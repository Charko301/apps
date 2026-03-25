/**
 * Charkoシリーズ 共通API通信モジュール
 * 全アプリ共通。fetch・タイムアウト・エラー処理を一元管理。
 *
 * 使い方:
 *   charkoApi('tracker', 'save',    { date, record })
 *   charkoApi('tracker', 'load',    { date })
 *   charkoApi('tracker', 'analyze', { prompt, provider })
 *   charkoApi('tracker', 'archive', { date })
 */

// ─── GAS エンドポイント（デプロイ後に更新） ───
const CHARKO_GAS_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// ─── オフライン送信キュー（localStorageに保持） ───
const QUEUE_KEY = 'charko_queue';

/**
 * GAS にリクエストを送る共通関数
 * @param {string} app    - アプリ名 ('tracker' | 'medical' | 'money')
 * @param {string} action - 操作名 ('save' | 'load' | 'analyze' | 'archive')
 * @param {object} data   - 送信データ
 * @param {object} opts   - { silent: bool, timeout: ms }
 * @returns {Promise<{success, data, error_message, error_detail}>}
 */
async function charkoApi(app, action, data = {}, opts = {}) {
  const { silent = false, timeout = 10000 } = opts;

  // タイムアウト制御（AbortController）
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const payload = { app, action, data };
  console.log('[charkoApi] request:', app, action, data);

  try {
    const res = await fetch(CHARKO_GAS_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'text/plain' }, // CORS対応のためtext/plain
      body: JSON.stringify(payload),
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    console.log('[charkoApi] response:', json);

    if (!json.success) {
      throw new Error(json.error_message || `GASエラー: ${json.error_detail || '不明'}`);
    }
    return json;

  } catch (e) {
    clearTimeout(timer);
    const msg = e.name === 'AbortError'
      ? '通信タイムアウト（10秒）。接続を確認してください。'
      : e.message;
    console.error('[charkoApi] error:', msg);

    // silent=false のときだけトーストを出す
    if (!silent && typeof showToast === 'function') {
      showToast('⚠️ ' + msg.slice(0, 50), 'var(--a2)');
    }
    throw new Error(msg);
  }
}

// ─── オフラインキュー（送信失敗時にためておく） ───

function enqueueRequest(app, action, data) {
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  q.push({ app, action, data, ts: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  console.log('[charkoApi] enqueued. queue length:', q.length);
}

async function flushQueue() {
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (!q.length) return;

  const failed = [];
  for (const item of q) {
    try {
      await charkoApi(item.app, item.action, item.data, { silent: true });
    } catch {
      failed.push(item);
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
  if (!failed.length && typeof showToast === 'function') {
    showToast('📤 オフラインデータを送信しました', 'var(--a3)');
  }
}

// ─── save を試みて失敗したらキューに積む ───
async function charkoSave(app, data) {
  try {
    await charkoApi(app, 'save', data, { silent: true });
    return true;
  } catch {
    enqueueRequest(app, 'save', data);
    if (typeof showToast === 'function') {
      showToast('⚠️ オフライン保存（次回接続時に送信）', 'var(--a4)');
    }
    return false;
  }
}
