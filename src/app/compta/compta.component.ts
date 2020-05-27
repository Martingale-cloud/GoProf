import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ApplicationRef,
  OnInit,
} from "@angular/core";
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "nativescript-angular/router";
import { prompt, inputType, PromptResult } from "tns-core-modules/ui/dialogs";
import { TextField } from "tns-core-modules/ui/text-field";

import { Data } from "../shared/data/data.service";
import { AnimationCurve } from "tns-core-modules/ui/enums";

import * as moment from "moment";

import { isIOS } from "tns-core-modules/platform";

import { Color } from "tns-core-modules/color";

declare function alert(message: string);

@Component({
  moduleId: module.id,
  selector: "ns-compta",
  templateUrl: "compta.component.html",
  styleUrls: ["compta.component.css"],
})
export class ComptaComponent implements OnInit {
  constructor(
    public data: Data,
    private page: Page,
    private appRef: ApplicationRef,
    private routerExtensions: RouterExtensions
  ) {}

  ngOnInit() {
    this.data.stripeModel.loaded = false;
    this.data.socket.emit("getStripeData");
  }

  newAccount() {
    prompt({
      title: "Votre IBAN",
      defaultText: "FR",
      inputType: inputType.text,
      okButtonText: "Suivant",
      cancelButtonText: "Annuler",
    }).then((result: PromptResult) => {
      prompt({
        title: "Titulaire du compte",
        defaultText: this.data.user.fname + " " + this.data.user.lname,
        inputType: inputType.text,
        okButtonText: "Valider",
        cancelButtonText: "Annuler",
      }).then((result2: PromptResult) => {
        this.data.stripeModel.loaded = false;
        this.data.socket.emit("setStripeData", {
          iban: result.text,
          holder: result2.text,
        });
      });
    });
  }
}
