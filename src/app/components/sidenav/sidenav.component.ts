import { Component } from "@angular/core";
import { Level } from "app/server/data";

export interface Theme {
	readonly name: string;
	readonly primaryColor: string;
	readonly accentColor: string;
	readonly backgroundColor: string;
}

export abstract class SidenavController {
	abstract readonly debugEnabled: boolean;
	abstract readonly solved: boolean;

	abstract newGame(level: Level): void;
	abstract challengeToDuel(): void;
	abstract ownGame(): void;

	abstract solveNext(): void;
	abstract solveAll(): void;

	abstract share(): void;
	abstract about(): void;
	abstract privacyPolicy(): void;

	abstract testDuel(): void;
	abstract solveAlmost(): void;
}

@Component({
	selector: "sudoku-sidenav",
	templateUrl: "./sidenav.component.html",
})
export class SidenavComponent {
	constructor(public c: SidenavController) {}
}
