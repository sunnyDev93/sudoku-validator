/* eslint-disable @typescript-eslint/no-unsafe-member-access, func-names, @typescript-eslint/no-redeclare, @typescript-eslint/naming-convention, total-functions/no-unsafe-type-assertion -- Should be converted to normal class with index signature after https://github.com/microsoft/TypeScript/pull/44512, which should be available in TS 4.4 */
import { allPositions, Position } from "app/services/position";

export interface Grid<T> extends Record<PositionString, T>, Iterable<T> {
	get: (pos: Position) => T;
	set: (pos: Position, item: T) => void;
	setAllFrom: (src: ReadonlyGrid<T>) => void;
}

export type GridConstructor = new <T>(
	initialValuesOrInitFunction: GridTuple<GridTuple<T>> | ((position: Position) => T),
) => Grid<T>;

export const Grid = function <T>(
	this: Grid<T>,
	initialValuesOrInitFunction: GridTuple<GridTuple<T>> | ((position: Position) => T),
): void {
	if (Array.isArray(initialValuesOrInitFunction))
		for (const pos of allPositions())
			this[pos.asString] = initialValuesOrInitFunction[pos.row - 1]![pos.col - 1]!;
	else for (const pos of allPositions()) this[pos.asString] = initialValuesOrInitFunction(pos);
} as unknown as GridConstructor;

Grid.prototype.get = function get<T>(this: Grid<T>, pos: Position): T {
	return this[pos.asString];
};

Grid.prototype.set = function set<T>(this: Grid<T>, pos: Position, item: T): void {
	this[pos.asString] = item;
};

Grid.prototype.setAllFrom = function setAllFrom<T>(this: Grid<T>, src: ReadonlyGrid<T>): void {
	for (const pos of allPositions()) this.set(pos, src[pos.asString]!);
};

Grid.prototype[Symbol.iterator] = function* <T>(this: Grid<T>): Iterator<T> {
	for (const pos of allPositions()) yield this.get(pos);
};
