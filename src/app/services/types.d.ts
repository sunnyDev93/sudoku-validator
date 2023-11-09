type From1to9 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type From0to9 = From1to9 | 0;
type From1to9orUndefined = From1to9 | undefined;
type From1to9orNull = From1to9 | null;

// eslint-disable-next-line functional/prefer-readonly-type -- these tuples should be mutable
type DigitTuple<T> = [T, T, T, T, T, T, T, T, T, T];

// eslint-disable-next-line functional/prefer-readonly-type -- these tuples should be mutable
type GridTuple<T> = [T, T, T, T, T, T, T, T, T];

type PositionString = `${From1to9}${From1to9}`;

interface ReadonlyGrid<T> extends Readonly<Record<PositionString, T>>, Iterable<T> {}
