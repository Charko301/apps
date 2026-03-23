# charko_tracker — 開発メモ

双極性障害の日次セルフモニタリングアプリ。  
URL: https://charko301.github.io/apps/charko_tracker.html

---

## 環境・接続先

| 項目 | 値 |
|---|---|
| スプレッドシートID | `1ikC4auuAYjrqQKFsygCqXIY2L0Fjye-OoLBGLEwXq5I` |
| GAS URL | `https://script.google.com/macros/s/AKfycbwummKFKtsuDPTZ_QlcyF_rbF3iyCU4jWgMqJZ1U8lx2EmX93SOtxqCNaeLVsNHkDuoZA/exec` |
| Google OAuth Client ID | `933210373015-34tar1apnfdcb94gl743tqajpp954m0r.apps.googleusercontent.com` |
| 天気API | Open-Meteo（無料・無認証） 半田市 34.8939, 136.9380 |

---

## データ構造（v4.x）

```json
{
  "recordId": "rec_YYYY-MM-DD",
  "data": { },
  "metadata": { "updatedAt": "ISO8601", "appVer": "4.2" },
  "feedbacks": [
    { "model": "claude|gemini|gpt", "text": "...", "createdAt": "ISO8601" }
  ]
}
```

- `feedbacks` は配列・追記のみ（上書き禁止）
- v3.x旧形式は `loadRec()` が自動マイグレーション

---

## 主要関数

```js
// データ
loadRec(k)                      // 1日分レコード全体（新旧両対応）
saveRec(updates, k)             // data フィールドをマージ更新
saveFeedback(model, text, k)    // feedbacks に追記
recData(k)                      // data 部分だけ返す

// 時刻
parseTimeText(val)              // "930" → "09:30"（0省略対応）
stampTime(inputId, nowBtnId)    // 今ボタン
onManualTimeInput(el, nowBtnId) // 手入力（黄色表示）
onTimeBlur(el)                  // blur 時に HH:MM 整形

// 食事・服薬
stampMeal(hiddenId, timeInputId, nowBtnId, noBtnId)
clearMeal(hiddenId, timeInputId, nowBtnId, noBtnId)
stampMed(hiddenId, timeInputId, nowBtnId, noBtnId)
clearMed(hiddenId, timeInputId, nowBtnId, noBtnId)

// AI
sendAIFeedback(context)         // context: 'night' | 'record'
selectAIModel(model)            // 'claude' | 'gemini' | 'gpt'

// GAS
gasPostWithRetry(payload, maxRetry, returnResponse)
flushQueue()                    // オフラインキュー処理

// ストレージ
archiveOldData()                // 1年以上前を削除（DL後に実行）
getStorageUsage()               // 使用量(MB)を返す
```

---

## エラーコード（固定4種）

| コード | 意味 |
|---|---|
| `NETWORK_ERROR` | 接続なし・タイムアウト |
| `SERVER_ERROR` | GAS/API の 5xx |
| `VALIDATION_ERROR` | 入力不正・4xx |
| `UNKNOWN_ERROR` | その他 |

---

## GAS payload の type 一覧

| type | 処理 |
|---|---|
| （なし） | 日次データをスプシに保存 |
| `gemini_feedback` | Gemini でフィードバックを返す |
| `gpt_feedback` | GPT でフィードバックを返す |
| `unified_log` | Gemini/GPT ログを Unified_Log に統合 |

---

## バージョンアップ手順

1. **先に「⬆️ 全データをスプシに保存」を実行**
2. GitHub で `charko_tracker.html` を開く → 「…」→「Delete file」→ Commit
3. 「Add file」→「Upload files」→ 新しい `charko_tracker.html` をアップロード → Commit
4. 30秒待って https://charko301.github.io/apps/charko_tracker.html を開く

---

## バージョン履歴

| バージョン | 主な変更 |
|---|---|
| v4.2 | レスポンシブ対応（PC左サイドバー・2カラム） |
| v4.1 | オートセーブ・7日移動平均・コンサータ通知・原付危険度・アーカイブ |
| v4.0 | 全面リビルド・新データ構造（feedbacks配列）・複数AIモデル対応 |
| v3.9 | 中途覚醒UI・状態評価順番・使い方分離 |
| v3.8 | 月0省略入力・今ボタン色管理・グラフ位置バグ修正 |
| v3.5〜3.7 | アコーディオン化・時刻0省略・ログUI改善 |
| v3.0〜3.4 | 初期リリース・各機能追加 |
