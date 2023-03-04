function sendThemeToSlack() {
  // スプレッドシートの列を取得
  const sheet = getSheet_(PropertiesService.getScriptProperties().getProperty("SHEET_NAME"));
  const dateList = getDateList_(sheet);

  // 翌日の取得
  const nextdayString = getNextDate_();
  console.log(nextdayString)

  // テーマを取得（スプレッドシートにあればそれを、なければOpenAIで生成する）
  let theme = getTheme_(dateList, sheet, nextdayString);
  console.log(theme);

  // Slackに投稿
  postTextToSlack_(theme);
}

/**
 * スプレッドシートのシート情報を取得する
 */
function getSheet_(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);
  return sheet
}

/**
 * スプレッドシートから日付のリストを取得する
 */
function getDateList_(sheet) {
  const lastRow = sheet.getLastRow();
  const dateRange = sheet.getRange(2, 1, lastRow - 1);
  return dateRange.getDisplayValues();
}

/**
 * 翌日の日付を yyyy/M/dd で取得する
 */
function getNextDate_() {
  let nextday = new Date();
  console.log(nextday)
  nextday.setDate(nextday.getDate() + 1);
  nextday.setHours(0);
  nextday.setMinutes(0);
  nextday.setSeconds(0);
  nextday.setMilliseconds(0);
  return nextday.toLocaleDateString('ja-JA');
}

/**
 * 日付のリストを元にスプレッドシートからテーマを取得する
 */
function getTheme_(dateList, sheet, nextdayString) {
  let theme = "";
  for (let i = 0; i < dateList.length; i++) {
    if (dateList[i] == nextdayString) {
      // 隣のセルの番号にあるテーマを取得する
      const cell = `B${i + 2}`;
      const specificDateRange = sheet.getRange(cell);
      theme = specificDateRange.getDisplayValue();

      // スプレッドシートにテーマがないときは、OpenAI でテーマを生成する
      if (theme == "") {
        theme = requestOpenAI_();
        writeThemeToSpreadsheet_(theme, sheet, cell)
      }
    }
  }
  return theme;
}

/**
 * OpenAI Text Completion API にリクエストして雑談テーマを生成する
 */
function requestOpenAI_() {
  const apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
  const url = "https://api.openai.com/v1/completions";
  const prompt = "あなたはChatbotで、陽気で話しかけやすい人です。\n以下の制約条件を厳密に守って、雑談テーマを1つ提案してください。\n制約条件\n* Chatbotは雑談テーマをできるだけ詳しく提案します。\n* 「おしゃべりマン」というbotです。\n* 「好きな〇〇」や「気になる〇〇」という形式で答えます。\n* 「おしゃべりマン」のあなただったらどう答えるかも教えてください。\n* 一人称は「私」です。\n* ジェンダー、家族、体、政治、宗教の話題は避けてください。";
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const options = {
    'muteHttpExceptions' : true,
    'headers': headers, 
    'method': 'POST',
    'payload': JSON.stringify({
      'model': 'text-davinci-003',
      'max_tokens' : 200,
      'temperature' : 0.8,
      'top_p': 1.0,
      'frequency_penalty': 1.0,
      'presence_penalty': 1.0,
      'prompt': prompt})
  };
  const response = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
  console.log(response);
  let theme = response.choices[0].text.replace("\n", "");
  return theme;
}

/**
 * 生成したテーマをスプレッドシートに書き込む
 */
function writeThemeToSpreadsheet_(theme, sheet, cell) {
  let range = sheet.getRange(cell);
  range.setValue(theme);
};

/**
 * Slackにテーマを投稿する
 */
function postTextToSlack_(theme) {
  if (theme == "") {
    return
  };

  const text = `:sunny::sunny::sunny: *明日10:15から Slack で雑談会します！*:sunny::sunny::sunny:\n\n:speech_balloon: テーマ :speech_balloon:\n${theme}\n\n参加お待ちしてます:raised_hands:\n\n:sunny::sunny::sunny::sunny::sunny::sunny::sunny::sunny::sunny::sunny::sunny::sunny::sunny::sunny::sunny::sunny::sunny::sunny:`;

  /**
   * Slack通知用のメッセージ作成
   */ 
  const generateNotifyBlockMessage = () => {
    return {
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": ":sunny::sunny::sunny: *明日10:15から Slack で雑談会します！*:sunny::sunny::sunny:"
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*お題*\n雑談テーマ「私の好きな映画は、最近のアクションやSFが多いですね。特に『インターステラー』という映画が大好きです！宇宙の旅行をして、感動的な冒険をしていく姿がとっても胸を打ったんですよね。あとは『ジョーズ』『ハリウッド・ザ・ノイズ14世紀 〜ロスト・イン ザ グレートネバダ ディサード〜』"
          },
          "accessory": {
            "type": "image",
            "image_url": "https://2.bp.blogspot.com/-Rd9BRFyvraI/VRUSusRBx8I/AAAAAAAAsu4/WKCIPJyxHuI/s800/movie_woman.png",
            "alt_text": "alt text for image"
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "参加お待ちしてます :raised_hands:（雑談テーマの確認・変更は<https://google.com|ここから>）"
          }
        }
      ]
    }
  };

  const postRequestUrl = "https://slack.com/api/chat.postMessage" // see: https://api.slack.com/methods/chat.postMessage
  const blocks = generateNotifyBlockMessage();
  const token = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");
  const message = {
    token: token,
    blocks: blocks['blocks'],
    channel: PropertiesService.getScriptProperties().getProperty("SLACK_CHANNEL_ID"),
  };

  const messagePayload = JSON.stringify(message)
  const messageOptions =
  {
    method: "post",
    contentType: "application/json",
    payload: messagePayload,
    headers: { "Authorization": `Bearer ${token}` }
  }

  UrlFetchApp.fetch(postRequestUrl, messageOptions)
}