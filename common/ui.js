/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Charko Apps - 共通UI表示モジュール
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 【概要】
 * トースト通知、ローディング表示、エラー表示などの
 * UI操作を一元管理する共通モジュール。
 * 
 * 【主な機能】
 * - showToast(): 簡易通知表示
 * - showLoading(): ローディング表示
 * - hideLoading(): ローディング非表示
 * - showError(): エラー詳細表示
 * - confirm(): 確認ダイアログ
 * 
 * 【依存】
 * styles.css のトースト・ローディング用スタイルが必要
 * 
 * @version 1.0.0
 * @date 2026-04-08
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// トースト通知
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let toastElement = null;
let toastTimer = null;

/**
 * トースト通知を表示
 * 
 * @param {string} message - 表示メッセージ
 * @param {string} type - 通知タイプ（'success'|'error'|'info'|'warning'）
 * @param {number} duration - 表示時間（ミリ秒、デフォルト2000）
 * 
 * @example
 * showToast('保存しました', 'success');
 * showToast('エラーが発生しました', 'error', 3000);
 */
function showToast(message, type = 'info', duration = 2000) {
  // トースト要素を作成（初回のみ）
  if (!toastElement) {
    toastElement = document.createElement('div');
    toastElement.className = 'toast-ov';
    toastElement.innerHTML = '<div class="toast-box"></div>';
    document.body.appendChild(toastElement);
  }

  // 既存のタイマーをクリア
  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  // タイプに応じたアイコン
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  const icon = icons[type] || icons.info;

  // メッセージ設定
  const box = toastElement.querySelector('.toast-box');
  box.textContent = `${icon} ${message}`;

  // 表示
  toastElement.classList.add('show');
  box.style.transform = 'scale(1)';

  // 自動非表示
  toastTimer = setTimeout(() => {
    toastElement.classList.remove('show');
    box.style.transform = 'scale(0.8)';
  }, duration);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ローディング表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let loadingElement = null;

/**
 * ローディング表示
 * 
 * @param {string} message - ローディングメッセージ（オプション）
 * 
 * @example
 * showLoading('保存中...');
 * await callGAS(...);
 * hideLoading();
 */
function showLoading(message = '処理中...') {
  // ローディング要素を作成（初回のみ）
  if (!loadingElement) {
    loadingElement = document.createElement('div');
    loadingElement.className = 'loading-overlay';
    loadingElement.innerHTML = `
      <div class="loading-box">
        <div class="loading-spinner"></div>
        <div class="loading-text"></div>
      </div>
    `;
    document.body.appendChild(loadingElement);
  }

  // メッセージ設定
  const textElement = loadingElement.querySelector('.loading-text');
  textElement.textContent = message;

  // 表示
  loadingElement.classList.add('show');
}

/**
 * ローディング非表示
 */
function hideLoading() {
  if (loadingElement) {
    loadingElement.classList.remove('show');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// エラー表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let errorElement = null;

/**
 * エラー詳細を表示
 * 
 * @param {string} errorMessage - ユーザー向けエラーメッセージ
 * @param {string} errorDetail - デバッグ用詳細（オプション）
 * @param {Function} onRetry - 再試行ボタンのコールバック（オプション）
 * 
 * @example
 * showError('通信に失敗しました', 'Timeout after 10s', () => {
 *   // 再試行処理
 *   retryUpload();
 * });
 */
function showError(errorMessage, errorDetail = '', onRetry = null) {
  // エラー要素を作成（初回のみ）
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.className = 'error-overlay';
    errorElement.innerHTML = `
      <div class="error-box">
        <div class="error-title"></div>
        <div class="error-message"></div>
        <div class="error-detail"></div>
        <div class="error-actions">
          <button class="btn-close">閉じる</button>
          <button class="btn-retry" style="display:none">再試行</button>
        </div>
      </div>
    `;
    document.body.appendChild(errorElement);

    // 閉じるボタン
    errorElement.querySelector('.btn-close').addEventListener('click', () => {
      errorElement.classList.remove('show');
    });
  }

  // 内容設定
  errorElement.querySelector('.error-title').textContent = 'エラー';
  errorElement.querySelector('.error-message').textContent = errorMessage;
  errorElement.querySelector('.error-detail').textContent = 
    errorDetail ? `詳細: ${errorDetail}` : '';

  // 再試行ボタン
  const retryBtn = errorElement.querySelector('.btn-retry');
  if (onRetry) {
    retryBtn.style.display = '';
    retryBtn.onclick = () => {
      errorElement.classList.remove('show');
      onRetry();
    };
  } else {
    retryBtn.style.display = 'none';
  }

  // 表示
  errorElement.classList.add('show');

  // コンソールにもログ
  console.error('[CharkoUI] エラー表示:', {
    message: errorMessage,
    detail: errorDetail
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 確認ダイアログ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 確認ダイアログを表示（Promise返却）
 * 
 * @param {string} message - 確認メッセージ
 * @param {string} confirmText - 確認ボタンテキスト（デフォルト'OK'）
 * @param {string} cancelText - キャンセルボタンテキスト（デフォルト'キャンセル'）
 * 
 * @returns {Promise<boolean>} ユーザーの選択（true: OK, false: キャンセル）
 * 
 * @example
 * const ok = await confirm('本当に削除しますか？', '削除', 'キャンセル');
 * if (ok) {
 *   deleteRecord();
 * }
 */
function confirm(message, confirmText = 'OK', cancelText = 'キャンセル') {
  return new Promise((resolve) => {
    // 確認ダイアログ要素を作成
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box">
        <div class="confirm-message"></div>
        <div class="confirm-actions">
          <button class="btn-cancel"></button>
          <button class="btn-confirm"></button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 内容設定
    overlay.querySelector('.confirm-message').textContent = message;
    overlay.querySelector('.btn-confirm').textContent = confirmText;
    overlay.querySelector('.btn-cancel').textContent = cancelText;

    // イベント設定
    overlay.querySelector('.btn-confirm').addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });

    overlay.querySelector('.btn-cancel').addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });

    // 表示
    setTimeout(() => overlay.classList.add('show'), 10);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ユーティリティ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * API呼び出し結果に応じて自動でUI表示
 * 
 * @param {Object} result - callGASの返り値
 * @param {string} successMessage - 成功時のメッセージ
 * 
 * @example
 * const result = await callGAS('tracker', 'save', data);
 * handleApiResult(result, '保存しました');
 */
function handleApiResult(result, successMessage = '完了しました') {
  if (result.success) {
    showToast(successMessage, 'success');
  } else {
    showError(
      result.error_message || 'エラーが発生しました',
      result.error_detail || ''
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// アプリメタ情報（バージョン番号・履歴）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * ヘッダーのバージョン番号と設定タブのバージョン履歴アコーディオンを生成する。
 * 各アプリの DOMContentLoaded で1回呼ぶだけでOK。
 *
 * 【前提条件】HTML側に以下のidが必要：
 *   - id="app-version"  : ヘッダーのバージョン番号表示欄
 *   - id="acc-versions" : 設定タブのバージョン履歴アコーディオン本体（acc-b）
 *
 * @param {Object} config
 * @param {string} config.version  - 現在のバージョン（例: 'v1.3'）
 * @param {Array}  config.history  - バージョン履歴の配列（新しい順）
 *   各要素: { v: 'v1.3', date: '2026/04/10', note: '変更内容' }
 *   最新2件は緑（var(--a3)）、それ以前はグレー（var(--t2)）で表示
 *
 * @example
 * initAppMeta({
 *   version: 'v1.3',
 *   history: [
 *     { v: 'v1.3', date: '2026/04/10', note: '受診準備を記録タブに統合' },
 *     { v: 'v1.2', date: '2026/04/10', note: 'GASプロキシ方式に変更' },
 *     { v: 'v1.0', date: '2026/04/08', note: '初版リリース' },
 *   ]
 * });
 */
function initAppMeta({ version, history = [] }) {
  // ① ヘッダーのバージョン番号を更新
  const versionEl = document.getElementById('app-version');
  if (versionEl) {
    versionEl.textContent = 'Charko Series ' + version;
  } else {
    console.warn('[CharkoUI] id="app-version" が見つかりません');
  }

  // ② バージョン履歴アコーディオンのHTMLを生成
  const histEl = document.getElementById('acc-versions');
  if (histEl) {
    // 最新2件は緑、それ以前はグレーで表示（Trackerと同じスタイル）
    const rows = history.map((item, i) => {
      const color = i < 2 ? 'var(--a3)' : 'var(--t2)';
      return `<b style="color:${color}">${item.v}</b>（${item.date}）${item.note}<br>`;
    }).join('');
    histEl.innerHTML = `<div style="font-size:10px;color:var(--t2);line-height:2">${rows}</div>`;
  } else {
    console.warn('[CharkoUI] id="acc-versions" が見つかりません');
  }
}



if (typeof window !== 'undefined') {
  window.CharkoUI = {
    showToast,
    showLoading,
    hideLoading,
    showError,
    confirm,
    handleApiResult,
    initAppMeta
  };

  // グローバルにも公開（各アプリから initAppMeta() と直接呼べる）
  window.initAppMeta = initAppMeta;

  console.log('[CharkoUI] モジュール読み込み完了 v1.1.0');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showToast,
    showLoading,
    hideLoading,
    showError,
    confirm,
    handleApiResult,
    initAppMeta
  };
}
