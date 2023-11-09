import { MatSnackBar, MatSnackBarRef } from "@angular/material/snack-bar";
import { TranslateService } from "@ngx-translate/core";
import { SnackbarComponent } from "app/components/snackbar/snackbar.component";
import { As, Assert } from "app/utils/assert";
import { hasProperty } from "app/utils/type-guard";
import fb from "firebase/compat/app";

export function nullToUndefined<T>(value: T | null): T | undefined {
	return value ?? undefined;
}

export function undefinedToNull<T>(value: T | undefined): T | null {
	return value ?? null;
}

export function isDebugEnabled(): boolean {
	if (location.hostname === "localhost") return true;

	const { currentUser } = fb.auth();
	if (currentUser === null) return false;

	return [
		"15jPTJncnsVa4OIgrKzsi5PEsaI3",
		"5N4T6DdBHufpoQ8pkM0sc7WB1Zu1",
		"XvAusBeeWUXE3FQoTwJ8q8Dg5py2",
		"YfP5bSwZuNecsBb98gfnQaqzP4L2",
		"cxXkytL0MBe9XIky4eGq5qRCDPW2",
		"eOQEWEa9o4N51ans65VnCz41kQB2",
	].includes(currentUser.uid);
}

export async function share(
	title: string,
	text: string,
	url: string,
	ts: TranslateService,
	snackBar: MatSnackBar,
): Promise<void> {
	try {
		await navigator.share({
			text: text,
			title: title,
			url: url,
		});
	} catch {
		// show snackbar with URL and copy-URL-action, if "share" is not available or user/Safari cancels
		const message = translate(ts, "share.message", { url });
		snackBar
			.open(message, translate(ts, "share.action"), {
				duration: message.length * 200,
				panelClass: "pre-wrap",
			})
			.onAction()
			.subscribe(() => {
				const textarea = document.createElement("textarea");
				textarea.style.position = "fixed";
				textarea.style.left = "0";
				textarea.style.top = "0";
				textarea.style.opacity = "0";
				textarea.value = url;
				document.body.append(textarea);
				textarea.focus();
				textarea.select();
				// eslint-disable-next-line deprecation/deprecation -- Currently no better replacement https://stackoverflow.com/questions/61520602/is-there-a-replacement-for-document-execcommand-or-is-it-safe-to-use-document
				document.execCommand("copy");
				textarea.remove();
			});
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types -- Must imitate bad API from TranslateService
export function translate(ts: TranslateService, key: string, interpolateParams?: Object): string {
	const result = As.nonEmptyString(ts.instant(key, interpolateParams));
	Assert.truthy(result !== key, `No translation provided for '${key}'`);
	Assert.truthy(
		!result.includes("{{"),
		interpolateParams
			? `Incorrect interpolate parameters '${JSON.stringify(
					interpolateParams,
			  )}' for translation '${result}'`
			: "Missing interpolate parameters",
	);
	return result;
}

export function openSnackBarForUnexpectedError(
	error: unknown,
	snackBar: MatSnackBar,
): MatSnackBarRef<unknown> {
	const message =
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- TODO
		hasProperty(error, "message") && error.message ? error.message : error;
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- TODO
	return openSnackBar(message ? String(message) : "Error", snackBar);
}

export function openSnackBar(message: string, snackBar: MatSnackBar): MatSnackBarRef<unknown> {
	return snackBar.openFromComponent(SnackbarComponent, {
		data: message,
		duration: message.length * 200,
	});
}
