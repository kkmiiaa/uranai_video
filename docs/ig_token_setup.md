# Instagram Graph API トークン取得メモ

このメモは「IG_USER_ID」と「IG_ACCESS_TOKEN（Page Access Token）」を取得する手順です。

## 1) Graph API Explorer を開く
https://developers.facebook.com/tools/explorer/

## 2) User Access Token を発行
- 右上でアプリを選択
- 「Get Token」→「Get User Access Token」
- 付与する権限:
  - pages_show_list
  - instagram_basic
  - instagram_content_publish
  - pages_read_engagement

## 3) Page Access Token を取得（IG_ACCESS_TOKEN）
```
https://graph.facebook.com/v20.0/958367507360475?fields=access_token&access_token=USER_ACCESS_TOKEN
```
レスポンスの `access_token` が **IG_ACCESS_TOKEN** です。

## 4) IG_USER_ID を取得（必要なら）
```
https://graph.facebook.com/v20.0/958367507360475?fields=instagram_business_account&access_token=USER_ACCESS_TOKEN
```
レスポンスの `instagram_business_account.id` が **IG_USER_ID** です。

---

## Access Token Debugger で長期化（簡易）
短期トークンが発行できたら、下記のページで **「Extend Access Token」** を実行します。
https://developers.facebook.com/tools/debug/accesstoken/

※ ボタンが出ない場合は、長期化対象ではありません。
その場合は通常の手順（Graph API Explorer で取り直し）を行ってください。
