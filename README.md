# GitHub Issue Automation

Google Sheetsから定義されたデータを読み込んで、GitHub Issuesを自動作成するバッチ処理ツールです。

## 機能

- Google Sheetsからissue情報をCSV形式で読み取り
- GitHub CLI (`gh`コマンド) を使用したissue自動作成
- ラベルの存在チェック・バリデーション
- ISSUE_TEMPLATEに基づいたissue本文の自動生成

## 前提条件

- Node.js 16以上
- yarn
- **GitHub CLI (`gh`) の事前認証が必要**

## 必要な準備

### 1. 依存関係のインストール

```bash
yarn install
```

### 2. GitHub CLIのインストールと認証 ⚠️ **必須**

このツールを使用する前に、GitHub CLIでの認証が必要です。

```bash
# GitHub CLIのインストール (macOS)
brew install gh

# GitHub認証（必須）
gh auth login
```

認証状態の確認：

```bash
gh auth status
```

> **重要**: `gh auth login`による事前認証が完了していない場合、ツールは正常に動作しません。認証が完了すると、`GITHUB_TOKEN`環境変数の設定は不要になります。

### 3. Google Sheets APIの設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. Google Sheets APIを有効化
3. サービスアカウントを作成
4. 対象のGoogle Sheetsでサービスアカウントのメールアドレスに閲覧権限を付与

詳細な認証設定については、[Google Sheets認証ガイド](./docs/google-sheets-auth.md)を参照してください。

### 4. 環境変数の設定

`.env.example`を`.env`にコピーして必要な値を設定：

```bash
cp .env.example .env
```

#### 基本設定

```env
GOOGLE_SHEET_ID=your_google_sheet_id
# GITHUB_TOKEN=your_github_token  # オプション: gh auth loginで認証済みの場合は不要
GITHUB_REPO_OWNER=your_github_username
GITHUB_REPO_NAME=your_repository_name
```

#### GitHub Project設定（オプション）

作成したIssueを自動的にGitHub Projectに追加したい場合：

```env
# 方法1: プロジェクト名で指定（推奨）
GITHUB_PROJECT_TITLE=vital-pjt

# 方法2: プロジェクトIDで指定
GITHUB_PROJECT_ID=PVT_kwHOAppHyM4BC8AM

# オプション: 初期ステータス
GITHUB_PROJECT_STATUS=Todo
```

プロジェクト情報の確認方法：

```bash
gh project list
```

#### Google認証設定（以下のいずれかを選択）

**方法1: 環境変数でのサービスアカウント認証（推奨）**

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

**方法2: サービスアカウントキーファイル**

```env
GOOGLE_CREDENTIALS_PATH=path/to/credentials.json
```

**方法3: Base64エンコードされたキー**

```env
GOOGLE_SERVICE_ACCOUNT_KEY=base64_encoded_service_account_key
```

## [Google Spread Sheet](https://docs.google.com/spreadsheets/d/1jcYk8Dn_pTXBbsZz-NsFSG3sLKfaiXARE-ZlVjgC5mY/edit?gid=0#gid=0)の形式

````

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
````

### 本番実行

```bash
yarn start
```

### ビルド

```bash
yarn build
```

### トラブルシューティング用診断スクリプト

接続や権限の問題を診断するためのスクリプトを実行できます：

```bash
yarn troubleshoot
```

## 注意事項

- **事前にGitHub CLIでの認証が必要です**: `gh auth login`を実行してください
- **Google Sheetsの共有設定が必要です**: サービスアカウントを「閲覧者」として追加してください
- GitHub API制限を考慮し、各issue作成間に1秒の待機時間を設けています
- 無効なラベルが指定された場合、警告を表示して有効なラベルのみを使用します
- Titleが空の行はスキップされます
- 対象リポジトリへの書き込み権限が必要です

````

## トラブルシューティング

### Google Sheets権限エラー

**エラー**: `The caller does not have permission`

**解決方法**:
1. Google Sheetsを開く: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID`
2. 右上の「共有」ボタンをクリック
3. サービスアカウントのメールアドレス（`GOOGLE_SERVICE_ACCOUNT_EMAIL`の値）を追加
4. 権限を「閲覧者」に設定
5. 「送信」をクリック

**確認コマンド**:
```bash
yarn troubleshoot
````

### GitHub認証エラー

以下のコマンドで認証状態を確認してください：

```bash
gh auth status
```

認証されていない場合は、再度認証を実行：

```bash
gh auth login
```

### よくあるエラー

- **`gh: command not found`**: GitHub CLIがインストールされていません
- **`authentication required`**: `gh auth login`を実行してください
- **`repository not found`**: リポジトリ名やオーナー名を確認してください
- **`permission denied`**: 対象リポジトリへの書き込み権限がありません

詳細な認証設定については、[認証ガイド](./docs/authentication.md)を参照してください。

## プロジェクト構造
