# CoffeeChatGAS

Google Apps Script to post Coffee chat theme to Slack!

![](Screenshots/slack.png)

When there is a theme in the following spreadsheet, post it to Slack.
When there is not, generate a theme with OpenAI and post it. The Generated theme is written in the spreadsheet.

![](Screenshots/spreadsheet.png)

## Development

1. Create Slack app and Get bot token

1. Generate OpenAI API Key
    - If you always list the theme in the spreadsheet, you do not need to generate the key because OpenAI API is used only when there isn't a theme in the spreadsheet.

2. Create Spreadsheet and Google Apps Script(GAS)

3. Set Script Properties.
    - `SHEET_NAME`(required): Spreadsheet name
    - `SLACK_BOT_TOKEN`(required): Slack bot token you generated 
    - `SLACK_CHANNEL_ID`(required): Slack channel ID you want to post 
    - `OPENAI_API_KEY`(optional): OpenAI API Key

4. Run
    - Recommend to set some triggers