import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export type  Config = {
  googleSheetId: string;
  googleCredentialsPath: string;
  githubToken?: string;
  githubRepoOwner: string;
  githubRepoName: string;
  sheetRange?: string;
}

export function loadConfig(): Config {
  const requiredEnvVars = [
    'GOOGLE_SHEET_ID',
    'GITHUB_REPO_OWNER',
    'GITHUB_REPO_NAME'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Google認証の検証
  const hasServiceAccountEnv = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY;
  const hasServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const hasCredentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;

  if (!hasServiceAccountEnv && !hasServiceAccountKey && !hasCredentialsPath) {
    throw new Error(
      'Google Sheets authentication required. Please set one of the following:\n' +
      '1. GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY\n' +
      '2. GOOGLE_SERVICE_ACCOUNT_KEY (Base64 encoded)\n' +
      '3. GOOGLE_CREDENTIALS_PATH (file path)\n' +
      '4. Use Application Default Credentials (ADC) in Google Cloud environment'
    );
  }

  return {
    googleSheetId: process.env.GOOGLE_SHEET_ID!,
    googleCredentialsPath: './credentials.json',
    githubToken: process.env.GITHUB_TOKEN,
    githubRepoOwner: process.env.GITHUB_REPO_OWNER!,
    githubRepoName: process.env.GITHUB_REPO_NAME!,
    sheetRange: process.env.SHEET_RANGE || 'Sheet1!A:I',
  };
}
