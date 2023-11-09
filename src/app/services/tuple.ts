/* eslint-disable total-functions/no-unsafe-type-assertion -- not helpful for tuples*/
import { from1to9 } from "app/services/digit";

export function newGridTuple<T>(createElement: (i: From1to9) => T): GridTuple<T> {
	const result = [];
	for (const i of from1to9) result[i - 1] = createElement(i);
	return result as GridTuple<T>;
}

export function newDigitTuple<T>(createElement: (i: From0to9) => T): DigitTuple<T> {
	const result = [];
	for (let i = 0; i <= 9; i++) result[i] = createElement(i as From0to9);
	return result as DigitTuple<T>;
}
