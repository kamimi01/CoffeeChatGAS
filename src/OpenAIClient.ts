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