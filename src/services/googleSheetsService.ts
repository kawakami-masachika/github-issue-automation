import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { CSVRow } from '../types';

export class GoogleSheetsService {
  private auth: any;
  private sheets: any;
  private initialized = false;

  constructor() {
    // 認証は遅延初期化
  }

  private async initializeAuth(): Promise<void> {
    if (this.initialized) return;

    try {
      // 認証方法を順番に試す
      let credentials = null;

      // 方法1: 環境変数でのサービスアカウント認証
      if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        credentials = {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
        console.log('✅ Using service account credentials from environment variables');
      }
      // 方法2: Base64エンコードされたサービスアカウントキー
      else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const decodedKey = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
        credentials = JSON.parse(decodedKey);
        console.log('✅ Using Base64 encoded service account key');
      }
      // 方法3: サービスアカウントキーファイル
      else if (process.env.GOOGLE_CREDENTIALS_PATH) {
        if (fs.existsSync(process.env.GOOGLE_CREDENTIALS_PATH)) {
          credentials = JSON.parse(fs.readFileSync(process.env.GOOGLE_CREDENTIALS_PATH, 'utf8'));
          console.log('✅ Using service account key file:', process.env.GOOGLE_CREDENTIALS_PATH);
        } else {
          throw new Error(`Credentials file not found: ${process.env.GOOGLE_CREDENTIALS_PATH}`);
        }
      }
      // 方法4: デフォルトのcredentials.jsonファイル（後方互換性）
      else if (fs.existsSync('./credentials.json')) {
        credentials = JSON.parse(fs.readFileSync('./credentials.json', 'utf8'));
        console.log('✅ Using default credentials.json file');
      }
      // 方法5: Application Default Credentials (ADC)
      else {
        console.log('✅ Attempting to use Application Default Credentials (ADC)');
      }

      if (credentials) {
        this.auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        // サービスアカウント情報を表示
        if (credentials.client_email) {
          console.log(`📧 Service Account Email: ${credentials.client_email}`);
          console.log('⚠️  このメールアドレスをGoogle Sheetsの共有設定に追加してください');
        }
      } else {
        // ADCを使用
        this.auth = new google.auth.GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
      }

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.initialized = true;
    } catch (error) {
      console.error('Google Sheets authentication failed:', error);
      throw new Error(
        'Google Sheets authentication failed. Please check your credentials and ensure you have:\n' +
        '1. Set GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY, or\n' +
        '2. Set GOOGLE_SERVICE_ACCOUNT_KEY (Base64 encoded), or\n' +
        '3. Set GOOGLE_CREDENTIALS_PATH pointing to a valid credentials file, or\n' +
        '4. Configured Application Default Credentials (ADC)'
      );
    }
  }

  async fetchData(sheetId: string, range: string = 'A:I'): Promise<CSVRow[]> {
    try {
      // 認証の初期化を確実に行う
      await this.initializeAuth();

      console.log(`📊 Accessing Google Sheet: ${sheetId}`);
      console.log(`📋 Range: ${range}`);

      // 複数の範囲指定パターンを試す
      const rangesToTry = [
        range,                    // 指定された範囲
        'A:I',                   // シンプルな範囲
        'Sheet1!A:I',            // Sheet1指定
        'A1:I1000',              // 具体的な範囲
        'Sheet1!A1:I1000'        // Sheet1で具体的な範囲
      ];

      let response;
      let usedRange = '';

      for (const tryRange of rangesToTry) {
        try {
          console.log(`🔍 範囲を試行中: ${tryRange}`);
          response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: tryRange,
          });
          usedRange = tryRange;
          console.log(`✅ 範囲 "${tryRange}" で取得成功`);
          break;
        } catch (error: any) {
          console.log(`❌ 範囲 "${tryRange}" で失敗: ${error.message}`);
          if (tryRange === rangesToTry[rangesToTry.length - 1]) {
            throw error; // 最後の試行でも失敗した場合はエラーを投げる
          }
        }
      }

      if (!response) {
        throw new Error('すべての範囲指定パターンで取得に失敗しました');
      }

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('No data found.');
        return [];
      }

      console.log(`📋 取得データ: ${rows.length}行 (範囲: ${usedRange})`);

      // 最初の行をヘッダーとして使用
      const headers = rows[0];
      const data: CSVRow[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const csvRow: CSVRow = {
          title: row[0] || '',
          labels: row[1] || '',
          overview: row[2] || '',
          ref: row[3] || '',
          background: row[4] || '',
          goals: row[5] || '',
          acceptanceCriteria: row[6] || '',
          notes: row[7] || '',
          outOfScope: row[8] || '',
        };

        // タイトルが必須なので、空の場合はスキップ
        if (csvRow.title.trim()) {
          data.push(csvRow);
        }
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching data from Google Sheets:', error);
      
      // 権限エラーの場合の詳細説明
      if (error.status === 403 || error.code === 403) {
        console.error('\n🚨 Google Sheets アクセス権限エラーが発生しました:');
        console.error('以下の手順で権限を設定してください:\n');
        console.error('1. Google Sheetsを開く');
        console.error('2. 右上の「共有」ボタンをクリック');
        console.error('3. サービスアカウントのメールアドレスを追加');
        console.error('4. 権限を「閲覧者」または「編集者」に設定');
        console.error('\nサービスアカウントのメールアドレスは credentials.json の client_email フィールドで確認できます。');
        
        if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
          console.error(`\n📧 使用中のサービスアカウント: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
        }
        
        throw new Error(`Google Sheets access denied. Please share the spreadsheet (${sheetId}) with your service account.`);
      }
      
      throw error;
    }
  }

  async checkPermissions(sheetId: string): Promise<boolean> {
    try {
      await this.initializeAuth();

      console.log('🔍 Google Sheetsの権限をチェック中...');

      // シンプルなメタデータ取得でアクセス権限をテスト
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: 'properties.title,sheets.properties.title'
      });

      if (response.data.properties?.title) {
        console.log(`✅ スプレッドシート「${response.data.properties.title}」にアクセス可能です`);

        // シート名を表示
        if (response.data.sheets && response.data.sheets.length > 0) {
          console.log('📋 利用可能なシート:');
          response.data.sheets.forEach((sheet: any, index: number) => {
            console.log(`   ${index + 1}. ${sheet.properties.title}`);
          });
        }

        return true;
      }

      return false;
    } catch (error: any) {
      if (error.status === 403 || error.code === 403) {
        console.error('❌ スプレッドシートへのアクセス権限がありません');
        return false;
      }
      console.error('❌ 権限チェック中にエラーが発生しました:', error.message);
      return false;
    }
  }
}
