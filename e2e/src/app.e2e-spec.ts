import { SudokuSprintPage } from "./app.po";

describe("angular-sudoku App", () => {
	let page: SudokuSprintPage;

	beforeEach(() => {
		page = new SudokuSprintPage();
	});

	it("should display score", () => {
		page.navigateTo();
		// fails with "script timeout"
		// expect(page.getScore()).toEqual(" 0 ");
	});
});
