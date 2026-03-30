# charko_tracker — 双極性障害の日次セルフモニタリングアプリ

## 基本情報

| 項目 | 値 |
|---|---|
| URL | https://charko301.github.io/apps/charko_tracker.html |
| スプレッドシート ID | `1ikC4auuAYjrqQKFsygCqXIY2L0Fjye-OoLBGLEwXq5I` |
| GAS URL | `https://script.google.com/macros/s/AKfycbwummKFKtsuDPTZ_QlcyF_rbF3iyCU4jWgMqJZ1U8lx2EmX93SOtxqCNaeLVsNHkDuoZA/exec` |
| Google OAuth Client ID | `933210373015-34tar1apnfdcb94gl743tqajpp954m0r.apps.googleusercontent.com` |
| 天気 API | Open-Meteo（無料・無認証）半田市 34.8939, 136.9380 |

---

## データ構造（v4.x）

```json
{
  "recordId": "rec_YYYY-MM-DD",
  "data": { },
  "metadata": { "updatedAt": "ISO8601", "appVer": "4.19" },
  "feedbacks": [
    { "model": "claude|gemini|gpt", "text": "...", "createdAt": "ISO8601" }
  ]
}
```

- `feedbacks` は配列・追記のみ（上書き禁止）
- v3.x 旧形式は `loadRec()` が自動マイグレーション

---

## 主要関数グループ

| グループ | 関数 |
|---|---|
| データ | `loadRec()` / `saveRec()` / `saveFeedback()` / `recData()` |
| 時刻 | `parseTimeText()` / `stampTime()` / `onTimeBlur()` |
| 食事・服薬 | `stampMeal()` / `clearMeal()` / `stampMed()` / `clearMed()` |
| AI | `sendAIFeedback()` / `selectAIModel()` |
| GAS | `gasPostWithRetry()` / `flushQueue()` |
| ストレージ | `archiveOldData()` / `getStorageUsage()` |
| 勤務 | `setAttendTime()` / `autoSetNoonMealTakeout()` |

---

## エラーコード（4種）

| コード | 意味 |
|---|---|
| `NETWORK_ERROR` | 接続なし・タイムアウト |
| `SERVER_ERROR` | GAS/API の 5xx |
| `VALIDATION_ERROR` | 入力不正・4xx |
| `UNKNOWN_ERROR` | その他 |

> **PC（768px以上）** ではエラーをトーストで表示。モバイルはダイアログ。

---

## GAS payload type

| type | 処理 |
|---|---|
| （なし） | 日次データをスプシに保存 |
| `gemini_feedback` | Gemini でフィードバックを返す |
| `gpt_feedback` | GPT でフィードバックを返す |
| `unified_log` | Gemini/GPT ログを Unified_Log に統合 |
| `archive` | 全データを Archive シートにバックアップ |

---

## バージョンアップ手順

1. **「⬆️ 全データをスプシに保存」を必ず先に実行**
2. GitHub で `charko_tracker.html` を開く → 「…」→「Delete file」→「Commit changes」
3. 「Add file」→「Upload files」→ 新しい `charko_tracker.html` をアップロード → 「Commit changes」
4. 30秒〜1分待って https://charko301.github.io/apps/charko_tracker.html を確認
5. スマホでキャッシュが残る場合はブラウザ設定からキャッシュ削除

---

## バージョン履歴

| バージョン | 主な変更 |
|---|---|
| v4.19 | 出勤時に昼食「中食」自動設定・PCセーブエラーをトースト化 |
| v4.2 | レスポンシブ対応（PC左サイドバー・2カラム） |
| v4.1 | オートセーブ・7日移動平均・コンサータ通知・原付危険度・アーカイブ |
| v4.0 | 全面リビルド・新データ構造（feedbacks配列）・複数AIモデル対応 |
| v3.9 | 中途覚醒UI・状態評価順番・使い方分離 |
| v3.8 | 月0省略入力・今ボタン色管理・グラフ位置バグ修正 |
| v3.5〜3.7 | アコーディオン化・時刻0省略・ログUI改善 |
| v3.0〜3.4 | 初期リリース・各機能追加 |
