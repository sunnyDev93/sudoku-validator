import { Injectable } from "@angular/core";
import {
	AngularFirestore,
	AngularFirestoreDocument,
	QueryDocumentSnapshot,
} from "@angular/fire/compat/firestore";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import {
	DuelData,
	DuelDataNoId,
	DuelError,
	DuelistData,
	DuelistKey,
	UserData,
} from "app/server/data";
import { As, Assert } from "app/utils/assert";
import { hasProperty } from "app/utils/type-guard";
import fb from "firebase/compat/app";
import { base64ToFile } from "ngx-image-cropper";
import { combineLatest, firstValueFrom, Observable, of } from "rxjs";
import { filter, map } from "rxjs/operators";

// = Math.pow(36, 6) = 6 characters in base 36 notation = about 25 days
const SIX_CHARS = 2_176_782_336;

@Injectable({ providedIn: "root" })
export class Store {
	constructor(
		private readonly db: AngularFirestore,
		private readonly storage: AngularFireStorage,
	) {}

	getUserDataDoc(uuid: string): AngularFirestoreDocument<UserData> {
		return this.db.doc<UserData>(`users/${uuid}`);
	}

	getDuelDataDoc(duelCode: string): AngularFirestoreDocument<DuelData> {
		return this.db.doc<DuelData>(`duels/${duelCode}`);
	}

	async createDuel(userInfo: fb.UserInfo): Promise<void> {
		const duelCode = (Date.now() % SIX_CHARS).toString(36);
		const duelDoc = this.db.doc<DuelDataNoId>(`duels/${duelCode}`);
		const duelData: DuelDataNoId = {
			duelist1: createDuelist(userInfo),
			duelist2: null,
			gameIndex: null,
			level: "easy",
			started: this.serverTimestamp(),
		};
		return duelDoc.set(duelData);
	}

	async createTestDuel(userInfo: fb.UserInfo): Promise<void> {
		const duelData: DuelDataNoId = {
			duelist1: createDuelist(userInfo),
			duelist2: {
				displayName: "asdfqwer2",
				photoURL: null,
				ready: true,
				score: 0,
				solvedPositions: [],
				uid: "15jPTJncnsVa4OIgrKzsi5PEsaI3",
			},
			gameIndex: null,
			level: "medium",
			started: this.serverTimestamp(),
		};
		const duelDoc = this.db.doc<DuelDataNoId>("duels/test");
		return duelDoc.set(duelData);
	}

	async joinDuel(userInfo: fb.UserInfo, duelCode: string): Promise<DuelError> {
		/*
		 A duel code with less than 4 characters is too easy to guess.
		 It probably originated from a manual URL manipulation.
		*/
		if (duelCode.length < 4) return "invalidDuelCode";

		const duelDataDoc = this.getDuelDataDoc(duelCode);
		const duelData = await this.getData(duelDataDoc);
		if (!duelData) return "nonexistentDuelCode";
		const duelDataSnapshot = await duelDataDoc.ref.get();
		if (!duelDataSnapshot.exists) return "nonexistentDuelCode";

		const { duelist1, duelist2 } = duelData;
		const { uid } = userInfo;
		Assert.defined(uid);
		if (duelist1.uid === uid || duelist2?.uid === uid) return "userAlreadyJoinedDuel";
		if (duelist2) return "alreadyTwoDuelists";

		try {
			await duelDataDoc.ref.update("duelist2", createDuelist(userInfo));
		} catch (error: unknown) {
			if (hasProperty(error, "code") && error.code === "not-found") return "nonexistentDuelCode";
			throw error;
		}
		return undefined;
	}

	async abandonDuel(duelDataDoc: QueryDocumentSnapshot<DuelData>): Promise<void> {
		try {
			await duelDataDoc.ref.update("duelist2", null);
		} catch (error: unknown) {
			if (hasProperty(error, "code") && error.code === "not-found")
				// ignore "not-found" error (i.e. duel was deleted in the mean-time), because that means nothing to do
				return;
			throw error;
		}
	}

	async getData<T>(doc: AngularFirestoreDocument<T>): Promise<T | undefined> {
		const snapshot = await doc.ref.get();
		return snapshot.data();
	}

	valueChangesWithoutOwn<T>(
		doc: AngularFirestoreDocument<T> | undefined,
	): Observable<T | undefined> {
		if (!doc) return of(undefined);
		return doc.snapshotChanges().pipe(
			// ignore all snapshots which are created from myself
			filter((snapshot) => !snapshot.payload.metadata.hasPendingWrites),
			map((snapshot) => snapshot.payload.data()),
		);
	}

	firstDuelForUser(
		uid: string | undefined,
	): Observable<QueryDocumentSnapshot<DuelData> | undefined> {
		if (uid === undefined) return of(undefined);
		return combineLatest([this.firstDuel(uid, "duelist1"), this.firstDuel(uid, "duelist2")]).pipe(
			map(
				([firstDuelAsDuelist1, firstDuelAsDuelist2]) =>
					firstDuelAsDuelist1 ?? firstDuelAsDuelist2 ?? undefined,
			),
		);
	}

	private firstDuel(
		uid: string,
		duelistKey: DuelistKey,
	): Observable<QueryDocumentSnapshot<DuelData> | undefined> {
		return this.db
			.collection<DuelData>("duels", (ref) => ref.where(`${duelistKey}.uid`, "==", uid).limit(1))
			.snapshotChanges()
			.pipe(
				map((duels) => duels[0]?.payload),
				// ignore all snapshots which are created from myself
				filter((payload) => !payload || !payload.doc.metadata.hasPendingWrites),
				map((payload) => payload?.doc),
			);
	}

	serverTimestamp(): Date {
		// eslint-disable-next-line total-functions/no-unsafe-type-assertion -- ok here
		return fb.firestore.FieldValue.serverTimestamp() as unknown as Date;
	}

	async uploadProfileImage(base64Image: string | undefined): Promise<string | null> {
		const user = As.defined(fb.auth().currentUser);
		if (base64Image === undefined) return user.photoURL;

		const filePath = `${user.uid}/photo.png`;
		await this.storage.upload(filePath, base64ToFile(base64Image));
		return As.string(await firstValueFrom(this.storage.ref(filePath).getDownloadURL()));
	}

	async deleteProfileImage(): Promise<void> {
		const user = As.defined(fb.auth().currentUser);
		const photoUrl = user.photoURL;
		if (photoUrl === null) return;
		if (!photoUrl.includes("https://firebasestorage.googleapis.com")) return;
		try {
			await this.storage.storage.refFromURL(photoUrl).delete();
		} catch (error: unknown) {
			if (hasProperty(error, "code") && error.code === "storage/object-not-found")
				// eslint-disable-next-line no-console -- Can happen if first try of profile deletion did not succeed because of "auth/requires-recent-login"
				console.log("Ignore deletion error of nonexisting profile image:", error);
			else throw error;
		}
	}
}

function createDuelist(userInfo: fb.UserInfo): DuelistData {
	return {
		displayName: userInfo.displayName,
		photoURL: userInfo.photoURL,
		ready: false,
		score: 0,
		solvedPositions: [],
		uid: userInfo.uid,
	};
}
