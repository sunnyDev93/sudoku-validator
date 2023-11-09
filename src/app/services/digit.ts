/* eslint-disable total-functions/no-unsafe-type-assertion -- not helpful for digits*/
export const from1to9 = {
	*[Symbol.iterator](): Iterator<From1to9> {
		for (let i = 1; i <= 9; i++) yield i as From1to9;
	},
};

export const oneFourSeven = [1, 4, 7] as const;

export function getBoxBounds(digit: From1to9): readonly [lower: From1to9, upper: From1to9] {
	const lower = (Math.floor((digit - 1) / 3) * 3 + 1) as From1to9;
	const upper = (lower + 2) as From1to9;
	return [lower, upper];
}

export function add2ToOneFourSeven(digit: From1to9): From1to9 {
	return (digit + 2) as From1to9;
}

export function increment(i: From1to9): From1to9 {
	if (i > 8) return 1;
	return (i + 1) as From1to9;
}

export function decrement(i: From1to9): From1to9 {
	if (i < 2) return 9;
	return (i - 1) as From1to9;
}

export function incrementBox(i: From1to9): From1to9 {
	if (i > 6) return 1;
	if (i > 3) return 7;
	return 4;
}

export function decrementBox(i: From1to9): From1to9 {
	if (i < 4) return 9;
	if (i < 7) return 3;
	return 6;
}
