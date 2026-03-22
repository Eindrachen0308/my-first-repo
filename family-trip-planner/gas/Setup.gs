/**
 * セットアップ＆トリガー管理スクリプト
 *
 * 初回セットアップ手順:
 * 1. setupAll() を実行
 * 2. GmailとSpreadsheetのアクセス許可を承認
 * 3. 自動的にスプレッドシートとトリガーが作成される
 */

/**
 * 初回セットアップ（最初に1回だけ実行）
 */
function setupAll() {
  // 1. メールアドレスの設定確認
  if (CONFIG.EMAIL_TO === 'your-email@gmail.com') {
    const ui = SpreadsheetApp.getUi ? SpreadsheetApp.getUi() : null;
    if (ui) {
      const response = ui.prompt(
        'メールアドレスの設定',
        '下書きの宛先メールアドレスを入力してください:',
        ui.ButtonSet.OK_CANCEL
      );
      if (response.getSelectedButton() === ui.Button.OK) {
        PropertiesService.getScriptProperties().setProperty('EMAIL_TO', response.getResponseText());
        Logger.log(`メールアドレスを設定しました: ${response.getResponseText()}`);
      }
    } else {
      Logger.log('⚠ CONFIG.EMAIL_TO を実際のメールアドレスに変更してください。');
      Logger.log('  または setupEmail("your-email@gmail.com") を実行してください。');
    }
  }

  // 2. スプレッドシート作成
  const ss = getOrCreateSpreadsheet_();
  Logger.log(`✅ スプレッドシート準備完了: ${ss.getUrl()}`);

  // 3. トリガー設定
  setupTriggers();
  Logger.log('✅ トリガー設定完了');

  // 4. 初回テスト実行
  Logger.log('📋 セットアップ完了！初回テスト実行を開始します...');
  testRun();

  Logger.log('\n===== セットアップ完了 =====');
  Logger.log(`スプレッドシート: ${ss.getUrl()}`);
  Logger.log('朝8:00と夜20:30に自動実行されます。');
}

/**
 * メールアドレスを設定
 */
function setupEmail(email) {
  PropertiesService.getScriptProperties().setProperty('EMAIL_TO', email);
  Logger.log(`メールアドレスを設定しました: ${email}`);
}

/**
 * Google Custom Search API キーを設定（オプション）
 * より多くの検索結果を取得したい場合に設定
 */
function setupSearchAPI(apiKey, searchEngineId) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('GOOGLE_API_KEY', apiKey);
  props.setProperty('SEARCH_ENGINE_ID', searchEngineId);
  Logger.log('Google Custom Search API の設定が完了しました。');
}

/**
 * 時間ベースのトリガーを設定
 * - 毎朝 8:00 に morningRun() を実行
 * - 毎晩 20:30 に eveningRun() を実行
 */
function setupTriggers() {
  // 既存のトリガーを削除
  clearAllTriggers();

  // 朝8時のトリガー
  ScriptApp.newTrigger('morningRun')
    .timeBased()
    .atHour(8)
    .nearMinute(0)
    .everyDays(1)
    .inTimezone('Asia/Tokyo')
    .create();

  // 夜20時半のトリガー
  ScriptApp.newTrigger('eveningRun')
    .timeBased()
    .atHour(20)
    .nearMinute(30)
    .everyDays(1)
    .inTimezone('Asia/Tokyo')
    .create();

  Logger.log('トリガーを設定しました:');
  Logger.log('  - 朝 8:00 (JST): morningRun');
  Logger.log('  - 夜 20:30 (JST): eveningRun');
}

/**
 * すべてのトリガーを削除
 */
function clearAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  Logger.log(`${triggers.length}件のトリガーを削除しました。`);
}

/**
 * 現在のトリガー一覧を表示
 */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  if (triggers.length === 0) {
    Logger.log('トリガーは設定されていません。');
    return;
  }
  triggers.forEach(trigger => {
    Logger.log(`- ${trigger.getHandlerFunction()} (${trigger.getEventType()})`);
  });
}

/**
 * 現在の設定を確認
 */
function showCurrentConfig() {
  const props = PropertiesService.getScriptProperties().getProperties();
  Logger.log('===== 現在の設定 =====');
  Logger.log(`メール宛先: ${props.EMAIL_TO || CONFIG.EMAIL_TO}`);
  Logger.log(`スプレッドシートID: ${props.SPREADSHEET_ID || '未作成'}`);
  Logger.log(`Google API Key: ${props.GOOGLE_API_KEY ? '設定済み' : '未設定（オプション）'}`);
  Logger.log(`Search Engine ID: ${props.SEARCH_ENGINE_ID ? '設定済み' : '未設定（オプション）'}`);

  if (props.SPREADSHEET_ID) {
    try {
      const ss = SpreadsheetApp.openById(props.SPREADSHEET_ID);
      Logger.log(`スプレッドシートURL: ${ss.getUrl()}`);
    } catch (e) {
      Logger.log('スプレッドシートにアクセスできません。');
    }
  }

  Logger.log('\n===== トリガー =====');
  listTriggers();
}

/**
 * すべてのデータをリセット（注意：送信履歴も消えます）
 */
function resetAll() {
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');

  if (ssId) {
    try {
      const ss = SpreadsheetApp.openById(ssId);
      const spotSheet = ss.getSheetByName('スポット一覧');
      if (spotSheet && spotSheet.getLastRow() > 1) {
        spotSheet.deleteRows(2, spotSheet.getLastRow() - 1);
      }
      const historySheet = ss.getSheetByName('送信履歴');
      if (historySheet && historySheet.getLastRow() > 1) {
        historySheet.deleteRows(2, historySheet.getLastRow() - 1);
      }
      Logger.log('スプレッドシートのデータをリセットしました。');
    } catch (e) {
      Logger.log(`リセットに失敗: ${e.message}`);
    }
  }

  Logger.log('リセット完了。');
}
