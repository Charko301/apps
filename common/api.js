/**
 * Charko Apps - 共通API通信モジュール v2.0.1
 * @date 2026-04-10
 */

let _gasUrl = (typeof window !== 'undefined' && window.CHARKO_GAS_URL) ? window.CHARKO_GAS_URL : '';

const DEFAULT_TIMEOUT = 10000;

const ERROR_MESSAGES = {
  TIMEOUT:       'タイムアウトしました（10秒以内に応答がありませんでした）',
  NETWORK:       'ネットワークに接続できませんでした。Wi-Fi・通信状態を確認してください',
  HTTP_5XX:      'サーバーでエラーが発生しました。しばらく待ってから再試行してください',
  GAS_URL_UNSET: 'GAS URLが設定されていません。設定タブからURLを入力してください',
  GAS_ERROR:     'スプレッドシートへの保存に失敗しました',
  UNKNOWN:       '予期しないエラーが発生しました',
};

function setGasUrl(url) {
  _gasUrl = url;
  if (typeof window !== 'undefined') window.CHARKO_GAS_URL = url;
  console.log('[CharkoAPI] GAS URL設定:', url);
}

async function callGAS(app, action, data, options = {}) {
  if (!app || !action) return _errRes('UNKNOWN', 'app と action は必須です');
  const url = _gasUrl || (typeof window !== 'undefined' && window.CHARKO_GAS_URL) || '';
  if (!url) return _errRes('GAS_URL_UNSET');
  const button = options.button || null;
  _disableButton(button);
  try {
    return await _fetchWithRetry(url, { app, action, data: data || {} }, options.timeout || DEFAULT_TIMEOUT, options.retry || 0);
  } finally {
    _enableButton(button);
  }
}

async function gasPost(payload, options = {}) {
  const url = _gasUrl || (typeof window !== 'undefined' && window.CHARKO_GAS_URL) || '';
  if (!url) return _errRes('GAS_URL_UNSET');
  const button = options.button || null;
  _disableButton(button);
  try {
    return await _fetchWithRetry(url, payload, options.timeout || DEFAULT_TIMEOUT, options.retry || 0);
  } finally {
    _enableButton(button);
  }
}

async function _fetchWithRetry(url, payload, timeout, maxRetry) {
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetry; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 1500 * attempt));
      console.log(`[CharkoAPI] リトライ ${attempt}/${maxRetry}`);
    }
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeout);
    try {
      console.log('[CharkoAPI] POST', payload.app || payload.type || '(unknown)');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        redirect: 'follow',
        signal: controller.signal,
        body: JSON.stringify(payload),
      });
      clearTimeout(timerId);
      if (!res.ok) { const e = new Error(`HTTP_${res.status}`); e.httpStatus = res.status; throw e; }
      let result;
      try { result = await res.json(); } catch (pe) { throw new Error('INVALID_JSON: ' + pe.message); }
      if (result.success === false) {
        console.warn('[CharkoAPI] GASエラー:', result);
        return { success: false, error_message: result.error_message || ERROR_MESSAGES.GAS_ERROR, error_detail: result.error_detail || '', error_code: 'GAS_ERROR' };
      }
      console.log('[CharkoAPI] 成功:', result);
      return result;
    } catch (err) {
      clearTimeout(timerId);
      lastError = err;
      if (err.name === 'AbortError' || err.message === 'Failed to fetch') break;
      if (attempt < maxRetry) continue;
    }
  }
  return _classifyError(lastError);
}

function _classifyError(err) {
  if (!err) return _errRes('UNKNOWN');
  if (err.name === 'AbortError') return _errRes('TIMEOUT', `${DEFAULT_TIMEOUT/1000}秒以内に応答なし`);
  if (err.message === 'Failed to fetch' || err.message.includes('Network')) return _errRes('NETWORK', err.message);
  if (err.httpStatus >= 500) return _errRes('HTTP_5XX', `HTTP ${err.httpStatus}`);
  return _errRes('UNKNOWN', err.message);
}

function _errRes(code, detail = '') {
  console.error('[CharkoAPI] エラー:', code, detail);
  return { success: false, error_message: ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN, error_detail: detail, error_code: code };
}

function _disableButton(btn) {
  if (!btn) return;
  btn.disabled = true;
  btn.dataset.originalText = btn.textContent;
  btn.textContent = '通信中...';
}

function _enableButton(btn) {
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = btn.dataset.originalText || '送信';
}

if (typeof window !== 'undefined') {
  window.CharkoAPI = { setGasUrl, callGAS, gasPost };
  window.callGAS   = callGAS;
  window.gasPost   = gasPost;
  window.setGasUrl = setGasUrl;
  console.log('[CharkoAPI] モジュール読み込み完了 v2.0.1');
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setGasUrl, callGAS, gasPost };
}
