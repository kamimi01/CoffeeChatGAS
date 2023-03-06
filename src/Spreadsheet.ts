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