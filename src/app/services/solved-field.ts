import { Position } from "app/services/position";
import { Assert } from "app/utils/assert";

export type Reason =
	| "SolePossibleDigitForCell"
	| "SolePossiblePositionForBox"
	| "SolePossiblePositionForColumn"
	| "SolePossiblePositionForRow";

export class SolvedField extends Error {
	constructor(readonly position: Position, readonly digit: From1to9, readonly reason: Reason) {
		super();
	}

	*allPositionsForReason(): Generator<Position> {
		switch (this.reason) {
			case "SolePossiblePositionForColumn":
				yield* this.position.allPositionsInColumn();
				break;
			case "SolePossiblePositionForRow":
				yield* this.position.allPositionsInRow();
				break;
			case "SolePossiblePositionForBox":
				yield* this.position.allPositionsInBox();
				break;
			case "SolePossibleDigitForCell":
				// no positions to show for this reason
				break;
			default:
				Assert.never(this.reason);
		}
	}
}
