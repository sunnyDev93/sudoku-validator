type NonEmptyString = string & {
	readonly nonEmptyStringBrand: never;
};

type Integer = number & {
	readonly integerBrand: never;
};

type NonNegativeInteger = number & {
	readonly nonNegativeIntegerBrand: never;
};

type PositiveInteger = number & {
	readonly positiveIntegerBrand: never;
};
