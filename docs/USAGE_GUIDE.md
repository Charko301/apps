# Charko Apps 共通基盤 使い方ガイド

**v1.0.0** | 2026-04-08

---

## 📚 目次

1. [セットアップ](#セットアップ)
2. [API通信（api.js）](#api通信)
3. [UI表示（ui.js）](#ui表示)
4. [データ保存（storage.js）](#データ保存)
5. [実装例](#実装例)

---

## 1. セットアップ

### HTMLファイルへの組み込み

各アプリのHTMLファイルの`<head>`タグ内に以下を追加：

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Charko Tracker</title>
  
  <!-- 共通モジュール読み込み -->
  <script src="../common/api.js"></script>
  <script src="../common/ui.js"></script>
  <script src="../common/storage.js"></script>
  
  <!-- アプリ固有のスタイル -->
  <link rel="stylesheet" href="./tracker-specific.css">
</head>
<body>
  <!-- アプリのHTML -->
  
  <script>
    // GAS URL設定（最初に必ず実行）
    CharkoAPI.setGasUrl('https://script.google.com/macros/s/.../exec');
  </script>
</body>
</html>
```

---

## 2. API通信

### 2-1. 基本的な使い方

```javascript
// データ保存
async function saveData() {
  const result = await CharkoAPI.callGAS('tracker', 'save', {
    date: '2026-04-08',
    mood: 1,
    energy: 3,
    diary: '今日はいい天気だった'
  });

  if (result.success) {
    console.log('保存成功:', result.data);
    CharkoUI.showToast('保存しました', 'success');
  } else {
    console.error('保存失敗:', result.error_message);
    CharkoUI.showError(result.error_message, result.error_detail);
  }
}
```

### 2-2. ボタン無効化付き

```javascript
async function saveWithButton() {
  const saveBtn = document.getElementById('save-btn');
  
  const result = await CharkoAPI.callGAS('medical', 'save', visitData, {
    button: saveBtn  // 通信中は自動で無効化される
  });

  CharkoUI.handleApiResult(result, '受診記録を保存しました');
}
```

### 2-3. エラーハンドリング

```javascript
const result = await CharkoAPI.callGAS('tracker', 'analyze', { date });

if (result.success) {
  // 成功
  const analysis = result.data.analysis;
  displayAnalysis(analysis);
} else {
  // 失敗
  if (result.error_detail.includes('Timeout')) {
    // タイムアウト時の処理
    CharkoUI.showError('通信がタイムアウトしました', '再度お試しください');
  } else {
    // その他のエラー
    CharkoUI.showError(result.error_message, result.error_detail);
  }
}
```

---

## 3. UI表示

### 3-1. トースト通知

```javascript
// 成功
CharkoUI.showToast('保存しました', 'success');

// エラー
CharkoUI.showToast('保存に失敗しました', 'error');

// 情報
CharkoUI.showToast('同期中...', 'info', 3000); // 3秒表示

// 警告
CharkoUI.showToast('未保存のデータがあります', 'warning');
```

### 3-2. ローディング表示

```javascript
async function uploadData() {
  CharkoUI.showLoading('アップロード中...');
  
  try {
    await CharkoAPI.callGAS('tracker', 'bulk_save', records);
    CharkoUI.showToast('アップロード完了', 'success');
  } catch (error) {
    CharkoUI.showError('アップロード失敗', error.message);
  } finally {
    CharkoUI.hideLoading();
  }
}
```

### 3-3. エラー表示（再試行付き）

```javascript
CharkoUI.showError(
  '通信に失敗しました',
  'Timeout after 10s',
  () => {
    // 再試行ボタンが押された時の処理
    retryUpload();
  }
);
```

### 3-4. 確認ダイアログ

```javascript
async function deleteRecord(date) {
  const ok = await CharkoUI.confirm(
    `${date} のデータを削除しますか？`,
    '削除',
    'キャンセル'
  );

  if (ok) {
    const result = await CharkoAPI.callGAS('tracker', 'delete', { date });
    CharkoUI.handleApiResult(result, '削除しました');
  }
}
```

---

## 4. データ保存

### 4-1. 基本操作

```javascript
// 保存
CharkoStorage.save('user_settings', {
  theme: 'dark',
  fontSize: 14,
  notifications: true
});

// 読込
const settings = CharkoStorage.load('user_settings', {
  theme: 'light', // デフォルト値
  fontSize: 12,
  notifications: false
});

// 存在確認
if (CharkoStorage.exists('user_settings')) {
  console.log('設定が保存されています');
}

// 削除
CharkoStorage.remove('temp_data');
```

### 4-2. 日次記録（tracker専用）

```javascript
// 保存
CharkoStorage.saveRecord('2026-04-08', {
  mood: 1,
  energy: 3,
  diary: '今日は...'
});

// 読込
const record = CharkoStorage.loadRecord('2026-04-08');
if (record) {
  console.log(record.mood);
}

// 直近N件取得
const recent = CharkoStorage.listRecords(7); // 直近7件
recent.forEach(({ date, data }) => {
  console.log(date, data.mood);
});
```

### 4-3. 使用容量確認

```javascript
const { usedMB } = CharkoStorage.getUsage();
console.log(`使用中: ${usedMB.toFixed(2)} MB`);

if (usedMB > 4) {
  alert('ストレージ容量が不足しています（上限5MB）');
}
```

---

## 5. 実装例

### 5-1. 保存ボタンの実装

```javascript
document.getElementById('save-btn').addEventListener('click', async () => {
  // バリデーション
  const date = document.getElementById('date').value;
  if (!date) {
    CharkoUI.showToast('日付を入力してください', 'warning');
    return;
  }

  // データ収集
  const data = {
    date,
    mood: getMoodValue(),
    energy: getEnergyValue(),
    diary: document.getElementById('diary').value
  };

  // localStorage保存
  CharkoStorage.saveRecord(date, data);

  // GAS同期
  const saveBtn = document.getElementById('save-btn');
  const result = await CharkoAPI.callGAS('tracker', 'save', data, {
    button: saveBtn
  });

  CharkoUI.handleApiResult(result, '保存しました');
});
```

### 5-2. AI分析の実装

```javascript
async function analyzeRecord(date) {
  // ローディング表示
  CharkoUI.showLoading('AI分析中...');

  try {
    // API呼び出し
    const result = await CharkoAPI.callGAS('tracker', 'analyze', { date });

    if (result.success) {
      // 分析結果表示
      document.getElementById('analysis-text').textContent = result.data.analysis;
      CharkoUI.showToast('分析完了', 'success');
    } else {
      CharkoUI.showError(result.error_message, result.error_detail);
    }
  } finally {
    CharkoUI.hideLoading();
  }
}
```

### 5-3. 初回読み込み処理

```javascript
window.addEventListener('DOMContentLoaded', () => {
  // GAS URL設定
  CharkoAPI.setGasUrl('https://script.google.com/macros/s/.../exec');

  // 設定読み込み
  const settings = CharkoStorage.load('user_settings', {
    theme: 'light'
  });

  // テーマ適用
  document.body.dataset.theme = settings.theme;

  // 今日の記録読み込み
  const today = new Date().toISOString().slice(0, 10);
  const record = CharkoStorage.loadRecord(today);
  
  if (record) {
    loadRecordToForm(record);
  }
});
```

---

## 📝 チートシート

### よく使うパターン

```javascript
// ── 保存 ──
const result = await CharkoAPI.callGAS('tracker', 'save', data, { button });
CharkoUI.handleApiResult(result, '保存しました');

// ── 読込 ──
const result = await CharkoAPI.callGAS('tracker', 'load', { date });
if (result.success) displayData(result.data);

// ── 削除（確認付き） ──
const ok = await CharkoUI.confirm('削除しますか？');
if (ok) {
  await CharkoAPI.callGAS('tracker', 'delete', { id });
  CharkoUI.showToast('削除しました', 'success');
}

// ── ローカル保存 ──
CharkoStorage.saveRecord(date, data);

// ── ローカル読込 ──
const data = CharkoStorage.loadRecord(date);
```

---

## 🔧 トラブルシューティング

### Q1. 「GAS URL未設定」エラー

```javascript
// 解決: HTMLファイルで setGasUrl を呼ぶ
CharkoAPI.setGasUrl('https://script.google.com/...');
```

### Q2. タイムアウトエラーが頻発

```javascript
// 解決: タイムアウト時間を延長
await CharkoAPI.callGAS('tracker', 'analyze', data, {
  timeout: 20000  // 20秒に延長
});
```

### Q3. ストレージ容量不足

```javascript
// 解決: 古いデータを削除
const old = CharkoStorage.keys()
  .filter(k => k.startsWith('record_'))
  .sort()
  .slice(0, -30); // 最新30件以外削除

old.forEach(k => CharkoStorage.remove(k));
```

---

## 🎓 次のステップ

1. ✅ 共通モジュール理解
2. ⏳ GAS実装（gas/Code.gs）
3. ⏳ Medical完成（既存 → 共通基盤移行）

---

**作成**: Claude (Anthropic)  
**最終更新**: 2026-04-08
