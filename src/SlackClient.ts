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