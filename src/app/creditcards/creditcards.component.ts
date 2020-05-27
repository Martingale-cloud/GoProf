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

import { WebView, LoadEventData } from "tns-core-modules/ui/web-view";
import { TextField } from "tns-core-modules/ui/text-field";

import { Data } from "../shared/data/data.service";
import { AnimationCurve } from "tns-core-modules/ui/enums";

import * as moment from "moment";

import { isIOS } from "tns-core-modules/platform";

import { Color } from "tns-core-modules/color";

declare function alert(message: string);

import { Card, Stripe } from "nativescript-stripe";
const stripe = new Stripe("pk_live_Qm2aS8T4Q3peTCTvBHeQJHjy");

@Component({
  moduleId: module.id,
  selector: "ns-creditcards",
  templateUrl: "creditcards.component.html",
  styleUrls: ["creditcards.component.css"],
})
export class CreditcardsComponent implements OnInit {
  newcard = { name: "", number: null, month: null, year: null, cvc: null };
  paymode = false;

  constructor(
    public data: Data,
    private page: Page,
    private appRef: ApplicationRef,
    private routerExtensions: RouterExtensions
  ) {}

  ngOnInit() {
    this.data.socket.emit("getCreditCards");
  }

  displayCCIcon(brand) {
    if (brand == "Visa") return "";
    else if (brand == "MasterCard") return "";
    else return "";
  }

  addCard() {
    this.data.creditCardsModel.loaded = false;

    const cc = new Card(
      this.newcard.number,
      this.newcard.month,
      this.newcard.year,
      this.newcard.cvc
    );
    cc.name = this.newcard.name;

    stripe.createToken(cc, (error, token) => {
      if (!error) {
        //Do something with your token;
        console.log("token created");
        console.log(token.id);
        console.log(token);

        this.data.socket.emit("addNewCreditCard", {
          token: token.id || token,
        });
      } else {
        console.log(error);
      }
    });
    this.newcard = {
      name: "",
      number: null,
      month: null,
      year: null,
      cvc: null,
    };
    this.data.refreshUI();
  }

  deleteCard(card) {
    console.log(card);
    this.data.socket.emit("deleteCreditCard", { card_id: card.id });
  }
}
