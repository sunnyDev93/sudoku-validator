/* eslint-disable @typescript-eslint/no-unnecessary-qualifier -- The qualifier "Assert" supports readability */
/* eslint-disable functional/prefer-readonly-type -- Assertion for readonly array is currently not implemented (but could be possible) */

export namespace Assert {
	export function string(value: unknown, message?: string): asserts value is string {
		Assert.truthy(
			typeof value === "string",
			message ?? `Assertion error: Value '${String(value)}' is not a string`,
		);
	}

	export function nonEmptyString(
		value: unknown,
		message?: string,
	): asserts value is NonEmptyString {
		Assert.string(value, message);
		Assert.truthy(value.length > 0, `Assertion error: String is empty`);
	}

	export function number(value: unknown, message?: string): asserts value is number {
		Assert.truthy(
			typeof value === "number",
			message ?? `Assertion error: Value '${String(value)}' is not a number`,
		);
	}

	export function integer(value: unknown, message?: string): asserts value is Integer {
		Assert.number(value, message);
		Assert.truthy(Number.isInteger(value), `Assertion error: Value '${value}' is not an integer`);
	}

	export function nonNegativeInteger(
		value: unknown,
		message?: string,
	): asserts value is NonNegativeInteger {
		Assert.integer(value, message);
		Assert.truthy(value >= 0, `Assertion error: Value '${value}' is negative`);
	}

	export function positiveInteger(
		value: unknown,
		message?: string,
	): asserts value is PositiveInteger {
		Assert.integer(value, message);
		Assert.truthy(value > 0, `Assertion error: Value '${value}' is not positive`);
	}

	export function boolean(value: unknown, message?: string): asserts value is boolean {
		Assert.truthy(
			typeof value === "boolean",
			message ?? `Assertion error: Value '${String(value)}' is not a boolean`,
		);
	}

	export function array(value: unknown, message?: string): asserts value is unknown[] {
		Assert.truthy(
			Array.isArray(value),
			message ?? `Assertion error: Value '${String(value)}' is not an array`,
		);
	}

	export function nonEmptyArray(
		value: unknown,
		message?: string,
	): asserts value is [unknown, ...unknown[]] {
		Assert.array(value, message);
		Assert.truthy(value.length > 0, message ?? `Assertion error: Array is empty`);
	}

	export function defined<T>(value: T, message?: string): asserts value is NonNullable<T> {
		Assert.truthy(value !== null, message ?? `Assertion error: Value is null`);
		Assert.truthy(value !== undefined, message ?? `Assertion error: Value is undefined`);
	}

	export function truthy(condition: unknown, message?: string): asserts condition {
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- ok, because all falsy conditions should throw
		if (!condition)
			throw new Error(message ?? `Assertion error: Condition '${String(condition)}' is not truthy`);
	}

	export function never(value: never, message?: string): never {
		throw new Error(message ?? `Assertion error: Unexpected value '${String(value)}'`);
	}
}

/*
	Use these fail-fast helper functions instead of using an unchecked
  - Type Assertion (i.e. cast, e.g. `x as string`)
  - Definite Assignment Assertion (i.e. exclamation mark operator, e.g. `o!.p`)
  when you do not immediately (!) access the value afterwards.

	Examples:
  - USE these functions when returning a value from a function, because otherwise it would not fail-fast:
  	e.g: Prefer `return As.defined(x)` over `return x!`
  - Do NOT use these functions when you could write `!.`, because it would fail-fast anyway and is shorter:
		 e.g. Prefer `return x!.p` instead of `return As.defined(x).p`
*/
export namespace As {
	export function string(value: unknown, message?: string): string {
		Assert.string(value, message);
		return value;
	}

	export function nonEmptyString(value: unknown, message?: string): NonEmptyString {
		Assert.nonEmptyString(value, message);
		return value;
	}

	export function number(value: unknown, message?: string): number {
		Assert.number(value, message);
		return value;
	}

	export function integer(value: unknown, message?: string): Integer {
		Assert.integer(value, message);
		return value;
	}

	export function nonNegativeInteger(value: unknown, message?: string): NonNegativeInteger {
		Assert.nonNegativeInteger(value, message);
		return value;
	}

	export function positiveInteger(value: unknown, message?: string): PositiveInteger {
		Assert.positiveInteger(value, message);
		return value;
	}

	export function boolean(value: unknown, message?: string): boolean {
		Assert.boolean(value, message);
		return value;
	}

	export function array(value: unknown, message?: string): unknown[] {
		Assert.array(value, message);
		return value;
	}

	export function nonEmptyArray(value: unknown, message?: string): [unknown, ...unknown[]] {
		Assert.nonEmptyArray(value, message);
		return value;
	}

	export function defined<T>(value: T, message?: string): NonNullable<T> {
		Assert.defined(value, message);
		return value;
	}
}
