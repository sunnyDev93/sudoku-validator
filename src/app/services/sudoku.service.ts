import { Injectable } from "@angular/core";
import { DuelistData, GameData, Level } from "app/server/data";
import { getLevel, init, isInitialClue, nextGameIndex } from "app/services/games";
import { Grid } from "app/services/grid";
import { allPositions, Position, Region } from "app/services/position";
import {
	FieldState,
	SetDigitMessage,
	SetDigitResult,
	SetDigitResultKind,
} from "app/services/set-digit-result";
import { SolvedField } from "app/services/solved-field";
import {
	getGridForSolePossibleDigit,
	isDigitPossible,
	solveAll,
	solveAlmost,
	solveNext,
} from "app/services/sudoku";
import { newDigitTuple } from "app/services/tuple";
import { Assert } from "app/utils/assert";
import { nullToUndefined, undefinedToNull } from "app/utils/util";

const MAX_POINTS_TO_WIN_FOR_EASY_LEVEL = 9;

export type DuelResult = "draw" | "lost" | "won";

@Injectable({
	providedIn: "root",
})
export class SudokuService {
	readonly #grid = new Grid<From1to9orUndefined>(() => undefined);
	readonly #solvedGrid = new Grid<From1to9orUndefined>(() => undefined);

	#myScore = 0;
	#opponentScore = 0;
	readonly #ySolvedPositions: PositionString[] = [];
	readonly #opponentSolvedPositions: PositionString[] = [];

	#gameIndex = -1;
	#isDuel = false;
	#startTime = 0;

	get grid(): ReadonlyGrid<From1to9orUndefined> {
		return this.#grid;
	}

	get myScore(): number {
		return this.#myScore;
	}

	get opponentScore(): number {
		return this.#opponentScore;
	}

	get duelResult(): DuelResult {
		if (this.#myScore > this.#opponentScore) return "won";
		if (this.#myScore === this.#opponentScore) return "draw";
		return "lost";
	}

	get mySolvedPositions(): readonly PositionString[] {
		return this.#ySolvedPositions;
	}

	get opponentSolvedPositions(): readonly PositionString[] {
		return this.#opponentSolvedPositions;
	}

	get gameIndex(): number {
		return this.#gameIndex;
	}

	get pointsToWin(): number {
		const elapsedSeconds = Math.floor((Date.now() - this.#startTime) / 1000);
		if (this.#isDuel) return Math.min(this.maxPointsToWin, 3 + elapsedSeconds);
		return Math.max(1, this.maxPointsToWin - elapsedSeconds);
	}

	private get maxPointsToWin(): number {
		return MAX_POINTS_TO_WIN_FOR_EASY_LEVEL * this.levelFactor;
	}

	private get levelFactor(): number {
		const { level } = this;
		switch (level) {
			case "easy":
				return 1;
			case "medium":
				return 2;
			case "difficult":
				return 3;
			case undefined:
				return 0;
			default:
				return Assert.never(level);
		}
	}

	get isStarted(): boolean {
		if (this.#isDuel) return true;
		for (const pos of allPositions())
			if (this.getDigit(pos) !== undefined && !this.isInitialClue(pos)) return true;
		return false;
	}

	get level(): Level | undefined {
		if (this.isUserDefined) return undefined;
		return getLevel(this.#gameIndex);
	}

	get isUserDefined(): boolean {
		return this.#gameIndex === -1;
	}

	get isDuel(): boolean {
		return this.#isDuel;
	}

	isSolved(): boolean {
		for (const digit of this.#grid) if (digit === undefined) return false;
		return true;
	}

	newTestGame(gameIndex: number): Position {
		this.initGame(gameIndex, false);
		return this.findInitialPosition();
	}

	newGame(level: Level): Position {
		this.initGame(nextGameIndex(this.#gameIndex, level), false);
		return this.findInitialPosition();
	}

	newDuel(level: Level): Position {
		this.initGame(nextGameIndex(this.#gameIndex, level), true);
		return this.findInitialPosition();
	}

	duelStarted(gameIndex: number, myDuelistData: DuelistData): Position {
		this.initGame(gameIndex, true);
		this.#myScore = myDuelistData.score;
		for (const positionAsNumber of myDuelistData.solvedPositions) {
			this.#grid[positionAsNumber] = this.#solvedGrid[positionAsNumber];
			this.#ySolvedPositions.push(positionAsNumber);
		}
		return this.findInitialPosition();
	}

	clearGame(): void {
		this.initGame(-1, false);
	}

	private initGame(gameIndex: number, duel: boolean): void {
		this.#isDuel = duel;
		this.#myScore = 0;
		this.#ySolvedPositions.length = 0;
		this.#opponentScore = 0;
		this.#opponentSolvedPositions.length = 0;
		this.setGameIndex(gameIndex);
		this.startTimer();
	}

	private findInitialPosition(): Position {
		for (const pos of allPositions())
			if (!this.isInitialClue(pos)) return Position.new(pos.row, pos.col);
		throw new Error("no free position, all fields are initial clues!");
	}

	solveNext(): SolvedField | undefined {
		if (!this.isDuel) this.#myScore -= 2 * this.pointsToWin;
		this.startTimer();
		const solvedField = solveNext(this.#grid);
		if (solvedField) this.#ySolvedPositions.push(solvedField.position.asString);
		return solvedField;
	}

	solveAll(): void {
		this.#ySolvedPositions.push(...solveAll(this.#grid));
	}

	solveAlmost(): void {
		this.#ySolvedPositions.push(...solveAlmost(this.#grid));
	}

	private startTimer(): void {
		this.#startTime = Date.now();
	}

	getDigit(position: Position): From1to9orUndefined {
		return this.#grid.get(position);
	}

	setDigitChecked(position: Position, digit?: From1to9): SetDigitResult | undefined {
		if (digit === undefined) {
			this.setDigit(position);
			return undefined;
		}

		const result = this.setDefinedDigitChecked(position, digit);
		this.#myScore += result.speedPoints;
		this.startTimer();
		return result;
	}

	private setDefinedDigitChecked(position: Position, digit: From1to9): SetDigitResult {
		const oldDigit = this.getDigit(position);
		this.setDigit(position);

		const fieldStates = new Grid<FieldState>(() => undefined);

		if (!this.isDigitPossible(position, digit)) {
			this.setDigit(position, oldDigit);
			fieldStates.set(position, "warning");
			return new SetDigitResult(
				"warning",
				this.isUserDefined ? "digitNotPossible" : "digitNotPossiblePointsLost",
				fieldStates,
				-2 * this.pointsToWin,
			);
		}

		if (!this.isDigitCorrect(position, digit)) {
			this.setDigit(position, oldDigit);
			fieldStates.set(position, "warning");
			return new SetDigitResult("warning", "digitNotCorrect", fieldStates, -2 * this.pointsToWin);
		}

		this.#ySolvedPositions.push(position.asString);
		this.setDigit(position, digit);
		if (this.isSolved()) {
			for (const pos of allPositions()) fieldStates.set(pos, "solvedSudoku");
			fieldStates.set(position, "solvedFieldInSolvedSudoku");
			return new SetDigitResult("solved", "solved", fieldStates, this.pointsToWin);
		}

		let kind: SetDigitResultKind;
		let message: SetDigitMessage;
		if (this.getExhaustedDigits()[digit]) {
			for (const pos of allPositions())
				if (this.getDigit(pos) === digit) fieldStates.set(pos, "solvedGroup");
			fieldStates.set(position, "solvedFieldInSolvedGroup");
			kind = "solved";
			message = "solvedDigit";
		}

		this.setFieldStatesForSolvedRegion(position, "Column", fieldStates);
		this.setFieldStatesForSolvedRegion(position, "Row", fieldStates);
		this.setFieldStatesForSolvedRegion(position, "Box", fieldStates);

		if (fieldStates.get(position) === undefined) fieldStates.set(position, "solvedField");

		return new SetDigitResult(kind, message, fieldStates, this.pointsToWin);
	}

	private setFieldStatesForSolvedRegion(
		position: Position,
		region: Region,
		fieldStates: Grid<FieldState>,
	): void {
		if (this.isRegionSolved(position.allPositionsInRegion(region))) {
			for (const pos of position.allPositionsInRegion(region)) fieldStates.set(pos, "solvedGroup");
			fieldStates.set(position, "solvedFieldInSolvedGroup");
		}
	}

	private isRegionSolved(posIter: Generator<Position>): boolean {
		for (const p of posIter) if (this.getDigit(p) === undefined) return false;
		return true;
	}

	private setDigit(position: Position, digit?: From1to9): void {
		this.#grid.set(position, digit);
	}

	getExhaustedDigits(): DigitTuple<boolean> {
		const occurrences = newDigitTuple(() => 0);
		for (const digit of this.#grid) if (digit !== undefined) occurrences[digit]++;
		return newDigitTuple((i) => occurrences[i] === 9);
	}

	getGridForSolePossibleDigit(): Grid<boolean> {
		return getGridForSolePossibleDigit(this.#grid);
	}

	isDigitPossible(pos: Position, digit: From1to9): boolean {
		return isDigitPossible(this.#grid, pos, digit);
	}

	isDigitCorrect(position: Position, digit: From1to9): boolean {
		return this.isUserDefined || this.#solvedGrid.get(position) === digit;
	}

	isInitialClue(position: Position): boolean {
		return !this.isUserDefined && isInitialClue(this.#gameIndex, position);
	}

	isSolvedByMyself(position: Position): boolean {
		return this.#isDuel && this.mySolvedPositions.includes(position.asString);
	}

	isSolvedByOpponent(position: Position): boolean {
		return this.#isDuel && this.#opponentSolvedPositions.includes(position.asString);
	}

	setGameData(gameData: GameData): void {
		if (gameData.gameIndex !== undefined && this.#gameIndex !== gameData.gameIndex)
			this.setGameIndex(gameData.gameIndex);

		if (gameData.digits !== undefined) this.setDigits(gameData.digits);

		if (gameData.score !== undefined) this.#myScore = gameData.score;
	}

	private setGameIndex(gameIndex: number): void {
		this.#gameIndex = gameIndex;
		if (this.isUserDefined) for (const pos of allPositions()) this.setDigit(pos);
		else {
			init(this.#gameIndex, this.#grid);
			init(this.#gameIndex, this.#solvedGrid);
			solveAll(this.#solvedGrid);
		}
	}

	setDigits(digits: readonly From1to9orNull[]): void {
		let i = 0;
		for (const pos of allPositions())
			if (!this.isInitialClue(pos)) {
				const digit = digits[i++];
				/* only set a digit if it is defined (i.e. never remove a valid digit in a multi-player race condition)
				   or if it is a user defined game */
				if (digit !== null || this.isUserDefined) this.setDigit(pos, nullToUndefined(digit));
			}
	}

	getGameData(): GameData {
		return {
			digits: this.getGridValuesAsArray(),
			gameIndex: this.#gameIndex,
			score: this.#myScore,
		};
	}

	setOpponentDuelistGameData(score: number, solvedPositions: PositionString[]): PositionString[] {
		if (
			this.#opponentScore === score &&
			this.#opponentSolvedPositions.length === solvedPositions.length
		)
			return [];
		this.#opponentScore = score;
		const newSolvedPositions = solvedPositions.slice(this.#opponentSolvedPositions.length);
		for (const positionString of newSolvedPositions) {
			this.#grid[positionString] = this.#solvedGrid[positionString];
			this.#opponentSolvedPositions.push(positionString);
		}
		this.startTimer();
		return newSolvedPositions;
	}

	getGridValuesAsArray(): readonly From1to9orNull[] {
		let i = 0;
		const result: From1to9orNull[] = [];
		for (const pos of allPositions())
			if (!this.isInitialClue(pos)) result[i++] = undefinedToNull(this.getDigit(pos));
		return result;
	}
}
