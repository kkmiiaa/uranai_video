# Google Drive OAuth (Refresh Token) 取得手順

GHA から Drive へアップロードするために、OAuth の **refresh token** を取得して
GitHub Secrets に保存します。

## 1) OAuth クライアント作成
- Google Cloud Console → API とサービス → 認証情報
- 「認証情報を作成」→「OAuth クライアント ID」
- アプリケーションの種類: **ウェブアプリ**
- リダイレクトURIに以下を追加:
  - http://localhost:42813/oauth2callback

作成後に表示される **Client ID / Client Secret** を控える。

## 2) 認可URLを開いて code を取得
以下のURLを開き、認可を進める。最後に `code` が返る。
```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=282214819668-ossls2vfc17t9ghb67jsdivfnp7n66eo.apps.googleusercontent.com
  &redirect_uri=http://localhost:42813/oauth2callback
  &response_type=code
  &scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file
  &access_type=offline
  &prompt=consent
```

※ `prompt=consent` がないと refresh token が返らないことがあります。

## 3) code を refresh token に交換
以下を実行して refresh token を取得:
```
curl -X POST https://oauth2.googleapis.com/token \
  -d client_id=282214819668-ossls2vfc17t9ghb67jsdivfnp7n66eo.apps.googleusercontent.com \
  -d client_secret=YOUR_CLIENT_SECRET \
  -d code=AUTH_CODE \
  -d grant_type=authorization_code \
  -d redirect_uri=http://localhost:42813/oauth2callback
```

レスポンスに `refresh_token` が含まれる。

## 4) GitHub Secrets に登録
- `DRIVE_OAUTH_CLIENT_ID`
- `DRIVE_OAUTH_CLIENT_SECRET`
- `DRIVE_OAUTH_REFRESH_TOKEN`

これで GHA から Drive にアップロード可能。
