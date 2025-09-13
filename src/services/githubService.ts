import { exec } from 'child_process';
import { promisify } from 'util';
import { IssueData, GitHubLabel } from '../types';

const execAsync = promisify(exec);

export class GitHubService {
  constructor(
    private owner: string,
    private repo: string,
    private token?: string,
    private projectId?: string,
    private projectTitle?: string,
  ) {}

  /**
   * GitHub CLIの権限を確認し、プロジェクト機能が利用可能かチェックする
   */
  async checkProjectPermissions(): Promise<boolean> {
    try {
      // auth status コマンドでスコープを確認
      const output = await this.runGhCommand('auth status');
      console.log('🔍 GitHub CLI認証状態:', output);

      // プロジェクトスコープが含まれているかチェック
      const hasProjectScope = output.includes('project');

      if (!hasProjectScope) {
        console.warn('⚠️ GitHub CLIトークンに `project` スコープがありません');
        console.warn(
          '📋 プロジェクト機能を利用するには以下を実行してください:',
        );
        console.warn('   gh auth refresh -s project');
        console.warn(
          'または https://github.com/settings/tokens でトークンに `project` スコープを追加',
        );
      }

      return hasProjectScope;
    } catch (error) {
      console.error('GitHub CLI認証状態の確認に失敗:', error);
      return false;
    }
  }

  private async runGhCommand(command: string): Promise<string> {
    try {
      // GitHub CLIの認証を使用（トークンが提供されている場合は環境変数として設定）
      const env = { ...process.env };
      if (this.token) {
        env.GITHUB_TOKEN = this.token;
      }

      const { stdout } = await execAsync(`gh ${command}`, { env });
      return stdout.trim();
    } catch (error) {
      console.error(`Error running gh command: ${command}`, error);
      throw error;
    }
  }

  async getRepositoryLabels(): Promise<GitHubLabel[]> {
    try {
      const output = await this.runGhCommand(
        `label list --repo ${this.owner}/${this.repo} --json name,color,description,id`,
      );
      return JSON.parse(output);
    } catch (error) {
      console.error('Error fetching repository labels:', error);
      throw error;
    }
  }

  async createIssue(issueData: IssueData): Promise<string> {
    try {
      const body = this.generateIssueBody(issueData);

      // デバッグ用: 本文の内容をログ出力
      console.log('📝 Generated issue body:');
      console.log('--- START BODY ---');
      console.log(body);
      console.log('--- END BODY ---');

      // 本文をファイルに書き込み、それを使用してissueを作成
      const fs = await import('fs/promises');
      const path = await import('path');
      const os = await import('os');

      const tempFile = path.join(os.tmpdir(), `issue-body-${Date.now()}.md`);
      await fs.writeFile(tempFile, body, 'utf8');

      try {
        let command = `issue create --repo ${this.owner}/${this.repo} --title "${issueData.title}" --body-file "${tempFile}"`;

        if (issueData.labels && issueData.labels.length > 0) {
          const labelsStr = issueData.labels.join(',');
          command += ` --label "${labelsStr}"`;
        }

        // プロジェクトが指定されている場合、Issue作成時に直接プロジェクトに追加を試行
        const projectName = await this.getProjectName();
        if (projectName) {
          console.log(`🏗️ プロジェクト "${projectName}" に追加予定...`);
          command += ` --project "${projectName}"`;
        }

        try {
          const output = await this.runGhCommand(command);
          console.log(`✅ Issue created: ${output}`);
          return output;
        } catch (createError) {
          // プロジェクト追加でエラーが発生した場合の処理
          if (
            createError instanceof Error &&
            createError.message.includes('project')
          ) {
            console.warn(
              '⚠️ プロジェクト追加でエラーが発生しました。Issueのみ作成します...',
            );

            // プロジェクト指定なしでIssueを作成
            let fallbackCommand = `issue create --repo ${this.owner}/${this.repo} --title "${issueData.title}" --body-file "${tempFile}"`;
            if (issueData.labels && issueData.labels.length > 0) {
              const labelsStr = issueData.labels.join(',');
              fallbackCommand += ` --label "${labelsStr}"`;
            }

            const output = await this.runGhCommand(fallbackCommand);
            console.log(`✅ Issue created (プロジェクト追加なし): ${output}`);

            // プロジェクト権限に関するエラーメッセージを表示
            if (
              createError.message.includes('project') &&
              createError.message.includes('scope')
            ) {
              console.error(
                '❌ GitHub CLIトークンに `project` スコープが不足しています',
              );
              console.error('📋 解決方法:');
              console.error('1. https://github.com/settings/tokens にアクセス');
              console.error('2. 使用中のPersonal Access Tokenを編集');
              console.error('3. `project` スコープを追加');
              console.error(
                '4. または `gh auth refresh -s project` コマンドを実行',
              );
              console.error('5. 設定後、再度ツールを実行してください');
            }

            return output;
          } else {
            // その他のエラーは再スロー
            throw createError;
          }
        }
      } finally {
        // 一時ファイルを削除
        try {
          await fs.unlink(tempFile);
        } catch (e) {
          // ファイル削除エラーは無視
        }
      }
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  }

  private generateIssueBody(issueData: IssueData): string {
    let body = '';

    if (issueData.overview) {
      body += `### 概要\n${this.processNewlines(issueData.overview)}\n\n`;
    } else {
      body += `### 概要\n<!-- issueの概要を記載してください -->\n\n`;
    }

    if (issueData.ref) {
      body += `## ref\n${this.processNewlines(issueData.ref)}\n\n`;
    } else {
      body += `## ref\n<!-- 関連するissue -->\n\n`;
    }

    if (issueData.background) {
      body += `## 背景\n${this.processNewlines(issueData.background)}\n\n`;
    } else {
      body += `## 背景\n<!-- issue作成の背景 -->\n\n`;
    }

    if (issueData.goals) {
      body += `## 実現したいこと\n${this.processNewlines(issueData.goals)}\n\n`;
    } else {
      body += `## 実現したいこと\n\n`;
    }

    if (issueData.acceptanceCriteria) {
      body += `### 受け入れ条件\n${this.processNewlines(issueData.acceptanceCriteria)}\n\n`;
    } else {
      body += `### 受け入れ条件\n<!-- このissueがどのような状態になったら完了とするかを記載してください -->\n\n`;
    }

    if (issueData.notes) {
      body += `### 備考\n${this.processNewlines(issueData.notes)}\n\n`;
    } else {
      body += `### 備考\n<!-- その他、補足事項などがあれば記載してください -->\n\n`;
    }

    if (issueData.outOfScope) {
      body += `### やらないこと\n${this.processNewlines(issueData.outOfScope)}`;
    } else {
      body += `### やらないこと\n<!-- このissueのスコープ外 -->`;
    }

    // エスケープ処理は不要（--body-fileを使用するため）
    return body;
  }

  /**
   * 文字列内の改行コード(\n)を実際の改行に変換する
   * スプレッドシートから取得したデータに含まれる\nを正しく処理する
   */
  private processNewlines(text: string): string {
    // \\n（エスケープされた改行）と\n（文字列としての改行）の両方を処理
    return text
      .replace(/\\n/g, '\n') // \\n を実際の改行に変換
      .replace(/\n/g, '\n') // 既存の改行も保持
      .trim(); // 前後の空白を削除
  }

  private async getProjectName(): Promise<string | null> {
    // プロジェクトタイトルが直接指定されている場合はそれを使用
    if (this.projectTitle) {
      console.log(`✅ プロジェクト名: "${this.projectTitle}" (直接指定)`);
      return this.projectTitle;
    }

    // プロジェクトIDが指定されている場合はIDからタイトルを取得
    if (this.projectId) {
      return await this.getProjectTitleFromId(this.projectId);
    }

    return null;
  }

  private async getProjectTitleFromId(
    projectId: string,
  ): Promise<string | null> {
    try {
      console.log(`🔍 プロジェクト ${projectId} の情報を取得中...`);

      // 複数のコマンド形式を試す
      let command = `project list --format json`;
      let output;

      try {
        output = await this.runGhCommand(command);
      } catch (firstError) {
        console.log('通常のproject listが失敗、--ownerオプションを試行中...');
        command = `project list --owner ${this.owner} --format json`;
        try {
          output = await this.runGhCommand(command);
        } catch (secondError) {
          console.error('両方のproject listコマンドが失敗:', {
            firstError,
            secondError,
          });
          throw secondError;
        }
      }

      // デバッグ用: 実際の出力を確認
      console.log('📋 Project list output:', output);

      let projectsData;
      try {
        projectsData = JSON.parse(output);
      } catch (parseError) {
        console.error('❌ JSON解析エラー:', parseError);
        console.error('Raw output:', output);
        return null;
      }

      // projectsDataの構造を確認し、適切な配列を取得
      let projects;
      if (Array.isArray(projectsData)) {
        // 直接配列の場合
        projects = projectsData;
      } else if (
        projectsData.projects &&
        Array.isArray(projectsData.projects)
      ) {
        // projectsプロパティの中に配列がある場合
        projects = projectsData.projects;
      } else {
        console.error(
          '❌ プロジェクトリストが期待する形式ではありません:',
          typeof projectsData,
        );
        console.error('Received data:', projectsData);
        return null;
      }

      const project = projects.find((p: any) => p.id === projectId);
      if (project) {
        console.log(`✅ プロジェクト "${project.title}" を発見`);
        return project.title;
      }

      console.warn(`⚠️ プロジェクトID ${projectId} が見つかりません`);
      console.log(
        '利用可能なプロジェクト:',
        projects.map((p: any) => ({ id: p.id, title: p.title })),
      );
      console.log(
        '💡 ヒント: プロジェクトIDの代わりにGITHUB_PROJECT_TITLEでプロジェクト名を直接指定することを推奨します',
      );
      return null;
    } catch (error) {
      console.error('❌ プロジェクト情報の取得に失敗:', error);
      console.log(
        '💡 ヒント: プロジェクトIDの代わりにGITHUB_PROJECT_TITLEでプロジェクト名を直接指定してください',
      );
      return null;
    }
  }
}
