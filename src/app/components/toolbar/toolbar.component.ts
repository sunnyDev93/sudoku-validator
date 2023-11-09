import { ChangeDetectorRef, Component, NgZone, OnDestroy } from "@angular/core";
import { MatSidenav } from "@angular/material/sidenav";
import { Theme } from "app/components/sidenav/sidenav.component";
import { Level } from "app/server/data";
import fb from "firebase/compat/app";

export abstract class ToolbarController {
	abstract readonly sidenav: MatSidenav;
	abstract readonly isUserDefined: boolean;
	abstract readonly isDuel: boolean;
	abstract readonly myScore: number;
	abstract readonly opponentScore: number;
	abstract readonly pointsToWin: number;
	abstract readonly level: Level | undefined;
	abstract readonly user: fb.User | undefined;
	abstract readonly solved: boolean;
	abstract readonly currentTheme: string;
	abstract readonly themes: readonly Theme[];

	abstract setTheme(theme: string): void;
	abstract login(): void;
	abstract register(): void;
	abstract editProfile(): void;
	abstract deleteProfile(): void;
	abstract logout(): void;
}

@Component({
	selector: "sudoku-toolbar",
	styleUrls: ["./toolbar.component.scss"],
	templateUrl: "./toolbar.component.html",
})
export class ToolbarComponent implements OnDestroy {
	pointsToWin = 0;

	private readonly intervalID: NodeJS.Timeout;

	constructor(public c: ToolbarController, zone: NgZone, ref: ChangeDetectorRef) {
		/* Run change detection only if "pointsToWin" changes.
		   After a page reload (when no user is logged in) "isUserDefined()"
		   is "only" called 1834 times before all calls stop.
		   Without this performance optimization, it is called more frequently and the calls never stop. */
		this.intervalID = zone.runOutsideAngular(() =>
			setInterval(() => {
				const newPointsToWin = c.pointsToWin;
				if (this.pointsToWin !== newPointsToWin) {
					this.pointsToWin = newPointsToWin;
					ref.detectChanges();
				}
			}, 100),
		);
	}

	ngOnDestroy(): void {
		clearInterval(this.intervalID);
	}
}
