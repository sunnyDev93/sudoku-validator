import { Component, OnDestroy } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar, MatSnackBarRef } from "@angular/material/snack-bar";
import { openCropDialog } from "app/components/crop/crop.component";
import { ExternalAuthProviderId, State } from "app/server/state";
import { Store } from "app/server/store";
import { As } from "app/utils/assert";
import { hasProperty } from "app/utils/type-guard";
import { openSnackBarForUnexpectedError } from "app/utils/util";
import fb from "firebase/compat/app";

const { required, email, minLength } = Validators;

@Component({
	selector: "sudoku-login",
	styleUrls: ["./register.component.scss"],
	templateUrl: "./register.component.html",
})
export class RegisterComponent implements OnDestroy {
	readonly displayNameControl = new FormControl("", [required]);

	readonly emailControl = new FormControl("", [required, email]);

	readonly passwordControl = new FormControl("", [required, minLength(6)]);

	readonly formGroup = new FormGroup({
		displayNameControl: this.displayNameControl,
		emailControl: this.emailControl,
		passwordControl: this.passwordControl,
	});

	private croppedImage?: string;
	private snackBarRef?: MatSnackBarRef<unknown>;

	constructor(
		private readonly dialogRef: MatDialogRef<RegisterComponent>,
		private readonly auth: AngularFireAuth,
		private readonly snackBar: MatSnackBar,
		private readonly dialog: MatDialog,
		private readonly store: Store,
		private readonly state: State,
	) {}

	ngOnDestroy(): void {
		this.snackBarRef?.dismiss();
	}

	get photoURL(): string {
		return this.croppedImage ?? fb.auth().currentUser?.photoURL ?? "assets/no-photo.png";
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

	async register(): Promise<void> {
		try {
			const userCredential = await this.auth.createUserWithEmailAndPassword(
				As.string(this.emailControl.value),
				As.string(this.passwordControl.value),
			);
			await userCredential.user!.updateProfile({
				displayName: As.string(this.displayNameControl.value),
				photoURL: await this.store.uploadProfileImage(this.croppedImage),
			});
			this.dialogRef.close(true);
		} catch (error: unknown) {
			// https://firebase.google.com/docs/reference/js/firebase.auth.Auth.html#createUserWithEmailAndPassword
			const code = hasProperty(error, "code") ? error.code : undefined;
			switch (code) {
				case "auth/email-already-in-use":
					this.emailControl.setErrors({
						// eslint-disable-next-line @typescript-eslint/naming-convention -- naming is from firebase and can not be influenced
						"email-already-in-use": error,
					});
					break;
				case "auth/invalid-email":
					this.emailControl.setErrors({ email: error });
					break;
				case "auth/weak-password":
					this.passwordControl.setErrors({ minlength: error });
					break;
				default:
					this.snackBarRef = openSnackBarForUnexpectedError(error, this.snackBar);
			}
		}
	}

	registerWith(providerId: ExternalAuthProviderId): void {
		this.dialogRef.close(true);
		void this.state.loginWith(providerId);
	}
}

export function openRegisterDialog(dialog: MatDialog): void {
	dialog.open<RegisterComponent, void, boolean>(RegisterComponent, {
		disableClose: true,
		width: "25em",
	});
}
