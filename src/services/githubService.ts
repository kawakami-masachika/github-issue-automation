import { exec } from 'child_process';
import { promisify } from 'util';
import { IssueData, GitHubLabel } from '../types';

const execAsync = promisify(exec);

export class GitHubService {
  constructor(
    private token: string,
    private owner: string,
    private repo: string
  ) {}

  private async runGhCommand(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`gh ${command}`, {
        env: { ...process.env, GITHUB_TOKEN: this.token }
      });
      return stdout.trim();
    } catch (error) {
      console.error(`Error running gh command: ${command}`, error);
      throw error;
    }
  }

  async getRepositoryLabels(): Promise<GitHubLabel[]> {
    try {
      const output = await this.runGhCommand(
        `label list --repo ${this.owner}/${this.repo} --json name,color,description,id`
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
      
      let command = `issue create --repo ${this.owner}/${this.repo} --title "${issueData.title}" --body "${body}"`;
      
      if (issueData.labels && issueData.labels.length > 0) {
        const labelsStr = issueData.labels.join(',');
        command += ` --label "${labelsStr}"`;
      }

      const output = await this.runGhCommand(command);
      console.log(`Issue created: ${output}`);
      return output;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  }

  private generateIssueBody(issueData: IssueData): string {
    let body = '';

    if (issueData.overview) {
      body += `### 概要\n${issueData.overview}\n\n`;
    } else {
      body += `### 概要\n<!-- issueの概要を記載してください -->\n\n`;
    }

    if (issueData.ref) {
      body += `## ref\n${issueData.ref}\n\n`;
    } else {
      body += `## ref\n<!-- 関連するissue -->\n\n`;
    }

    if (issueData.background) {
      body += `## 背景\n${issueData.background}\n\n`;
    } else {
      body += `## 背景\n<!-- issue作成の背景 -->\n\n`;
    }

    if (issueData.goals) {
      body += `## 実現したいこと\n${issueData.goals}\n\n`;
    } else {
      body += `## 実現したいこと\n\n`;
    }

    if (issueData.acceptanceCriteria) {
      body += `### 受け入れ条件\n${issueData.acceptanceCriteria}\n\n`;
    } else {
      body += `### 受け入れ条件\n<!-- このissueがどのような状態になったら完了とするかを記載してください -->\n\n`;
    }

    if (issueData.notes) {
      body += `### 備考\n${issueData.notes}\n\n`;
    } else {
      body += `### 備考\n<!-- その他、補足事項などがあれば記載してください -->\n\n`;
    }

    if (issueData.outOfScope) {
      body += `### やらないこと\n${issueData.outOfScope}\n`;
    } else {
      body += `### やらないこと\n<!-- このissueのスコープ外 -->\n`;
    }

    // エスケープ処理
    return body.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}
