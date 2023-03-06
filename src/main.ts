import { SlackClient } from "./SlackClient";
import { Spreadsheet } from "./Spreadsheet";
import { OpenAIClient } from "./OpenAIClient";
import { TopicDomain } from "./TopicDomain";

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