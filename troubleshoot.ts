#!/usr/bin/env tsx

import { GoogleSheetsService } from './src/services/googleSheetsService';
import { loadConfig } from './src/config';

async function troubleshoot() {
  try {
    console.log('🔧 Google Sheets 接続トラブルシューティング\n');

    // 設定の読み込み
    console.log('1. 設定の確認...');
    const config = loadConfig();
    console.log(`   Sheet ID: ${config.googleSheetId}`);
    console.log(`   Range: ${config.sheetRange}\n`);

    // 認証情報の確認
    console.log('2. 認証情報の確認...');
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      console.log(
        `   ✅ サービスアカウント: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`,
      );
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.log('   ✅ Base64エンコードされたキーが設定されています');
    } else if (process.env.GOOGLE_CREDENTIALS_PATH) {
      console.log(
        `   ✅ 認証情報ファイル: ${process.env.GOOGLE_CREDENTIALS_PATH}`,
      );
    } else {
      console.log('   ℹ️  Application Default Credentials (ADC) を使用');
    }

    // Google Sheetsサービスの初期化
    console.log('\n3. Google Sheetsサービスの初期化...');
    const googleSheetsService = new GoogleSheetsService();

    // 権限チェック
    console.log('\n4. アクセス権限のチェック...');
    const hasPermission = await googleSheetsService.checkPermissions(
      config.googleSheetId,
    );

    if (hasPermission) {
      console.log('\n✅ 接続テスト成功！');

      // 実際のデータ取得テスト
      console.log('\n5. データ取得テスト...');
      const data = await googleSheetsService.fetchData(
        config.googleSheetId,
        config.sheetRange,
      );
      console.log(`   取得行数: ${data.length}行`);

      if (data.length > 0) {
        console.log('   最初の行のタイトル:', data[0].title);
      }
    } else {
      console.log('\n❌ 接続テスト失敗');
      console.log('\n解決方法:');
      console.log('1. Google Sheetsを開く:');
      console.log(
        `   https://docs.google.com/spreadsheets/d/${config.googleSheetId}`,
      );
      console.log('2. 右上の「共有」ボタンをクリック');
      console.log('3. サービスアカウントのメールアドレスを追加');
      console.log('4. 権限を「閲覧者」に設定');
    }
  } catch (error) {
    console.error('\n💥 エラーが発生しました:', error);
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  troubleshoot();
}
