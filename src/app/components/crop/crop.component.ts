import { Component, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { TranslateService } from "@ngx-translate/core";
import { As } from "app/utils/assert";
import { openSnackBarForUnexpectedError, translate } from "app/utils/util";
import { ImageCroppedEvent } from "ngx-image-cropper";
import { firstValueFrom } from "rxjs";

@Component({
	selector: "sudoku-crop",
	templateUrl: "./crop.component.html",
})
export class CropComponent {
	croppedImage = "";

	constructor(
		@Inject(MAT_DIALOG_DATA) readonly imageBase64: string,
		private readonly dialogRef: MatDialogRef<CropComponent>,
		private readonly snackBar: MatSnackBar,
		private readonly ts: TranslateService,
	) {}

	imageCropped(event: ImageCroppedEvent): void {
		this.croppedImage = As.string(event.base64);
	}

	loadImageFailed(): void {
		openSnackBarForUnexpectedError(translate(this.ts, "loadImageFailed"), this.snackBar);
		this.dialogRef.close();
	}
}

export async function openCropDialog(
	dialog: MatDialog,
	imageBase64: string,
): Promise<string | undefined> {
	return firstValueFrom(
		dialog
			.open<CropComponent, string, string>(CropComponent, {
				data: imageBase64,
				disableClose: true,
			})
			.afterClosed(),
	);
}
