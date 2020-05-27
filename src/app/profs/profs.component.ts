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
const util = require("util");

@Component({
  moduleId: module.id,
  selector: "ns-profs",
  templateUrl: "profs.component.html",
  styleUrls: ["profs.component.css"],
})
export class ProfsComponent implements OnInit {
  private subjectCount = 0;
  constructor(public data: Data) {
    this.data.socket.emit("getProfs");
    moment.locale("fr"); //sets moment in french;
  }

  ngOnInit() {}

  ngAfterViewInit() {}

  openProf(prof, event) {
    this.data.openProf = prof;
    event.view
      .animate({
        translate: { x: 100, y: 0 },
        opacity: 0,
        duration: 250,
        curve: AnimationCurve.easeInOut,
      })
      .then(() => {
        this.data.routerExtensions.navigate(["/prof"]);
      });
  }

  lessThanFourSubjects(prof) {
    if (prof.need_math) this.subjectCount++;
    else if (prof.need_histoire) this.subjectCount++;
    else if (prof.need_geographie) this.subjectCount++;
    else if (prof.need_francais) this.subjectCount++;
    else if (prof.need_espagnol) this.subjectCount++;
    else if (prof.need_allemand) this.subjectCount++;
    else if (prof.need_physique) this.subjectCount++;
    else if (prof.need_svt) this.subjectCount++;
    else if (prof.need_anglais) this.subjectCount++;
    return this.subjectCount < 4;
  }

  moreThanThreeSubjects() {
    return this.subjectCount > 3 && this.subjectCount != 0;
  }

  setSubjectCount(value) {
    this.subjectCount = value;
  }

  humanTime(time) {
    return moment(time).calendar();
  }
}
