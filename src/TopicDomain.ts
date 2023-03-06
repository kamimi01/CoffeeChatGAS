import { Spreadsheet } from "./Spreadsheet";
import { Cell } from "./Cell";

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