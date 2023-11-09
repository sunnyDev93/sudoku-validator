export type Level = "difficult" | "easy" | "medium";

export type DuelError =
	| "alreadyTwoDuelists"
	| "invalidDuelCode"
	| "nonexistentDuelCode"
	| "userAlreadyJoinedDuel"
	| undefined;

export type DuelistKey = "duelist1" | "duelist2";

export interface GameData {
	readonly digits?: readonly From1to9orNull[];
	readonly gameIndex?: number;
	readonly score?: number;
}

export interface UserData {
	theme?: string;
	gameData?: GameData;
}

export interface DuelistData {
	displayName: string | null;
	photoURL: string | null;
	ready: boolean;
	score: number;
	solvedPositions: PositionString[];
	uid: string;
}

export interface DuelDataNoId {
	// timestamp to be able to delete old parties?

	// gameData?: GameData;
	level: Level;
	gameIndex: number | null;
	started: Date;
	duelist1: DuelistData;
	duelist2: DuelistData | null;
}

export interface DuelData extends DuelDataNoId {
	duelCode: string;
}
