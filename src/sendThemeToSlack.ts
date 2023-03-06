/**
 * スプレッドシートからテーマを取得、ない場合は OpenAI でテーマを生成して、Slack に投稿する（日本語対応のみ）
 * @param sheetName スプレッドシート名
 * @param sheetId スプレッドシート ID
 * @param slackBotToken Slack の Bot Token
 * @param slackChannelId Slack の Channel ID
 * @param openAIAPIKey OpenAI の API Key
 * @param content Slack に投稿するメッセージ。文字列または Block Kit（テーマを表示したい箇所は`@topic`とする）
 */
function postTopicToSlack(
    sheetName: string,
    sheetId: string,
    slackBotToken: string,
    slackChannelId: string,
    openAIAPIKey: string,
    content: {} | string,
) {
    // スプレッドシートの列を取得
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
    const dateList = getDateList_(sheet);

    // 翌日の取得
    const nextdayString = getNextDate_();
    console.log(nextdayString)

    // テーマを取得（スプレッドシートにあればそれを、なければOpenAIで生成する）
    let theme = getTheme_(dateList, sheet, nextdayString, openAIAPIKey);
    console.log(theme);

    // Slackに投稿
    postTextToSlack_(slackBotToken, slackChannelId, content, theme);
}

/**
 * スプレッドシートのシート情報を取得する
 */
function getSheet_(sheetName: string): GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    return sheet;
}

/**
 * スプレッドシートから日付のリストを取得する
 */
function getDateList_(sheet: GoogleAppsScript.Spreadsheet.Sheet): string[][] {
    const lastRow = sheet.getLastRow();
    const dateRange = sheet.getRange(2, 1, lastRow - 1);
    return dateRange.getDisplayValues();
}

/**
 * 翌日の日付を yyyy/M/dd で取得する
 */
function getNextDate_(): string {
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
 * 日付のリストを元にスプレッドシートからテーマを取得する。
 * スプレッドシートにテーマがないときは、OpenAI でテーマを生成する
 */
function getTheme_(
    dateList: string[][],
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    nextdayString: string,
    openAIAPIKey: string
): string {
    let theme = "";
    for (let i = 0; i < dateList.length; i++) {
        if (dateList[i][0] == nextdayString) {
            // 隣のセルの番号にあるテーマを取得する
            const cell = `B${i + 2}`;
            const specificDateRange = sheet.getRange(cell);
            theme = specificDateRange.getDisplayValue();

            // スプレッドシートにテーマがないときは、OpenAI でテーマを生成する
            if (theme == "") {
                theme = requestOpenAI_(openAIAPIKey);
                writeThemeToSpreadsheet_(theme, sheet, cell)
            }
        }
    }
    return theme;
}

/**
 * OpenAI Text Completion API にリクエストして雑談テーマを生成する
 */
function requestOpenAI_(apiKey: string): string {
    const url = "https://api.openai.com/v1/completions";
    const prompt = "あなたはChatbotで、陽気で話しかけやすい人です。\n以下の制約条件を厳密に守って、雑談テーマを1つ提案してください。\n制約条件\n* Chatbotは雑談テーマをできるだけ詳しく提案します。\n* 「おしゃべりマン」というbotです。\n* 「好きな〇〇」や「気になる〇〇」という形式で答えます。\n* 「おしゃべりマン」のあなただったらどう答えるかも教えてください。\n* 一人称は「私」です。\n* ジェンダー、家族、体、政治、宗教の話題は避けてください。";

    const headers = {
        "Authorization": `Bearer ${apiKey}`
    }
    const params: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "post",
        muteHttpExceptions: true,
        contentType: "application/json",
        headers: headers,
        payload: JSON.stringify({
            'model': 'text-davinci-003',
            'max_tokens': 200,
            'temperature': 0.8,
            'top_p': 1.0,
            'frequency_penalty': 1.0,
            'presence_penalty': 1.0,
            'prompt': prompt
        })
    }

    const response = JSON.parse(UrlFetchApp.fetch(url, params).getContentText());
    console.log(response);
    let theme = response.choices[0].text.replace("\n", "");
    return theme;
}

/**
 * 生成したテーマをスプレッドシートに書き込む
 */
function writeThemeToSpreadsheet_(theme: string, sheet: GoogleAppsScript.Spreadsheet.Sheet, cell: string) {
    let range = sheet.getRange(cell);
    range.setValue(theme);
};

/**
 * Slackにテーマを投稿する
 */
function postTextToSlack_(token: string, channel: string, content: {} | string, theme: string) {
    if (theme == "") {
        return
    };

    let message = {};
    if (typeof content == "string") {
        const text = generateNotifyText_(content, theme);
        message = {
            token: token,
            text: text,
            channel: channel,
        }
    } else {
        const blocks = generateNotifyBlockMessage_(content, theme);
        message = {
            token: token,
            blocks: blocks['blocks'],
            channel: channel,    
        }
    }
    console.log(message);

    const postRequestUrl = "https://slack.com/api/chat.postMessage";

    const messagePayload = JSON.stringify(message);
    const messageOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "post",
        contentType: "application/json",
        payload: messagePayload,
        headers: { "Authorization": `Bearer ${token}` }
    };

    UrlFetchApp.fetch(postRequestUrl, messageOptions);
}

/**
 * Slack通知用のメッセージ作成
 */
function generateNotifyText_(context: string, theme: string): string {
    let keyString = "@topic";
    if (context.includes(keyString)) {
        return context.replace(keyString, theme);
    }
    return context;
} 

/**
 * Slack通知用のBlockメッセージ作成
 */
function generateNotifyBlockMessage_(content: {}, theme: string) {
    let jsonString = JSON.stringify(content);
    let keyString = "@topic";
    if (jsonString.includes(keyString)) {
        let replacedString = jsonString.replace(keyString, theme);
        return JSON.parse(replacedString);
    }
    return content;
};