import { animate, transition, trigger } from "@angular/animations";
import { Component } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { keyframesReadonly } from "app/components/grid/grid.component";
import { zoomIn, zoomInAndPulseThreeTimes } from "app/utils/keyframes";
import { unsubscribeOnDestroyMixin } from "app/utils/unsubscribe-on-destroy.mixin";
import { isDebugEnabled } from "app/utils/util";
import { firstValueFrom, interval } from "rxjs";

const progressIncrementStep = 2;
@Component({
	animations: [
		trigger("secondsAnimator", [
			transition("* => 5", animate(600, keyframesReadonly(zoomIn))),
			transition("* => 4", animate(600, keyframesReadonly(zoomIn))),
			transition("* => 3", animate(600, keyframesReadonly(zoomIn))),
			transition("* => 2", animate(600, keyframesReadonly(zoomIn))),
			transition("* => 1", animate(600, keyframesReadonly(zoomIn))),
			transition("* => 0", animate(2000, keyframesReadonly(zoomInAndPulseThreeTimes))),
		]),
	],
	selector: "sudoku-countdown",
	styleUrls: ["./countdown.component.scss"],
	templateUrl: "./countdown.component.html",
})
export class CountdownComponent extends unsubscribeOnDestroyMixin() {
	progress = 0;
	seconds: number;

	constructor(dialogRef: MatDialogRef<CountdownComponent>) {
		super();
		const startInSeconds = isDebugEnabled() ? 1 : 5;
		this.seconds = startInSeconds;
		this.subscription.add(
			interval(10 * startInSeconds * progressIncrementStep).subscribe((v) => {
				this.progress = v * progressIncrementStep;
				if (this.seconds > 0)
					this.seconds = startInSeconds - Math.floor((startInSeconds * this.progress) / 100);

				if (this.progress > 100 + 20 * progressIncrementStep) dialogRef.close();
			}),
		);
	}
}

export async function openCountdownDialog(dialog: MatDialog): Promise<void> {
	return firstValueFrom(
		dialog
			.open<CountdownComponent, void, void>(CountdownComponent, {
				disableClose: true,
				panelClass: "countdown",
			})
			.afterClosed(),
	);
}
