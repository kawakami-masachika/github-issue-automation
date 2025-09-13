import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export type Config = {
  googleSheetId: string;
  githubToken?: string;
  githubRepoOwner: string;
  githubRepoName: string;
  sheetRange?: string;
};

export function loadConfig(): Config {
  const requiredEnvVars = [
    'GOOGLE_SHEET_ID',
    'GITHUB_REPO_OWNER',
    'GITHUB_REPO_NAME',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  }

  // Google認証の設定をログ出力（デバッグ用）
  const hasServiceAccountEnv =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY;
  const hasServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const hasCredentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;

  if (hasServiceAccountEnv) {
    console.log('🔐 Google認証: 環境変数のサービスアカウント');
  } else if (hasServiceAccountKey) {
    console.log('🔐 Google認証: Base64エンコードされたキー');
  } else if (hasCredentialsPath) {
    console.log('🔐 Google認証: 認証情報ファイル');
  } else {
    console.log('🔐 Google認証: デフォルト認証情報またはADCを使用');
  }

  return {
    googleSheetId: process.env.GOOGLE_SHEET_ID!,
    githubToken: process.env.GITHUB_TOKEN,
    githubRepoOwner: process.env.GITHUB_REPO_OWNER!,
    githubRepoName: process.env.GITHUB_REPO_NAME!,
    sheetRange: process.env.SHEET_RANGE || 'A:I',
  };
}
