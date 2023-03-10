# PostCoffeeChatTopicToSlack

Google Apps Script to post Coffee chat topic to Slack!

![](Screenshots/slack.png)

When there is a theme in the following spreadsheet, post it to Slack.
When there is not, generate a theme with OpenAI and post it. The Generated theme is written in the spreadsheet.

![](Screenshots/spreadsheet.png)

## Development

### Prerequisites

1. Create Slack app and Get bot token

1. Generate OpenAI API Key
    - If you always list the theme in the spreadsheet, you do not need to generate the key because OpenAI API is used only when there isn't a theme in the spreadsheet.

1. Create a spreadsheet and gas

1. Set Script Properties in gas
    - `SHEET_NAME`(required): Spreadsheet name
    - `SPREADSHEET_URL`(required): Spreadsheet URL
    - `SPREADSHEET_ID`(required): Spreadsheet ID
    - `SLACK_BOT_TOKEN`(required): Slack bot token you generated 
    - `SLACK_CHANNEL_ID`(required): Slack channel ID you want to post 
    - `OPENAI_API_KEY`(optional): OpenAI API Key

## Procedures

1. clone this repo
    - run `git clone <this repo url>`

2. Add packages
    - run `yarn install` or `npm install`

3. Create a spreadsheet and gas, and copy script ID

4. Enable Script API
    - open `https://script.google.com/home/usersettings` and turn on

5. Login your google account with clasp
    - run `npx clasp login`

6. Clone the gas
    - run `npx clasp clone <copied script ID>`

7. Build and deploy
    - run `yarn run deploy` or `npm run deploy`

8. Run
    - Recommend to set some triggers