/**
 * 家族旅行プランナー - Google Apps Script
 *
 * 機能:
 * - 関東近辺の家族旅行スポット・イベント情報をウェブから取得
 * - Google スプレッドシートにデータを蓄積
 * - 毎朝8時・夜20時半にGmailの下書きとして保存
 * - 過去に報告済みの情報は自動で除外
 *
 * 家族構成: 夫（会社員）、妻（専業主婦）、5歳児、2歳児
 * 居住地: 千葉県流山市 ｜ 移動制限: 車で片道1〜1.5時間
 */

// ===== 設定 =====
const CONFIG = {
  // メール送信先（ご自身のメールアドレスに変更してください）
  EMAIL_TO: 'your-email@gmail.com',

  // スプレッドシートID（セットアップ時に自動設定されます）
  SPREADSHEET_ID: '',

  // 検索キーワード群
  SEARCH_QUERIES: [
    '関東 子連れ 週末 イベント 2026',
    '千葉 流山 近郊 家族 お出かけ',
    '関東 アンパンマン サンリオ 恐竜 子供 イベント',
    '関東 パウパトロール イベント キャラクターショー',
    '千葉 埼玉 東京 子連れ 新スポット オープン',
    '関東 子連れ グルメ ランチ 週末',
    '関東 動物ふれあい 牧場 子供',
    '千葉 埼玉 東京 週末 お祭り フェスティバル 家族',
  ],

  // 情報取得元のRSSフィード・APIエンドポイント
  SOURCES: [
    {
      name: 'いこーよ 関東イベント',
      url: 'https://iko-yo.net/events.rss?region_ids[]=3',
      type: 'rss',
    },
    {
      name: 'Walkerplus 関東イベント',
      url: 'https://www.walkerplus.com/rss/eventnews/ar0300.xml',
      type: 'rss',
    },
    {
      name: 'るるぶKids',
      url: 'https://kids.rurubu.jp/feed',
      type: 'rss',
    },
  ],

  // 子供の好みキーワード（フィルタリング用）
  INTEREST_KEYWORDS: [
    'パウ・パトロール', 'パウパトロール', 'パウパト', 'PAW PATROL',
    'こびとづかん',
    'アンパンマン',
    'サンリオ', 'ハローキティ', 'キティ', 'マイメロディ', 'ポムポムプリン', 'シナモロール',
    '恐竜', 'ダイナソー', 'ジュラシック',
    '犬', '猫', 'ペット', '動物', '牧場', '動物園', '水族館',
    'キャラクターショー',
    '子連れ', 'キッズ', 'ファミリー', '家族',
    'アスレチック', '公園', '遊園地', 'テーマパーク',
  ],

  // 関東エリアキーワード
  AREA_KEYWORDS: [
    '東京', '千葉', '埼玉', '神奈川', '茨城', '栃木', '群馬',
    '流山', '柏', '松戸', '船橋', '横浜', 'さいたま',
    '関東',
  ],
};


// ===== メインエントリーポイント =====

/**
 * 朝8時の定期実行用
 */
function morningRun() {
  main_('朝のおすすめ情報');
}

/**
 * 夜20時半の定期実行用
 */
function eveningRun() {
  main_('夜のおすすめ情報');
}

/**
 * 手動テスト用
 */
function testRun() {
  main_('テスト実行');
}

/**
 * メイン処理
 */
function main_(label) {
  const ss = getOrCreateSpreadsheet_();
  const spots = collectSpotInfo_();
  const newSpots = filterNewSpots_(ss, spots);

  if (newSpots.length === 0) {
    Logger.log('新しいスポット情報はありませんでした。');
    return;
  }

  // スプレッドシートに保存
  saveToSpreadsheet_(ss, newSpots);

  // 上位5件を選定してメール下書き作成
  const topSpots = newSpots.slice(0, 5);
  createDraft_(topSpots, label);

  Logger.log(`${newSpots.length}件の新しいスポットを保存し、下書きを作成しました。`);
}


// ===== データ収集 =====

/**
 * 各ソースから情報を収集
 */
function collectSpotInfo_() {
  const allSpots = [];

  // RSSフィードから収集
  CONFIG.SOURCES.forEach(source => {
    try {
      const spots = fetchRSS_(source);
      allSpots.push(...spots);
    } catch (e) {
      Logger.log(`${source.name} の取得に失敗: ${e.message}`);
    }
  });

  // Google Custom Search API からの収集（APIキー設定時のみ）
  const apiKey = PropertiesService.getScriptProperties().getProperty('GOOGLE_API_KEY');
  const searchEngineId = PropertiesService.getScriptProperties().getProperty('SEARCH_ENGINE_ID');

  if (apiKey && searchEngineId) {
    CONFIG.SEARCH_QUERIES.forEach(query => {
      try {
        const spots = fetchFromCustomSearch_(query, apiKey, searchEngineId);
        allSpots.push(...spots);
      } catch (e) {
        Logger.log(`検索 "${query}" の取得に失敗: ${e.message}`);
      }
    });
  }

  // 重複除去（タイトルベース）
  const seen = new Set();
  const unique = allSpots.filter(spot => {
    const key = spot.title.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 関連度スコアリング＆ソート
  const scored = unique.map(spot => ({
    ...spot,
    score: calculateRelevanceScore_(spot),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * RSSフィードからスポット情報を取得
 */
function fetchRSS_(source) {
  const response = UrlFetchApp.fetch(source.url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) return [];

  const xml = XmlService.parse(response.getContentText());
  const root = xml.getRootElement();
  const items = findRSSItems_(root);
  const spots = [];

  items.forEach(item => {
    const title = getElementText_(item, 'title');
    const link = getElementText_(item, 'link');
    const description = getElementText_(item, 'description');
    const pubDate = getElementText_(item, 'pubDate');

    if (isRelevant_(title + ' ' + description)) {
      spots.push({
        title: title,
        url: link,
        description: stripHtml_(description).substring(0, 300),
        source: source.name,
        date: pubDate || new Date().toISOString(),
        category: categorize_(title + ' ' + description),
        area: extractArea_(title + ' ' + description),
      });
    }
  });

  return spots;
}

/**
 * RSSのitem要素を再帰的に検索
 */
function findRSSItems_(element) {
  const items = [];
  const children = element.getChildren();

  children.forEach(child => {
    if (child.getName() === 'item' || child.getName() === 'entry') {
      items.push(child);
    } else {
      items.push(...findRSSItems_(child));
    }
  });

  return items;
}

/**
 * XML要素からテキストを取得
 */
function getElementText_(parent, tagName) {
  const namespaces = parent.getNamespace();
  let child = parent.getChild(tagName);
  if (!child && namespaces) {
    child = parent.getChild(tagName, namespaces);
  }
  return child ? child.getText() : '';
}

/**
 * Google Custom Search APIで検索
 */
function fetchFromCustomSearch_(query, apiKey, searchEngineId) {
  const url = 'https://www.googleapis.com/customsearch/v1'
    + '?key=' + encodeURIComponent(apiKey)
    + '&cx=' + encodeURIComponent(searchEngineId)
    + '&q=' + encodeURIComponent(query)
    + '&num=5'
    + '&lr=lang_ja';

  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) return [];

  const data = JSON.parse(response.getContentText());
  if (!data.items) return [];

  return data.items.map(item => ({
    title: item.title,
    url: item.link,
    description: (item.snippet || '').substring(0, 300),
    source: 'Google検索',
    date: new Date().toISOString(),
    category: categorize_(item.title + ' ' + (item.snippet || '')),
    area: extractArea_(item.title + ' ' + (item.snippet || '')),
  }));
}


// ===== フィルタリング・スコアリング =====

/**
 * テキストがファミリー旅行に関連するかチェック
 */
function isRelevant_(text) {
  const lowerText = text.toLowerCase();
  const hasInterest = CONFIG.INTEREST_KEYWORDS.some(kw =>
    lowerText.includes(kw.toLowerCase())
  );
  const hasArea = CONFIG.AREA_KEYWORDS.some(kw =>
    lowerText.includes(kw.toLowerCase())
  );
  return hasInterest || hasArea;
}

/**
 * 関連度スコアを計算
 */
function calculateRelevanceScore_(spot) {
  const text = (spot.title + ' ' + spot.description).toLowerCase();
  let score = 0;

  // 子供の好みキーワードにマッチするほど高スコア
  CONFIG.INTEREST_KEYWORDS.forEach(kw => {
    if (text.includes(kw.toLowerCase())) score += 10;
  });

  // 近いエリアほど高スコア
  const nearbyAreas = ['流山', '柏', '松戸', '船橋', '千葉'];
  nearbyAreas.forEach((area, i) => {
    if (text.includes(area)) score += (5 - i) * 3;
  });

  // 直近のイベントほど高スコア
  if (text.includes('今週') || text.includes('今週末')) score += 15;
  if (text.includes('開催中') || text.includes('新オープン')) score += 10;

  // グルメ情報があるとボーナス
  if (text.includes('グルメ') || text.includes('ランチ') || text.includes('美味しい')) {
    score += 8;
  }

  return score;
}

/**
 * カテゴリ分類
 */
function categorize_(text) {
  if (/恐竜|ダイナソー|ジュラシック/.test(text)) return '恐竜';
  if (/アンパンマン/.test(text)) return 'アンパンマン';
  if (/サンリオ|キティ|ピューロ/.test(text)) return 'サンリオ';
  if (/パウ.*パト|PAW/.test(text)) return 'パウパトロール';
  if (/動物|牧場|動物園|水族館/.test(text)) return '動物';
  if (/公園|アスレチック/.test(text)) return '公園・アウトドア';
  if (/遊園地|テーマパーク/.test(text)) return 'テーマパーク';
  if (/グルメ|ランチ|レストラン|カフェ/.test(text)) return 'グルメ';
  if (/イベント|ショー|祭|フェス/.test(text)) return 'イベント';
  return 'その他';
}

/**
 * エリア抽出
 */
function extractArea_(text) {
  for (const area of CONFIG.AREA_KEYWORDS) {
    if (text.includes(area)) return area;
  }
  return '関東';
}

/**
 * 過去に報告済みのスポットを除外
 */
function filterNewSpots_(ss, spots) {
  const historySheet = ss.getSheetByName('送信履歴');
  if (!historySheet || historySheet.getLastRow() < 2) return spots;

  const sentUrls = new Set();
  const sentTitles = new Set();
  const data = historySheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1]) sentTitles.add(data[i][1].toString().trim());
    if (data[i][2]) sentUrls.add(data[i][2].toString().trim());
  }

  return spots.filter(spot =>
    !sentUrls.has(spot.url) && !sentTitles.has(spot.title.trim())
  );
}


// ===== スプレッドシート管理 =====

/**
 * スプレッドシートの取得または新規作成
 */
function getOrCreateSpreadsheet_() {
  let ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');

  if (ssId) {
    try {
      return SpreadsheetApp.openById(ssId);
    } catch (e) {
      Logger.log('保存済みのスプレッドシートが見つかりません。新規作成します。');
    }
  }

  const ss = SpreadsheetApp.create('家族旅行おすすめスポット一覧');
  ssId = ss.getId();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ssId);

  // スポット一覧シート
  const spotSheet = ss.getActiveSheet();
  spotSheet.setName('スポット一覧');
  spotSheet.appendRow([
    '登録日', 'スポット名', 'URL', 'カテゴリ', 'エリア',
    '説明', '情報源', '関連度スコア', '訪問済み', 'メモ',
  ]);
  spotSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#4a86c8').setFontColor('white');
  spotSheet.setFrozenRows(1);

  // 送信履歴シート
  const historySheet = ss.insertSheet('送信履歴');
  historySheet.appendRow(['送信日時', 'スポット名', 'URL', 'ラベル']);
  historySheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#6aa84f').setFontColor('white');
  historySheet.setFrozenRows(1);

  // イベント情報シート
  const eventSheet = ss.insertSheet('イベント情報');
  eventSheet.appendRow([
    '登録日', 'イベント名', 'URL', '開催日', 'エリア',
    '説明', 'カテゴリ', '関連度スコア',
  ]);
  eventSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#e69138').setFontColor('white');
  eventSheet.setFrozenRows(1);

  Logger.log(`スプレッドシートを作成しました: ${ss.getUrl()}`);
  return ss;
}

/**
 * スポット情報をスプレッドシートに保存
 */
function saveToSpreadsheet_(ss, spots) {
  const spotSheet = ss.getSheetByName('スポット一覧');
  const now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');

  spots.forEach(spot => {
    spotSheet.appendRow([
      now,
      spot.title,
      spot.url,
      spot.category,
      spot.area,
      spot.description,
      spot.source,
      spot.score,
      '',  // 訪問済みフラグ
      '',  // メモ
    ]);
  });
}

/**
 * 送信履歴を記録
 */
function recordSentHistory_(ss, spots, label) {
  const historySheet = ss.getSheetByName('送信履歴');
  const now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');

  spots.forEach(spot => {
    historySheet.appendRow([now, spot.title, spot.url, label]);
  });
}


// ===== メール下書き作成 =====

/**
 * Gmail下書きを作成
 */
function createDraft_(spots, label) {
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy年M月d日（E）');
  const subject = `【家族旅行プランナー】${today} ${label} - おすすめ${spots.length}選`;

  const htmlBody = buildEmailHtml_(spots, today, label);
  const plainBody = buildEmailPlain_(spots, today, label);

  GmailApp.createDraft(
    CONFIG.EMAIL_TO,
    subject,
    plainBody,
    { htmlBody: htmlBody }
  );

  // 送信履歴を記録
  const ss = getOrCreateSpreadsheet_();
  recordSentHistory_(ss, spots, label);

  Logger.log(`下書きを作成しました: ${subject}`);
}

/**
 * HTML形式のメール本文を生成
 */
function buildEmailHtml_(spots, today, label) {
  let html = `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 20px;">🏖 家族旅行プランナー</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">${today} ${label}</p>
    </div>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
      <p style="color: #555; font-size: 14px;">
        千葉県流山市から車で片道1〜1.5時間圏内のおすすめスポット・イベント情報です。
      </p>
  `;

  spots.forEach((spot, i) => {
    const categoryEmoji = getCategoryEmoji_(spot.category);
    html += `
      <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea;">
        <h3 style="margin: 0 0 5px 0; color: #333;">
          ${categoryEmoji} ${i + 1}. ${escapeHtml_(spot.title)}
        </h3>
        <p style="margin: 5px 0; color: #666; font-size: 13px;">
          📍 ${escapeHtml_(spot.area)} ｜ 🏷 ${escapeHtml_(spot.category)} ｜ ⭐ スコア: ${spot.score}
        </p>
        <p style="margin: 5px 0; color: #444; font-size: 14px;">
          ${escapeHtml_(spot.description)}
        </p>
        <a href="${spot.url}" style="color: #667eea; font-size: 13px;">詳細を見る →</a>
      </div>
    `;
  });

  html += `
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">
        ※ 過去にお伝えした情報は自動的に除外されています。<br>
        ※ スプレッドシートに全データが蓄積されています。
      </p>
    </div>
  </div>`;

  return html;
}

/**
 * プレーンテキスト形式のメール本文を生成
 */
function buildEmailPlain_(spots, today, label) {
  let text = `家族旅行プランナー - ${today} ${label}\n`;
  text += '='.repeat(50) + '\n\n';
  text += '千葉県流山市から車で片道1〜1.5時間圏内のおすすめ情報\n\n';

  spots.forEach((spot, i) => {
    text += `${i + 1}. ${spot.title}\n`;
    text += `   エリア: ${spot.area} ｜ カテゴリ: ${spot.category}\n`;
    text += `   ${spot.description}\n`;
    text += `   URL: ${spot.url}\n\n`;
  });

  text += '-'.repeat(50) + '\n';
  text += '※ 過去にお伝えした情報は自動で除外されています。\n';
  return text;
}

/**
 * カテゴリに応じた絵文字を返す
 */
function getCategoryEmoji_(category) {
  const map = {
    '恐竜': '🦕',
    'アンパンマン': '🍞',
    'サンリオ': '🎀',
    'パウパトロール': '🐾',
    '動物': '🐄',
    '公園・アウトドア': '🌳',
    'テーマパーク': '🎢',
    'グルメ': '🍽',
    'イベント': '🎭',
  };
  return map[category] || '📍';
}


// ===== ユーティリティ =====

/**
 * HTMLタグを除去
 */
function stripHtml_(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}

/**
 * HTMLエスケープ
 */
function escapeHtml_(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
