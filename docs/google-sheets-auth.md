# Google Sheets API 認証設定ガイド

このプロジェクトでは、Google Sheets APIへのアクセスに複数の認証方法をサポートしています。

## 推奨認証方法

### 方法1: 環境変数でのサービスアカウント認証（推奨）

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成または選択
2. Google Sheets APIを有効化
3. サービスアカウントを作成
   - 「IAM と管理」 → 「サービス アカウント」
   - 「サービス アカウントを作成」
   - 名前と説明を入力
4. サービスアカウントキーを作成
   - 作成したサービスアカウントをクリック
   - 「キー」タブ → 「キーを追加」 → 「新しいキーを作成」
   - JSON形式を選択してダウンロード
5. 環境変数を設定

```bash
# .envファイルに以下を追加
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

**注意**: `GOOGLE_PRIVATE_KEY`の値は改行文字を`\n`でエスケープしてください。

### 方法2: Base64エンコードされたサービスアカウントキー

ダウンロードしたJSONファイルをBase64エンコードして環境変数に設定：

```bash
# JSONファイルをBase64エンコード
base64 -i path/to/your-service-account-key.json

# .envファイルに追加
GOOGLE_SERVICE_ACCOUNT_KEY=base64_encoded_json_here
```

### 方法3: サービスアカウントキーファイル

JSONファイルをプロジェクトに配置して、パスを指定：

```bash
# .envファイルに追加
GOOGLE_CREDENTIALS_PATH=path/to/credentials.json
```

**セキュリティ注意**: JSONファイルをGitにコミットしないでください。`.gitignore`に追加してください。

## Google Sheetsの共有設定

認証が完了したら、対象のGoogle Sheetsをサービスアカウントと共有する必要があります：

1. Google Sheetsを開く
2. 「共有」ボタンをクリック
3. サービスアカウントのメールアドレスを追加
4. 権限を「閲覧者」に設定

## トラブルシューティング

### 認証エラーが発生する場合

1. サービスアカウントのメールアドレスとキーが正しいか確認
2. Google Sheets APIが有効化されているか確認
3. Google Sheetsがサービスアカウントと共有されているか確認
4. 環境変数が正しく設定されているか確認

### プライベートキーのフォーマットエラー

`GOOGLE_PRIVATE_KEY`の値に改行が含まれている場合、`\n`でエスケープしてください：

```bash
# 正しいフォーマット例
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG...\n-----END PRIVATE KEY-----\n"
```

## Application Default Credentials (ADC)

Google Cloud環境（Cloud Run、Cloud Functions、GKEなど）で実行する場合、環境変数を設定せずにADCを使用することも可能です。この場合、すべての認証設定を省略できます。
