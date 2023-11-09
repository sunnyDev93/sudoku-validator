export function isDefined<T>(value: T): value is NonNullable<T> {
	return value !== undefined && value !== null;
}

export function hasMethod<K extends string>(
	unknownValue: unknown,
	methodName: K,
	// eslint-disable-next-line @typescript-eslint/ban-types -- Use of "Function" as a type is ok here, because the exact signature cannot be retrieved at runtime
): unknownValue is Record<K, Function> {
	if (!hasProperty(unknownValue, methodName)) return false;

	return typeof unknownValue[methodName] === "function";
}

export function hasProperty<K extends string>(
	unknownValue: unknown,
	propertyName: K,
): unknownValue is Record<K, unknown> {
	if (typeof unknownValue !== "object" && typeof unknownValue !== "function") return false;

	if (!unknownValue) return false;

	return propertyName in unknownValue;
}
