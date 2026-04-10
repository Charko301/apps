/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Charko Apps - 共通UI表示モジュール
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 【主な関数】
 * - showToast(msg, colorOrType, duration)
 *     既存trackerの showToast(msg, color) と互換あり。
 *     type文字列（'success'|'error'|'warning'|'info'）も受け付ける。
 *
 * - showSyncResult(synced, label, errorInfo)
 *     保存ボタン押下後の結果表示に特化。
 *     成功→緑トースト、失敗→原因つき赤トースト+詳細ダイアログ。
 *
 * - showError(titleOrMessage, codeOrDetail, detail, onRetry)
 *     既存trackerの showError(title, code, detail) と互換あり。
 *     エラーオーバーレイを表示。
 *
 * - showLoading(message) / hideLoading()
 *
 * @version 2.0.0
 * @date 2026-04-10
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// トースト
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let _toastEl = null;
let _toastTimer = null;

const TYPE_COLORS = {
  success: 'var(--a3)',
  error:   'var(--a2)',
  warning: '#c09030',
  info:    'var(--accent)',
};

/**
 * トースト通知を表示
 *
 * 【互換性】
 * 旧: showToast('メッセージ', '#c09030')      → そのまま動く
 * 新: showToast('メッセージ', 'success', 3000) → タイプ指定も動く
 *
 * @param {string} msg            - 表示メッセージ
 * @param {string} [colorOrType]  - CSSカラー('#xxxxxx'/'var(--xx)') または 'success'|'error'|'warning'|'info'
 * @param {number} [duration]     - 表示時間ms（デフォルト2200）
 */
function showToast(msg, colorOrType, duration) {
  // toast-overlay / toast-box がHTMLに直書きされている場合はそちらを優先使用
  let ov  = document.getElementById('toast-overlay');
  let box = document.getElementById('toast-box');

  if (!ov) {
    // 動的生成（ui.js単独で動く場合）
    if (!_toastEl) {
      _toastEl = document.createElement('div');
      _toastEl.id = 'toast-overlay';
      _toastEl.innerHTML = '<div id="toast-box" class="toast-box"></div>';
      // 最低限のスタイル（styles.cssが読まれていない環境でも動くように）
      Object.assign(_toastEl.style, {
        position:'fixed', bottom:'80px', left:'50%', transform:'translateX(-50%)',
        zIndex:'9999', pointerEvents:'none', opacity:'0', transition:'opacity .25s'
      });
      document.body.appendChild(_toastEl);
    }
    ov  = _toastEl;
    box = ov.querySelector('#toast-box');
  }

  // カラー解決
  const color = TYPE_COLORS[colorOrType] || colorOrType || 'var(--accent)';

  box.textContent = msg;
  if (box.style !== undefined) box.style.background = color;

  ov.classList.add('show');
  // 動的生成の場合はopacityで表示
  if (ov === _toastEl) ov.style.opacity = '1';

  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    ov.classList.remove('show');
    if (ov === _toastEl) ov.style.opacity = '0';
  }, duration || 2200);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 保存結果表示（新機能）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 保存ボタン押下後の結果を表示する専用関数
 *
 * 成功時: 緑トーストを2.2秒表示
 * 失敗時: 赤トーストを表示し、タップでエラー詳細ダイアログを開く
 *
 * @param {boolean} synced     - trueなら成功、falseなら失敗
 * @param {string}  label      - '朝の記録'|'昼の記録' など、何を保存しようとしたか
 * @param {Object|string} [errorInfo] - 失敗時のエラー情報
 *   文字列の場合: そのままerror_messageとして扱う
 *   オブジェクトの場合: {error_message, error_detail, error_code} を想定
 * @param {string}  [color]    - 成功時のトースト色（省略時は緑）
 *
 * @example
 * // callGASの結果を渡す
 * const result = await callGAS('tracker', 'save', data);
 * showSyncResult(result.success, '朝の記録', result);
 *
 * @example
 * // bool + 色を渡す（既存コードからの移行用）
 * const synced = await autoSyncToGAS();
 * showSyncResult(synced, '朝の記録', null, '#c09030');
 */
function showSyncResult(synced, label, errorInfo, color) {
  if (synced) {
    showToast(`✅ ${label}をスプシに保存しました`, color || 'var(--a3)');
    return;
  }

  // エラー情報を解決
  let errMsg    = 'スプシへの保存に失敗しました';
  let errDetail = '';
  let errCode   = '';

  if (typeof errorInfo === 'string') {
    errMsg = errorInfo;
  } else if (errorInfo && typeof errorInfo === 'object') {
    errMsg    = errorInfo.error_message || errMsg;
    errDetail = errorInfo.error_detail  || '';
    errCode   = errorInfo.error_code    || '';
  }

  // 失敗トースト（タップで詳細表示）
  const toastMsg = `❌ ${label}のスプシ保存失敗 → タップで詳細`;
  showToast(toastMsg, 'var(--a2)', 4000);

  // トーストをタップ可能にして詳細ダイアログを開く
  const box = document.getElementById('toast-box');
  if (box) {
    box.style.cursor   = 'pointer';
    box.style.pointerEvents = 'auto';
    box.onclick = () => {
      box.style.cursor = '';
      box.style.pointerEvents = '';
      box.onclick = null;
      showError(`${label}の保存失敗`, errCode || 'GAS_ERROR', errDetail || errMsg);
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// エラーダイアログ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let _errEl = null;

// ERR_MAP: trackerと共通のエラーコード→解決策マップ
const _ERR_MAP = {
  TIMEOUT:       'GASサーバーの応答が遅い可能性があります。しばらく待ってから再試行してください',
  NETWORK:       'Wi-Fiまたはモバイル通信をオンにして再試行してください',
  HTTP_5XX:      'GASサーバーで問題が発生しました。しばらく待ってから再試行してください',
  GAS_URL_UNSET: '設定タブを開き、GAS URLを入力して保存してください',
  GAS_ERROR:     'GASのコードかスプレッドシートの設定を確認してください',
  NETWORK_ERROR: 'Wi-Fiまたはモバイル通信をオンにして再試行してください',
  SERVER_ERROR:  'GASサーバーで問題が発生しました。しばらく待ってから再試行してください',
  UNKNOWN:       'アプリを再読み込みして再試行してください',
};

/**
 * エラーダイアログを表示
 *
 * 【互換性】
 * 旧: showError('タイトル', 'ERROR_CODE', '詳細文') → そのまま動く
 * 新: showError('メッセージ', '', '', retryFn)       → 再試行ボタン付き
 *
 * @param {string}   titleOrMsg  - タイトル or エラーメッセージ
 * @param {string}   [codeOrDetail] - エラーコード or 詳細文
 * @param {string}   [detail]    - デバッグ用詳細文
 * @param {Function} [onRetry]   - 再試行ボタンを押したときのコールバック
 */
function showError(titleOrMsg, codeOrDetail = '', detail = '', onRetry = null) {
  const title    = titleOrMsg;
  const code     = codeOrDetail;
  const solution = _ERR_MAP[code] || '';
  const body     = [
    code    ? `エラーコード: ${code}` : '',
    detail  ? `詳細: ${detail}`       : '',
    solution ? `解決方法: ${solution}` : '',
  ].filter(Boolean).join('\n\n');

  console.error('[CharkoUI] showError', { title, code, detail });

  // PC（768px以上）はトーストで表示、モバイルはダイアログ
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    showToast(`⚠️ ${title}${code ? ' | ' + code : ''}`, 'var(--a2)', 3500);
    return;
  }

  // モバイル: err-overlay がHTMLに直書きされていればそれを使う
  const overlayEl = document.getElementById('err-overlay');
  if (overlayEl) {
    const titleEl  = document.getElementById('err-title');
    const bodyEl   = document.getElementById('err-body');
    if (titleEl) titleEl.textContent = title;
    if (bodyEl)  bodyEl.textContent  = body || codeOrDetail || '詳細なし';
    overlayEl.classList.add('show');
    return;
  }

  // フォールバック: 動的生成ダイアログ
  if (!_errEl) {
    _errEl = document.createElement('div');
    _errEl.className = 'error-overlay';
    _errEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    _errEl.innerHTML = `
      <div style="background:var(--bg,#1a1a2e);border:1px solid var(--a2,#e05050);border-radius:12px;padding:20px;max-width:340px;width:100%">
        <div style="font-weight:700;font-size:15px;color:var(--a2,#e05050);margin-bottom:8px" class="err-dyn-title"></div>
        <div style="font-size:12px;color:var(--text,#ccc);white-space:pre-wrap;line-height:1.6" class="err-dyn-body"></div>
        <div style="margin-top:14px;display:flex;gap:8px">
          <button class="err-dyn-close" style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--border,#333);background:transparent;color:var(--text,#ccc);cursor:pointer">閉じる</button>
          <button class="err-dyn-retry" style="flex:1;padding:10px;border-radius:8px;border:none;background:var(--a3,#40a060);color:#fff;cursor:pointer;display:none">再試行</button>
        </div>
      </div>`;
    document.body.appendChild(_errEl);
    _errEl.querySelector('.err-dyn-close').addEventListener('click', () => _errEl.style.display = 'none');
  }

  _errEl.querySelector('.err-dyn-title').textContent = title;
  _errEl.querySelector('.err-dyn-body').textContent  = body || codeOrDetail || '詳細なし';
  _errEl.style.display = 'flex';

  const retryBtn = _errEl.querySelector('.err-dyn-retry');
  if (onRetry) {
    retryBtn.style.display = '';
    retryBtn.onclick = () => { _errEl.style.display = 'none'; onRetry(); };
  } else {
    retryBtn.style.display = 'none';
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ローディング
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let _loadingEl = null;

function showLoading(message = '処理中...') {
  if (!_loadingEl) {
    _loadingEl = document.createElement('div');
    _loadingEl.className = 'loading-overlay';
    _loadingEl.innerHTML = `<div class="loading-box"><div class="loading-spinner"></div><div class="loading-text"></div></div>`;
    document.body.appendChild(_loadingEl);
  }
  _loadingEl.querySelector('.loading-text').textContent = message;
  _loadingEl.classList.add('show');
}

function hideLoading() {
  if (_loadingEl) _loadingEl.classList.remove('show');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ユーティリティ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * callGAS の結果を受けて自動でUI表示
 * @param {Object} result        - callGAS の返り値
 * @param {string} successMessage - 成功時のメッセージ
 */
function handleApiResult(result, successMessage = '完了しました') {
  if (result.success) {
    showToast(successMessage, 'success');
  } else {
    showError(
      result.error_message || 'エラーが発生しました',
      result.error_code    || '',
      result.error_detail  || ''
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// エクスポート
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (typeof window !== 'undefined') {
  window.CharkoUI     = { showToast, showSyncResult, showError, showLoading, hideLoading, handleApiResult };
  window.showToast    = showToast;
  window.showSyncResult = showSyncResult;
  window.showError    = showError;
  window.showLoading  = showLoading;
  window.hideLoading  = hideLoading;
  window.handleApiResult = handleApiResult;
  console.log('[CharkoUI] モジュール読み込み完了 v2.0.0');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { showToast, showSyncResult, showError, showLoading, hideLoading, handleApiResult };
}
