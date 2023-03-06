export class Spreadsheet {
    sheet: GoogleAppsScript.Spreadsheet.Sheet

    constructor(sheetID: string, sheetName: string) {
        this.sheet = SpreadsheetApp.openById(sheetID).getSheetByName(sheetName)
    }

    write(cell: string, content: string) {
        let range = this.sheet.getRange(cell);
        range.setValue(content);
    }
}

export class SlackClient {
    private token: string

    /**
     * 
     * @param token Slack の Bot Token
     */
    constructor(token: string) {
        this.token = token
    }

    /**
     * Slack の メッセージ投稿APIをリクエストする
     * @param block Block Kit 
     * @returns 
     */
    postMessage(channel: string, blocks: Object) {
        const message = {
            token: this.token,
            blocks: blocks['blocks'],
            channel: channel,
        }

        const postRequestUrl = "https://slack.com/api/chat.postMessage";

        const messagePayload = JSON.stringify(message);
        const messageOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
            method: "post",
            contentType: "application/json",
            payload: messagePayload,
            headers: { "Authorization": `Bearer ${this.token}` }
        };

        UrlFetchApp.fetch(postRequestUrl, messageOptions);
    }
}

export class OpenAIClient {
    private apiKey: string

    /**
     * 
     * @param apiKey OpenAI の API Key
     */
    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    /**
     * Text Completion API をリクエストする
     * @param prompt プロンプト
     * @returns 
     */
    requestTextCompletion(prompt: string): any {
        const url = "https://api.openai.com/v1/completions";

        const headers = {
            "Authorization": `Bearer ${this.apiKey}`
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

        return JSON.parse(UrlFetchApp.fetch(url, params).getContentText());
    }
}

export class Cell {
    cell: string;
    value: string;

    constructor(cell: string, value: string) {
        this.cell = cell
        this.value = value
    }
}

// スプレッドシートの翌日の列のテーマを取得する
export class TopicDomain {
    constructor() {}

    getTopicFromSpreadsheet(sheetID: string, sheetName: string): Cell | null {
        // シートの取得
        const sheet = new Spreadsheet(sheetID, sheetName).sheet
        // 翌日の日付
        const nextdayString = this.getNextDate();
        // 日付のリスト
        const dateList = this.getDateList(sheet);

        let theme = "";
        for (let i = 0; i < dateList.length; i++) {
            if (dateList[i][0] == nextdayString) {
                // 隣のセルの番号にあるテーマを取得する
                const cell = `B${i + 2}`;
                const specificDateRange = sheet.getRange(cell);
                theme = specificDateRange.getDisplayValue();
                return new Cell(cell, theme)
            }
        }
        return null
    }

    /**
     * スプレッドシートから日付のリストを取得する
     */
    private getDateList(sheet: GoogleAppsScript.Spreadsheet.Sheet): string[][] {
        const lastRow = sheet.getLastRow();
        const dateRange = sheet.getRange(2, 1, lastRow - 1);
        return dateRange.getDisplayValues();
    }

    /**
    * 翌日の日付を yyyy/M/dd で取得する
    */
    private getNextDate(): string {
        let nextday = new Date();
        nextday.setDate(nextday.getDate() + 1);
        nextday.setHours(0);
        nextday.setMinutes(0);
        nextday.setSeconds(0);
        nextday.setMilliseconds(0);
        const nextdayString = nextday.toLocaleDateString('ja-JA');
        console.log(nextdayString)
        return nextdayString
    }
}

function main() {
    // 翌日のテーマを取得する
    const sheetID = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
    const sheetName = PropertiesService.getScriptProperties().getProperty("SHEET_NAME");
    const topicDomain = new TopicDomain();
    const tomorrowTopicCellOnSpreadsheet = topicDomain.getTopicFromSpreadsheet(sheetID, sheetName);
    const tomorrowTopic = tomorrowTopicCellOnSpreadsheet.value;
    let topic = tomorrowTopicCellOnSpreadsheet.value;

    // 翌日のテーマがなければ、OpenAI API で生成する
    if (tomorrowTopic == "") {
        const key = PropertiesService.getScriptProperties().getProperty("OPEN_AI_API");
        const openAIClient = new OpenAIClient(key);
        const prompt = "あなたはChatbotで、陽気で話しかけやすい人です。\n以下の制約条件を厳密に守って、雑談テーマを1つ提案してください。\n制約条件\n* Chatbotは雑談テーマをできるだけ詳しく提案します。\n* 「おしゃべりマン」というbotです。\n* 「好きな〇〇」や「気になる〇〇」という形式で答えます。\n* 「おしゃべりマン」のあなただったらどう答えるかも教えてください。\n* 一人称は「私」です。\n* ジェンダー、家族、体、政治、宗教の話題は避けてください。";
        const response = openAIClient.requestTextCompletion(prompt);
        const generatedTopic = response.choices[0].text.replace("\n", "")
        topic = generatedTopic
        
        // 書き込む
        const sheet = new Spreadsheet(sheetID, sheetName);
        sheet.write(tomorrowTopicCellOnSpreadsheet.cell, generatedTopic);
    }
    console.log(topic)

    // テーマを投稿する
    const token = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");
    const slackAPIClient = new SlackClient(token);
    const channelID = PropertiesService.getScriptProperties().getProperty("SLACK_CHANNEL_ID");
    slackAPIClient.postMessage(channelID, generateNotifyBlockMessage_(topic));
}

function generateNotifyBlockMessage_(topic: string) {
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
                    "text": `*お題*\n${topic}`
                },
                "accessory": {
                    "type": "image",
                    "image_url": "https://user-images.githubusercontent.com/47489629/222876369-00291ef8-ee8d-4550-9c5f-d640c6dec87f.png",
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
                    "text": `参加お待ちしてます :raised_hands:（雑談テーマの確認・変更は<https://github.com/google/clasp|ここから>）`
                }
            }
        ]
    }
}