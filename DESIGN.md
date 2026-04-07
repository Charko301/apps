# Charkoシリーズ 共通基盤設計書

**作成日**: 2026-04-08  
**バージョン**: v1.0  
**ステータス**: 設計承認待ち

---

## 📋 目次

1. [アーキテクチャ概要](#アーキテクチャ概要)
2. [シーケンス図](#シーケンス図)
3. [ファイル構成](#ファイル構成)
4. [API設計](#api設計)
5. [エラーハンドリング](#エラーハンドリング)
6. [移行戦略](#移行戦略)
7. [技術的注意点](#技術的注意点)

---

## 🎯 設計の目的

複数の個人開発アプリ（tracker / medical / kakeibo / kota）を統合管理するための共通基盤を構築する。

### 重要原則
- ✅ **単一HTMLファイル**: ビルド不要、開くだけで動作
- ✅ **共通化優先**: コード重複を排除
- ✅ **拡張性**: 新規アプリ追加が容易
- ✅ **GitHub管理**: バージョン管理・コラボレーション対応
- ✅ **初心者フレンドリー**: 専門用語に補足説明あり

---

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│  https://github.com/[username]/charko-apps                   │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   /common    │      │    /apps     │      │     /gas     │
│  共通モジュール  │      │  個別アプリ   │      │  GASプロジェクト │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        │                     │                     │
   ┌────┴────┐          ┌─────┴─────┐         ┌────┴────┐
   │         │          │           │         │         │
   ▼         ▼          ▼           ▼         ▼         ▼
┌─────┐ ┌──────┐   ┌────────┐ ┌────────┐ ┌──────┐ ┌──────┐
│api.js│ │ui.js │   │tracker │ │medical │ │doPost│ │Sheet │
├─────┤ ├──────┤   │.html   │ │.html   │ │      │ │API   │
│storage│styles│   │kakeibo │ │kota    │ │      │ │      │
│.js   │.css  │   │.html   │ │.html   │ │      │ │      │
└─────┘ └──────┘   └────────┘ └────────┘ └──────┘ └──────┘
```

### データフロー

```
Browser (HTML)
    ↓
common/api.js (callGAS, fetchGAS)
    ↓
fetch() with timeout + AbortController
    ↓
GAS doPost(e) - 単一エントリーポイント
    ↓
app/action による分岐
    ↓
Google Sheets (SSOT = Single Source of Truth)
```

**用語解説**:
- **SSOT**: データの唯一の正しい保存場所。Googleスプレッドシートがそれ
- **共通化**: 同じコードを何度も書かず、1箇所で管理
- **単一HTMLファイル**: ビルド不要で、開くだけで動作確認可能

---

## 2. シーケンス図

### 2-1. 記録保存フロー（正常系）

```
ユーザー              HTML/JS            common/api.js        GAS doPost         Sheets
   │                    │                    │                  │                  │
   │  ①「保存」押下      │                    │                  │                  │
   │─────────────────→  │                    │                  │                  │
   │                    │ ②バリデーション      │                  │                  │
   │                    │  （日付・必須項目）   │                  │                  │
   │                    │  ボタン無効化        │                  │                  │
   │                    │                    │                  │                  │
   │                    │ ③callGAS({         │                  │                  │
   │                    │    app: "tracker", │                  │                  │
   │                    │    action: "save", │                  │                  │
   │                    │    data: {...}     │                  │                  │
   │                    │  })                │                  │                  │
   │                    │─────────────────→  │                  │                  │
   │                    │                    │ ④fetch POST       │                  │
   │                    │                    │  (timeout:10s)   │                  │
   │                    │                    │─────────────────→│                  │
   │                    │                    │                  │ ⑤app/action確認  │
   │                    │                    │                  │  分岐処理実行    │
   │                    │                    │                  │─────────────────→│
   │                    │                    │                  │                  │ データ追記
   │                    │                    │                  │                  │ バックアップJSON保存
   │                    │                    │                  │                  │
   │                    │                    │                  │ ⑥成功レスポンス  │
   │                    │                    │ ⑦JSON受信        │←─────────────────│
   │                    │ ⑧成功データ        │←─────────────────│                  │
   │                    │  {                 │                  │                  │
   │                    │    success: true,  │                  │                  │
   │                    │    data: {...}     │                  │                  │
   │                    │  }                 │                  │                  │
   │  ⑨トースト表示      │←─────────────────  │                  │                  │
   │「保存しました」      │  ボタン再有効化    │                  │                  │
   │←─────────────────  │  localStorage更新  │                  │                  │
   │                    │                    │                  │                  │
```

### 2-2. エラーハンドリングフロー

```
ユーザー              HTML/JS            common/api.js        GAS doPost
   │                    │                    │                  │
   │  ①「保存」押下      │                    │                  │
   │─────────────────→  │                    │                  │
   │                    │ ②callGAS()        │                  │
   │                    │─────────────────→  │                  │
   │                    │                    │ ③fetch POST       │
   │                    │                    │─────────────────→│
   │                    │                    │                  │
   │                    │                    │   【タイムアウト or サーバーエラー】
   │                    │                    │                  │
   │                    │ ④エラーレスポンス   │                  │
   │                    │  {                 │                  │
   │                    │    success: false, │                  │
   │                    │    error_message:  │                  │
   │                    │      "通信失敗",    │                  │
   │                    │    error_detail:   │                  │
   │                    │      "Timeout"     │                  │
   │                    │  }                 │                  │
   │  ⑤エラー表示        │←─────────────────  │                  │
   │「通信に失敗しました」 │  console.log()    │                  │
   │「再試行してください」 │  ボタン再有効化    │                  │
   │←─────────────────  │                    │                  │
```

### 2-3. AI分析フロー（完全分離）

```
ユーザー              HTML/JS            common/api.js        GAS doPost         Gemini API
   │                    │                    │                  │                  │
   │ ①「分析」ボタン押下  │                    │                  │                  │
   │─────────────────→  │                    │                  │                  │
   │                    │ ②callGAS({         │                  │                  │
   │                    │    app: "tracker", │                  │                  │
   │                    │    action:"analyze"│                  │                  │
   │                    │    dates: [...]    │                  │                  │
   │                    │  })                │                  │                  │
   │                    │─────────────────→  │                  │                  │
   │                    │                    │ ③POST             │                  │
   │                    │                    │─────────────────→│                  │
   │                    │                    │                  │ ④Sheetsから読込  │
   │                    │                    │                  │  プロンプト作成  │
   │                    │                    │                  │─────────────────→│
   │                    │                    │                  │                  │ AI処理
   │                    │                    │                  │ ⑤分析結果       │
   │                    │                    │ ⑥JSON            │←─────────────────│
   │                    │ ⑦結果             │←─────────────────│                  │
   │  ⑧分析テキスト表示  │←─────────────────  │                  │                  │
   │←─────────────────  │  バナー表示        │                  │                  │
```

**重要**: 
- 保存時にAIは呼ばない（速度・信頼性のため）
- 分析は別ボタンで明示的に実行

---

## 3. ファイル構成

```
charko-apps/
├── README.md                    # プロジェクト説明
├── DESIGN.md                    # この設計書
├── .gitignore                   # Git除外設定
│
├── common/                      # 共通モジュール（すべてのアプリで使用）
│   ├── api.js                   # GAS通信 (callGAS, fetchGAS)
│   ├── storage.js               # localStorage操作
│   ├── ui.js                    # 共通UI（トースト、ローディング）
│   └── styles.css               # 共通スタイル（カラー変数、レイアウト）
│
├── apps/                        # 個別アプリ
│   ├── tracker/
│   │   ├── charko_tracker.html  # 日次記録アプリ
│   │   └── tracker-specific.css # アプリ固有スタイル
│   │
│   ├── medical/
│   │   ├── charko_medical.html  # 受診記録アプリ（優先実装）
│   │   └── medical-specific.css
│   │
│   ├── kakeibo/
│   │   ├── kakeibo.html         # 家計簿アプリ
│   │   └── kakeibo-specific.css
│   │
│   └── kota/
│       ├── kota.html            # ペット記録アプリ
│       └── kota-specific.css
│
└── gas/                         # Google Apps Script
    ├── Code.gs                  # メインエントリーポイント (doPost)
    ├── TrackerService.gs        # tracker専用処理
    ├── MedicalService.gs        # medical専用処理
    ├── KakeiboService.gs        # kakeibo専用処理
    ├── KotaService.gs           # kota専用処理
    └── Common.gs                # 共通ユーティリティ
```

### 各ファイルの役割

#### common/api.js
- `callGAS(app, action, data)` - POST送信
- `fetchGAS(app, action, params)` - GET取得
- 統一エラーハンドリング
- 10秒タイムアウト with AbortController
- ボタン無効化/有効化

#### common/storage.js
- `saveToLocal(key, data)` - localStorage保存
- `loadFromLocal(key)` - localStorage読込
- `clearLocal(key)` - localStorage削除
- データバージョニング対応

#### common/ui.js
- `showToast(message, type)` - 通知表示
- `showLoading(message)` - ローディング表示
- `hideLoading()` - ローディング非表示
- `showError(error_message, error_detail)` - エラー表示

#### common/styles.css
- CSS変数（カラースキーム、フォント、サイズ）
- レスポンシブレイアウト（max-width: 540px）
- 共通コンポーネント（ボタン、カード、アコーディオン）

#### gas/Code.gs
単一エントリーポイント `doPost(e)` で全リクエストを受け取り、app/actionで分岐

---

## 4. API設計

### リクエスト形式（全アプリ共通）

```javascript
{
  app: "tracker" | "medical" | "kakeibo" | "kota",
  action: "save" | "load" | "delete" | "analyze",
  data: {
    // アプリ・アクション固有のデータ
  }
}
```

### レスポンス形式（統一）

**成功時:**
```javascript
{
  success: true,
  data: {
    // アプリごとに異なるデータ
  }
}
```

**失敗時:**
```javascript
{
  success: false,
  error_message: "ユーザー向けメッセージ（日本語）",
  error_detail: "デバッグ用詳細（英語エラー文など）"
}
```

### アクション一覧

#### tracker
- `save` - 日次記録保存
- `load` - 指定日のデータ読込
- `analyze` - AI分析実行
- `bulk_load` - 期間指定で一括読込

#### medical
- `save` - 受診記録保存
- `load` - 全受診記録読込
- `delete` - 受診記録削除
- `summary` - Claude連携サマリー生成

#### kakeibo
- `save` - 取引保存
- `load` - 月次データ読込
- `analyze` - 支出分析

#### kota
- `save` - ペット記録保存
- `load` - 期間指定読込

---

## 5. エラーハンドリング

### エラータイプ別の処理

| エラータイプ | error_message | error_detail | ユーザーアクション |
|-------------|---------------|--------------|-------------------|
| ネットワークタイムアウト | 通信に失敗しました | Timeout after 10s | 再試行ボタン表示 |
| GASエラー | サーバーでエラーが発生しました | GAS例外メッセージ | 再試行ボタン表示 |
| バリデーションエラー | 入力内容を確認してください | Missing required field: date | エラー箇所をハイライト |
| 重複データ | すでに同じ日付のデータがあります | Duplicate entry for 2024-04-08 | 上書き確認ダイアログ |

### エラーログ出力

```javascript
// フロントエンド
console.error('[CharkoAPI Error]', {
  app: 'tracker',
  action: 'save',
  error: error_detail,
  timestamp: new Date().toISOString()
});

// GAS
Logger.log('[ERROR] ' + app + '/' + action + ': ' + error.toString());
```

---

## 6. 移行戦略

### フェーズ1: 共通基盤実装（優先度：最高）
1. `common/api.js` 実装
2. `common/ui.js` 実装
3. `common/storage.js` 実装
4. `common/styles.css` 実装
5. `gas/Code.gs` 実装（doPost）

### フェーズ2: アプリ移行（既存機能維持）
1. **Medical完成優先** ← ユーザー要望
2. Tracker移行
3. Kakeibo移行
4. Kota移行

### フェーズ3: 最適化
1. 共通スタイル洗練化
2. パフォーマンス改善
3. エラーハンドリング強化

---

## 7. 技術的注意点

### AbortControllerの使い方（初心者向け）

```javascript
// タイムアウト処理の仕組み
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

fetch(url, { signal: controller.signal })
  .then(response => {
    clearTimeout(timeoutId);  // 成功したらタイマー解除
    return response.json();
  })
  .catch(error => {
    if (error.name === 'AbortError') {
      // タイムアウトエラー
    }
  });
```

**解説**: `AbortController`は「このfetchを10秒経ったら止める」ための仕組み。`signal`を渡すことで、外部からfetchを中断できる。

### localStorageの使い分け

- **保存前の一時データ**: localStorage（オフライン編集可能）
- **確定データ**: Google Sheets（バックアップあり）
- **表示用キャッシュ**: localStorage（高速表示）

### GAS実装時の注意

```javascript
// ❌ 悪い例: app名を直接if文で書く
if (app === 'tracker') { ... }
if (app === 'medical') { ... }
// → アプリ追加のたびにdoPostを修正

// ✅ 良い例: サービス分離
const services = {
  'tracker': TrackerService,
  'medical': MedicalService,
  'kakeibo': KakeiboService,
  'kota': KotaService
};
return services[app].handle(action, data);
// → 新規アプリはサービス追加のみでOK
```

---

## 8. チェックリスト

設計要件の確認：

- ✅ GASは1つ
- ✅ API入口はdoPostのみ
- ✅ analyzeとCRUDが分離
- ✅ API通信は共通JS化
- ✅ エラー構造統一
- ✅ タイムアウトで固まらない
- ✅ 拡張性あり（/apps配下に追加可能）
- ✅ GitHub管理前提

---

## 9. 次のステップ

1. ✅ 設計レビュー ← 今ここ
2. ⏳ 共通基盤実装（`common/`配下）
3. ⏳ GAS実装（`gas/Code.gs`）
4. ⏳ Medical完成（既存機能を共通基盤に移行）
5. ⏳ 他アプリ順次移行

---

## 変更履歴

### v1.0 (2026-04-08)
- 初版作成
- アーキテクチャ図、シーケンス図、ファイル構成を策定
- API設計、エラーハンドリング戦略を定義
- 移行フェーズを計画

---

**作成者**: Claude (Anthropic)  
**レビュー待ち**: しゃーこ
