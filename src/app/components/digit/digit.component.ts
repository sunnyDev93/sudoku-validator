import { Component } from "@angular/core";

export interface DigitCssClass {
	readonly selectedDigit?: boolean;
	readonly exhaustedDigit?: boolean;
}

export abstract class DigitController {
	abstract readonly digitCssClasses: DigitTuple<DigitCssClass>;
	abstract readonly isUserDefined: boolean;
	abstract readonly isDuel: boolean;
	abstract readonly solved: boolean;
	abstract readonly from1to9: Iterable<From1to9>;

	abstract digitClicked(value: From0to9): void;
	abstract playAgain(): void;
}

@Component({
	selector: "sudoku-digit",
	styleUrls: ["./digit.component.scss"],
	templateUrl: "./digit.component.html",
})
export class DigitComponent {
	constructor(public c: DigitController) {}
}
