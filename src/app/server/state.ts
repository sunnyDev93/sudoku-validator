import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestoreDocument, QueryDocumentSnapshot } from "@angular/fire/compat/firestore";
import { DuelData, DuelError, DuelistData, DuelistKey, Level, UserData } from "app/server/data";
import { Store } from "app/server/store";
import { As, Assert } from "app/utils/assert";
import { nullToUndefined } from "app/utils/util";
import fb from "firebase/compat/app";
import { isEqual } from "lodash-es";
import { Observable, Subject } from "rxjs";
import { distinctUntilChanged, map, switchMap, tap } from "rxjs/operators";

const GITHUB_ID = "github.com";
const GOOGLE_ID = "google.com";
const TWITTER_ID = "twitter.com";
const PASSWORD_ID = "password";

export type ExternalAuthProviderId = "github.com" | "google.com" | "twitter.com";
export type AuthProviderId = ExternalAuthProviderId | "password";

@Injectable({ providedIn: "root" })
export class State {
	private userDataDoc?: AngularFirestoreDocument<UserData>;
	private duelDataDoc?: QueryDocumentSnapshot<DuelData>;
	private readonly userDataSubject = new Subject<UserData | undefined>();
	private readonly duelDataSubject = new Subject<DuelData | undefined>();
	private userDataValue?: UserData;
	private duelDataValue?: DuelData;

	constructor(private readonly auth: AngularFireAuth, private readonly store: Store) {
		auth.authState
			.pipe(
				map(nullToUndefined),
				map((user) => (user ? store.getUserDataDoc(user.uid) : undefined)),
				tap((userDataDoc) => (this.userDataDoc = userDataDoc)),
				switchMap((userDataDoc) => store.valueChangesWithoutOwn(userDataDoc)),
				// "valueChangesWithoutOwn" (and "valueChanges") emit often 2 equal values
				distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
				map((userData) => userData ?? (this.userDataDoc ? ({} as UserData) : undefined)),
			)
			.subscribe((userData) => {
				this.userDataValue = userData;
				this.userDataSubject.next(userData);
			});
		auth.authState
			.pipe(switchMap((user) => store.firstDuelForUser(user?.uid)))
			.subscribe((duelDataDoc) => {
				this.duelDataDoc = duelDataDoc;
				this.duelDataValue = duelDataDoc?.data();
				if (this.duelDataValue) this.duelDataValue.duelCode = As.defined(duelDataDoc?.id);
				this.duelDataSubject.next(this.duelDataValue);
				void this.ensureConsistentDuelData();
			});
	}

	get user(): fb.User | undefined {
		return nullToUndefined("auth" in fb ? fb.auth().currentUser : null);
	}

	get user2(): fb.User {
		return As.defined(this.user);
	}

	get authProviderDisplayName(): string {
		const { authProviderId, user2 } = this;
		switch (authProviderId) {
			case PASSWORD_ID:
				return As.defined(user2.email);
			case GOOGLE_ID:
				return "Google";
			case GITHUB_ID:
				return "GitHub";
			case TWITTER_ID:
				return "Twitter";
			default:
				Assert.never(authProviderId);
		}
	}

	get authProviderId(): AuthProviderId {
		// "this.user.providerId" gives "firebase" even when authenticated with Google
		const { providerId } = this.user2.providerData[0]!;
		switch (providerId) {
			case PASSWORD_ID:
			case GOOGLE_ID:
			case GITHUB_ID:
			case TWITTER_ID:
				return providerId;
			default:
				throw new Error(`Assertion error: Unexpected value '${providerId}'`);
		}
	}

	async loginWith(providerId: ExternalAuthProviderId): Promise<void> {
		fb.auth().useDeviceLanguage();
		return this.auth.signInWithRedirect(createAuthProvider(providerId));
	}

	get userData$(): Observable<UserData | undefined> {
		return this.userDataSubject;
	}

	get userData(): UserData | undefined {
		return this.userDataValue;
	}

	get userData2(): UserData {
		return As.defined(this.userData);
	}

	get duelData$(): Observable<DuelData | undefined> {
		return this.duelDataSubject;
	}

	get duelData(): DuelData | undefined {
		return this.duelDataValue;
	}

	get duelData2(): DuelData {
		return As.defined(this.duelData);
	}

	async duelExists(duelCode: string): Promise<boolean> {
		const duelDataDoc = this.store.getDuelDataDoc(duelCode);
		const duelData = await this.store.getData(duelDataDoc);
		return duelData !== undefined;
	}

	get opponentDuelistKey(): DuelistKey | undefined {
		const { myDuelistKey } = this;
		if (myDuelistKey === "duelist1") return "duelist2";
		if (myDuelistKey === "duelist2") return "duelist1";
		return undefined;
	}

	get opponentDuelistData(): DuelistData | undefined {
		const { opponentDuelistKey, duelData } = this;
		if (opponentDuelistKey === undefined) return undefined;
		return nullToUndefined(duelData![opponentDuelistKey]);
	}

	get myDuelistData(): DuelistData | undefined {
		const { myDuelistKey, duelData } = this;
		if (myDuelistKey === undefined) return undefined;
		return nullToUndefined(duelData![myDuelistKey]);
	}

	get myDuelistKey(): DuelistKey | undefined {
		const { duelData, user } = this;
		if (!duelData) return undefined;
		const uid = user?.uid;
		if (uid === undefined) return undefined;
		if (duelData.duelist1.uid === uid) return "duelist1";
		if (duelData.duelist2?.uid === uid) return "duelist2";

		return undefined;
	}

	async saveUserData(): Promise<void> {
		return this.userDataDoc!.set(this.userData2);
	}

	async deleteUser(): Promise<void> {
		/*
			Delete user data and profile image before the user account, otherwise it would not be allowed,
			because the user is not authenticated anymore and the my security roles enforce this.
		*/
		await this.userDataDoc!.delete();
		await this.store.deleteProfileImage();
		/*
			When the user is deleted, the error "auth/requires-recent-login" could occur,
			which leads to deletion of the user data and profile image but not of the user account, if the user does not login again.
			Currently there is no way to detect if a recent login is required (https://stackoverflow.com/a/57967911).
			Ensure that "login" is called manually before calling this function.
		*/
		return this.user2.delete();
	}

	async createDuel(): Promise<void> {
		if (!this.user) await fb.auth().signInAnonymously();
		return this.store.createDuel(this.user2);
	}

	async createTestDuel(): Promise<void> {
		if (!this.user) await fb.auth().signInAnonymously();
		return this.store.createTestDuel(this.user2);
	}

	async joinDuel(duelCode: string): Promise<DuelError> {
		if (!this.user) await fb.auth().signInAnonymously();
		return this.store.joinDuel(this.user2, duelCode);
	}

	async deleteOrAbandonDuel(): Promise<void> {
		if (!this.duelData) return;
		if (this.myDuelistKey === "duelist1") return this.duelDataDoc!.ref.delete();

		return this.store.abandonDuel(As.defined(this.duelDataDoc));
	}

	async saveDuelLevel(level: Level): Promise<void> {
		return this.duelDataDoc!.ref.update("level", level);
	}

	async saveDuelReady(ready: boolean): Promise<void> {
		return this.duelDataDoc!.ref.update(`${this.myDuelistKey!}.ready`, ready);
	}

	async resetDuel(): Promise<void> {
		return this.duelDataDoc!.ref.update(
			"gameIndex",
			null,
			"duelist1.ready",
			false,
			"duelist1.score",
			0,
			"duelist1.solvedPositions",
			[],
			"duelist2.ready",
			false,
			"duelist2.score",
			0,
			"duelist2.solvedPositions",
			[],
		);
	}

	async saveDuelGameIndex(gameIndex: number): Promise<void> {
		return this.duelDataDoc!.ref.update(
			"gameIndex",
			gameIndex,
			"started",
			this.store.serverTimestamp(),
		);
	}

	async saveMyDuelistGameData(
		myScore: number,
		mySolvedPositions: readonly PositionString[],
	): Promise<void> {
		const myDuelistKey = this.myDuelistKey!;
		return this.duelDataDoc!.ref.update(
			`${myDuelistKey}.score`,
			myScore,
			`${myDuelistKey}.solvedPositions`,
			mySolvedPositions,
		);
	}

	async ensureConsistentDuelData(): Promise<void> {
		if ((this.myDuelistData?.ready ?? false) && !this.opponentDuelistData) {
			return this.saveDuelReady(false);
		}
	}
}

function createAuthProvider(providerId: ExternalAuthProviderId): fb.auth.AuthProvider {
	switch (providerId) {
		case GITHUB_ID:
			return new fb.auth.GithubAuthProvider();
		case GOOGLE_ID:
			return new fb.auth.GoogleAuthProvider();
		case TWITTER_ID:
			// https://apps.twitter.com/
			return new fb.auth.TwitterAuthProvider();
		default:
			Assert.never(providerId);
	}
}
