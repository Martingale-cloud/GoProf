import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";

import { AppRoutingModule, pages } from "./app-routing.module";
import { AppComponent } from "./app.component";

// Uncomment and add to NgModule imports if you need to use two-way binding
import { NativeScriptFormsModule } from "nativescript-angular/forms";


/* Service (providers) */
import { Data } from "./shared/data/data.service";


/* Modals */
import { newpageModalComponent } from "./shared/modals/newPage.modal";

import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';


//Components
import { Btn } from "./shared/btn/btn.component";


import { DropDownModule } from "nativescript-drop-down/angular";

import { FilterPipe } from './filter.pipe';

import { NgShadowModule } from 'nativescript-ng-shadow';

// Uncomment and add to NgModule imports if you need to use the HttpClient wrapper
// import { NativeScriptHttpClientModule } from "nativescript-angular/http-client";

@NgModule({
    bootstrap: [
        AppComponent,
        
    ],
    imports: [
        NativeScriptModule,
        AppRoutingModule,
        NativeScriptFormsModule,
        DropDownModule,
        NgShadowModule,
        NativeScriptUIListViewModule

    ],
    entryComponents: [newpageModalComponent],
    declarations: [
        AppComponent,
        newpageModalComponent,
        ...pages,
        Btn,
        FilterPipe
    ],
    providers: [Data],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
/*
Pass your application module to the bootstrapModule function located in main.ts to start your app
*/
export class AppModule { }
