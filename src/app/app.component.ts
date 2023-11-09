import { OverlayContainer } from "@angular/cdk/overlay";
import {
	Component,
	ElementRef,
	forwardRef,
	OnDestroy,
	Provider,
	Renderer2,
	ViewChild,
} from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSidenav } from "@angular/material/sidenav";
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from "@angular/material/snack-bar";
import { Meta } from "@angular/platform-browser";
import { SwPush, SwUpdate } from "@angular/service-worker";
import { TranslateService } from "@ngx-translate/core";
import { openConfirmDialog } from "app/components/confirm/confirm.component";
import { openCountdownDialog } from "app/components/countdown/countdown.component";
import { DigitController, DigitCssClass } from "app/components/digit/digit.component";
import { DuelComponent } from "app/components/duel/duel.component";
import { FieldCssClass, GridController } from "app/components/grid/grid.component";
import { openLoginDialog } from "app/components/login/login.component";
import { openProfileDialog } from "app/components/profile/profile.component";
import { openRegisterDialog } from "app/components/register/register.component";
import { SidenavController, Theme } from "app/components/sidenav/sidenav.component";
import { SnackbarComponent } from "app/components/snackbar/snackbar.component";
import { ToolbarController } from "app/components/toolbar/toolbar.component";
import { DuelData, DuelistData, Level } from "app/server/data";
import { State } from "app/server/state";
import { from1to9 } from "app/services/digit";
import { Grid } from "app/services/grid";
import { allPositions, Position } from "app/services/position";
import { FieldState } from "app/services/set-digit-result";
import { SolvedField } from "app/services/solved-field";
import { SudokuService } from "app/services/sudoku.service";
import { newDigitTuple } from "app/services/tuple";
import { As, Assert } from "app/utils/assert";
import { hasProperty } from "app/utils/type-guard";
import { unsubscribeOnDestroyMixin } from "app/utils/unsubscribe-on-destroy.mixin";
import {
	isDebugEnabled,
	nullToUndefined,
	openSnackBarForUnexpectedError,
	share,
	translate,
} from "app/utils/util";
import fb from "firebase/compat/app";
import { Subscription } from "rxjs";
import { pairwise } from "rxjs/operators";

@Component({
	providers: [
		provideAppComponentAs(SidenavController),
		provideAppComponentAs(ToolbarController),
		provideAppComponentAs(GridController),
		provideAppComponentAs(DigitController),
	],
	selector: "sudoku-root",
	styleUrls: ["./app.component.scss"],
	templateUrl: "./app.component.html",
})
export class AppComponent
	extends unsubscribeOnDestroyMixin()
	implements SidenavController, ToolbarController, GridController, DigitController, OnDestroy
{
	@ViewChild(MatSidenav, { static: true }) readonly sidenav!: MatSidenav;

	currentTheme = "";
	readonly fieldCssClasses = new Grid<FieldCssClass>(() => ({}));
	readonly digitCssClasses = newDigitTuple<DigitCssClass>(() => ({}));
	fieldStates = new Grid<FieldState>(() => undefined);
	solved = false;
	readonly themes: readonly Theme[] = [
		{
			accentColor: "#e91e63",
			backgroundColor: "#fafafa",
			name: "",
			primaryColor: "#3f51b5",
		},
		{
			accentColor: "#ffc107",
			backgroundColor: "#fafafa",
			name: "light-deeppurple-amber",
			primaryColor: "#673ab7",
		},
		{
			accentColor: "#4caf50",
			backgroundColor: "#303030",
			name: "dark-purple-green",
			primaryColor: "#9c27b0",
		},
		{
			accentColor: "#607d8b",
			backgroundColor: "#303030",
			name: "dark-pink-bluegrey",
			primaryColor: "#e91e63",
		},
	];

	readonly from1to9 = from1to9;

	private selectedPosition: Position;
	private selectedPositionVisible = false;
	private selectedDigit?: From1to9 = 1;
	private lastSolvedField?: SolvedField;
	private duelDialogRef?: MatDialogRef<DuelComponent, void>;

	constructor(
		private readonly ts: TranslateService,
		private readonly ss: SudokuService,
		private readonly snackBar: MatSnackBar,
		private readonly element: ElementRef,
		private readonly renderer: Renderer2,
		private readonly overlayContainer: OverlayContainer,
		private readonly dialog: MatDialog,
		private readonly state: State,
		private readonly auth: AngularFireAuth,
		private readonly swUpdate: SwUpdate,
		swPush: SwPush,
		meta: Meta,
	) {
		super();

		ts.setDefaultLang("en");
		ts.addLangs(["de", "fr"]);
		const browserLang = ts.getBrowserLang();
		if (browserLang !== undefined) ts.use(browserLang);
		void ts
			.get("description")
			.forEach((d) => meta.updateTag({ content: As.nonEmptyString(d), name: "description" }));

		this.selectedPosition = this.ss.newGame("easy");
		this.update();

		this.subscription.add(this.subscribeUserData());
		this.subscription.add(this.subscribeDuelData());
		this.subscription.add(this.subscribeDuelSnackbar());
		if ("Notification" in window)
			document.addEventListener("visibilitychange", () => void closeNotification());
		swPush.notificationClicks.subscribe((notificationClick) => {
			// eslint-disable-next-line no-console -- A breakpoint does not help here, because the service worker is only available in production mode
			console.log(notificationClick);
			/*
				"focus()" does not work, because it does not bring PWA to foreground.
				Until https://github.com/angular/angular/issues/26907 is implemented,
				the workaround https://github.com/angular/angular/issues/26907#issuecomment-467552342
				is implemented in "custom-ngsw-worker.js".
				Opening is done as described in https://developer.mozilla.org/en-US/docs/Web/API/Clients/openWindow
			*/
		});
	}

	private subscribeUserData(): Subscription {
		return this.state.userData$.subscribe((userData) => {
			this.setThemeInternal(userData?.theme ?? "");
			this.ss.setGameData(userData?.gameData ?? { score: 0 });
			this.update(this.lastSolvedField);
		});
	}

	private subscribeDuelData(): Subscription {
		return this.state.duelData$.subscribe((duelData) => void this.handleDuelData(duelData));
	}

	private async handleDuelData(duelData?: DuelData): Promise<void> {
		const url = new URL(window.location.href);
		const duelCode = url.searchParams.get("duel");
		if (duelCode !== null) window.history.replaceState(undefined, "", window.location.pathname);
		if (duelCode === null || duelCode === duelData?.duelCode) {
			void this.openOrCloseDuelDialog(duelData);
			this.updateDuelGame(duelData);
		} else {
			window.history.replaceState(undefined, "", window.location.pathname);
			await this.state.deleteOrAbandonDuel();
			const duelError = await this.state.joinDuel(duelCode);
			if (duelError !== undefined) this.openSnackBar("warning", `duel.error.${duelError}`);
		}
	}

	private async openOrCloseDuelDialog(duelData?: DuelData): Promise<void> {
		if (duelData) {
			const bothDuelistsReady = duelData.duelist1.ready && (duelData.duelist2?.ready ?? false);
			if (bothDuelistsReady && this.duelDialogRef) {
				this.duelDialogRef.close();
				this.duelDialogRef = undefined;
				await openCountdownDialog(this.dialog);
				if (this.state.myDuelistKey === "duelist1") {
					this.selectedPosition = this.ss.newDuel(duelData.level);
					void this.state.saveDuelGameIndex(this.ss.gameIndex);
					this.updateAndSave();
				}
			}
			// Ignore if an dialog is already open, otherwise it is opened twice on a refresh
			if (!bothDuelistsReady && !this.duelDialogRef)
				this.duelDialogRef = this.dialog.open<DuelComponent, void, void>(DuelComponent, {
					disableClose: true,
				});
		} else if (this.duelDialogRef) {
			this.duelDialogRef.close();
			this.duelDialogRef = undefined;
		}
	}

	private updateDuelGame(duelData?: DuelData): void {
		if (!duelData) {
			if (this.ss.isDuel) {
				this.selectedPosition = this.ss.newGame(As.defined(this.ss.level));
				this.updateAndSave();
			}
			return;
		}
		if (duelData.gameIndex === null) return;
		if (!this.ss.isDuel || duelData.gameIndex !== this.ss.gameIndex)
			this.selectedPosition = this.ss.duelStarted(duelData.gameIndex, this.state.myDuelistData!);
		const { opponentDuelistData } = this.state;
		if (opponentDuelistData) {
			const newSolvedPositions = this.ss.setOpponentDuelistGameData(
				opponentDuelistData.score,
				opponentDuelistData.solvedPositions,
			);
			for (const newSolvedPosition of newSolvedPositions)
				this.fieldStates[newSolvedPosition] = "solvedFieldByOpponent";
		}
		if (this.ss.isSolved()) {
			this.openDuelSolvedSnackBar()
				.afterDismissed()
				.subscribe(() => void this.state.resetDuel());
		}
		this.updateFieldCssClasses();
		this.updateDigitCssClasses();
	}

	private subscribeDuelSnackbar(): Subscription {
		return this.state.duelData$
			.pipe(pairwise())
			.subscribe(
				([oldDuelData, newDuelData]) =>
					void this.openSnackBarIfDuelistStateChanged(oldDuelData, newDuelData),
			);
	}

	private async openSnackBarIfDuelistStateChanged(
		oldDuelData?: DuelData,
		newDuelData?: DuelData,
	): Promise<void> {
		if (!oldDuelData) return;

		const { duelCode, duelist1, duelist2 } = oldDuelData;
		if (newDuelData) {
			if (!duelist2 && newDuelData.duelist2) {
				this.openDuelSnackBar(duelCode, "duel.opponent.joined", newDuelData.duelist2);
			} else if (duelist2 && !newDuelData.duelist2)
				this.openDuelSnackBar(duelCode, "duel.opponent.abandoned", duelist2);
			else {
				const { opponentDuelistKey, myDuelistKey } = this.state;
				Assert.defined(opponentDuelistKey);
				Assert.defined(myDuelistKey);
				const oldOpponentDuelistData = oldDuelData[opponentDuelistKey];
				const newOpponentDuelistData = newDuelData[opponentDuelistKey];
				const newMyDuelistData = newDuelData[myDuelistKey];
				if (
					(!oldOpponentDuelistData || !oldOpponentDuelistData.ready) &&
					newOpponentDuelistData &&
					newOpponentDuelistData.ready &&
					newMyDuelistData &&
					!newMyDuelistData.ready
				)
					this.openDuelSnackBar(duelCode, "duel.opponent.ready", newOpponentDuelistData);
			}
		} else if (duelist2?.uid === this.state.user?.uid && !(await this.state.duelExists(duelCode)))
			/*
				Show snackbar for duelist2, if duelist1 abandoned.
				If duelist1 abandoned, the duel does not exist anymore.
				Checking "duelExists()" is different from checking "newDuelData !== null",
				because the latter also returns false if I left the duel.
		 	*/
			this.openDuelSnackBar(duelCode, "duel.opponent.abandoned", duelist1);
	}

	private openDuelSnackBar(duelCode: string, messageKey: string, duelistData: DuelistData): void {
		const interpolateParams = {
			displayName: duelistData.displayName ?? translate(this.ts, "anonymousPlayer"),
		};
		this.openSnackBar("solved", messageKey, interpolateParams);
		void this.showNotification(
			duelCode,
			messageKey,
			interpolateParams,
			nullToUndefined(duelistData.photoURL) ?? "assets/no-photo.png",
		);
	}

	private async showNotification(
		tag: string,
		messageKey: string,
		interpolateParams: Record<string, unknown>,
		image?: string,
	): Promise<void> {
		if (
			"Notification" in window &&
			Notification.permission === "granted" &&
			document.visibilityState !== "visible"
		) {
			const registration = await navigator.serviceWorker.ready;
			for (const notification of await registration.getNotifications()) notification.close();
			void registration.showNotification(translate(this.ts, "duel.label"), {
				badge: "assets/icons/icon-mono-128x128.png",
				body: translate(this.ts, messageKey, interpolateParams),
				data: { url: location.href },
				icon: "assets/icons/icon-192x192.png",
				image,
				tag,
				vibrate: [200, 100, 200, 100],
			});
			for (const notification of await registration.getNotifications()) {
				// eslint-disable-next-line @typescript-eslint/no-loop-func -- Does currently not work
				notification.addEventListener("notificationclick", () => focus());
			}
		}
	}

	setTheme(theme: string): void {
		this.dismissAndClose();
		this.setThemeInternal(theme);
		this.saveUserData();
	}

	private setThemeInternal(theme: string): void {
		if (theme === "light")
			// eslint-disable-next-line no-param-reassign -- TODO
			theme = "";
		if (this.currentTheme.length > 0) {
			this.renderer.removeClass(this.element.nativeElement, this.currentTheme);
			this.overlayContainer.getContainerElement().classList.remove(this.currentTheme);
		}

		if (theme.length > 0) {
			this.renderer.addClass(this.element.nativeElement, theme);
			this.overlayContainer.getContainerElement().classList.add(theme);
		}
		this.currentTheme = theme;
	}

	get user(): fb.User | undefined {
		return this.state.user;
	}

	get debugEnabled(): boolean {
		return isDebugEnabled();
	}

	editProfile(): void {
		if (this.user === undefined || this.user.isAnonymous) this.login();
		else {
			this.dismissAndClose();
			openProfileDialog(this.dialog);
		}
	}

	async deleteProfile(): Promise<void> {
		if (
			!(await openConfirmDialog(this.dialog, "profile.delete", {
				authProviderDisplayName: this.state.authProviderDisplayName,
				displayName: this.user?.displayName,
			}))
		)
			return;

		try {
			await this.state.deleteUser();
		} catch (error: unknown) {
			if (hasProperty(error, "code") && error.code === "auth/requires-recent-login") {
				const { authProviderId } = this.state;
				if (authProviderId === "password") {
					if (await openLoginDialog(this.dialog)) return this.state.deleteUser();
				}
				// Senseless to call deleteUser() here, because the page is reloaded. The user must click again on "Delete profile"
				else return this.state.loginWith(authProviderId);
			} else openSnackBarForUnexpectedError(error, this.snackBar);
		}
	}

	login(): void {
		this.dismissAndClose();
		void openLoginDialog(this.dialog);
	}

	register(): void {
		this.dismissAndClose();
		openRegisterDialog(this.dialog);
	}

	async logout(): Promise<void> {
		this.dismissAndClose();
		await this.state.deleteOrAbandonDuel();
		return this.auth.signOut();
	}

	share(): void {
		this.dismissAndClose();
		void share(
			"Sudoku Sprint",
			translate(this.ts, "description"),
			window.location.href,
			this.ts,
			this.snackBar,
		);
	}

	privacyPolicy(): void {
		this.dismissAndClose();
		window.open(`privacy-policy_${this.ts.currentLang}.html`);
	}

	about(): void {
		this.dismissAndClose();
		window.open("https://gitlab.com/winni/angular-sudoku/-/blob/master/README.adoc");
	}

	testDuel(): void {
		this.dismissAndClose();
		void this.state.createTestDuel();
	}

	solveAlmost(): void {
		this.dismissAndClose();
		this.ss.solveAlmost();
		this.updateAndSave();
	}

	get grid(): ReadonlyGrid<From1to9orUndefined> {
		return this.ss.grid;
	}

	get level(): Level | undefined {
		return this.ss.level;
	}

	get myScore(): number {
		return this.ss.myScore;
	}

	get opponentScore(): number {
		return this.ss.opponentScore;
	}

	get pointsToWin(): number {
		return this.ss.pointsToWin;
	}

	// private isUserDefinedCallCount = 0;
	get isUserDefined(): boolean {
		// console.log("isUserDefinedCallCount", this.isUserDefinedCallCount++);
		return this.ss.isUserDefined;
	}

	get isDuel(): boolean {
		return this.ss.isDuel;
	}

	playAgain(): void {
		void this.newGame(As.defined(this.level));
	}

	async newGame(level: Level): Promise<void> {
		this.dismissAndClose();
		if (await this.confirm("newGame")) {
			await this.state.deleteOrAbandonDuel();
			this.selectedPosition = this.ss.newGame(level);
			this.updateAndSave();
		}
	}

	async challengeToDuel(): Promise<void> {
		this.dismissAndClose();
		if (await this.confirm("duel")) {
			await this.state.deleteOrAbandonDuel();
			if (
				this.swUpdate.isEnabled &&
				"Notification" in window &&
				Notification.permission === "default"
			) {
				const snackbarRef = this.openSnackBar(
					"solved",
					"permissionNotificationInfo",
					undefined,
					"top",
				);
				try {
					await Notification.requestPermission();
				} finally {
					snackbarRef.dismiss();
				}
			}
			return this.state.createDuel();
		}
	}

	async ownGame(): Promise<void> {
		this.dismissAndClose();
		if (await this.confirm("ownGame")) {
			await this.state.deleteOrAbandonDuel();
			this.ss.clearGame();
			this.updateAndSave();
		}
	}

	solveNext(): void {
		this.dismissAndClose();
		const solvedField = this.ss.solveNext();
		if (!solvedField) this.openSnackBar("warning", "notYetSolvable");
		this.updateAndSave(solvedField);
	}

	async solveAll(): Promise<void> {
		this.dismissAndClose();
		if (await this.confirm("solveAll")) {
			this.ss.solveAll();
			this.updateAndSave();
			if (!this.solved) this.openSnackBar("warning", "notYetSolvable");
		}
	}

	keydown(keyboardEvent: KeyboardEvent): void {
		this.dismissAndClose();
		// Do not handle and do not prevent default, if a dialog is open.
		if (this.dialog.openDialogs.length > 0) return;
		this.selectedPositionVisible = true;
		this.handleKeyboardEvent(keyboardEvent);
	}

	fieldClicked(positionString: PositionString): void {
		this.dismissAndClose();
		this.selectedPositionVisible = false;
		this.selectedPosition = Position.fromString(positionString);
		this.setSelectedDigitInSelectedField();
		this.updateAndSave();
	}

	digitClicked(value: From0to9): void {
		this.dismissAndClose();
		// 0 is used here instead of undefined, because undefined can not be an index of the digitCssClasses array
		this.selectedDigit = value === 0 ? undefined : value;
		this.update();
	}

	private handleKeyboardEvent(keyboardEvent: KeyboardEvent): void {
		const { key } = keyboardEvent;
		if (key >= "1" && key <= "9")
			// eslint-disable-next-line total-functions/no-unsafe-type-assertion -- type assertion is safe here, because checked in "if"
			this.setSelectedDigitOrSetDigitInSelectedField(Number(key) as From1to9);
		else
			switch (key) {
				case " ":
					this.setSelectedDigitOrSetDigitInSelectedField(undefined);
					break;
				case "Enter":
					this.setSelectedDigitInSelectedField();
					break;
				case "Delete":
				case "Backspace":
					this.setDigitInSelectedField(undefined);
					break;
				default: {
					const newPosition = this.getNewPosition(keyboardEvent);
					// Do not prevent default for an unhandled key.
					if (!newPosition) return;
					this.selectedPosition = newPosition;
				}
			}
		this.updateAndSave();
		keyboardEvent.preventDefault();
	}

	private getNewPosition(keyboardEvent: KeyboardEvent): Position | undefined {
		switch (keyboardEvent.key) {
			case "ArrowUp":
				if (keyboardEvent.ctrlKey) return this.selectedPosition.prevRowBox();
				return this.selectedPosition.prevRow();
			case "ArrowDown":
				if (keyboardEvent.ctrlKey) return this.selectedPosition.nextRowBox();
				return this.selectedPosition.nextRow();
			case "ArrowLeft":
				if (keyboardEvent.ctrlKey) return this.selectedPosition.prevColBox();
				return this.selectedPosition.prevCol();
			case "ArrowRight":
				if (keyboardEvent.ctrlKey) return this.selectedPosition.nextColBox();
				return this.selectedPosition.nextCol();
			case "Home":
				if (keyboardEvent.ctrlKey) return this.selectedPosition.start();
				return this.selectedPosition.startRow();
			case "End":
				if (keyboardEvent.ctrlKey) return this.selectedPosition.end();
				return this.selectedPosition.endRow();
			case "Tab":
				if (keyboardEvent.shiftKey) return this.selectedPosition.prev();
				return this.selectedPosition.next();
			default:
				return undefined;
		}
	}

	private setSelectedDigitOrSetDigitInSelectedField(digit: From1to9orUndefined): void {
		if (digit === this.selectedDigit) this.setSelectedDigitInSelectedField();
		else this.selectedDigit = digit;
	}

	private setSelectedDigitInSelectedField(): void {
		if (this.ss.isInitialClue(this.selectedPosition)) return;
		this.setDigitInSelectedField(this.selectedDigit);
	}

	private setDigitInSelectedField(digit: From1to9orUndefined): void {
		const result = this.ss.setDigitChecked(this.selectedPosition, digit);
		if (result) {
			if (
				result.kind !== undefined &&
				result.message !== undefined &&
				(!this.ss.isDuel || result.message !== "solved")
			) {
				this.openSnackBar(result.kind, `SetDigitMessage.${result.message}`, {
					digit: digit,
					negativePoints: -result.speedPoints,
				});
			}
			this.fieldStates = result.fieldStates;
		}
	}

	private openDuelSolvedSnackBar(): MatSnackBarRef<SnackbarComponent> {
		const { duelResult, myScore, mySolvedPositions, opponentScore, opponentSolvedPositions } =
			this.ss;
		return this.openSnackBar(
			duelResult === "won" ? "solved" : "warning",
			`duel.result.${duelResult}`,
			{
				myScore: myScore,
				mySolvedPositionsLength: mySolvedPositions.length,
				opponentScore: opponentScore,
				opponentSolvedPositionsLength: opponentSolvedPositions.length,
			},
		);
	}

	private updateAndSave(solvedField?: SolvedField): void {
		this.update(solvedField);
		if (this.ss.isDuel) this.saveDuelData();
		else this.saveUserData();
	}

	private update(solvedField?: SolvedField): void {
		this.lastSolvedField = solvedField;
		if (solvedField) {
			this.selectedPosition = solvedField.position;
			this.selectedDigit = solvedField.digit;
			this.openSnackBar("solved", solvedField.reason, solvedField);
		}
		this.updateFieldCssClasses(solvedField);
		this.updateDigitCssClasses();
		this.solved = this.ss.isSolved();
	}

	private updateFieldCssClasses(solvedField?: SolvedField): void {
		const gridForSolePossibleDigit = this.ss.getGridForSolePossibleDigit();
		for (const pos of allPositions())
			this.fieldCssClasses.set(pos, {
				initialClue: this.ss.isInitialClue(pos),
				selectedDigit:
					this.ss.getDigit(pos) === this.selectedDigit && this.selectedDigit !== undefined,
				solePossibleDigit: gridForSolePossibleDigit.get(pos),
				solvedByMyself: this.ss.isSolvedByMyself(pos),
				solvedByOpponent: this.ss.isSolvedByOpponent(pos),
			});
		if (solvedField) {
			this.fieldCssClasses.get(solvedField.position).lastSolvedField = true;
			for (const p of solvedField.allPositionsForReason())
				this.fieldCssClasses.get(p).groupForLastSolvedField = true;
		}
		this.fieldCssClasses.get(this.selectedPosition).selectedPosition = this.selectedPositionVisible;
	}

	private updateDigitCssClasses(): void {
		const exhaustedDigits = this.ss.getExhaustedDigits();
		for (const digit of from1to9)
			this.digitCssClasses[digit] = {
				exhaustedDigit: exhaustedDigits[digit],
				selectedDigit: this.selectedDigit === digit,
			};
		this.digitCssClasses[0] = {
			exhaustedDigit: false,
			selectedDigit: this.selectedDigit === undefined,
		};
	}

	private async confirm(action: string): Promise<boolean> {
		return !this.ss.isStarted || this.solved || openConfirmDialog(this.dialog, action);
	}

	private openSnackBar(
		cssClass: string,
		messageKey: string,
		// eslint-disable-next-line @typescript-eslint/ban-types -- Must imitate bad API from TranslateService
		interpolateParams?: Object,
		verticalPosition: "bottom" | "top" = "bottom",
	): MatSnackBarRef<SnackbarComponent> {
		const config = new MatSnackBarConfig();
		config.verticalPosition = verticalPosition;
		config.horizontalPosition = "center";
		config.panelClass = [cssClass];
		const text = translate(this.ts, messageKey, interpolateParams);
		config.data = text;
		config.duration = text.length * 200;
		return this.snackBar.openFromComponent(SnackbarComponent, config);
	}

	private dismissAndClose(): void {
		this.snackBar.dismiss();
		void this.sidenav.close();
	}

	private saveUserData(): void {
		const { userData } = this.state;
		if (!userData) return;
		userData.gameData = this.ss.getGameData();
		userData.theme = this.currentTheme;
		void this.state.saveUserData();
	}

	private saveDuelData(): void {
		void this.state.saveMyDuelistGameData(this.ss.myScore, this.ss.mySolvedPositions);
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types -- Did not find another solution
type Class = Function & { readonly prototype: unknown };

export function provideAppComponentAs(injectionToken: Class): Provider {
	return {
		provide: injectionToken,
		// eslint-disable-next-line @angular-eslint/no-forward-ref -- Is ok here
		useExisting: forwardRef(() => AppComponent),
	};
}

async function closeNotification(): Promise<void> {
	if (Notification.permission === "granted" && document.visibilityState === "visible") {
		const ready = await navigator.serviceWorker.ready;
		const notifications = await ready.getNotifications();
		for (const notification of notifications) notification.close();
	}
}
