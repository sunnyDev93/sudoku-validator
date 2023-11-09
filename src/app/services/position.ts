import {
	decrement,
	decrementBox,
	from1to9,
	getBoxBounds,
	increment,
	incrementBox,
	oneFourSeven,
} from "app/services/digit";
import { newGridTuple } from "app/services/tuple";
import { As, Assert } from "app/utils/assert";

export class Position {
	private static readonly allPositionsCache = newGridTuple((row) =>
		newGridTuple((col) => new Position(row, col)),
	);

	readonly asString: PositionString;

	private constructor(readonly row: From1to9, readonly col: From1to9) {
		this.asString = toPositionString(row, col);
	}

	*allPositionsInRegion(region: Region): Generator<Position> {
		switch (region) {
			case "Row":
				yield* this.allPositionsInRow();
				break;
			case "Column":
				yield* this.allPositionsInColumn();
				break;
			case "Box":
				yield* this.allPositionsInBox();
				break;
			default:
				Assert.never(region);
		}
	}

	*allPositionsInRow(): Generator<Position> {
		yield* allPositionsBetween(this.row, 1, this.row, 9);
	}

	*allPositionsInColumn(): Generator<Position> {
		yield* allPositionsBetween(1, this.col, 9, this.col);
	}

	*allPositionsInBox(): Generator<Position> {
		const rowBoxBounds = getBoxBounds(this.row);
		const colBoxBounds = getBoxBounds(this.col);
		yield* allPositionsBetween(rowBoxBounds[0], colBoxBounds[0], rowBoxBounds[1], colBoxBounds[1]);
	}

	nextRowBox(): Position {
		return Position.new(incrementBox(this.row), this.col);
	}

	prevRowBox(): Position {
		return Position.new(decrementBox(this.row), this.col);
	}

	nextColBox(): Position {
		return Position.new(this.row, incrementBox(this.col));
	}

	prevColBox(): Position {
		return Position.new(this.row, decrementBox(this.col));
	}

	nextRow(): Position {
		return Position.new(increment(this.row), this.col);
	}

	prevRow(): Position {
		return Position.new(decrement(this.row), this.col);
	}

	nextCol(): Position {
		return Position.new(this.row, increment(this.col));
	}

	prevCol(): Position {
		return Position.new(this.row, decrement(this.col));
	}

	next(): Position {
		if (this.col < 9) return Position.new(this.row, increment(this.col));
		if (this.row < 9) return Position.new(increment(this.row), 1);
		return this.start();
	}

	prev(): Position {
		if (this.col > 1) return Position.new(this.row, decrement(this.col));
		if (this.row > 1) return Position.new(decrement(this.row), 9);
		return this.end();
	}

	start(): Position {
		return Position.new(1, 1);
	}

	startRow(): Position {
		return Position.new(this.row, 1);
	}

	end(): Position {
		return Position.new(9, 9);
	}

	endRow(): Position {
		return Position.new(this.row, 9);
	}

	static fromString(positionString: PositionString): Position {
		return Position.new(
			// eslint-disable-next-line total-functions/no-unsafe-type-assertion -- is safe here
			Number(positionString[0]) as From1to9,
			// eslint-disable-next-line total-functions/no-unsafe-type-assertion -- is safe here
			Number(positionString[1]) as From1to9,
		);
	}

	static new(row: From1to9, col: From1to9): Position {
		/*
		 	I'm not sure, if this cache really improves performance. It does not seem so.
			If yes, the cache implementation could perhaps be simplified by using `@Memoize` from `lodash-decorators`
		*/
		return As.defined(As.defined(Position.allPositionsCache[row - 1])[col - 1]);
	}
}

export function toPositionString(row: From1to9, col: From1to9): PositionString {
	return `${row}${col}` as const;
}

export type Region = "Box" | "Column" | "Row";

export function* allPositionsInAllRows(): Generator<Generator<Position>> {
	for (const row of from1to9) yield Position.new(row, 1).allPositionsInRow();
}

export function* allPositionsInAllColumns(): Generator<Generator<Position>> {
	for (const col of from1to9) yield Position.new(1, col).allPositionsInColumn();
}

export function* allPositionsInAllBoxes(): Generator<Generator<Position>> {
	for (const row of oneFourSeven)
		for (const col of oneFourSeven) yield Position.new(row, col).allPositionsInBox();
}

export function* allPositions(): Generator<Position> {
	yield* allPositionsBetween(1, 1, 9, 9);
}

function* allPositionsBetween(
	startRow: From1to9,
	startCol: From1to9,
	endRow: From1to9,
	endCol: From1to9,
): Generator<Position> {
	for (let row = startRow; row <= endRow; row++)
		for (let col = startCol; col <= endCol; col++) yield Position.new(row, col);
}
