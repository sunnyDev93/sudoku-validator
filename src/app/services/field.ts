import { from1to9 } from "app/services/digit";
import { newDigitTuple } from "app/services/tuple";

export class Field {
	#digit?: From1to9;
	private readonly possibleDigits = newDigitTuple(() => true);

	get digit(): From1to9orUndefined {
		return this.#digit;
	}

	set digit(digit: From1to9orUndefined) {
		if (this.#digit !== undefined) throw new Error("field was already set");
		if (!this.isDigitPossible(digit)) throw new Error("digit is not possible");

		this.#digit = digit;
		for (const d of from1to9) this.crossOutDigit(d);
	}

	getSolePossibleDigit(): From1to9orUndefined {
		if (this.digit !== undefined) return undefined;
		let result: From1to9orUndefined;
		for (const digit of from1to9)
			if (this.isDigitPossible(digit))
				if (result === undefined) result = digit;
				else return undefined;
		return result;
	}

	isDigitPossible(digit?: From1to9): boolean {
		if (digit !== undefined) return this.possibleDigits[digit];
		return true;
	}

	crossOutDigit(digit: From1to9): void {
		this.possibleDigits[digit] = false;
	}
}
