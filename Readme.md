# 🏥 Charko Apps シリーズ

**しゃーこの個人開発アプリ集 - 日常記録を1箇所で管理**

[![Status](https://img.shields.io/badge/status-開発中-yellow)]()
[![GitHub](https://img.shields.io/badge/managed-GitHub-blue)]()
[![Data](https://img.shields.io/badge/data-Google%20Sheets-green)]()

---

## 📱 アプリ一覧

| アプリ | 説明 | ステータス | URL |
|--------|------|------------|-----|
| 🏃 **Tracker** | 日次記録（気分・活動・健康） | ✅ 稼働中 | [tracker.html](apps/tracker/charko_tracker.html) |
| 🏥 **Medical** | 受診記録・薬管理 | 🚧 実装中 | [medical.html](apps/medical/charko_medical.html) |
| 💰 **Kakeibo** | 家計簿 | ✅ 稼働中 | [kakeibo.html](apps/kakeibo/kakeibo.html) |
| 🐾 **Kota** | ペット記録 | 📝 設計済 | [kota.html](apps/kota/kota.html) |

---

## 🎯 プロジェクトの目的

複数の個人開発アプリを**共通基盤**で統合管理し、以下を実現する：

- ✅ **コード重複の排除**: API通信・UI・スタイルを共通化
- ✅ **拡張性**: 新規アプリを簡単に追加
- ✅ **保守性**: 修正が1箇所で済む
- ✅ **GitHub管理**: バージョン管理・バックアップ
- ✅ **単一HTMLファイル**: ビルド不要、開くだけで動作

---

## 🏗 アーキテクチャ

```
charko-apps/
├── common/          # 共通モジュール（全アプリで使用）
│   ├── api.js       # GAS通信（callGAS, fetchGAS）
│   ├── storage.js   # localStorage操作
│   ├── ui.js        # トースト・ローディング
│   └── styles.css   # 共通スタイル
│
├── apps/            # 個別アプリ
│   ├── tracker/     # 日次記録
│   ├── medical/     # 受診記録
│   ├── kakeibo/     # 家計簿
│   └── kota/        # ペット記録
│
└── gas/             # Google Apps Script
    ├── Code.gs      # doPost（単一エントリーポイント）
    └── *Service.gs  # 各アプリ専用処理
```

**データフロー**:
```
HTML → common/api.js → GAS doPost → Google Sheets (SSOT)
```

詳細は [DESIGN.md](DESIGN.md) を参照。

---

## 🚀 使い方

### 1. リポジトリのクローン

```bash
git clone https://github.com/[username]/charko-apps.git
cd charko-apps
```

### 2. アプリを開く

```bash
# 例: Trackerを開く
open apps/tracker/charko_tracker.html
```

単一HTMLファイルなので、ブラウザで直接開くだけでOK。

### 3. GASデプロイURL設定

各HTMLファイルの`GAS_URL`変数に、自分のGASデプロイURLを設定：

```javascript
const GAS_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

### 4. Google Sheetsの準備

スプレッドシートに以下のシートを作成：

- `tracker_data` - 日次記録
- `medical_visits` - 受診記録
- `kakeibo_transactions` - 家計簿
- `kota_logs` - ペット記録
- `_backup` - JSONバックアップ（自動作成）

---

## 🔧 開発環境

### 必要なもの

- ブラウザ（Chrome/Safari/Edge推奨）
- Googleアカウント
- GitHub Personal Access Token（アップロード用）

### 開発の流れ

1. HTMLファイルを編集
2. ブラウザでリロードして確認
3. `charko_github_uploader.html`でGitHubにアップロード

---

## 📚 ドキュメント

- [DESIGN.md](DESIGN.md) - 共通基盤の設計書
- [gas/README.md](gas/README.md) - GAS実装ガイド（予定）
- [common/README.md](common/README.md) - 共通モジュール説明（予定）

---

## 🛠 技術スタック

| 分野 | 技術 |
|------|------|
| フロントエンド | HTML, Vanilla JavaScript, CSS |
| データストレージ | Google Sheets |
| サーバーサイド | Google Apps Script (GAS) |
| AI | Gemini API (分析機能) |
| バージョン管理 | GitHub |
| デザイン | CSS Variables, レスポンシブ |

---

## 🔐 セキュリティ

- **APIキー**: localStorageに暗号化せず保存（個人利用前提）
- **アクセス制限**: GASは認証済みユーザーのみ
- **バックアップ**: Google Sheetsに自動JSON保存

---

## 📝 開発ログ

### 2026-04-08
- [x] 共通基盤設計完了
- [ ] `common/api.js`実装
- [ ] `gas/Code.gs`実装
- [ ] Medical完成

### 過去の履歴
- 2025-XX-XX: Tracker AI分析機能追加（Gemini API統合）
- 2025-XX-XX: Medical v2 完成（Claude連携）
- 2025-XX-XX: Kakeibo v3 リリース

---

## 🤝 コントリビューション

個人開発プロジェクトですが、改善提案は歓迎です：

1. Issue作成
2. Fork & Pull Request
3. レビュー → マージ

---

## 📄 ライセンス

MIT License - 自由に使ってOK

---

## 👤 開発者

**しゃーこ** - 個人開発者

- GitHub: [@username](https://github.com/username)
- アプリシリーズ: Charko Apps

---

## 🙏 謝辞

- **Claude (Anthropic)** - 設計支援・実装サポート
- **Google Apps Script** - サーバーレス基盤
- **Google Sheets** - データストレージ

---

**最終更新**: 2026-04-08
