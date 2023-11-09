import { Component } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { TranslateService } from "@ngx-translate/core";
import { openCropDialog } from "app/components/crop/crop.component";
import { State } from "app/server/state";
import { Store } from "app/server/store";
import { As } from "app/utils/assert";
import { openSnackBar, translate } from "app/utils/util";
import fb from "firebase/compat/app";

const { required } = Validators;

@Component({
	selector: "sudoku-login",
	styleUrls: ["./profile.component.scss"],
	templateUrl: "./profile.component.html",
})
export class ProfileComponent {
	readonly isReadonly: boolean;
	readonly displayNameControl = new FormControl(fb.auth().currentUser?.displayName, [required]);

	readonly formGroup = new FormGroup({
		displayNameControl: this.displayNameControl,
	});

	private readonly user = As.defined(fb.auth().currentUser);
	private croppedImage?: string;

	constructor(
		private readonly dialogRef: MatDialogRef<ProfileComponent>,
		private readonly dialog: MatDialog,
		private readonly store: Store,
		state: State,
		snackBar: MatSnackBar,
		ts: TranslateService,
	) {
		if (state.authProviderId === "password") this.isReadonly = false;
		else {
			this.isReadonly = true;
			const message = translate(ts, "profile.readonly", {
				provider: state.authProviderDisplayName,
			});
			openSnackBar(message, snackBar);
		}
	}

	get photoURL(): string {
		return this.croppedImage ?? this.user.photoURL ?? "assets/no-photo.png";
	}

	fileInputChange(fileInput: HTMLInputElement): void {
		const file = fileInput.files?.[0];
		if (file !== undefined) {
			const reader = new FileReader();
			reader.addEventListener("load", async () => {
				const croppedImage = await openCropDialog(this.dialog, As.string(reader.result));
				// The result of openCropDialog is defined but empty, when cancel button was pressed. I do not know why.
				if (croppedImage !== undefined && croppedImage.length > 0) {
					this.croppedImage = croppedImage;
				}
			});
			reader.readAsDataURL(file);
		}
	}

	async update(): Promise<void> {
		await this.user.updateProfile({
			displayName: As.string(this.displayNameControl.value),
			photoURL: await this.store.uploadProfileImage(this.croppedImage),
		});
		this.dialogRef.close(true);
	}
}

export function openProfileDialog(dialog: MatDialog): void {
	dialog.open<ProfileComponent, void, boolean>(ProfileComponent, {
		disableClose: true,
		width: "25em",
	});
}
