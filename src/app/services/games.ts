import { Level } from "app/server/data";
import { Grid } from "app/services/grid";
import { Position } from "app/services/position";
import { As } from "app/utils/assert";
import { isDefined } from "app/utils/type-guard";

const n = undefined;

const games: ReadonlyArray<
	readonly [
		level: Level,
		initialGrid: ReadonlyGrid<From1to9orUndefined>,
		solvedGrid?: ReadonlyGrid<From1to9>,
	]
> = [
	[
		"medium",
		new Grid([
			[n, n, n, n, n, n, n, n, n],
			[n, n, n, 5, 3, n, 7, 9, n],
			[n, n, n, n, n, 7, n, 5, 3],
			[n, 9, n, n, n, 5, n, n, n],
			[n, 4, n, n, n, 2, 3, 7, n],
			[n, n, 8, 1, 7, n, n, 4, 5],
			[n, 7, n, n, 9, n, n, n, 6],
			[n, 5, 9, n, 1, 8, n, n, 7],
			[n, n, 4, n, n, 3, 1, 2, n],
		]),
		new Grid([
			[5, 3, 7, 8, 2, 9, 6, 1, 4],
			[4, 8, 6, 5, 3, 1, 7, 9, 2],
			[9, 1, 2, 4, 6, 7, 8, 5, 3],
			[7, 9, 1, 3, 4, 5, 2, 6, 8],
			[6, 4, 5, 9, 8, 2, 3, 7, 1],
			[3, 2, 8, 1, 7, 6, 9, 4, 5],
			[1, 7, 3, 2, 9, 4, 5, 8, 6],
			[2, 5, 9, 6, 1, 8, 4, 3, 7],
			[8, 6, 4, 7, 5, 3, 1, 2, 9],
		]),
	],
	[
		"easy",
		new Grid([
			[n, n, 9, n, 1, n, n, 2, 6],
			[n, n, n, n, n, 3, n, 4, 5],
			[4, 5, 1, n, 6, 2, n, n, n],
			[n, n, 7, n, n, n, 8, 5, n],
			[n, n, n, n, n, n, n, 3, 7],
			[1, n, n, n, 7, 5, n, n, 2],
			[9, n, n, n, n, n, 2, n, 4],
			[n, 2, n, n, 3, 9, 5, n, 8],
			[5, 1, 4, 2, n, 7, 3, n, n],
		]),
		new Grid([
			[8, 3, 9, 5, 1, 4, 7, 2, 6],
			[6, 7, 2, 8, 9, 3, 1, 4, 5],
			[4, 5, 1, 7, 6, 2, 9, 8, 3],
			[3, 4, 7, 9, 2, 6, 8, 5, 1],
			[2, 9, 5, 1, 4, 8, 6, 3, 7],
			[1, 6, 8, 3, 7, 5, 4, 9, 2],
			[9, 8, 3, 6, 5, 1, 2, 7, 4],
			[7, 2, 6, 4, 3, 9, 5, 1, 8],
			[5, 1, 4, 2, 8, 7, 3, 6, 9],
		]),
	],
	[
		"medium",
		new Grid([
			[n, n, 3, n, 2, n, n, 4, n],
			[n, n, 2, n, 9, n, n, 8, n],
			[9, n, n, 7, 4, 5, n, 1, n],
			[n, 2, n, n, n, n, 8, n, n],
			[n, n, n, n, n, n, 5, n, n],
			[8, n, 7, n, n, n, n, 2, 1],
			[n, n, 6, n, 5, n, 7, n, 8],
			[1, n, n, n, n, 3, n, n, n],
			[7, n, n, n, n, 8, 1, n, n],
		]),
		new Grid([
			[5, 1, 3, 8, 2, 6, 9, 4, 7],
			[4, 7, 2, 3, 9, 1, 6, 8, 5],
			[9, 6, 8, 7, 4, 5, 3, 1, 2],
			[6, 2, 4, 5, 1, 7, 8, 3, 9],
			[3, 9, 1, 4, 8, 2, 5, 7, 6],
			[8, 5, 7, 6, 3, 9, 4, 2, 1],
			[2, 3, 6, 1, 5, 4, 7, 9, 8],
			[1, 8, 5, 9, 7, 3, 2, 6, 4],
			[7, 4, 9, 2, 6, 8, 1, 5, 3],
		]),
	],
	[
		"difficult",
		new Grid([
			[n, n, n, 3, n, 2, n, 9, 8],
			[n, n, 8, n, n, n, n, 1, 4],
			[n, 9, 4, n, n, 5, n, n, 3],
			[n, n, n, 9, n, n, n, 7, n],
			[9, n, n, n, n, n, n, n, 5],
			[n, 1, n, n, n, 8, n, n, n],
			[2, n, n, 1, n, n, 4, 6, n],
			[5, 6, n, n, n, n, 1, n, n],
			[4, 3, n, 6, n, 7, n, n, n],
		]),
		new Grid([
			[1, 7, 5, 3, 4, 2, 6, 9, 8],
			[3, 2, 8, 7, 9, 6, 5, 1, 4],
			[6, 9, 4, 8, 1, 5, 7, 2, 3],
			[8, 5, 3, 9, 6, 4, 2, 7, 1],
			[9, 4, 6, 2, 7, 1, 3, 8, 5],
			[7, 1, 2, 5, 3, 8, 9, 4, 6],
			[2, 8, 9, 1, 5, 3, 4, 6, 7],
			[5, 6, 7, 4, 8, 9, 1, 3, 2],
			[4, 3, 1, 6, 2, 7, 8, 5, 9],
		]),
	],
	[
		"difficult",
		new Grid([
			[n, n, n, 7, n, 2, 9, n, n],
			[n, 1, n, n, 4, n, n, n, 2],
			[n, 2, n, n, 9, n, 8, n, n],
			[6, n, n, 4, n, n, n, 2, 9],
			[2, 5, n, n, n, n, n, 3, 6],
			[n, 9, n, 2, n, 6, n, n, 8],
			[9, n, 3, n, 1, n, 2, 5, n],
			[7, n, 5, n, 2, n, n, 8, n],
			[1, n, 2, 5, n, 4, n, 9, n],
		]),
		new Grid([
			[4, 3, 6, 7, 8, 2, 9, 1, 5],
			[8, 1, 9, 3, 4, 5, 7, 6, 2],
			[5, 2, 7, 6, 9, 1, 8, 4, 3],
			[6, 7, 1, 4, 3, 8, 5, 2, 9],
			[2, 5, 8, 1, 7, 9, 4, 3, 6],
			[3, 9, 4, 2, 5, 6, 1, 7, 8],
			[9, 6, 3, 8, 1, 7, 2, 5, 4],
			[7, 4, 5, 9, 2, 3, 6, 8, 1],
			[1, 8, 2, 5, 6, 4, 3, 9, 7],
		]),
	],
	[
		"medium",
		new Grid([
			[n, n, n, n, n, n, n, n, n],
			[n, n, 4, 5, n, n, n, 7, n],
			[n, 5, 1, 7, n, n, n, 9, 2],
			[n, n, n, n, 5, 7, 3, 2, n],
			[n, 4, n, n, 9, n, n, 1, n],
			[n, 1, 7, 4, 3, n, n, n, n],
			[9, 8, n, n, n, 3, 1, 4, n],
			[n, 7, n, n, n, 1, 6, n, n],
			[n, n, n, n, n, n, n, n, n],
		]),
		new Grid([
			[7, 9, 8, 3, 2, 4, 5, 6, 1],
			[6, 2, 4, 5, 1, 9, 8, 7, 3],
			[3, 5, 1, 7, 6, 8, 4, 9, 2],
			[8, 6, 9, 1, 5, 7, 3, 2, 4],
			[5, 4, 3, 8, 9, 2, 7, 1, 6],
			[2, 1, 7, 4, 3, 6, 9, 5, 8],
			[9, 8, 2, 6, 7, 3, 1, 4, 5],
			[4, 7, 5, 2, 8, 1, 6, 3, 9],
			[1, 3, 6, 9, 4, 5, 2, 8, 7],
		]),
	],
	[
		"easy",
		new Grid([
			[n, n, 7, n, n, 5, 3, n, n],
			[n, n, n, n, 4, n, n, 2, 9],
			[8, n, 3, 7, n, 1, n, n, 4],
			[n, n, n, n, n, n, 2, n, 3],
			[n, n, n, n, 1, 7, n, 5, n],
			[n, 5, 9, n, n, n, n, 4, n],
			[n, n, 6, n, n, n, 4, 3, n],
			[n, 9, n, n, 7, n, n, n, 2],
			[1, 8, n, 3, 6, n, 9, n, n],
		]),
		new Grid([
			[9, 4, 7, 6, 2, 5, 3, 1, 8],
			[5, 6, 1, 8, 4, 3, 7, 2, 9],
			[8, 2, 3, 7, 9, 1, 5, 6, 4],
			[7, 1, 8, 4, 5, 6, 2, 9, 3],
			[4, 3, 2, 9, 1, 7, 8, 5, 6],
			[6, 5, 9, 2, 3, 8, 1, 4, 7],
			[2, 7, 6, 5, 8, 9, 4, 3, 1],
			[3, 9, 5, 1, 7, 4, 6, 8, 2],
			[1, 8, 4, 3, 6, 2, 9, 7, 5],
		]),
	],
	[
		"easy",
		new Grid([
			[n, 3, 9, 6, n, 7, n, n, n],
			[4, n, 6, 8, n, n, 1, 3, n],
			[n, n, n, n, n, 4, n, 9, n],
			[n, 8, 5, n, 7, n, 3, n, 4],
			[n, n, n, n, 3, 6, 7, 5, n],
			[n, 4, n, n, n, 5, n, n, n],
			[9, 2, n, 1, 6, 3, n, 4, 5],
			[3, n, n, n, n, 8, n, n, n],
			[n, n, n, n, n, 2, n, n, 3],
		]),
		new Grid([
			[1, 3, 9, 6, 5, 7, 4, 8, 2],
			[4, 5, 6, 8, 2, 9, 1, 3, 7],
			[8, 7, 2, 3, 1, 4, 5, 9, 6],
			[6, 8, 5, 9, 7, 1, 3, 2, 4],
			[2, 9, 1, 4, 3, 6, 7, 5, 8],
			[7, 4, 3, 2, 8, 5, 6, 1, 9],
			[9, 2, 7, 1, 6, 3, 8, 4, 5],
			[3, 6, 4, 5, 9, 8, 2, 7, 1],
			[5, 1, 8, 7, 4, 2, 9, 6, 3],
		]),
	],
	[
		"easy",
		new Grid([
			[3, n, n, 7, n, 8, n, n, 4],
			[n, 8, n, 2, n, n, 3, n, 9],
			[5, 7, n, n, n, 9, 8, n, n],
			[2, n, n, n, n, n, 6, n, 8],
			[8, n, n, 1, 7, 6, 5, n, n],
			[4, n, 6, n, n, 2, n, 9, n],
			[n, 2, n, n, n, 3, 9, 8, 7],
			[n, 6, 3, n, 8, n, 4, n, n],
			[n, 4, n, 5, n, 7, n, n, n],
		]),
		new Grid([
			[3, 9, 1, 7, 6, 8, 2, 5, 4],
			[6, 8, 4, 2, 1, 5, 3, 7, 9],
			[5, 7, 2, 4, 3, 9, 8, 6, 1],
			[2, 5, 7, 3, 9, 4, 6, 1, 8],
			[8, 3, 9, 1, 7, 6, 5, 4, 2],
			[4, 1, 6, 8, 5, 2, 7, 9, 3],
			[1, 2, 5, 6, 4, 3, 9, 8, 7],
			[7, 6, 3, 9, 8, 1, 4, 2, 5],
			[9, 4, 8, 5, 2, 7, 1, 3, 6],
		]),
	],
	[
		"easy",
		new Grid([
			[5, 3, n, n, 7, n, n, n, n],
			[6, n, n, 1, 9, 5, n, n, n],
			[n, 9, 8, n, n, n, n, 6, n],
			[8, n, n, n, 6, n, n, n, 3],
			[4, n, n, 8, n, 3, n, n, 1],
			[7, n, n, n, 2, n, n, n, 6],
			[n, 6, n, n, n, n, 2, 8, n],
			[n, n, n, 4, 1, 9, n, n, 5],
			[n, n, n, n, 8, n, n, 7, 9],
		]),
		new Grid([
			[5, 3, 4, 6, 7, 8, 9, 1, 2],
			[6, 7, 2, 1, 9, 5, 3, 4, 8],
			[1, 9, 8, 3, 4, 2, 5, 6, 7],
			[8, 5, 9, 7, 6, 1, 4, 2, 3],
			[4, 2, 6, 8, 5, 3, 7, 9, 1],
			[7, 1, 3, 9, 2, 4, 8, 5, 6],
			[9, 6, 1, 5, 3, 7, 2, 8, 4],
			[2, 8, 7, 4, 1, 9, 6, 3, 5],
			[3, 4, 5, 2, 8, 6, 1, 7, 9],
		]),
	],
	[
		"easy",
		new Grid([
			[n, n, n, n, n, 9, 1, 3, 2],
			[n, n, 4, n, 6, n, n, 9, n],
			[n, n, n, n, n, n, n, 6, 4],
			[n, 6, 8, 9, n, 3, n, n, n],
			[n, 9, n, 2, 5, 4, n, n, n],
			[3, n, 2, n, n, n, n, n, 5],
			[n, n, n, n, 4, n, n, n, 1],
			[n, 7, 3, n, n, 1, n, 5, 6],
			[n, 5, n, n, n, 6, n, n, 9],
		]),
	],
	[
		"medium",
		new Grid([
			[n, 7, n, 4, n, n, 6, 2, 9],
			[n, n, 9, 7, 6, n, n, n, n],
			[5, n, n, 9, n, n, 7, n, 3],
			[n, n, n, 6, 7, 2, 3, n, 5],
			[n, 5, n, n, n, 1, n, n, n],
			[6, 1, n, n, n, 9, n, n, n],
			[n, n, 2, n, 5, 7, 9, n, n],
			[n, 4, n, n, n, n, n, 8, 2],
			[n, 9, n, n, n, n, n, n, n],
		]),
	],
	[
		"medium",
		new Grid([
			[7, n, n, n, 9, n, 6, n, 2],
			[n, n, n, 1, n, 2, n, n, 9],
			[n, 1, n, 7, n, n, n, n, n],
			[5, 6, 8, n, n, n, n, n, 3],
			[n, n, n, 6, 8, 3, n, n, 4],
			[n, n, n, n, n, 5, n, n, n],
			[n, n, 3, n, 5, n, n, n, n],
			[n, n, n, 8, n, n, 4, n, 5],
			[n, n, 1, n, n, n, n, 7, n],
		]),
	],
	[
		"difficult",
		new Grid([
			[n, n, 5, n, n, n, n, n, 4],
			[7, n, 4, n, 9, 8, n, 2, n],
			[n, n, n, n, 6, n, n, n, n],
			[5, n, n, 4, 2, n, n, n, n],
			[n, n, n, n, n, n, n, 7, n],
			[1, n, 7, 6, n, n, n, n, 2],
			[n, n, n, 2, n, 6, n, 1, 8],
			[n, n, n, 3, n, n, n, n, n],
			[9, 2, n, 8, n, n, 4, n, n],
		]),
	],
	[
		"difficult",
		new Grid([
			[n, n, n, 5, 3, n, n, 8, n],
			[n, n, n, n, n, 9, n, 5, n],
			[n, 4, n, 8, n, 7, n, 1, n],
			[n, 5, 7, n, n, n, n, n, n],
			[n, 9, n, n, 1, 8, 7, n, n],
			[2, n, n, n, 5, n, 1, n, n],
			[n, n, n, n, 6, 2, 3, n, n],
			[7, 6, n, n, n, n, n, n, 9],
			[n, n, n, n, n, 4, n, n, n],
		]),
	],
	/*
    Additional games can be added here
    without adding the solution to "solvedDemoGames",
	  because the solution is calculated programmatically, now.
    "solvedDemoGames" is only used in tests.
  ["difficult"
	new Grid([
		[,,,,,,,,],
		[,,,,,,,,],
		[,,,,,,,,],
		[,,,,,,,,],
		[,,,,,,,,],
		[,,,,,,,,],
		[,,,,,,,,],
		[,,,,,,,,],
		[,,,,,,,,],
  ])],
  */
];

export function getLevel(gameIndex: number): Level {
	return As.defined(games[gameIndex])[0];
}

export function nextGameIndex(gameIndex: number, level: Level): NonNegativeInteger {
	if (gameIndex === -1) return randomGameIndex(level);
	let result = (gameIndex + 1) % games.length;
	while (As.defined(games[result])[0] !== level) result = (result + 1) % games.length;
	return As.nonNegativeInteger(result);
}

function randomGameIndex(level: Level): NonNegativeInteger {
	const gamesWithLevel = games.filter((game) => game[0] === level);
	const randomIndex = Math.floor(Math.random() * gamesWithLevel.length);
	const randomGameWithLevel = As.defined(gamesWithLevel[randomIndex]);
	return As.nonNegativeInteger(games.indexOf(randomGameWithLevel));
}

export function init(gameIndex: number, dst: Grid<From1to9orUndefined>): void {
	dst.setAllFrom(As.defined(games[gameIndex])[1]);
}

export function isInitialClue(gameIndex: number, position: Position): boolean {
	return As.defined(games[gameIndex])[1][position.asString] !== undefined;
}

/*
  only for tests
*/
export const gamesLength = games.length;

export const solvedGrids = games
	.map((game) => game[2])
	.filter(isDefined)
	.map((solvedGame) => solvedGame);
