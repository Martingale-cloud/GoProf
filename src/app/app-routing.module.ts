import { NgModule } from "@angular/core";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { Routes } from "@angular/router";


import {LoginComponent} from "./login/login.component"


import { HomeComponent } from "./home/home.component";


import { MessagesComponent } from "./messages/messages.component";
import { CoursComponent } from "./cours/cours.component";
import { AgendaComponent } from "./agenda/agenda.component";
import { SettingsComponent } from "./settings/settings.component";


import { ProfsComponent } from "./profs/profs.component";
import { ReserverComponent } from "./reserver/reserver.component";
import { ProfComponent } from "./prof/prof.component";
import { ProfagendaComponent } from "./profagenda/profagenda.component";


import { LiveComponent } from "./live/live.component";
import { PlayerComponent } from "./player/player.component";
import { NotificationsComponent } from "./notifications/notifications.component";
import { CreditcardsComponent } from "./creditcards/creditcards.component";
import { ConversationsComponent } from "./conversations/conversations.component";
import { ConfirmcoursComponent } from "./confirmcours/confirmcours.component";
import { DemandesComponent } from "./demandes/demandes.component";

import { AddhoursComponent } from "./addhours/addhours.component";
import { ComptaComponent } from "./compta/compta.component";
import { GameComponent } from "./game/game.component";
import { heureComponent } from "./heure/heure.component";



const routes: Routes = [
    { path: "", redirectTo: "/login", pathMatch: "full" },
    { path: "login", component: LoginComponent },
    { path: 'home', component: HomeComponent },
    

    
    { path: 'cours', component: CoursComponent },
    
    { path: 'messages', component: MessagesComponent },
    { path: 'agenda', component: AgendaComponent },
    { path: 'settings', component: SettingsComponent },
    
    
  
    { path: 'live', component: LiveComponent },
    { path: 'player', component: PlayerComponent },
    { path: 'game', component: GameComponent },
    { path: 'notifications', component: NotificationsComponent },
    { path: 'creditcards', component: CreditcardsComponent },
    { path: 'conversations', component: ConversationsComponent },
    { path: 'profs', component: ProfsComponent },
    { path: 'reserver', component: ReserverComponent },
    { path: 'prof', component: ProfComponent },
    { path: 'compta', component: ComptaComponent },
    { path: 'confirmcours', component: ConfirmcoursComponent },
    { path: 'profagenda', component: ProfagendaComponent },
    { path: 'demandes', component: DemandesComponent },
    { path: 'addhours', component: AddhoursComponent },
    { path: 'heure', component: heureComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }


export const pages = [LoginComponent, HomeComponent,LiveComponent,CoursComponent,PlayerComponent,GameComponent,AgendaComponent,NotificationsComponent,SettingsComponent,CreditcardsComponent,ConversationsComponent,MessagesComponent,ProfsComponent,ReserverComponent,ProfComponent,ComptaComponent,ConfirmcoursComponent,ProfagendaComponent,DemandesComponent,AddhoursComponent,heureComponent];
//export const pages = [LoginComponent, HomeComponent, CoursComponent, MessagesComponent, AgendaComponent, SettingsComponent];