# Google Apps Script デプロイ手順書

**Charko Apps シリーズ共通GAS v1.0**

---

## 📋 事前準備

### 1. Googleスプレッドシートを作成

1. https://drive.google.com を開く
2. 「新規」→「Googleスプレッドシート」
3. タイトルを「Charko Apps データ」などに変更
4. URLから**スプレッドシートID**をコピー
   ```
   https://docs.google.com/spreadsheets/d/【ここがID】/edit
   例: 1ikC4auuAYjrqQKFsygCqXIY2L0Fjye-OoLBGLEwXq5I
   ```

### 2. Gemini APIキーを取得（オプション）

AI分析機能を使う場合のみ必要：

1. https://aistudio.google.com/app/apikey を開く
2. 「APIキーを作成」
3. キーをコピー（`AIza...`で始まる文字列）

---

## 🚀 GASデプロイ手順

### ステップ1: スクリプトエディタを開く

1. スプレッドシートを開く
2. メニューバー →「拡張機能」→「Apps Script」

### ステップ2: Code.gs を貼り付け

1. エディタの既存コード（`function myFunction() {}`）を全削除
2. ダウンロードした`Code.gs`の内容を全コピー
3. 貼り付け

### ステップ3: 設定を編集

**必須**: 以下の2箇所を編集

#### 📍 スプレッドシートID（17行目付近）

```javascript
const SHEET_ID = 'YOUR_SHEET_ID_HERE';
```

↓ 自分のIDに変更

```javascript
const SHEET_ID = '1ikC4auuAYjrqQKFsygCqXIY2L0Fjye-OoLBGLEwXq5I';
```

#### 📍 Gemini APIキー（24行目付近）

AI分析を使わない場合はそのままでOK

```javascript
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
```

↓ 取得したキーに変更（使う場合のみ）

```javascript
const GEMINI_API_KEY = 'AIzaSyC...';
```

### ステップ4: 保存

1. `Ctrl + S` または 💾アイコンをクリック
2. プロジェクト名を聞かれたら「Charko Apps GAS」などと入力

### ステップ5: テスト実行

1. 関数選択で **`testDoPost`** を選択
2. 「▶ 実行」をクリック
3. 初回は認証画面が表示される

#### 認証画面の対応

1. 「権限を確認」をクリック
2. 自分のGoogleアカウントを選択
3. 「このアプリは確認されていません」と表示されたら：
   - 「詳細」をクリック
   - 「〇〇（安全でないページ）に移動」をクリック
   - ✅ これは自分で作ったスクリプトなので安全です
4. 「許可」をクリック

### ステップ6: 実行ログを確認

1. 下部の「実行ログ」タブをクリック
2. 以下のようなログが表示されればOK：

```
情報	[doPost] app=tracker, action=save
情報	テスト結果:
情報	{
  "success": true,
  "data": {
    "date": "2026-04-08",
    "saved": true,
    "timestamp": "2026-04-08T12:34:56.789Z"
  }
}
```

### ステップ7: ウェブアプリとしてデプロイ

1. 右上の「デプロイ」→「新しいデプロイ」
2. 左上の⚙歯車アイコン →「ウェブアプリ」を選択
3. 設定：
   - **説明**: `Charko Apps v1.0`
   - **次のユーザーとして実行**: `自分（自分のメールアドレス）`
   - **アクセスできるユーザー**: `全員`
4. 「デプロイ」をクリック

### ステップ8: デプロイURLをコピー

表示された **「ウェブアプリのURL」** をコピー：

```
https://script.google.com/macros/s/AKfycby.../exec
```

このURLを各アプリのHTMLファイルに設定します。

---

## 🔧 再デプロイ（コード変更後）

コードを修正した場合は必ず再デプロイが必要：

1. コードを編集
2. `Ctrl + S` で保存
3. 「デプロイ」→「デプロイを管理」
4. 右上の✏鉛筆アイコン（編集）をクリック
5. バージョン欄を **「新しいバージョン」** に変更
6. 「デプロイ」をクリック

**重要**: URLは変わりません！

---

## ✅ 動作確認

### 1. スプレッドシートを確認

デプロイ後、以下のシートが自動作成されます：

- `tracker_data` - 日次記録
- `medical_visits` - 受診記録
- `_backup` - JSONバックアップ

### 2. HTMLアプリから接続

各アプリのHTMLファイルで：

```javascript
CharkoAPI.setGasUrl('https://script.google.com/macros/s/.../exec');
```

### 3. 保存テスト

アプリで何かデータを保存して、スプレッドシートに反映されればOK！

---

## 🐛 トラブルシューティング

### Q1. 「実行ログ」に何も表示されない

**A**: 実行に失敗している可能性があります。

- エディタ上部に赤いエラーメッセージが表示されていないか確認
- `SHEET_ID`が正しく設定されているか確認

### Q2. 「権限が不足しています」エラー

**A**: 認証が完了していません。

1. `testDoPost`を再実行
2. 認証画面が表示されたら、手順通りに許可

### Q3. HTMLアプリから接続できない

**A**: 以下を確認：

1. GAS URLが正しいか
2. 再デプロイしたか（コード変更後）
3. 「アクセスできるユーザー」が「全員」になっているか

### Q4. スプレッドシートにデータが反映されない

**A**: `SHEET_ID`が間違っている可能性：

1. スプレッドシートのURLを再確認
2. Code.gs の`SHEET_ID`を修正
3. 保存 → 再デプロイ

---

## 📝 次のステップ

1. ✅ GASデプロイ完了
2. ⏳ HTMLアプリに GAS URL を設定
3. ⏳ Medical完成（共通基盤に移行）

---

**作成**: Claude (Anthropic)  
**最終更新**: 2026-04-08
