import { gamesLength, solvedGrids } from "app/services/games";
import { Position } from "app/services/position";
import { SolvedField } from "app/services/solved-field";
import { SudokuService } from "app/services/sudoku.service";

describe("SudokuService", () => {
	let service: SudokuService;
	beforeEach(() => (service = new SudokuService()));

	it("should be created", () => {
		expect(service).toBeTruthy();
	});

	it("should solve next field and update demo game 1", () => {
		service.newTestGame(0);
		const p = Position.new(7, 6);
		expect(service.grid[p.asString]).toBeUndefined();
		expect(service.solveNext()).toEqual(new SolvedField(p, 4, "SolePossibleDigitForCell"));
		expect(service.grid[p.asString]).toEqual(4);
	});

	it("should solve and update the first demo games where the solution is specified in solvedDemoGames", () => {
		let i = 0;
		for (const solvedGrid of solvedGrids) {
			service.newTestGame(i++);
			service.solveAll();
			expect(service.grid).toEqual(solvedGrid);
		}
	});

	it("should solve all and update all demo games (even without specified solution)", () => {
		for (let i = 0; i < gamesLength; i++) {
			service.newTestGame(i);
			service.solveAll();
			expect(service.isSolved()).toBeTrue();
		}
	});

	it("should return correct answer, if digit is possible", () => {
		service.newTestGame(0);
		expect(service.isDigitPossible(Position.new(1, 1), 1)).toBeTruthy();
		expect(service.isDigitPossible(Position.new(9, 9), 1)).toBeFalsy();
	});

	it("should return correct answer, if digit is correct", () => {
		service.newTestGame(0);
		expect(service.isDigitCorrect(Position.new(1, 1), 5)).toBeTruthy();
		expect(service.isDigitCorrect(Position.new(1, 1), 1)).toBeFalsy();
		service.clearGame();
		expect(service.isDigitCorrect(Position.new(1, 1), 1)).toBeTruthy();
	});
});
