/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Charko Apps - localStorage管理モジュール
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 【概要】
 * ブラウザのlocalStorageへのデータ保存・読込を一元管理。
 * JSONのシリアライズ/デシリアライズを自動処理。
 * 
 * 【主な機能】
 * - save(): データ保存
 * - load(): データ読込
 * - remove(): データ削除
 * - clear(): 全削除
 * - exists(): 存在確認
 * - keys(): キー一覧取得
 * 
 * 【データバージョニング】
 * データ構造変更時の互換性を保つため、バージョン情報を付与。
 * 
 * 【用語解説】
 * - localStorage: ブラウザに永続保存できる仕組み（Cookieより大容量）
 * - シリアライズ: オブジェクトを文字列に変換すること（JSON.stringify）
 * - デシリアライズ: 文字列をオブジェクトに戻すこと（JSON.parse）
 * 
 * @version 1.0.0
 * @date 2026-04-08
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 設定
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * キープレフィックス（名前空間）
 * 他のアプリとの衝突を避けるため、全てのキーにプレフィックスを付与
 */
const PREFIX = 'charko_';

/**
 * データバージョン
 * データ構造を変更した場合はインクリメント
 */
const DATA_VERSION = 1;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 公開API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * データを保存
 * 
 * @param {string} key - 保存キー
 * @param {*} value - 保存する値（オブジェクト、配列、文字列など）
 * @param {Object} options - オプション
 * @param {boolean} options.withVersion - バージョン情報を付与するか（デフォルトtrue）
 * 
 * @returns {boolean} 成功したかどうか
 * 
 * @example
 * // 基本的な使い方
 * save('user_settings', { theme: 'dark', fontSize: 14 });
 * 
 * // バージョン情報なし
 * save('temp_data', { x: 1 }, { withVersion: false });
 */
function save(key, value, options = {}) {
  try {
    const withVersion = options.withVersion !== false;
    const fullKey = PREFIX + key;

    // バージョン情報を付与
    const data = withVersion
      ? {
          _version: DATA_VERSION,
          _savedAt: new Date().toISOString(),
          value: value
        }
      : value;

    // JSON文字列化して保存
    localStorage.setItem(fullKey, JSON.stringify(data));

    console.log(`[CharkoStorage] 保存: ${key}`, value);
    return true;

  } catch (error) {
    console.error(`[CharkoStorage] 保存失敗: ${key}`, error);
    
    // QuotaExceededError: ストレージ容量超過
    if (error.name === 'QuotaExceededError') {
      console.warn('[CharkoStorage] ストレージ容量が不足しています');
    }
    
    return false;
  }
}

/**
 * データを読込
 * 
 * @param {string} key - 読込キー
 * @param {*} defaultValue - データが存在しない場合のデフォルト値
 * 
 * @returns {*} 読み込んだ値、または defaultValue
 * 
 * @example
 * const settings = load('user_settings', { theme: 'light' });
 * console.log(settings.theme); // 'dark' or 'light'
 */
function load(key, defaultValue = null) {
  try {
    const fullKey = PREFIX + key;
    const raw = localStorage.getItem(fullKey);

    if (raw === null) {
      return defaultValue;
    }

    const parsed = JSON.parse(raw);

    // バージョン情報がある場合は展開
    if (parsed && typeof parsed === 'object' && '_version' in parsed) {
      // バージョンチェック（将来のマイグレーション用）
      if (parsed._version !== DATA_VERSION) {
        console.warn(`[CharkoStorage] バージョン不一致: ${key} (${parsed._version} -> ${DATA_VERSION})`);
      }
      return parsed.value;
    }

    return parsed;

  } catch (error) {
    console.error(`[CharkoStorage] 読込失敗: ${key}`, error);
    return defaultValue;
  }
}

/**
 * データを削除
 * 
 * @param {string} key - 削除キー
 * 
 * @example
 * remove('temp_data');
 */
function remove(key) {
  try {
    const fullKey = PREFIX + key;
    localStorage.removeItem(fullKey);
    console.log(`[CharkoStorage] 削除: ${key}`);
  } catch (error) {
    console.error(`[CharkoStorage] 削除失敗: ${key}`, error);
  }
}

/**
 * 全データを削除
 * 
 * @param {boolean} confirm - 確認なしで削除（デフォルトfalse）
 * 
 * @example
 * clear(true); // 確認なしで全削除
 */
function clear(confirm = false) {
  if (!confirm) {
    console.warn('[CharkoStorage] clear() には confirm:true が必要です');
    return;
  }

  try {
    const keys = Object.keys(localStorage);
    const charkoKeys = keys.filter(k => k.startsWith(PREFIX));

    charkoKeys.forEach(k => localStorage.removeItem(k));

    console.log(`[CharkoStorage] 全削除: ${charkoKeys.length}件`);
  } catch (error) {
    console.error('[CharkoStorage] 全削除失敗', error);
  }
}

/**
 * データの存在確認
 * 
 * @param {string} key - 確認キー
 * @returns {boolean} 存在するか
 * 
 * @example
 * if (exists('user_settings')) {
 *   // 設定が保存されている
 * }
 */
function exists(key) {
  const fullKey = PREFIX + key;
  return localStorage.getItem(fullKey) !== null;
}

/**
 * 保存されている全キー一覧を取得
 * 
 * @returns {string[]} キー配列（プレフィックスなし）
 * 
 * @example
 * const allKeys = keys();
 * console.log(allKeys); // ['user_settings', 'tracker_2026-04-08', ...]
 */
function keys() {
  try {
    const allKeys = Object.keys(localStorage);
    return allKeys
      .filter(k => k.startsWith(PREFIX))
      .map(k => k.slice(PREFIX.length));
  } catch (error) {
    console.error('[CharkoStorage] キー取得失敗', error);
    return [];
  }
}

/**
 * 使用容量を取得（概算）
 * 
 * @returns {Object} { used: バイト数, usedMB: MB換算 }
 * 
 * @example
 * const { usedMB } = getUsage();
 * console.log(`使用中: ${usedMB.toFixed(2)} MB`);
 */
function getUsage() {
  try {
    let total = 0;
    
    for (let key in localStorage) {
      if (key.startsWith(PREFIX)) {
        total += localStorage[key].length + key.length;
      }
    }

    return {
      used: total,
      usedMB: total / (1024 * 1024)
    };
  } catch (error) {
    console.error('[CharkoStorage] 容量取得失敗', error);
    return { used: 0, usedMB: 0 };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// アプリ固有のヘルパー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 日次記録を保存（tracker用）
 * 
 * @param {string} date - 日付（YYYY-MM-DD）
 * @param {Object} data - 記録データ
 * 
 * @example
 * saveRecord('2026-04-08', { mood: 1, energy: 3, diary: '今日は...' });
 */
function saveRecord(date, data) {
  return save(`record_${date}`, data);
}

/**
 * 日次記録を読込（tracker用）
 * 
 * @param {string} date - 日付（YYYY-MM-DD）
 * @returns {Object|null} 記録データ
 * 
 * @example
 * const record = loadRecord('2026-04-08');
 * if (record) console.log(record.mood);
 */
function loadRecord(date) {
  return load(`record_${date}`);
}

/**
 * 日次記録の一覧取得（tracker用）
 * 
 * @param {number} limit - 取得件数（デフォルト30）
 * @returns {Array} [{ date, data }, ...]
 * 
 * @example
 * const recent = listRecords(7); // 直近7件
 */
function listRecords(limit = 30) {
  const recordKeys = keys()
    .filter(k => k.startsWith('record_'))
    .sort()
    .reverse()
    .slice(0, limit);

  return recordKeys.map(key => ({
    date: key.replace('record_', ''),
    data: load(key)
  }));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// エクスポート
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (typeof window !== 'undefined') {
  window.CharkoStorage = {
    save,
    load,
    remove,
    clear,
    exists,
    keys,
    getUsage,
    // アプリ固有
    saveRecord,
    loadRecord,
    listRecords
  };

  console.log('[CharkoStorage] モジュール読み込み完了 v1.0.0');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    save,
    load,
    remove,
    clear,
    exists,
    keys,
    getUsage,
    saveRecord,
    loadRecord,
    listRecords
  };
}
