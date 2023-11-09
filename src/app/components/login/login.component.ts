import { Component, OnDestroy } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar, MatSnackBarRef } from "@angular/material/snack-bar";
import { ExternalAuthProviderId, State } from "app/server/state";
import { As } from "app/utils/assert";
import { hasProperty } from "app/utils/type-guard";
import { openSnackBarForUnexpectedError } from "app/utils/util";
import fb from "firebase/compat/app";
import { firstValueFrom } from "rxjs";

const { required, email, minLength } = Validators;

@Component({
	selector: "sudoku-login",
	styleUrls: ["./login.component.scss"],
	templateUrl: "./login.component.html",
})
export class LoginComponent implements OnDestroy {
	readonly alreadyLoggedIn = fb.auth().currentUser !== null && !fb.auth().currentUser?.isAnonymous;

	readonly emailControl = new FormControl(fb.auth().currentUser?.email, [required, email]);

	readonly passwordControl = new FormControl("", [required, minLength(6)]);

	readonly formGroup = new FormGroup({
		emailControl: this.emailControl,
		passwordControl: this.passwordControl,
	});

	private snackBarRef?: MatSnackBarRef<unknown>;

	constructor(
		private readonly dialogRef: MatDialogRef<LoginComponent>,
		private readonly auth: AngularFireAuth,
		private readonly snackBar: MatSnackBar,
		private readonly state: State,
	) {}

	ngOnDestroy(): void {
		this.snackBarRef?.dismiss();
	}

	async login(): Promise<void> {
		try {
			// Even when catched or when using a catch-handler, SudokuErrorHandler is called (https://github.com/firebase/firebase-js-sdk/issues/1881)
			await this.auth.signInWithEmailAndPassword(
				As.string(this.emailControl.value),
				As.string(this.passwordControl.value),
			);
			this.dialogRef.close(true);
		} catch (error: unknown) {
			// https://firebase.google.com/docs/reference/js/firebase.auth.Auth#signInWithEmailAndPassword
			const code = hasProperty(error, "code") ? error.code : undefined;
			switch (code) {
				case "auth/invalid-email":
					this.emailControl.setErrors({ email: error });
					break;
				case "auth/user-disabled":
					// eslint-disable-next-line @typescript-eslint/naming-convention -- naming is from firebase and can not be influenced
					this.emailControl.setErrors({ "user-disabled": error });
					break;
				case "auth/user-not-found":
					// eslint-disable-next-line @typescript-eslint/naming-convention -- naming is from firebase and can not be influenced
					this.emailControl.setErrors({ "user-not-found": error });
					break;
				case "auth/wrong-password":
					// eslint-disable-next-line @typescript-eslint/naming-convention -- naming is from firebase and can not be influenced
					this.passwordControl.setErrors({ "wrong-password": error });
					break;
				default:
					this.snackBarRef = openSnackBarForUnexpectedError(error, this.snackBar);
			}
		}
	}

	loginWith(providerId: ExternalAuthProviderId): void {
		this.dialogRef.close(true);
		void this.state.loginWith(providerId);
	}
}

export async function openLoginDialog(dialog: MatDialog): Promise<boolean> {
	const result = await firstValueFrom(
		dialog
			.open<LoginComponent, void, boolean>(LoginComponent, {
				disableClose: true,
				width: "25em",
			})
			.afterClosed(),
	);
	return result ?? false;
}
