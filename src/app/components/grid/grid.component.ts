import {
	animate,
	AnimationKeyframesSequenceMetadata,
	AnimationStyleMetadata,
	keyframes,
	transition,
	trigger,
} from "@angular/animations";
import { Component } from "@angular/core";
import { toPositionString } from "app/services/position";
import { FieldState } from "app/services/set-digit-result";
import {
	pulse,
	pulseThreeTimes,
	shake,
	shakeTwoTimes,
	zoomIn,
	zoomInAndPulse,
	zoomInAndPulseThreeTimes,
} from "app/utils/keyframes";

export interface FieldCssClass {
	readonly initialClue?: boolean;
	selectedPosition?: boolean;
	lastSolvedField?: boolean;
	readonly solvedByMyself?: boolean;
	readonly solvedByOpponent?: boolean;
	groupForLastSolvedField?: boolean;
	readonly selectedDigit?: boolean;
	readonly solePossibleDigit?: boolean;
}

export abstract class GridController {
	abstract readonly isUserDefined: boolean;
	abstract readonly grid: ReadonlyGrid<From1to9orUndefined>;
	abstract readonly fieldCssClasses: ReadonlyGrid<FieldCssClass>;
	abstract readonly fieldStates: ReadonlyGrid<FieldState>;
	abstract readonly from1to9: Iterable<From1to9>;

	abstract fieldClicked(positionString: PositionString): void;
}

export function keyframesReadonly(
	steps: readonly AnimationStyleMetadata[],
): AnimationKeyframesSequenceMetadata {
	// @ts-expect-error: The Angular function `keyframes` should have a readonly argument `steps`
	return keyframes(steps);
}

@Component({
	animations: [
		trigger("fieldAnimator", [
			transition("* => warning", animate(1000, keyframesReadonly(shake))),
			transition("* => solvedField", animate(500, keyframesReadonly(zoomIn))),
			transition("* => solvedFieldByOpponent", animate(500, keyframesReadonly(shakeTwoTimes))),
			transition("* => solvedFieldInSolvedGroup", animate(1000, keyframesReadonly(zoomInAndPulse))),
			transition("* => solvedGroup", animate("500ms 500ms", keyframesReadonly(pulse))),
			transition(
				"* => solvedFieldInSolvedSudoku",
				animate(2000, keyframesReadonly(zoomInAndPulseThreeTimes)),
			),
			transition("* => solvedSudoku", animate("1500ms 500ms", keyframesReadonly(pulseThreeTimes))),
		]),
	],
	selector: "sudoku-grid",
	styleUrls: ["./grid.component.scss"],
	templateUrl: "./grid.component.html",
})
export class GridComponent {
	constructor(public c: GridController) {}

	toPositionString(row: From1to9, col: From1to9): PositionString {
		return toPositionString(row, col);
	}
}
