# Google Drive OAuth アップロード手順

個人のGoogle Driveに保存する場合はサービスアカウントではなく **OAuth** を使います。

## 1) OAuthクライアントを作成
- Google Cloud Console → APIとサービス → 認証情報
- 「認証情報を作成」→「OAuthクライアントID」
- 種別: **デスクトップアプリ** で作成
- JSONをダウンロードして `secrets/drive-oauth.json` に保存

## 2) Drive API を有効化
- Google Cloud Console → APIとサービス → ライブラリ
- Google Drive API を有効化

## 3) 初回の認可（ブラウザ）
以下を実行するとブラウザ認可URLが表示されます。
認可後、自動で `secrets/drive-token.json` が保存されます。

```
node scripts/upload-drive-oauth.js --file out.mp4 --name fortune-test.mp4 --out out/drive.json
```

## 4) 2回目以降
`secrets/drive-token.json` がある場合は自動でアップロードされます。

---

備考:
- OAuthクライアントは**デスクトップアプリ**推奨
- `secrets/` は `.gitignore` 済み
