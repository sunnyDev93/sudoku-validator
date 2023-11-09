import { Component, Inject } from "@angular/core";
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from "@angular/material/snack-bar";
import { unsubscribeOnDestroyMixin } from "app/utils/unsubscribe-on-destroy.mixin";
import { fromEvent } from "rxjs";

@Component({
	selector: "sudoku-snackbar",
	templateUrl: "./snackbar.component.html",
})
export class SnackbarComponent extends unsubscribeOnDestroyMixin() {
	constructor(
		public snackBarRef: MatSnackBarRef<SnackbarComponent>,
		@Inject(MAT_SNACK_BAR_DATA) public data: string,
	) {
		super();
		/* Use setTimeout to avoid propagation of possible click event which opened this snackbar.
		   Because otherwise this event would immediately dismiss the snackbar.
			It also ignores unintentional clicks that the user makes before realizing that he wants to read the snack bar.
			*/
		setTimeout(() => {
			this.subscription.add(
				fromEvent(document, "click").subscribe(() => {
					this.snackBarRef.dismiss();
				}),
			);
		}, 2000);
	}
}
