import { GoogleSheetsService } from './services/googleSheetsService';
import { GitHubService } from './services/githubService';
import { LabelValidator } from './validators/labelValidator';
import { loadConfig } from './config';
import { csvRowToIssueData, sleep } from './utils';

async function main(): Promise<void> {
  try {
    console.log('🚀 GitHub Issue Automation を開始します...');

    // 設定の読み込み
    const config = loadConfig();
    console.log('✅ 設定を読み込みました');

    // サービスの初期化
    const googleSheetsService = new GoogleSheetsService();
    const githubService = new GitHubService(
      config.githubRepoOwner,
      config.githubRepoName,
      config.githubToken
    );
    console.log('✅ サービスを初期化しました');

    // Google Sheetsの権限チェック
    console.log('🔐 Google Sheetsアクセス権限をチェック中...');
    const hasPermission = await googleSheetsService.checkPermissions(config.googleSheetId);

    if (!hasPermission) {
      console.error('\n❌ Google Sheetsへのアクセス権限がありません。');
      console.error('以下の手順で権限を設定してください:\n');
      console.error('1. Google Sheetsを開く: https://docs.google.com/spreadsheets/d/' + config.googleSheetId);
      console.error('2. 右上の「共有」ボタンをクリック');
      console.error('3. サービスアカウントのメールアドレスを追加');
      console.error('4. 権限を「閲覧者」に設定\n');
      return;
    }

    // Google Sheetsからデータを取得
    console.log('📊 Google Sheetsからデータを取得中...');
    const csvData = await googleSheetsService.fetchData(config.googleSheetId, config.sheetRange);

    if (csvData.length === 0) {
      console.log('⚠️  処理するデータがありません');
      return;
    }

    console.log(`✅ ${csvData.length}件のデータを取得しました`);

    // リポジトリのラベルを取得
    console.log('🏷️  リポジトリのラベルを取得中...');
    const repositoryLabels = await githubService.getRepositoryLabels();
    const labelValidator = new LabelValidator(repositoryLabels);
    console.log(`✅ ${repositoryLabels.length}個のラベルを取得しました`);

    // 各行を処理してIssueを作成
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < csvData.length; i++) {
      const csvRow = csvData[i];
      const rowNumber = i + 2; // スプレッドシートの行番号（ヘッダー含む）

      console.log(`\n📝 行 ${rowNumber}: "${csvRow.title}" を処理中...`);

      try {
        const issueData = csvRowToIssueData(csvRow);

        // ラベルの検証
        if (issueData.labels && issueData.labels.length > 0) {
          const labelValidation = labelValidator.validateLabels(issueData.labels);

          if (!labelValidation.isValid) {
            console.warn(`⚠️  行 ${rowNumber}: 無効なラベルが見つかりました: ${labelValidation.invalidLabels.join(', ')}`);
            console.warn(`   有効なラベル: ${labelValidation.validLabels.join(', ')}`);
            // 有効なラベルのみを使用
            issueData.labels = labelValidation.validLabels;
          }
        }

        // Issueを作成
        const issueUrl = await githubService.createIssue(issueData);
        console.log(`✅ 行 ${rowNumber}: Issue作成成功 - ${issueUrl}`);
        successCount++;

        // API制限を避けるため少し待機
        if (i < csvData.length - 1) {
          await sleep(1000);
        }

      } catch (error) {
        console.error(`❌ 行 ${rowNumber}: Issue作成エラー -`, error);
        errorCount++;
      }
    }

    // 結果のサマリー
    console.log('\n📊 処理結果サマリー:');
    console.log(`   成功: ${successCount}件`);
    console.log(`   エラー: ${errorCount}件`);
    console.log(`   合計: ${csvData.length}件`);

    if (successCount === csvData.length) {
      console.log('🎉 すべてのIssueが正常に作成されました！');
    } else if (successCount > 0) {
      console.log('⚠️  一部のIssue作成でエラーが発生しました');
    } else {
      console.log('❌ すべてのIssue作成に失敗しました');
    }

  } catch (error) {
    console.error('💥 アプリケーションエラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main()
    .then(() => {
      console.log('✨ 処理が完了しました');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 予期しないエラー:', error);
      process.exit(1);
    });
}
