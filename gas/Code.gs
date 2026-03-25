/**
 * Charkoシリーズ 統合GASバックエンド
 *
 * 【初回セットアップ手順】
 * 1. Apps Script エディタ → プロジェクトのプロパティ → スクリプトプロパティ に追加:
 *    SHEET_ID   : GoogleスプレッドシートのID（URLの /d/ここ/edit の部分）
 *    CLAUDE_KEY : Anthropic APIキー（AI分析で使う場合）
 *    GEMINI_KEY : Gemini APIキー
 *
 * 2. デプロイ → 新しいデプロイ → ウェブアプリ
 *    - 「次のユーザーとして実行」= 自分
 *    - 「アクセスできるユーザー」= 全員
 *
 * 3. 発行されたURLを common/api.js の CHARKO_GAS_URL に貼り付ける
 */

// スプレッドシートID（スクリプトプロパティから取得）
function getSheetId() {
  return PropertiesService.getScriptProperties().getProperty('SHEET_ID');
}

// ─── エントリーポイント ───────────────────────────

function doPost(e) {
  // デバッグ用：リクエスト内容をログ出力
  Logger.log('doPost received: ' + (e.postData ? e.postData.contents : 'no data'));

  try {
    if (!e.postData || !e.postData.contents) {
      return respond(false, null, 'リクエストデータがありません', 'postData is empty');
    }

    const payload = JSON.parse(e.postData.contents);
    const { app, action, data } = payload;

    Logger.log('app=' + app + ' action=' + action);

    // アプリごとに分岐
    switch (app) {
      case 'tracker': return handleTracker(action, data || {});
      case 'medical': return handleMedical(action, data || {});
      case 'money':   return handleMoney(action, data || {});
      default:
        return respond(false, null, '不明なアプリです: ' + app, 'unknown app');
    }

  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return respond(false, null, 'サーバーエラーが発生しました', err.message);
  }
}

// GETリクエストで動作確認できるようにする（ブラウザでURLを開くとOKと表示）
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, message: 'Charko GAS is running', version: '1.0' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ─── レスポンス生成ヘルパー ───────────────────────

/**
 * 統一レスポンス形式
 * { success, data, error_message, error_detail }
 */
function respond(success, data, error_message, error_detail) {
  const result = { success };
  if (success) {
    result.data = data || {};
  } else {
    result.error_message = error_message || 'エラーが発生しました';
    result.error_detail  = error_detail  || '';
  }
  Logger.log('respond: ' + JSON.stringify(result));
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Trackerアプリ ────────────────────────────────

function handleTracker(action, data) {
  switch (action) {
    case 'save':    return trackerSave(data);
    case 'load':    return trackerLoad(data);
    case 'analyze': return trackerAnalyze(data);
    case 'archive': return trackerArchive(data);
    default:
      return respond(false, null, '不明な操作です: ' + action, 'unknown action');
  }
}

/** 1日分のレコードを保存 */
function trackerSave(data) {
  const { date, record } = data;
  if (!date) return respond(false, null, '日付が必要です', 'date is missing');

  const ss = SpreadsheetApp.openById(getSheetId());
  const sheet = getOrCreateSheet(ss, 'tracker_data');

  // date列を検索して既存行を更新、なければ追加
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) { // 1行目はヘッダー
    if (values[i][0] === date) { rowIndex = i + 1; break; }
  }

  const row = [
    date,
    JSON.stringify(record || data),
    new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    Logger.log('tracker: updated row ' + rowIndex + ' for date ' + date);
  } else {
    sheet.appendRow(row);
    Logger.log('tracker: appended new row for date ' + date);
  }

  return respond(true, { date, saved: true });
}

/** 1日分のレコードを読み込む */
function trackerLoad(data) {
  const { date } = data;
  if (!date) return respond(false, null, '日付が必要です', 'date is missing');

  const ss = SpreadsheetApp.openById(getSheetId());
  const sheet = ss.getSheetByName('tracker_data');
  if (!sheet) return respond(true, { record: null }); // シートなし＝空

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === date) {
      try {
        const record = JSON.parse(values[i][1]);
        Logger.log('tracker: loaded record for ' + date);
        return respond(true, { date, record });
      } catch {
        return respond(false, null, 'データ形式エラー', 'JSON parse failed');
      }
    }
  }
  return respond(true, { date, record: null }); // 該当日なし
}

/** AI分析（保存とは完全分離） */
function trackerAnalyze(data) {
  const { prompt, provider } = data;
  if (!prompt) return respond(false, null, 'プロンプトが必要です', 'prompt is missing');

  const p = PropertiesService.getScriptProperties();
  const useProvider = provider || 'gemini';

  try {
    let text = '';

    if (useProvider === 'gemini') {
      const key = p.getProperty('GEMINI_KEY');
      if (!key) return respond(false, null, 'Gemini APIキーが設定されていません', 'GEMINI_KEY not set');
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + key;
      const res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const json = JSON.parse(res.getContentText());
      text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';

    } else if (useProvider === 'claude') {
      const key = p.getProperty('CLAUDE_KEY');
      if (!key) return respond(false, null, 'Claude APIキーが設定されていません', 'CLAUDE_KEY not set');
      const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
        method: 'post',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        payload: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const json = JSON.parse(res.getContentText());
      text = json.content?.[0]?.text || '';

    } else if (useProvider === 'gpt') {
      const key = p.getProperty('GPT_KEY');
      if (!key) return respond(false, null, 'GPT APIキーが設定されていません', 'GPT_KEY not set');
      const res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
        payload: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000
        })
      });
      const json = JSON.parse(res.getContentText());
      text = json.choices?.[0]?.message?.content || '';
    }

    Logger.log('tracker: analyze done, text length=' + text.length);
    return respond(true, { text, provider: useProvider });

  } catch (err) {
    Logger.log('tracker: analyze error: ' + err.message);
    return respond(false, null, 'AI分析エラー: ' + err.message.slice(0, 80), err.message);
  }
}

/** Archiveシートにバックアップ */
function trackerArchive(data) {
  const { date, record } = data;
  const ss = SpreadsheetApp.openById(getSheetId());
  const archive = getOrCreateSheet(ss, 'archive_tracker');

  const row = [
    date || 'unknown',
    JSON.stringify(record || data),
    new Date().toISOString(),
    'manual_backup'
  ];
  archive.appendRow(row);
  Logger.log('tracker: archived for date ' + date);
  return respond(true, { archived: true, date });
}

// ─── Medical / Money（将来拡張用） ───────────────

function handleMedical(action, data) {
  // 将来実装
  return respond(false, null, 'Medical app is not implemented yet', 'TODO');
}

function handleMoney(action, data) {
  // 将来実装
  return respond(false, null, 'Money app is not implemented yet', 'TODO');
}

// ─── ユーティリティ ───────────────────────────────

/** シートを取得、なければヘッダー付きで作成 */
function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // ヘッダー行を追加
    if (name === 'tracker_data') {
      sheet.appendRow(['date', 'record_json', 'updated_at']);
    } else if (name === 'archive_tracker') {
      sheet.appendRow(['date', 'record_json', 'archived_at', 'reason']);
    }
    Logger.log('Created new sheet: ' + name);
  }
  return sheet;
}
