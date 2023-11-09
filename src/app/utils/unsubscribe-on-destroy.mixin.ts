import { OnDestroy } from "@angular/core";
import { hasMethod } from "app/utils/type-guard";
import { Subscription } from "rxjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `unknown` does not work
type Constructor = new (...args: readonly any[]) => any;

/**
 * If you're here, you probably need to call the parent mixin's implementation
 * and return its result, e.g. return super.ngOnDestroy()
 * https://github.com/microsoft/TypeScript/issues/21388#issuecomment-785309101
 */
export type CallSuperMethod = "CallSuperMethod";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types -- Return type cannot be specified because anonymous class
export function unsubscribeOnDestroyMixin<BASE extends Constructor>(base?: BASE) {
	const b = base ?? Object;
	return class extends b implements OnDestroy {
		protected readonly subscription = new Subscription();

		ngOnDestroy(): CallSuperMethod {
			if (hasMethod(b.prototype, "ngOnDestroy")) b.prototype.ngOnDestroy();
			this.subscription.unsubscribe();
			return "CallSuperMethod";
		}
	};
}
