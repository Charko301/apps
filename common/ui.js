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
 * @param {string} message  - メインメッセージ（大きく表示）
 * @param {string} type     - 通知タイプ（'success'|'error'|'info'|'warning'）
 * @param {number} duration - 表示時間（ミリ秒、デフォルト2500）
 * @param {string} [sub]    - サブテキスト（小さく表示。保存先シート名など）
 *
 * @example
 * showToast('保存しました', 'success');
 * showToast('保存しました', 'success', 2500, 'tracker_data シート');
 */
function showToast(message, type = 'info', duration = 2500, sub = '') {
  // トースト要素を作成（初回のみ）
  if (!toastElement) {
    toastElement = document.createElement('div');
    toastElement.className = 'toast-ov';
    toastElement.innerHTML = `
      <div class="toast-box">
        <div class="toast-main"></div>
        <div class="toast-sub"></div>
      </div>`;
    document.body.appendChild(toastElement);
  }

  // 既存のタイマーをクリア
  if (toastTimer) clearTimeout(toastTimer);

  // メッセージ設定
  const box = toastElement.querySelector('.toast-box');
  box.querySelector('.toast-main').textContent = message;

  const subEl = box.querySelector('.toast-sub');
  subEl.textContent = sub;
  subEl.style.display = sub ? '' : 'none';

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
// タブ初期化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * タブナビゲーションを初期化する。
 * .tab-btn[data-tab] と #tab-{name} の対応で自動的に切り替える。
 * モバイル（横並び）・PC（縦サイドバー）どちらの構造でも動作。
 *
 * 【前提条件】HTML側の構造：
 *   <button class="tab-btn active" data-tab="record">記録</button>
 *   <div class="tab-content" id="tab-record">...</div>
 *
 * @param {Object} [options]
 * @param {string} [options.defaultTab] - 初期表示するタブ名（省略時は最初の.tab-btn）
 * @param {Function} [options.onSwitch] - タブ切り替え時のコールバック (tabName) => {}
 *
 * @example
 * initTabs();
 * initTabs({ defaultTab: 'history', onSwitch: (name) => console.log(name) });
 */
function initTabs(options = {}) {
  // .tab-btn はモバイル用・PC用の両方を含む場合があるため querySelectorAll で全取得
  const buttons = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  if (buttons.length === 0) {
    console.warn('[CharkoUI] .tab-btn が見つかりません');
    return;
  }

  /**
   * 指定タブに切り替える内部関数
   * @param {string} tabName - data-tab の値
   */
  function switchTab(tabName) {
    // ボタン状態更新（同じ data-tab を持つボタンをすべて active 化）
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // コンテンツ表示切替
    contents.forEach(content => {
      const isTarget = content.id === 'tab-' + tabName;
      content.style.display = isTarget ? '' : 'none';
    });

    // コールバック
    if (typeof options.onSwitch === 'function') {
      options.onSwitch(tabName);
    }

    console.log('[CharkoUI] タブ切り替え:', tabName);
  }

  // クリックイベント設定
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // 初期タブを表示
  const defaultTab = options.defaultTab
    || document.querySelector('.tab-btn.active')?.dataset.tab
    || buttons[0]?.dataset.tab;

  if (defaultTab) {
    switchTab(defaultTab);
  }

  // グローバルに切り替え関数を公開（外部から呼べるように）
  window._charkoSwitchTab = switchTab;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 数値入力ショートカット変換
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 数値 + Enter で各形式に自動変換する関数。
 *
 * 【変換ルール】
 *   時刻モード（type='time'）:
 *     8    → 8:00    （1桁 = 時、分は00）
 *     83   → 8:30    （末尾1桁が1〜5 = ×10分）
 *     810  → 8:10    （3桁以上 = 最後2桁が分）
 *     1430 → 14:30   （4桁 = HHmm）
 *
 *   時間モード（type='duration'）:
 *     90   → 1:30    （分数 → h:mm 表示）
 *     30   → 0:30
 *     120  → 2:00
 *
 *   金額モード（type='money'）:
 *     9000  → 9,000  （3桁カンマ区切り）
 *     10000 → 10,000
 *
 * 【使い方】
 *   // 個別のinputに設定
 *   convertNumericInput(document.getElementById('start-time'), 'time');
 *   convertNumericInput(document.getElementById('sleep-duration'), 'duration');
 *   convertNumericInput(document.getElementById('amount'), 'money');
 *
 *   // data属性で一括設定（initNumericInputs()推奨）
 *   <input data-convert="time">
 *   <input data-convert="duration">
 *   <input data-convert="money">
 *
 * @param {HTMLInputElement} inputEl - 対象のinput要素
 * @param {'time'|'duration'|'money'} type - 変換タイプ
 */
function convertNumericInput(inputEl, type) {
  if (!inputEl) return;

  inputEl.addEventListener('keydown', function(e) {
    // Enter キーのみ処理（Shift+Enter は除外）
    if (e.key !== 'Enter' || e.shiftKey) return;

    const raw = this.value.trim();
    // 数字のみの場合に変換（すでに :  , を含む場合はスキップ）
    if (!/^\d+$/.test(raw)) return;

    const num = parseInt(raw, 10);
    let converted = raw;

    if (type === 'time') {
      converted = _convertTime(raw, num);
    } else if (type === 'duration') {
      converted = _convertDuration(num);
    } else if (type === 'money') {
      converted = _convertMoney(num);
    }

    if (converted !== raw) {
      this.value = converted;
      // input イベントを発火（他のリスナーへ通知）
      this.dispatchEvent(new Event('input', { bubbles: true }));
      console.log(`[CharkoUI] 数値変換 (${type}): ${raw} → ${converted}`);
    }

    // デフォルトのEnter動作（フォーム送信など）を防ぐ
    e.preventDefault();
  });
}

/**
 * 時刻変換ロジック
 * @param {string} raw - 入力文字列
 * @param {number} num - 数値
 * @returns {string}
 * @private
 */
function _convertTime(raw, num) {
  if (raw.length === 1) {
    // 1桁: 8 → 8:00
    return `${num}:00`;
  } else if (raw.length === 2) {
    const h = parseInt(raw[0], 10);
    const m = parseInt(raw[1], 10);
    // 末尾が 1〜5 → ×10分。0 or 6〜9 → そのまま分
    const min = (m >= 1 && m <= 5) ? m * 10 : m;
    return `${h}:${String(min).padStart(2, '0')}`;
  } else if (raw.length === 3) {
    // 3桁: 810 → 8:10
    const h = parseInt(raw[0], 10);
    const m = parseInt(raw.slice(1), 10);
    if (m >= 0 && m < 60) return `${h}:${String(m).padStart(2, '0')}`;
  } else if (raw.length === 4) {
    // 4桁: 1430 → 14:30
    const h = parseInt(raw.slice(0, 2), 10);
    const m = parseInt(raw.slice(2), 10);
    if (h < 24 && m < 60) return `${h}:${String(m).padStart(2, '0')}`;
  }
  return raw; // 変換不能はそのまま
}

/**
 * 時間（分数）変換ロジック
 * @param {number} totalMinutes
 * @returns {string}
 * @private
 */
function _convertDuration(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

/**
 * 金額変換ロジック（3桁カンマ）
 * @param {number} num
 * @returns {string}
 * @private
 */
function _convertMoney(num) {
  return num.toLocaleString('ja-JP');
}

/**
 * data-convert 属性を持つ input を一括で変換設定する。
 * DOMContentLoaded 後に1回呼ぶだけでOK。
 *
 * @example
 * document.addEventListener('DOMContentLoaded', () => {
 *   initNumericInputs();
 * });
 *
 * HTML:
 * <input type="text" data-convert="time" placeholder="例: 830">
 * <input type="text" data-convert="duration" placeholder="例: 90">
 * <input type="text" data-convert="money" placeholder="例: 9000">
 */
function initNumericInputs() {
  const inputs = document.querySelectorAll('input[data-convert]');
  inputs.forEach(input => {
    const type = input.dataset.convert;
    if (['time', 'duration', 'money'].includes(type)) {
      convertNumericInput(input, type);
    }
  });
  if (inputs.length > 0) {
    console.log(`[CharkoUI] 数値入力ショートカット設定: ${inputs.length}件`);
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
    initAppMeta,
    initTabs,
    convertNumericInput,
    initNumericInputs
  };

  // グローバルにも公開（各アプリから直接呼べる）
  window.initAppMeta = initAppMeta;
  window.initTabs = initTabs;
  window.initNumericInputs = initNumericInputs;
  window.convertNumericInput = convertNumericInput;

  console.log('[CharkoUI] モジュール読み込み完了 v1.2.0');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showToast,
    showLoading,
    hideLoading,
    showError,
    confirm,
    handleApiResult,
    initAppMeta,
    initTabs,
    convertNumericInput,
    initNumericInputs
  };
}
