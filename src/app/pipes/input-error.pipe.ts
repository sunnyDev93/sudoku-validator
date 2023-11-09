import { Pipe, PipeTransform } from "@angular/core";
import { ValidationErrors } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";
import { As, Assert } from "app/utils/assert";
import { translate } from "app/utils/util";

@Pipe({ name: "inputError" })
export class InputErrorPipe implements PipeTransform {
	// Trying to use a new InputErrorComponent (using this pipe) did not work, because the input elements were validated before they were touched.
	constructor(private readonly ts: TranslateService) {}

	transform(errors: ValidationErrors | null, translateKeyPrefix: string): string {
		// Directly using FormControl instead of ValidationErrors does not work, because the pipe is pure and the FormControl does not change.
		Assert.nonEmptyString(translateKeyPrefix);
		if (!errors) return "";

		const errorCode = As.nonEmptyString(Object.keys(errors)[0]);
		return As.nonEmptyString(translate(this.ts, `${translateKeyPrefix}.error.${errorCode}`));
	}
}
