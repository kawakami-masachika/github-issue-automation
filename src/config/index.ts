import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export interface Config {
  googleSheetId: string;
  googleCredentialsPath: string;
  githubToken: string;
  githubRepoOwner: string;
  githubRepoName: string;
  sheetRange?: string;
}

export function loadConfig(): Config {
  const requiredEnvVars = [
    'GOOGLE_SHEET_ID',
    'GOOGLE_CREDENTIALS_PATH',
    'GITHUB_TOKEN',
    'GITHUB_REPO_OWNER',
    'GITHUB_REPO_NAME'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    googleSheetId: process.env.GOOGLE_SHEET_ID!,
    googleCredentialsPath: path.resolve(process.env.GOOGLE_CREDENTIALS_PATH!),
    githubToken: process.env.GITHUB_TOKEN!,
    githubRepoOwner: process.env.GITHUB_REPO_OWNER!,
    githubRepoName: process.env.GITHUB_REPO_NAME!,
    sheetRange: process.env.SHEET_RANGE || 'Sheet1!A:I',
  };
}
