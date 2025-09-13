# GitHub Issue Automation

Google Sheetsから定義されたデータを読み込んで、GitHub Issuesを自動作成するバッチ処理ツールです。

## 機能

- Google Sheetsからissue情報をCSV形式で読み取り
- GitHub CLI (`gh`コマンド) を使用したissue自動作成
- ラベルの存在チェック・バリデーション
- ISSUE_TEMPLATEに基づいたissue本文の自動生成

## 必要な準備

### 1. 依存関係のインストール

```bash
yarn install
```

### 2. GitHub CLIのインストールと認証

```bash
# GitHub CLIのインストール (macOS)
brew install gh

# GitHub認証
gh auth login
```

### 3. Google Cloud Serviceアカウントの設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. Google Sheets APIを有効化
3. サービスアカウントを作成してJSONキーファイルをダウンロード
4. 対象のGoogle Sheetsでサービスアカウントのメールアドレスに編集権限を付与

### 4. 環境変数の設定

`.env.example`を`.env`にコピーして必要な値を設定：

```bash
cp .env.example .env
```

```env
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_CREDENTIALS_PATH=path/to/credentials.json
GITHUB_TOKEN=your_github_token
GITHUB_REPO_OWNER=your_github_username
GITHUB_REPO_NAME=your_repository_name
```

## Google Sheetsの形式

スプレッドシートは以下の列構成で作成してください：

| A列 | B列 | C列 | D列 | E列 | F列 | G列 | H列 | I列 |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| title | labels | overview | ref | background | goals | acceptanceCriteria | notes | outOfScope |
| Issue1のタイトル | bug,enhancement | 概要説明 | #123 | 背景説明 | 実現したいこと | 受け入れ条件 | 備考 | スコープ外 |

### 列の説明

- **title** (必須): Issueのタイトル
- **labels** (オプション): 付与するラベル（カンマ区切り）
- **overview** (オプション): Issue概要
- **ref** (オプション): 関連するissue
- **background** (オプション): Issue作成の背景
- **goals** (オプション): 実現したいこと
- **acceptanceCriteria** (オプション): 受け入れ条件
- **notes** (オプション): 備考
- **outOfScope** (オプション): やらないこと

## 使用方法

### 開発モード（ファイル変更監視）

```bash
yarn dev
```

### 本番実行

```bash
yarn start
```

### ビルド

```bash
yarn build
```

## 注意事項

- GitHub API制限を考慮し、各issue作成間に1秒の待機時間を設けています
- 無効なラベルが指定された場合、警告を表示して有効なラベルのみを使用します
- Titleが空の行はスキップされます

## プロジェクト構造

```
src/
├── index.ts                    # エントリーポイント
├── types/
│   └── index.ts               # 型定義
├── services/
│   ├── googleSheetsService.ts # Google Sheets API
│   └── githubService.ts       # GitHub CLI操作
├── validators/
│   └── labelValidator.ts      # ラベル検証
├── config/
│   └── index.ts              # 設定管理
└── utils/
    └── index.ts              # ユーティリティ関数
```
