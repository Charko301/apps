// ============================================================
// common/api.js — GAS通信の共通モジュール
// すべてのアプリはこのファイルをscriptタグで読み込んで使う
// ============================================================

// ── 設定 ─────────────────────────────────────────────────────
// ▼ 各自のGAS WebアプリURLをここに設定する
const CHARKO_GAS_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// タイムアウトまでの秒数（10秒）
const GAS_TIMEOUT_MS = 10000;

// ── メイン送信関数 ───────────────────────────────────────────
/**
 * GASにデータを送信する（POST）
 *
 * @param {string} app    - アプリ識別子 例: 'tracker' / 'medical' / 'kakeibo'
 * @param {string} action - 操作の種類   例: 'save' / 'load' / 'analyze'
 * @param {object} data   - 送信したいデータ（省略可）
 * @returns {object}      - { success, data, error_message, error_detail }
 *
 * 使い方:
 *   const result = await callGAS('tracker', 'save', { date: '2025-01-01', mood: 3 });
 *   if (result.success) { ... } else { showError(result.error_message); }
 */
async function callGAS(app, action, data = {}) {
  console.log(`[callGAS] 開始 app=${app} action=${action}`, data);

  // AbortControllerはfetchを途中でキャンセルする仕組み
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(); // 10秒経ったら強制キャンセル
  }, GAS_TIMEOUT_MS);

  try {
    const response = await fetch(CHARKO_GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app, action, ...data }),
      signal: controller.signal, // タイムアウト監視を登録
    });

    clearTimeout(timer); // 正常に返ってきたらタイマーを止める

    if (!response.ok) {
      // HTTPステータスが200番台以外（例: 500 Server Error）
      throw new Error(`HTTP_${response.status}`);
    }

    const result = await response.json();
    console.log(`[callGAS] 完了`, result);
    return result;

  } catch (err) {
    clearTimeout(timer);

    // エラーの種類を判別して統一形式で返す
    if (err.name === 'AbortError') {
      console.error('[callGAS] タイムアウト');
      return buildError('NETWORK_ERROR', '通信がタイムアウトしました。再度お試しください。', 'AbortError: timeout after 10s');
    }

    if (err.message.startsWith('HTTP_5')) {
      console.error('[callGAS] サーバーエラー', err.message);
      return buildError('SERVER_ERROR', 'サーバーでエラーが発生しました。しばらく待ってから再試行してください。', err.message);
    }

    console.error('[callGAS] 通信エラー', err.message);
    return buildError('NETWORK_ERROR', 'ネットワークエラーです。インターネット接続を確認してください。', err.message);
  }
}

// ── エラーオブジェクト生成ヘルパー ───────────────────────────
/**
 * 統一エラーレスポンスを作る内部関数
 * 外部からは使わなくてOK
 */
function buildError(code, userMessage, detail) {
  return {
    success: false,
    data: null,
    error_code: code,         // 'NETWORK_ERROR' / 'SERVER_ERROR' / 'VALIDATION_ERROR' / 'UNKNOWN_ERROR'
    error_message: userMessage, // ユーザーに見せるメッセージ
    error_detail: detail,       // デバッグ用（console.logで確認）
  };
}
