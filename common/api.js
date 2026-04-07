/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Charko Apps - 共通API通信モジュール
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 【概要】
 * Google Apps Script (GAS) との通信を一元管理する共通モジュール。
 * 全アプリ（tracker/medical/kakeibo/kota）で共有。
 * 
 * 【主な機能】
 * - callGAS(): POST通信（データ保存・AI分析）
 * - fetchGAS(): GET通信（データ読込）※将来用
 * - タイムアウト処理（10秒）
 * - AbortController による中断制御
 * - ボタン無効化/有効化の自動処理
 * - 統一エラーレスポンス構造
 * 
 * 【エラーレスポンス形式】
 * {
 *   success: false,
 *   error_message: "ユーザー向けメッセージ（日本語）",
 *   error_detail: "デバッグ用詳細（英語エラー文など）"
 * }
 * 
 * 【用語解説】
 * - AbortController: fetchを途中で止めるための仕組み
 * - タイムアウト: 通信が遅い時に一定時間で諦める機能
 * - CORS: ブラウザのセキュリティ制限（text/plainで回避）
 * 
 * @version 1.0.0
 * @date 2026-04-08
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 設定
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GAS デプロイURL（アプリ起動時に設定される想定）
 * 各アプリのHTMLファイル内で以下のように設定：
 * window.CHARKO_GAS_URL = 'https://script.google.com/macros/s/.../exec';
 */
let GAS_URL = window.CHARKO_GAS_URL || '';

/**
 * デフォルトタイムアウト時間（ミリ秒）
 */
const DEFAULT_TIMEOUT = 10000; // 10秒

/**
 * リトライ設定
 */
const RETRY_CONFIG = {
  maxRetries: 0,      // 現在はリトライなし（将来実装用）
  retryDelay: 1000    // リトライ間隔（ミリ秒）
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 公開API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GAS URL を設定
 * 
 * @param {string} url - GASデプロイURL
 * 
 * @example
 * setGasUrl('https://script.google.com/macros/s/.../exec');
 */
function setGasUrl(url) {
  GAS_URL = url;
  window.CHARKO_GAS_URL = url;
  console.log('[CharkoAPI] GAS URL設定:', url);
}

/**
 * GAS に POST リクエストを送信（データ保存・AI分析）
 * 
 * @param {string} app - アプリ名（'tracker'|'medical'|'kakeibo'|'kota'）
 * @param {string} action - アクション名（'save'|'load'|'analyze'など）
 * @param {Object} data - 送信データ
 * @param {Object} options - オプション設定
 * @param {HTMLElement} options.button - 無効化するボタン要素
 * @param {number} options.timeout - タイムアウト時間（ミリ秒）
 * 
 * @returns {Promise<Object>} レスポンス
 * 
 * @example
 * // 基本的な使い方
 * const result = await callGAS('tracker', 'save', { 
 *   date: '2026-04-08',
 *   mood: 1,
 *   energy: 3
 * });
 * 
 * if (result.success) {
 *   console.log('保存成功:', result.data);
 * } else {
 *   console.error('保存失敗:', result.error_message);
 * }
 * 
 * @example
 * // ボタン無効化付き
 * const saveBtn = document.getElementById('save-btn');
 * const result = await callGAS('medical', 'save', visitData, {
 *   button: saveBtn
 * });
 */
async function callGAS(app, action, data, options = {}) {
  // 引数検証
  if (!app || !action) {
    return createErrorResponse(
      '呼び出しエラー',
      'app と action は必須です'
    );
  }

  if (!GAS_URL) {
    return createErrorResponse(
      'GAS URL未設定',
      'setGasUrl() でURLを設定してください'
    );
  }

  // オプションのデフォルト値
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const button = options.button || null;

  // ボタン無効化
  if (button) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = '通信中...';
  }

  // タイムアウト制御用
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // リクエストボディ作成
    const payload = {
      app,
      action,
      data: data || {}
    };

    console.log(`[CharkoAPI] POST ${app}/${action}`, payload);

    // fetch実行
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain' // CORS回避
      },
      redirect: 'follow',
      signal: controller.signal,
      body: JSON.stringify(payload)
    });

    // タイムアウトタイマー解除
    clearTimeout(timeoutId);

    // HTTPステータスチェック
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // レスポンスパース
    const result = await response.json();

    // GAS側のエラーチェック
    if (result.success === false) {
      console.error('[CharkoAPI] GASエラー:', result);
      return result; // そのまま返す（既にエラー形式）
    }

    console.log('[CharkoAPI] 成功:', result);
    return result;

  } catch (error) {
    clearTimeout(timeoutId);

    // エラー種別判定
    let errorMessage = '通信に失敗しました';
    let errorDetail = error.message;

    if (error.name === 'AbortError') {
      errorMessage = 'タイムアウトしました';
      errorDetail = `${timeout / 1000}秒以内に応答がありませんでした`;
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = 'ネットワークエラー';
      errorDetail = 'インターネット接続を確認してください';
    }

    console.error('[CharkoAPI] エラー:', error);

    return createErrorResponse(errorMessage, errorDetail);

  } finally {
    // ボタン復元
    if (button) {
      button.disabled = false;
      button.textContent = button.dataset.originalText || '送信';
    }
  }
}

/**
 * GAS から GET リクエスト（将来実装用）
 * 
 * 現在のGASは doPost のみ実装。
 * 将来的に doGet を実装したら使用可能。
 * 
 * @param {string} app - アプリ名
 * @param {string} action - アクション名
 * @param {Object} params - クエリパラメータ
 * 
 * @returns {Promise<Object>} レスポンス
 * 
 * @example
 * const result = await fetchGAS('tracker', 'load', { 
 *   date: '2026-04-08' 
 * });
 */
async function fetchGAS(app, action, params = {}) {
  // 将来実装用のスタブ
  console.warn('[CharkoAPI] fetchGAS は未実装です。callGAS を使用してください。');
  
  return createErrorResponse(
    '未実装',
    'fetchGAS は将来実装予定です'
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 内部ヘルパー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * エラーレスポンスを生成（統一形式）
 * 
 * @param {string} message - ユーザー向けメッセージ
 * @param {string} detail - デバッグ用詳細
 * @returns {Object} エラーレスポンス
 * 
 * @private
 */
function createErrorResponse(message, detail) {
  return {
    success: false,
    error_message: message,
    error_detail: detail || ''
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// エクスポート（グローバルスコープに公開）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ブラウザ環境用（window オブジェクトに追加）
if (typeof window !== 'undefined') {
  window.CharkoAPI = {
    setGasUrl,
    callGAS,
    fetchGAS
  };
  
  console.log('[CharkoAPI] モジュール読み込み完了 v1.0.0');
}

// Node.js環境用（将来のテスト用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    setGasUrl,
    callGAS,
    fetchGAS
  };
}
