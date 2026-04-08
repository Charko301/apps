/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Charko Apps - Google Apps Script メインエントリーポイント
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 【概要】
 * 全アプリ（tracker/medical/kakeibo/kota）からのリクエストを
 * 単一のdoPost()で受け取り、app/actionで処理を振り分ける。
 * 
 * 【リクエスト形式】
 * {
 *   app: "tracker" | "medical" | "kakeibo" | "kota",
 *   action: "save" | "load" | "delete" | "analyze",
 *   data: { ... }
 * }
 * 
 * 【レスポンス形式】
 * 成功: { success: true, data: {...} }
 * 失敗: { success: false, error_message: "...", error_detail: "..." }
 * 
 * @version 1.0.0
 * @date 2026-04-08
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 設定（必ず編集すること）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GoogleスプレッドシートID
 * URLの /d/【ここ】/edit の部分をコピーして貼り付け
 * 
 * 例: https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit
 *     → SHEET_ID = '1ABC...XYZ'
 */
const SHEET_ID = 'YOUR_SHEET_ID_HERE';

/**
 * Gemini APIキー（分析機能で使用）
 * https://aistudio.google.com/app/apikey で取得
 */
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// メインエントリーポイント
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST リクエストを受信するメイン関数
 * すべてのアプリからのリクエストがここに届く
 * 
 * @param {Object} e - イベントオブジェクト
 * @returns {TextOutput} JSON レスポンス
 */
function doPost(e) {
  try {
    // リクエストボディをパース
    const payload = JSON.parse(e.postData.contents);
    const { app, action, data } = payload;
    
    // バリデーション
    if (!app) {
      return createErrorResponse('app パラメータが必要です', 'Missing app parameter');
    }
    
    if (!action) {
      return createErrorResponse('action パラメータが必要です', 'Missing action parameter');
    }
    
    // ログ出力（デバッグ用）
    Logger.log(`[doPost] app=${app}, action=${action}`);
    
    // アプリごとに処理を振り分け
    let result;
    
    switch (app) {
      case 'tracker':
        result = handleTracker(action, data);
        break;
        
      case 'medical':
        result = handleMedical(action, data);
        break;
        
      case 'kakeibo':
        result = handleKakeibo(action, data);
        break;
        
      case 'kota':
        result = handleKota(action, data);
        break;
        
      default:
        return createErrorResponse(
          `未対応のアプリです: ${app}`,
          `Unknown app: ${app}`
        );
    }
    
    // 成功レスポンス
    return createSuccessResponse(result);
    
  } catch (error) {
    // エラーレスポンス
    Logger.log(`[doPost] エラー: ${error.toString()}`);
    return createErrorResponse(
      'サーバーでエラーが発生しました',
      error.toString()
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// アプリ別ハンドラー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Tracker のリクエストを処理
 */
function handleTracker(action, data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('tracker_data') || ss.insertSheet('tracker_data');
  
  switch (action) {
    case 'save':
      return saveTrackerData(sheet, data);
      
    case 'load':
      return loadTrackerData(sheet, data.date);
      
    case 'bulk_load':
      return bulkLoadTrackerData(sheet, data.startDate, data.endDate);
      
    case 'analyze':
      return analyzeTrackerData(sheet, data);
      
    default:
      throw new Error(`未対応のアクション: ${action}`);
  }
}

/**
 * Medical のリクエストを処理
 */
function handleMedical(action, data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('medical_visits') || ss.insertSheet('medical_visits');
  
  switch (action) {
    case 'save':
      return saveMedicalVisit(sheet, data);
      
    case 'load':
      return loadMedicalVisits(sheet);
      
    case 'delete':
      return deleteMedicalVisit(sheet, data.id);
      
    case 'summary':
      return generateMedicalSummary(sheet, data);
      
    default:
      throw new Error(`未対応のアクション: ${action}`);
  }
}

/**
 * Kakeibo のリクエストを処理
 */
function handleKakeibo(action, data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('kakeibo_transactions') || ss.insertSheet('kakeibo_transactions');
  
  switch (action) {
    case 'save':
      return saveTransaction(sheet, data);
      
    case 'load':
      return loadTransactions(sheet, data.month);
      
    case 'analyze':
      return analyzeTransactions(sheet, data);
      
    default:
      throw new Error(`未対応のアクション: ${action}`);
  }
}

/**
 * Kota のリクエストを処理
 */
function handleKota(action, data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('kota_logs') || ss.insertSheet('kota_logs');
  
  switch (action) {
    case 'save':
      return saveKotaLog(sheet, data);
      
    case 'load':
      return loadKotaLogs(sheet, data.startDate, data.endDate);
      
    default:
      throw new Error(`未対応のアクション: ${action}`);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tracker 実装
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function saveTrackerData(sheet, data) {
  const { date } = data;
  
  if (!date) {
    throw new Error('date は必須です');
  }
  
  // ヘッダー行がなければ作成
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['date', 'data', 'updated_at']);
  }
  
  // 既存データを検索
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === date) {
      rowIndex = i + 1; // 1-indexed
      break;
    }
  }
  
  const now = new Date().toISOString();
  const dataJson = JSON.stringify(data);
  
  if (rowIndex > 0) {
    // 更新
    sheet.getRange(rowIndex, 2).setValue(dataJson);
    sheet.getRange(rowIndex, 3).setValue(now);
  } else {
    // 新規追加
    sheet.appendRow([date, dataJson, now]);
  }
  
  // バックアップ
  saveBackup('tracker', date, data);
  
  return {
    date,
    saved: true,
    timestamp: now
  };
}

function loadTrackerData(sheet, date) {
  if (!date) {
    throw new Error('date は必須です');
  }
  
  const values = sheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === date) {
      return {
        date,
        data: JSON.parse(values[i][1]),
        updated_at: values[i][2]
      };
    }
  }
  
  // データが見つからない場合
  return {
    date,
    data: null,
    updated_at: null
  };
}

function bulkLoadTrackerData(sheet, startDate, endDate) {
  const values = sheet.getDataRange().getValues();
  const results = [];
  
  for (let i = 1; i < values.length; i++) {
    const date = values[i][0];
    
    if (date >= startDate && date <= endDate) {
      results.push({
        date,
        data: JSON.parse(values[i][1]),
        updated_at: values[i][2]
      });
    }
  }
  
  return {
    records: results,
    count: results.length
  };
}

function analyzeTrackerData(sheet, data) {
  // AI分析は将来実装
  // 現在はスタブを返す
  return {
    analysis: 'AI分析機能は準備中です',
    model: 'stub'
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Medical 実装
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function saveMedicalVisit(sheet, data) {
  // ヘッダー行作成
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'date', 'data', 'created_at', 'updated_at']);
  }
  
  const id = data.id || generateId();
  const now = new Date().toISOString();
  
  sheet.appendRow([
    id,
    data.date,
    JSON.stringify(data),
    now,
    now
  ]);
  
  saveBackup('medical', id, data);
  
  return {
    id,
    saved: true,
    timestamp: now
  };
}

function loadMedicalVisits(sheet) {
  if (sheet.getLastRow() === 0) {
    return { visits: [] };
  }
  
  const values = sheet.getDataRange().getValues();
  const visits = [];
  
  for (let i = 1; i < values.length; i++) {
    visits.push({
      id: values[i][0],
      date: values[i][1],
      data: JSON.parse(values[i][2]),
      created_at: values[i][3],
      updated_at: values[i][4]
    });
  }
  
  return { visits };
}

function deleteMedicalVisit(sheet, id) {
  const values = sheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { deleted: true, id };
    }
  }
  
  throw new Error(`ID ${id} が見つかりません`);
}

function generateMedicalSummary(sheet, data) {
  // Claude連携は将来実装
  return {
    summary: 'サマリー機能は準備中です',
    model: 'stub'
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Kakeibo 実装（スタブ）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function saveTransaction(sheet, data) {
  return { saved: true, stub: true };
}

function loadTransactions(sheet, month) {
  return { transactions: [], stub: true };
}

function analyzeTransactions(sheet, data) {
  return { analysis: '準備中', stub: true };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Kota 実装（スタブ）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function saveKotaLog(sheet, data) {
  return { saved: true, stub: true };
}

function loadKotaLogs(sheet, startDate, endDate) {
  return { logs: [], stub: true };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 共通ユーティリティ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 成功レスポンスを作成
 */
function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      data: data
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * エラーレスポンスを作成
 */
function createErrorResponse(message, detail) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false,
      error_message: message,
      error_detail: detail || ''
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ユニークIDを生成
 */
function generateId() {
  return Utilities.getUuid();
}

/**
 * バックアップをJSONシートに保存
 */
function saveBackup(app, id, data) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let backupSheet = ss.getSheetByName('_backup');
    
    if (!backupSheet) {
      backupSheet = ss.insertSheet('_backup');
      backupSheet.appendRow(['timestamp', 'app', 'id', 'data']);
    }
    
    backupSheet.appendRow([
      new Date().toISOString(),
      app,
      id,
      JSON.stringify(data)
    ]);
    
    // 1000件を超えたら古いものを削除
    if (backupSheet.getLastRow() > 1000) {
      backupSheet.deleteRow(2); // ヘッダーの次の行（最古）を削除
    }
  } catch (error) {
    Logger.log(`[saveBackup] エラー: ${error.toString()}`);
    // バックアップ失敗はメイン処理に影響させない
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// テスト用関数
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * doPost のテスト
 * GASエディタで実行して動作確認
 */
function testDoPost() {
  const testPayload = {
    app: 'tracker',
    action: 'save',
    data: {
      date: '2026-04-08',
      mood: 1,
      energy: 3,
      diary: 'テストデータ'
    }
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(testPayload)
    }
  };
  
  const response = doPost(e);
  const result = JSON.parse(response.getContent());
  
  Logger.log('テスト結果:');
  Logger.log(JSON.stringify(result, null, 2));
  
  return result;
}
