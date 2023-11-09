import { Component, Inject } from "@angular/core";
import { MatDialog, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";

interface ConfirmDialogKeys {
	readonly title: string;
	readonly question: string;
	// eslint-disable-next-line @typescript-eslint/ban-types -- Must imitate bad API from TranslateService
	readonly interpolateParams?: object;
	readonly okButton: string;
}

@Component({
	selector: "sudoku-confirm",
	templateUrl: "./confirm.component.html",
})
export class ConfirmComponent {
	constructor(@Inject(MAT_DIALOG_DATA) readonly keys: ConfirmDialogKeys) {}
}

export async function openConfirmDialog(
	dialog: MatDialog,
	action: string,
	// eslint-disable-next-line @typescript-eslint/ban-types -- Must imitate bad API from TranslateService
	interpolateParams?: object,
): Promise<boolean> {
	const result = await firstValueFrom(
		dialog
			.open<ConfirmComponent, ConfirmDialogKeys, boolean>(ConfirmComponent, {
				data: {
					interpolateParams,
					okButton: `${action}.label`,
					question: `${action}.question`,
					title: `${action}.title`,
				},
				disableClose: true,
			})
			.afterClosed(),
	);
	return result ?? false;
}
