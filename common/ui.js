// ============================================================
// common/ui.js — UI共通モジュール
// トースト通知・ローディング・ボタン制御を一元管理
// ============================================================

// ── トースト通知（画面下部にポップアップ表示） ────────────────
/**
 * トースト通知を表示する
 *
 * @param {string} message  - 表示するメッセージ
 * @param {string} type     - 'success'（緑）/ 'error'（赤）/ 'info'（青）
 * @param {number} duration - 表示する時間（ミリ秒）デフォルト3秒
 *
 * 使い方:
 *   showToast('保存しました ✅', 'success');
 *   showToast('エラーが発生しました', 'error');
 */
function showToast(message, type = 'success', duration = 3000) {
  // 既存のトーストがあれば消す
  const existing = document.getElementById('charko-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'charko-toast';
  toast.textContent = message;

  // タイプ別の背景色
  const colors = {
    success: '#2d6a4f',
    error:   '#9b2335',
    info:    '#1d4e89',
    warning: '#7a5c00',
  };

  Object.assign(toast.style, {
    position:       'fixed',
    bottom:         '80px',      // スマホのナビバーと被らない位置
    left:           '50%',
    transform:      'translateX(-50%)',
    background:     colors[type] || colors.info,
    color:          '#ffffff',
    padding:        '12px 20px',
    borderRadius:   '8px',
    fontSize:       '14px',
    fontWeight:     '500',
    zIndex:         '9999',
    maxWidth:       '80vw',
    textAlign:      'center',
    boxShadow:      '0 4px 12px rgba(0,0,0,0.3)',
    opacity:        '0',
    transition:     'opacity 0.2s ease',
  });

  document.body.appendChild(toast);
  // DOMに追加した直後はtransitionが効かないためわずかに遅らせる
  requestAnimationFrame(() => { toast.style.opacity = '1'; });

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

// ── ローディング表示 ─────────────────────────────────────────
/**
 * ローディング状態のON/OFFを切り替える
 * 対象要素にaria-busy属性を付けることでアクセシビリティも確保
 *
 * @param {string}  elementId - ローディングを表示する要素のID
 * @param {boolean} isLoading - trueでON、falseでOFF
 * @param {string}  loadingText - ローディング中に表示するテキスト（省略可）
 *
 * 使い方:
 *   setLoading('save-result', true, '保存中...');
 *   setLoading('save-result', false);
 */
function setLoading(elementId, isLoading, loadingText = '処理中...') {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (isLoading) {
    el.dataset.originalText = el.textContent; // 元のテキストを退避
    el.textContent = loadingText;
    el.setAttribute('aria-busy', 'true');
    el.style.opacity = '0.7';
  } else {
    el.textContent = el.dataset.originalText || '';
    el.removeAttribute('aria-busy');
    el.style.opacity = '';
    delete el.dataset.originalText;
  }
}

// ── ボタン制御 ───────────────────────────────────────────────
/**
 * ボタンを無効化/有効化する
 * 通信中に連打されないよう必ずセットで使う
 *
 * @param {string|string[]} buttonIds - ボタンのID（配列でまとめて指定可）
 * @param {boolean}         disabled  - trueで無効化、falseで有効化
 *
 * 使い方:
 *   disableButtons(['save-btn', 'analyze-btn'], true);  // 通信前に無効化
 *   disableButtons(['save-btn', 'analyze-btn'], false); // 通信後に復活
 */
function disableButtons(buttonIds, disabled) {
  const ids = Array.isArray(buttonIds) ? buttonIds : [buttonIds];
  ids.forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = disabled;
    btn.style.opacity = disabled ? '0.5' : '';
    btn.style.cursor  = disabled ? 'not-allowed' : '';
  });
}

// ── エラー表示 ───────────────────────────────────────────────
/**
 * エラーメッセージを画面に表示する
 * 再試行ボタン付きで表示することもできる
 *
 * @param {string}   message     - ユーザー向けエラーメッセージ
 * @param {string}   elementId   - 表示先の要素ID（省略時はトーストで表示）
 * @param {Function} onRetry     - 再試行ボタンを押したときの処理（省略可）
 *
 * 使い方:
 *   showError('保存に失敗しました', 'error-area', () => saveData());
 */
function showError(message, elementId = null, onRetry = null) {
  if (!elementId) {
    showToast(message, 'error', 5000);
    return;
  }

  const el = document.getElementById(elementId);
  if (!el) {
    showToast(message, 'error', 5000);
    return;
  }

  el.innerHTML = `
    <span style="color:#cc3333">${message}</span>
    ${onRetry ? `<button onclick="(${onRetry})()" style="margin-left:8px;font-size:12px;padding:4px 10px;border-radius:4px;border:1px solid #cc3333;background:transparent;color:#cc3333;cursor:pointer">再試行</button>` : ''}
  `;
}
