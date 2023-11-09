import { ErrorHandler, Injectable } from "@angular/core";
import { isDebugEnabled } from "app/utils/util";
import { isEqual } from "lodash-es";

@Injectable({
	providedIn: "root",
})
export class SudokuErrorHandler extends ErrorHandler {
	private lastError: unknown;

	override handleError(error: unknown): void {
		try {
			super.handleError(error);

			if (isDebugEnabled() && !isEqual(error, this.lastError)) {
				// eslint-disable-next-line no-alert -- `alert` is ok for localhost
				alert(error);
				setTimeout(() => (this.lastError = undefined), 5000);
			}
			this.lastError = error;
		} catch (errorInHandleError) {
			// eslint-disable-next-line no-console -- logging is ok, because we are already in the global error handler and logging is all we can do.
			console.error(errorInHandleError);
		}
	}
}
