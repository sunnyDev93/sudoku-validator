import { Grid } from "app/services/grid";

export type SetDigitResultKind = "solved" | "warning" | undefined;

export type SetDigitMessage =
	| "digitNotCorrect"
	| "digitNotPossible"
	| "digitNotPossiblePointsLost"
	| "solved"
	| "solvedDigit"
	| undefined;

export type FieldState =
	| "solvedField"
	| "solvedFieldByOpponent"
	| "solvedFieldInSolvedGroup"
	| "solvedFieldInSolvedSudoku"
	| "solvedGroup"
	| "solvedSudoku"
	| "warning"
	| undefined;

export class SetDigitResult {
	constructor(
		readonly kind: SetDigitResultKind,
		readonly message: SetDigitMessage,
		readonly fieldStates: Grid<FieldState>,
		readonly speedPoints: number,
	) {}
}
