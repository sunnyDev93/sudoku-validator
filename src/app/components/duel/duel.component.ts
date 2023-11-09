import { Component } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { TranslateService } from "@ngx-translate/core";
import { DuelData, DuelistData, Level } from "app/server/data";
import { State } from "app/server/state";
import { As } from "app/utils/assert";
import { unsubscribeOnDestroyMixin } from "app/utils/unsubscribe-on-destroy.mixin";
import { share, translate } from "app/utils/util";

@Component({
	selector: "sudoku-duel",
	styleUrls: ["./duel.component.scss"],
	templateUrl: "./duel.component.html",
})
export class DuelComponent extends unsubscribeOnDestroyMixin() {
	constructor(
		private readonly state: State,
		private readonly ts: TranslateService,
		private readonly snackBar: MatSnackBar,
	) {
		super();
	}

	get duelData(): DuelData | undefined {
		return this.state.duelData;
	}

	get opponent(): DuelistData | undefined {
		return this.state.opponentDuelistData;
	}

	get myselfReady(): boolean {
		return this.state.myDuelistData?.ready ?? false;
	}

	levelChange(level: Level): void {
		void this.state.saveDuelLevel(level);
	}

	invite(): void {
		const displayName = this.state.user?.displayName ?? translate(this.ts, "anonymousPlayer");
		const title = translate(this.ts, "duel.label", { displayName });
		const text = translate(this.ts, "duel.invitation", { displayName });
		void share(
			title,
			text,
			`${window.location.href}?duel=${As.defined(this.duelData).duelCode}`,
			this.ts,
			this.snackBar,
		);
	}

	get waiting(): boolean {
		/*
			I have to wait, if the opponent has not joined OR if I declared myself ready (and the opponent is not ready, yet).
			If the opponent is ready, will be checked outside and the dialog will be closed.
		*/
		return !this.opponent || this.myselfReady;
	}

	get primaryButtonLabel(): string {
		return translate(this.ts, this.waiting ? "duel.waitingForOpponent" : "duel.ready");
	}

	ready(): void {
		void this.state.saveDuelReady(true);
	}

	cancel(): void {
		void this.state.deleteOrAbandonDuel();
	}
}
