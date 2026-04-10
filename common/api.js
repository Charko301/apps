/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Charko Apps - 共通API通信モジュール
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 【概要】
 * Google Apps Script (GAS) との通信を一元管理する共通モジュール。
 * 全アプリ（tracker/medical/kakeibo/kota）で共有。
 *
 * 【主な関数】
 * - callGAS(app, action, data, options)
 *     新フォーマット {app, action, data} でGASに送信。
 *     成功/失敗・エラー原因を含むオブジェクトを返す。
 *
 * - gasPost(payload, options)
 *     旧フォーマット（typeベース）との互換用。
 *     tracker内の gasPostWithRetry を置き換える。
 *
 * 【エラーレスポンス形式】（全関数共通）
 * {
 *   success: false,
 *   error_message: "ユーザー向けメッセージ（日本語）",
 *   error_detail:  "デバッグ用詳細",
 *   error_code:    "TIMEOUT" | "NETWORK" | "HTTP_5XX" | "GAS_URL_UNSET" | "GAS_ERROR" | "UNKNOWN"
 * }
 *
 * 【用語解説】
 * - AbortController: fetchを途中で止めるための仕組み（タイムアウト制御）
 * - CORS: ブラウザのセキュリティ制限。text/plain ヘッダーで回避
 * - リトライ: 失敗したとき自動で再送すること
 *
 * @version 2.0.0
 * @date 2026-04-10
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 設定
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let GAS_URL = (typeof window !== 'undefined' && window.CHARKO_GAS_URL) ? window.CHARKO_GAS_URL : '';

const DEFAULT_TIMEOUT = 10000;

const ERROR_MESSAGES = {
  TIMEOUT:       'タイムアウトしました（10秒以内に応答がありませんでした）',
  NETWORK:       'ネットワークに接続できませんでした。Wi-Fi・通信状態を確認してください',
  HTTP_5XX:      'サーバーでエラーが発生しました。しばらく待ってから再試行してください',
  GAS_URL_UNSET: 'GAS URLが設定されていません。設定タブからURLを入力してください',
  GAS_ERROR:     'スプレッドシートへの保存に失敗しました',
  UNKNOWN:       '予期しないエラーが発生しました',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 公開API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setGasUrl(url) {
  GAS_URL = url;
  if (typeof window !== 'undefined') window.CHARKO_GAS_URL = url;
  console.log('[CharkoAPI] GAS URL設定:', url);
}

/**
 * GAS に POST 送信（新フォーマット: {app, action, data}）
 *
 * @param {string} app    - 'tracker'|'medical'|'kakeibo'|'kota'
 * @param {string} action - 'save'|'load'|'analyze' など
 * @param {Object} data   - 送信データ
 * @param {Object} [options]
 * @param {HTMLElement} [options.button]  - 通信中に無効化するボタン
 * @param {number}      [options.timeout] - タイムアウト（ミリ秒）
 * @param {number}      [options.retry]   - リトライ回数（デフォルト0）
 * @returns {Promise<{success:boolean, data?:any, error_message?:string, error_detail?:string, error_code?:string}>}
 */
async function callGAS(app, action, data, options = {}) {
  if (!app || !action) return _errRes('UNKNOWN', 'app と action は必須です');

  const url = GAS_URL || (typeof window !== 'undefined' && window.CHARKO_GAS_URL) || '';
  if (!url) return _errRes('GAS_URL_UNSET');

  const button = options.button || null;
  _disableButton(button);
  try {
    return await _fetchWithRetry(url, { app, action, data: data || {} }, options.timeout || DEFAULT_TIMEOUT, options.retry || 0);
  } finally {
    _enableButton(button);
  }
}

/**
 * GAS に POST 送信（旧フォーマット互換: typeベースのペイロードをそのまま送る）
 * tracker の gasPostWithRetry を置き換える互換関数。
 *
 * @param {Object} payload  - 送信ペイロード（{type:'...'} 形式 or {app,action,data} 形式）
 * @param {Object} [options]
 * @param {number}  [options.retry]   - リトライ回数（デフォルト0）
 * @param {number}  [options.timeout] - タイムアウト（ミリ秒）
 * @param {HTMLElement} [options.button] - 通信中に無効化するボタン
 * @returns {Promise<{success:boolean, ...}>}
 */
async function gasPost(payload, options = {}) {
  const url = GAS_URL || (typeof window !== 'undefined' && window.CHARKO_GAS_URL) || '';
  if (!url) return _errRes('GAS_URL_UNSET');

  const button = options.button || null;
  _disableButton(button);
  try {
    return await _fetchWithRetry(url, payload, options.timeout || DEFAULT_TIMEOUT, options.retry || 0);
  } finally {
    _enableButton(button);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 内部ヘルパー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
      console.log('[CharkoAPI] POST', payload.app || payload.type || '(unknown)', payload);

      const res = await fetch(url, {
        method:   'POST',
        headers:  { 'Content-Type': 'text/plain' },
        redirect: 'follow',
        signal:   controller.signal,
        body:     JSON.stringify(payload),
      });

      clearTimeout(timerId);

      if (!res.ok) {
        const e = new Error(`HTTP_${res.status}`);
        e.httpStatus = res.status;
        throw e;
      }

      let result;
      try {
        result = await res.json();
      } catch (parseErr) {
        throw new Error('INVALID_JSON: ' + parseErr.message);
      }

      if (result.success === false) {
        console.warn('[CharkoAPI] GASエラー:', result);
        return {
          success:       false,
          error_message: result.error_message || ERROR_MESSAGES.GAS_ERROR,
          error_detail:  result.error_detail  || '',
          error_code:    'GAS_ERROR',
        };
      }

      console.log('[CharkoAPI] 成功:', result);
      return result;

    } catch (err) {
      clearTimeout(timerId);
      lastError = err;
      // タイムアウト・ネットワーク切断はリトライ不要
      if (err.name === 'AbortError' || err.message === 'Failed to fetch') break;
      if (attempt < maxRetry) continue;
    }
  }

  return _classifyError(lastError);
}

function _classifyError(err) {
  if (!err) return _errRes('UNKNOWN');
  if (err.name === 'AbortError')                                        return _errRes('TIMEOUT',   `${DEFAULT_TIMEOUT / 1000}秒以内に応答なし`);
  if (err.message === 'Failed to fetch' || err.message.includes('Network')) return _errRes('NETWORK',  err.message);
  if (err.httpStatus >= 500)                                             return _errRes('HTTP_5XX', `HTTP ${err.httpStatus}`);
  return _errRes('UNKNOWN', err.message);
}

function _errRes(code, detail = '') {
  console.error('[CharkoAPI] エラー:', code, detail);
  return {
    success:       false,
    error_message: ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN,
    error_detail:  detail,
    error_code:    code,
  };
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// エクスポート
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (typeof window !== 'undefined') {
  window.CharkoAPI  = { setGasUrl, callGAS, gasPost };
  window.callGAS    = callGAS;
  window.gasPost    = gasPost;
  window.setGasUrl  = setGasUrl;
  console.log('[CharkoAPI] モジュール読み込み完了 v2.0.0');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setGasUrl, callGAS, gasPost };
}
