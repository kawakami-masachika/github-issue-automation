# 認証設定ガイド

このドキュメントでは、GitHub Issue Automation ツールで必要な認証設定について説明します。

## GitHub 認証

### GitHub CLI を使用する方法（推奨）

GitHub CLI がすでに認証済みの場合、`GITHUB_TOKEN`環境変数は不要です。

1. GitHub CLI をインストール:

```bash
brew install gh
```

2. GitHub CLI で認証:

```bash
gh auth login
```

3. 認証状態を確認:

```bash
gh auth status
```

### 環境変数を使用する方法

GitHub CLI を使用しない場合、またはカスタムトークンを使用したい場合：

1. GitHub で Personal Access Token を作成
   - Settings > Developer settings > Personal access tokens > Tokens (classic)
   - 必要なスコープ: `repo`, `read:org`

2. `.env`ファイルに設定:

```bash
GITHUB_TOKEN=your_github_personal_access_token
```

## Google Sheets 認証

Google Sheets API を使用するには、以下のいずれかの方法で認証設定を行います：

### 方法 1: サービスアカウント（環境変数）

1. Google Cloud Console でサービスアカウントを作成
2. サービスアカウントキーをダウンロード
3. 環境変数に設定:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

### 方法 2: Base64 エンコードされたサービスアカウントキー

```bash
GOOGLE_SERVICE_ACCOUNT_KEY=base64_encoded_service_account_key
```

### 方法 3: サービスアカウントキーファイル

```bash
GOOGLE_CREDENTIALS_PATH=path/to/credentials.json
```

### 方法 4: Application Default Credentials (ADC)

Google Cloud 環境で実行する場合、ADC が自動的に使用されます。

## トラブルシューティング

### GitHub 認証エラー

- GitHub CLI が正しく認証されているか確認: `gh auth status`
- リポジトリへのアクセス権限があるか確認
- Personal Access Token の有効期限を確認

### Google Sheets 認証エラー

- サービスアカウントに Google Sheets API のアクセス権限があるか確認
- スプレッドシートがサービスアカウントと共有されているか確認
- 環境変数が正しく設定されているか確認

## セキュリティ考慮事項

- 認証情報は絶対にバージョン管理にコミットしない
- `.env`ファイルは`.gitignore`に追加
- 本番環境では環境変数またはシークレット管理サービスを使用
- 最小権限の原則に従ってアクセス権限を設定
