import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ApplicationRef,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { Page } from "tns-core-modules/ui/page";
import { Data } from "../shared/data/data.service";
import * as moment from "moment";
import { AnimationCurve } from "tns-core-modules/ui/enums";
import * as animation from "tns-core-modules/ui/animation";
import { isIOS, isAndroid } from "tns-core-modules/platform";
import * as TimeDatePicker from "nativescript-timedatepicker";

@Component({
  moduleId: module.id,
  selector: "ns-messages",
  templateUrl: "messages.component.html",
  styleUrls: ["messages.component.css"],
})
export class MessagesComponent implements OnInit {
  newMessage = "";
  scrollDownTimeOut;
  //timer = require("timer");
  lowestMessageID = -1;

  newQuote = {
    startMoment: null,
    endMoment: null,
    price: 0,
    conversation_id: null,
    start: null,
    end: null,
  };
  newQuoteVisible = false;
  quoteVisible = false;

  constructor(public data: Data, public page: Page) {
    moment.locale("fr"); //sets moment in french;

    this.data.socket.on("updateMessages", this.scrollDownCallback.bind(this));
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.data.socket.off("updateMessages", this.scrollDownCallback);
  }

  scrollDownCallback() {
    this.scrollDownTimeOut = setTimeout(() => {
      console.log("scrolldown solustion 2");
      var mScroller: any = this.page.getViewById("scrollview");
      if (mScroller)
        mScroller.scrollToVerticalOffset(mScroller.scrollableHeight, false);
      console.log(mScroller);
    }, 500);
  }

  openNewQuote() {
    this.newQuote.startMoment = moment();
    this.newQuote.endMoment = moment().add(1, "hour");
    this.newQuoteVisible = true;
    this.newQuote.conversation_id = this.data.openConversation.id;
  }

  sendQuote() {
    //pas plus de 3 heures
    if (
      this.newQuote.endMoment.unix() - this.newQuote.startMoment.unix() >
      10800
    ) {
      alert("Veuillez ne pas proposer des cours de plus de 3 heures");
      return;
    }
    if (this.newQuote.endMoment.unix() < this.newQuote.startMoment.unix()) {
      alert("La fin de votre cours est avant le début, veuillez vérifier..");
      return;
    }

    this.newQuoteVisible = false;

    this.newQuote.start = this.newQuote.startMoment.format(
      "YYYY-MM-DD HH:mm:ss"
    );
    this.newQuote.end = this.newQuote.endMoment.format("YYYY-MM-DD HH:mm:ss");

    this.newQuote.startMoment = null;
    this.newQuote.endMoment = null;

    console.log("sending new quote");
    console.log(this.newQuote);

    this.data.socket.emit("newQuote", this.newQuote);
  }

  openQuote(id) {
    //reset du quoteModel
    this.data.openQuoteModel.loaded = false;

    //afficher le popup
    this.quoteVisible = true;

    //demander les infos
    this.data.socket.emit("getQuote", { quote_id: id });

    //récupérer les cartes
    this.data.socket.emit("getCreditCards");
  }

  humanTime(time) {
    return moment(time).calendar();
  }

  scrollDown(
    id //ajouter un léger timeout pour eviter d'appeler cette fonction pour chaque message chargée succesivement <<== le cleartimeout ne marche pas !!!
  ) {
    /*this.timer.clearTimeout(this.scrollDownTimeOut);
            
            */

    if (this.lowestMessageID < id) {
      this.lowestMessageID = id;
      clearTimeout(this.scrollDownTimeOut);
      this.scrollDownTimeOut = setTimeout(() => {
        console.log("scrolldown");
        var mScroller: any = this.page.getViewById("scrollview");
        if (mScroller)
          mScroller.scrollToVerticalOffset(mScroller.scrollableHeight, false);
      }, 500);
    }
  }

  sendMessage() {
    console.log("sending - 2");
    if (this.newMessage.length == 0) return;
    this.data.openConversation.messages.push({
      user_id: this.data.user.id,
      local: true,
      content: this.newMessage,
      id: 99999999,
    });
    //this.data.refreshUI();
    this.data.socket.emit("sendMessage", {
      message: this.newMessage,
      conversation_id: this.data.openConversation.id,
    });
    this.newMessage = "";
    var view: any = this.page.getViewById("newMessageContent");
    view.dismissSoftInput();
  }

  id2name(userID) {
    if (userID)
      return this.data.openConversation.members.filter((elm) => {
        return elm.id == userID;
      })[0].fname;
  }

  notMeArray(members) {
    var arr = [];
    members.forEach((member) => {
      if (member.id != this.data.user.id) arr.push(member);
    });
    return arr;
  }

  setTime(
    side //side is start or end
  ) {
    if (isIOS) {
      var mCallback = (result) => {
        if (result) {
          if (side == "start")
            this.newQuote.startMoment = moment(result, "D M YYYY H:m Z");
          else this.newQuote.endMoment = moment(result, "D M YYYY H:m Z");

          this.data.refreshUI();
        }
      };
      // if (side == "start")
      // TimeDatePicker.init(
      //     mCallback,
      //     null,
      //     this.newQuote.startMoment.toDate()
      // );
      // else
      // TimeDatePicker.init(
      //     mCallback,
      //     null,
      //     this.newQuote.endMoment.toDate()
      // );

      //ios : en un seul coup avec
      // TimeDatePicker.showDateTimePickerDialog();
    }
    if (isAndroid) {
      /*var mCallback2 =  (result) => {
                    if (result) {
                        //transformer result en objet date JS correct
                        //this.data.newOrder.pickuptime = moment(result,"D M YYYY H:m Z").toDate();
                        this.data.refreshUI();
                    }
                };
                var mCallback =  (result)=> {
                    if (result) {
                    TimeDatePicker.registerCallback(mCallback2);
                    TimeDatePicker.showTimePickerDialog();
                    }
                }; 

                
                TimeDatePicker.init(mCallback,null,moment(this.data.newOrder.pickuptime).toDate());

                
                TimeDatePicker.showDatePickerDialog();


                */
    }
  }

  readableTime(m) {
    return m.format("DD/MM/YYYY - HH:mm");
  }
  readableTimeFromUnix(uts) {
    return moment.unix(uts).format("DD/MM/YYYY - HH:mm");
  }

  validateQuote() {
    alert("valider..");
  }

  openLive() {
    console.log("click on live button");
    this.data.routerExtensions.navigate(["/live"]);
    //this.data.socket.emit('startlive',{conversation_id:this.data.openConversation.id, otSession : this.});
  }

  displayCCIcon(brand) {
    if (brand == "Visa") return "";
    else if (brand == "MasterCard") return "";
    else return "";
  }

  confirm(card) {
    this.data.order = {};
    this.data.order.hour = { id: this.data.openQuoteModel.quote.id };
    this.data.order.prof = { id: this.data.openQuoteModel.quote.prof_id };
    this.data.order.card = card;

    console.log(this.data.order);

    this.data.socket.emit("reserver", this.data.order);
    this.quoteVisible = false;
  }

  gotocc() {
    this.data.routerExtensions.navigate(["/creditcards"]);
  }

  openMember(member, event) {
    console.log(member.id);
    var prof = this.data.profsModel.profs.find((prof) => {
      return member.id == prof.id;
    });
    if (prof) {
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
  }
}
