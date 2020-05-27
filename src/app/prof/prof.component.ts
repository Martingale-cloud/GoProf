import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ApplicationRef,
  OnInit,
} from "@angular/core";
import { Page } from "tns-core-modules/ui/page";

import { Data } from "../shared/data/data.service";

import * as moment from "moment";

import { AnimationCurve } from "tns-core-modules/ui/enums";

import * as animation from "tns-core-modules/ui/animation";

@Component({
  moduleId: module.id,
  selector: "ns-prof",
  templateUrl: "prof.component.html",
  styleUrls: ["prof.component.css"],
})
export class ProfComponent implements OnInit {
  matieres = "";
  constructor(public data: Data) {
    moment.locale("fr"); //sets moment in french;
  }

  ngOnInit() {
    if (this.data.openProf.need_math == 1) this.matieres += "Maths";
    if (this.data.openProf.need_histoire == 1) this.matieres += ", Histoire";
    if (this.data.openProf.need_francais == 1) this.matieres += ", Français";
    if (this.data.openProf.need_physique == 1) this.matieres += ", Physique";
    if (this.data.openProf.need_svt == 1) this.matieres += ", SVT";
    if (this.data.openProf.need_anglais == 1) this.matieres += ", Anglais";
    if (this.data.openProf.need_allemand == 1) this.matieres += ", Allemand";
    if (this.data.openProf.need_espagnol == 1) this.matieres += ", Espagnol";
    if (this.data.openProf.need_geographie == 1)
      this.matieres += ", Géographie";
  }

  openConversation() {
    if (this.data.openProf.id)
      this.data.socket.emit("newConversation", {
        userID: this.data.openProf.id,
      });
    this.data.openConversation = { loaded: false };
    this.data.routerExtensions.navigate(["/messages"]);
  }

  rdv() {
    if (this.data.openProf.id)
      this.data.socket.emit("getProfAgenda", { userID: this.data.openProf.id });
    this.data.openProfAgendaModel = { hours: [], loaded: false };
    this.data.routerExtensions.navigate(["/profagenda"]);
  }

  humanTime(time) {
    return moment(time).calendar();
  }
}
