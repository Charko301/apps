/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Charko Tracker - データ移行スクリプト
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 既存の App_data (60列形式) → tracker_data (JSON形式) に変換
 * 
 * 【実行方法】
 * 1. Code.gs の最後にこのコードを追加
 * 2. 関数選択で「migrateAppDataToTrackerData」を選択
 * 3. 「▶ 実行」をクリック
 * 4. 実行ログで進捗を確認
 * 
 * 【注意】
 * - 一度だけ実行すればOK
 * - App_data は削除されず、そのまま残ります
 * 
 * @version 1.0.0
 * @date 2026-04-08
 */

/**
 * App_data → tracker_data への移行メイン関数
 */
function migrateAppDataToTrackerData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  // 既存シート取得
  const appDataSheet = ss.getSheetByName('App_data');
  if (!appDataSheet) {
    Logger.log('エラー: App_data シートが見つかりません');
    return;
  }
  
  // 新しいシート作成（既にあれば削除して再作成）
  let trackerSheet = ss.getSheetByName('tracker_data');
  if (trackerSheet) {
    Logger.log('警告: tracker_data が既に存在します。上書きしますか？');
    Logger.log('上書きする場合は、次の行のコメントを外してください');
    // ss.deleteSheet(trackerSheet);
    // trackerSheet = ss.insertSheet('tracker_data');
  } else {
    trackerSheet = ss.insertSheet('tracker_data');
  }
  
  // tracker_data のヘッダー作成
  trackerSheet.clear();
  trackerSheet.appendRow(['date', 'data', 'updated_at']);
  
  // App_data からデータ読み込み
  const values = appDataSheet.getDataRange().getValues();
  const headers = values[0]; // 1行目がヘッダー
  
  Logger.log(`移行開始: ${values.length - 1}件のデータを処理します`);
  
  let successCount = 0;
  let skipCount = 0;
  
  // 2行目から処理（1行目はヘッダー）
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    
    // 日付列を取得（列インデックスを探す）
    const dateIndex = headers.indexOf('日付');
    if (dateIndex === -1) {
      Logger.log('エラー: 日付列が見つかりません');
      return;
    }
    
    const date = row[dateIndex];
    
    // 日付が空の場合はスキップ
    if (!date || date === '') {
      skipCount++;
      continue;
    }
    
    // 日付をYYYY-MM-DD形式に変換
    const dateStr = formatDate(date);
    
    // 行データをJSONオブジェクトに変換
    const jsonData = convertRowToJson(headers, row);
    
    // tracker_data に保存
    trackerSheet.appendRow([
      dateStr,
      JSON.stringify(jsonData),
      new Date().toISOString()
    ]);
    
    successCount++;
    
    // 進捗表示（10件ごと）
    if (successCount % 10 === 0) {
      Logger.log(`進捗: ${successCount}件完了`);
    }
  }
  
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('移行完了！');
  Logger.log(`成功: ${successCount}件`);
  Logger.log(`スキップ: ${skipCount}件`);
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * 行データをJSONオブジェクトに変換
 */
function convertRowToJson(headers, row) {
  const json = {};
  
  // 各列をキー:値のペアに変換
  for (let i = 0; i < headers.length; i++) {
    const key = headers[i];
    const value = row[i];
    
    // 空の値はスキップ（nullではなく空文字列の場合）
    if (value === '') {
      continue;
    }
    
    // キー名を英語のキャメルケースに変換
    const camelKey = convertToCamelCase(key);
    
    json[camelKey] = value;
  }
  
  return json;
}

/**
 * 日本語キーを英語キャメルケースに変換
 * 
 * 例: "気分(朝)" → "moodMorning"
 */
function convertToCamelCase(japaneseKey) {
  // マッピングテーブル
  const mapping = {
    '更新日時': 'updatedAt',
    '保存時刻(JST)': 'savedAtJST',
    '日付': 'date',
    '起床時刻': 'wakeupTime',
    '就寝時刻': 'bedTime',
    '睡眠時間(h)': 'sleepHours',
    '睡眠の質': 'sleepQuality',
    '中途覚醒': 'nightWakings',
    '気分(朝)': 'moodMorning',
    '気分(昼)': 'moodNoon',
    '気分(夜)': 'moodEvening',
    '活力(朝)': 'energyMorning',
    '活力(昼)': 'energyNoon',
    '活力(夜)': 'energyEvening',
    '状態評価(朝)': 'statusMorning',
    '状態評価(夜)': 'statusEvening',
    '状態の理由(朝)': 'statusReasonMorning',
    '体調症状': 'symptoms',
    '感情タグ(朝)': 'emotionTagsMorning',
    '感情タグ(昼)': 'emotionTagsNoon',
    '感情タグ(夜)': 'emotionTagsEvening',
    '感情タグ(記録)': 'emotionTagsLog',
    '感情メモ(朝)': 'emotionMemoMorning',
    '感情メモ(昼)': 'emotionMemoNoon',
    '感情メモ(夜)': 'emotionMemoEvening',
    '感情メモ(記録)': 'emotionMemoLog',
    'コンサータ': 'concerta',
    'コンサータ服薬時刻': 'concertaTime',
    '頓服薬': 'prn',
    '夜の薬': 'eveningMed',
    '夜薬服薬時刻': 'eveningMedTime',
    '勤務': 'work',
    '勤務開始': 'workStart',
    '勤務終了': 'workEnd',
    '欠席・遅刻理由': 'absenceReason',
    '勤務メモ': 'workMemo',
    '朝食': 'breakfast',
    '朝食時刻': 'breakfastTime',
    '昼食': 'lunch',
    '昼食時刻': 'lunchTime',
    '夕食': 'dinner',
    '夕食時刻': 'dinnerTime',
    '生理': 'menstruation',
    '生理痛(0-5)': 'menstrualPain',
    '幸太散歩回数': 'kotaWalks',
    '生活チェック': 'lifeCheck',
    '生活メモ': 'lifeMemo',
    '行動記録': 'actions',
    '行動振り返り': 'actionsReview',
    '天気': 'weather',
    '気圧(hPa)': 'pressure',
    'タイムスタンプメモ(朝)': 'timestampMemoMorning',
    'タイムスタンプメモ(昼)': 'timestampMemoNoon',
    'タイムスタンプメモ(夜)': 'timestampMemoEvening',
    '日記メモ': 'diary',
    'AI用整形テキスト': 'aiFormattedText',
    'JSONバックアップ': 'jsonBackup',
    'Claudeフィードバック': 'claudeFeedback',
    'Geminiフィードバック': 'geminiFeedback',
    'GPTフィードバック': 'gptFeedback'
  };
  
  // マッピングがあればそれを使用、なければそのまま
  return mapping[japaneseKey] || japaneseKey;
}

/**
 * 日付をYYYY-MM-DD形式に変換
 */
function formatDate(date) {
  if (date instanceof Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  // 既に文字列の場合
  return String(date);
}

/**
 * 移行データのサンプル確認（デバッグ用）
 * 
 * 最初の3件だけ変換して表示
 */
function previewMigration() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const appDataSheet = ss.getSheetByName('App_data');
  
  if (!appDataSheet) {
    Logger.log('エラー: App_data シートが見つかりません');
    return;
  }
  
  const values = appDataSheet.getDataRange().getValues();
  const headers = values[0];
  
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('移行プレビュー（最初の3件）');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  for (let i = 1; i <= Math.min(3, values.length - 1); i++) {
    const row = values[i];
    const dateIndex = headers.indexOf('日付');
    const date = formatDate(row[dateIndex]);
    const json = convertRowToJson(headers, row);
    
    Logger.log(`\n【${i}件目】`);
    Logger.log(`日付: ${date}`);
    Logger.log(`JSON: ${JSON.stringify(json, null, 2)}`);
  }
  
  Logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('プレビュー終了');
  Logger.log('問題なければ migrateAppDataToTrackerData を実行してください');
}
