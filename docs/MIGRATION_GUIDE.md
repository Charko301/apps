# Tracker データ移行ガイド

**App_data（60列形式）→ tracker_data（JSON形式）**

---

## 📋 移行の流れ

### 全体像

```
既存データ               新形式
┌─────────────┐         ┌─────────────┐
│  App_data   │         │tracker_data │
│  (60列)     │  ───→   │  (3列)      │
│             │         │             │
│ 2026-04-01  │         │ date  data  │
│ 気分: 1     │         │ 2026  {...} │
│ 活力: 3     │         │ -04          │
│ ...         │         │ -01          │
└─────────────┘         └─────────────┘
```

---

## 🚀 実行手順

### ステップ1: バックアップ作成

**重要**: 必ずスプレッドシート全体をコピー！

1. スプレッドシートを開く
2. 「ファイル」→「コピーを作成」
3. 名前を「Charko Tracker バックアップ」などに変更
4. 保存

### ステップ2: Code.gs に移行スクリプトを追加

1. Apps Script エディタを開く
2. 「+」→「スクリプト」をクリック
3. 名前を「Migration」に変更
4. ダウンロードした `migration_script.gs` の内容を貼り付け
5. `Ctrl + S` で保存

### ステップ3: プレビュー実行（安全確認）

1. 関数選択で **`previewMigration`** を選択
2. 「▶ 実行」をクリック
3. 実行ログを確認

#### 確認ポイント

```
【1件目】
日付: 2026-04-08
JSON: {
  "date": "2026-04-08",
  "moodMorning": 1,
  "energyMorning": 3,
  "diary": "今日は..."
  ...
}
```

- ✅ 日付が正しく表示される
- ✅ JSONに各項目が含まれている
- ✅ 日本語キーが英語に変換されている

### ステップ4: 本番移行実行

1. 関数選択で **`migrateAppDataToTrackerData`** を選択
2. 「▶ 実行」をクリック
3. 実行ログで進捗を確認

#### 実行ログ例

```
移行開始: 120件のデータを処理します
進捗: 10件完了
進捗: 20件完了
...
進捗: 120件完了
━━━━━━━━━━━━━━━━━━━━━━━━━━
移行完了！
成功: 120件
スキップ: 0件
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### ステップ5: 確認

スプレッドシートに戻って確認：

1. 新しく `tracker_data` シートが作成されている
2. 各行に日付とJSONデータが入っている
3. App_data はそのまま残っている（削除されていない）

---

## 📊 移行後のシート構造

### tracker_data（新形式）

| date | data | updated_at |
|------|------|------------|
| 2026-04-08 | {"moodMorning":1,"energyMorning":3...} | 2026-04-08T12:34:56.789Z |
| 2026-04-07 | {"moodMorning":2,"energyMorning":2...} | 2026-04-08T12:34:56.789Z |

### App_data（旧形式）

そのまま残ります。参照用として使えます。

---

## 🎯 移行後の使い方

### グラフ化・分析

JSONデータから特定の項目を抽出する関数を作成：

```javascript
/**
 * tracker_dataから気分の推移を取得
 */
function getMoodTrend(startDate, endDate) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('tracker_data');
  const values = sheet.getDataRange().getValues();
  
  const results = [];
  
  for (let i = 1; i < values.length; i++) {
    const date = values[i][0];
    
    if (date >= startDate && date <= endDate) {
      const data = JSON.parse(values[i][1]);
      
      results.push({
        date: date,
        moodMorning: data.moodMorning || null,
        moodNoon: data.moodNoon || null,
        moodEvening: data.moodEvening || null
      });
    }
  }
  
  return results;
}
```

### Looker Studio（旧Google Data Studio）連携

1. Looker Studio を開く
2. データソースに「Googleスプレッドシート」を選択
3. `tracker_data` シートを選択
4. `data` 列から必要な項目を抽出
5. グラフ作成

---

## ⚠️ トラブルシューティング

### Q1. 「App_data シートが見つかりません」エラー

**A**: シート名が違う可能性があります。

1. スプレッドシートでシート名を確認
2. `migration_script.gs` の以下を修正：

```javascript
const appDataSheet = ss.getSheetByName('App_data');
```

↓ 実際のシート名に変更

```javascript
const appDataSheet = ss.getSheetByName('実際のシート名');
```

### Q2. 「日付列が見つかりません」エラー

**A**: 列名が違う可能性があります。

1. App_data シートの1行目（ヘッダー）を確認
2. 日付の列名をコピー
3. スクリプト内の `'日付'` を実際の列名に変更

### Q3. データが一部しか移行されない

**A**: 日付列が空の行はスキップされます。

- これは正常動作です
- スキップ件数が実行ログに表示されます

### Q4. 移行後、グラフが作れない

**A**: JSONから値を取り出す処理が必要です。

- 上記の `getMoodTrend` のような関数を作成
- または、Looker Studioで抽出処理を行う

---

## 🎉 次のステップ

移行完了後：

1. ✅ tracker_data の確認
2. ⏳ 新しいHTMLアプリの作成（共通基盤版）
3. ⏳ グラフ化・分析機能の追加

---

**作成**: Claude (Anthropic)  
**最終更新**: 2026-04-08
