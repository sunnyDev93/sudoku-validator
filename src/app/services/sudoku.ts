import { from1to9 } from "app/services/digit";
import { Field } from "app/services/field";
import { Grid } from "app/services/grid";
import {
	allPositions,
	allPositionsInAllBoxes,
	allPositionsInAllColumns,
	allPositionsInAllRows,
	Position,
} from "app/services/position";
import { Reason, SolvedField } from "app/services/solved-field";

class Sudoku {
	private readonly grid = new Grid(() => new Field());

	constructor(initialDigits: Grid<From1to9orUndefined>) {
		for (const pos of allPositions()) {
			const digit = initialDigits.get(pos);
			if (digit !== undefined) this.setDigit(pos, digit);
		}
	}

	solveAll(): readonly PositionString[] {
		const solvedPositions: PositionString[] = [];
		for (let solvedField = this.solveNext(); solvedField; solvedField = this.solveNext())
			solvedPositions.push(solvedField.position.asString);
		return solvedPositions;
	}

	solveAlmost(): readonly PositionString[] {
		let unsolvedPositions = 0;
		for (const field of this.grid) if (field.digit === undefined) unsolvedPositions++;

		const solvedPositions: PositionString[] = [];
		while (unsolvedPositions > 1) {
			const solvedField = this.solveNext();
			if (!solvedField) return solvedPositions;
			solvedPositions.push(solvedField.position.asString);
			unsolvedPositions--;
		}
		return solvedPositions;
	}

	solveNext(): SolvedField | undefined {
		try {
			this.solveSolePossibleDigit();
			this.solveSolePossiblePosition();
		} catch (error: unknown) {
			if (error instanceof SolvedField) return error;
			throw error;
		}
		return undefined;
	}

	private solveSolePossibleDigit(): void {
		for (const pos of allPositions()) this.solveSolePossibleDigitForPosition(pos);
	}

	private solveSolePossibleDigitForPosition(pos: Position): void {
		const field = this.getField(pos);
		const onlyPossibleDigit = field.getSolePossibleDigit();
		if (onlyPossibleDigit !== undefined)
			this.setDigit(pos, onlyPossibleDigit, "SolePossibleDigitForCell");
	}

	private solveSolePossiblePosition(): void {
		for (const digit of from1to9) {
			this.solveSolePossiblePositionForGroups(
				allPositionsInAllRows(),
				digit,
				"SolePossiblePositionForRow",
			);
			this.solveSolePossiblePositionForGroups(
				allPositionsInAllColumns(),
				digit,
				"SolePossiblePositionForColumn",
			);
			this.solveSolePossiblePositionForGroups(
				allPositionsInAllBoxes(),
				digit,
				"SolePossiblePositionForBox",
			);
		}
	}

	private solveSolePossiblePositionForGroups(
		allPositionsInAllGroups: Generator<Generator<Position>>,
		digit: From1to9,
		reason: Reason,
	): void {
		for (const allPositionsInGroup of allPositionsInAllGroups)
			this.solveSolePossiblePositionForGroup(allPositionsInGroup, digit, reason);
	}

	private solveSolePossiblePositionForGroup(
		allPositionsInGroup: Generator<Position>,
		digit: From1to9,
		reason: Reason,
	): void {
		const pos = this.getSolePossiblePosition(allPositionsInGroup, digit);
		if (pos) this.setDigit(pos, digit, reason);
	}

	private getSolePossiblePosition(
		allPositionsInGroup: Generator<Position>,
		digit: From1to9,
	): Position | undefined {
		let result;
		for (const pos of allPositionsInGroup)
			if (this.getField(pos).isDigitPossible(digit))
				if (result) return undefined;
				else result = pos;
		return result;
	}

	private setDigit(pos: Position, digit: From1to9, reason?: Reason): void {
		this.getField(pos).digit = digit;

		for (const p of pos.allPositionsInColumn()) this.crossOutDigit(p, digit);

		for (const p of pos.allPositionsInRow()) this.crossOutDigit(p, digit);

		for (const p of pos.allPositionsInBox()) this.crossOutDigit(p, digit);

		if (reason !== undefined) throw new SolvedField(pos, digit, reason);
	}

	private crossOutDigit(pos: Position, digit: From1to9): void {
		this.getField(pos).crossOutDigit(digit);
	}

	getField(pos: Position): Field {
		return this.grid.get(pos);
	}
}

export function solveAlmost(grid: Grid<From1to9orUndefined>): readonly PositionString[] {
	const s = new Sudoku(grid);
	const solvedPositions = s.solveAlmost();
	for (const pos of allPositions()) grid.set(pos, s.getField(pos).digit);
	return solvedPositions;
}

export function solveAll(grid: Grid<From1to9orUndefined>): readonly PositionString[] {
	const s = new Sudoku(grid);
	const solvedPositions = s.solveAll();
	for (const pos of allPositions()) grid.set(pos, s.getField(pos).digit);
	return solvedPositions;
}

export function solveNext(grid: Grid<From1to9orUndefined>): SolvedField | undefined {
	const s = new Sudoku(grid);
	const solvedField = s.solveNext();
	if (solvedField) grid.set(solvedField.position, solvedField.digit);
	return solvedField;
}

export function isDigitPossible(
	grid: Grid<From1to9orUndefined>,
	position: Position,
	digit: From1to9,
): boolean {
	const s = new Sudoku(grid);
	return s.getField(position).isDigitPossible(digit);
}

export function getGridForSolePossibleDigit(grid: Grid<From1to9orUndefined>): Grid<boolean> {
	const s = new Sudoku(grid);
	return new Grid<boolean>((pos) => s.getField(pos).getSolePossibleDigit() !== undefined);
}
