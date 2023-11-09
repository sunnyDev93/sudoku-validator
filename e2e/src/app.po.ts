import { browser, by, element } from "protractor";

export class SudokuSprintPage {
	async navigateTo(): Promise<unknown> {
		return browser.get("/");
	}

	async getScore(): Promise<string> {
		return element.all(by.css("sudoku-toolbar div button span")).get(0).getText();
	}
}
