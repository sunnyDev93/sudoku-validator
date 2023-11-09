import { HttpClient, HttpClientModule } from "@angular/common/http";
import { ErrorHandler, NgModule } from "@angular/core";
import { AngularFireModule } from "@angular/fire/compat";
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from "@angular/material/core";
import { MatDialogModule } from "@angular/material/dialog";
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from "@angular/material/form-field";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatTabsModule } from "@angular/material/tabs";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ServiceWorkerModule } from "@angular/service-worker";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { AppComponent } from "app/app.component";
import { ConfirmComponent } from "app/components/confirm/confirm.component";
import { CountdownComponent } from "app/components/countdown/countdown.component";
import { CropComponent } from "app/components/crop/crop.component";
import { DigitComponent } from "app/components/digit/digit.component";
import { DuelComponent } from "app/components/duel/duel.component";
import { GridComponent } from "app/components/grid/grid.component";
import { LoginComponent } from "app/components/login/login.component";
import { ProfileComponent } from "app/components/profile/profile.component";
import { RegisterComponent } from "app/components/register/register.component";
import { SidenavComponent } from "app/components/sidenav/sidenav.component";
import { SnackbarComponent } from "app/components/snackbar/snackbar.component";
import { ToolbarComponent } from "app/components/toolbar/toolbar.component";
import { InputErrorPipe } from "app/pipes/input-error.pipe";
import { SudokuErrorHandler } from "app/services/error-handler";
import { ImageCropperModule } from "ngx-image-cropper";
import { environment } from "../environments/environment";

// AoT requires an exported function for factories
export function httpLoaderFactory(http: HttpClient): TranslateLoader {
	return new TranslateHttpLoader(http, "./assets/i18n/");
}

@NgModule({
	bootstrap: [AppComponent],
	declarations: [
		AppComponent,
		ConfirmComponent,
		CountdownComponent,
		CropComponent,
		DigitComponent,
		DuelComponent,
		GridComponent,
		InputErrorPipe,
		LoginComponent,
		ProfileComponent,
		RegisterComponent,
		SidenavComponent,
		SnackbarComponent,
		ToolbarComponent,
	],
	imports: [
		AngularFireAuthModule,
		BrowserAnimationsModule,
		FormsModule,
		HttpClientModule,
		ImageCropperModule,
		MatButtonModule,
		MatDialogModule,
		MatGridListModule,
		MatIconModule,
		MatInputModule,
		MatListModule,
		MatMenuModule,
		MatProgressSpinnerModule,
		MatSelectModule,
		MatSidenavModule,
		MatSnackBarModule,
		MatTabsModule,
		MatToolbarModule,
		MatTooltipModule,
		ReactiveFormsModule,
		TranslateModule.forRoot({
			loader: {
				deps: [HttpClient],
				provide: TranslateLoader,
				useFactory: httpLoaderFactory,
			},
		}),
		AngularFireModule.initializeApp({
			apiKey: "AIzaSyDLtCpl-B0yD4_Nr-ulcokswM9PKnK05IM",
			authDomain: "angular-sudoku.firebaseapp.com",
			databaseURL: "https://angular-sudoku.firebaseio.com",
			messagingSenderId: "995445029311",
			projectId: "angular-sudoku",
			storageBucket: "angular-sudoku.appspot.com",
		}),
		AngularFirestoreModule.enablePersistence(),
		ServiceWorkerModule.register("custom-ngsw-worker.js", { enabled: environment.production }),
	],
	providers: [
		{
			provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
			useValue: { appearance: "standard" },
		},
		{ provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher },
		{ provide: ErrorHandler, useClass: SudokuErrorHandler },
	],
})
export class AppModule {}
