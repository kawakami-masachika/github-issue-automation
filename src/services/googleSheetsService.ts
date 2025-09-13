import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { CSVRow } from '../types';

export class GoogleSheetsService {
  private auth: any;
  private sheets: any;

  constructor(private credentialsPath: string) {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
    
    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async fetchData(sheetId: string, range: string = 'Sheet1!A:I'): Promise<CSVRow[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('No data found.');
        return [];
      }

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
    } catch (error) {
      console.error('Error fetching data from Google Sheets:', error);
      throw error;
    }
  }
}
