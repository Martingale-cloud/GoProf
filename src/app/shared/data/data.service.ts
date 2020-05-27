import { Injectable, ApplicationRef, NgZone } from "@angular/core";
import { isAndroid, isIOS, device, screen } from "tns-core-modules/platform";
import { RouterExtensions } from "nativescript-angular/router";
import * as platformModule from "tns-core-modules/platform";
/*declare function alert(message:string);*/
import * as moment from "moment";

var applicationSettings = require("tns-core-modules/application-settings");

import { Color } from "tns-core-modules/color";

var TnsOneSignal = require("nativescript-onesignal").TnsOneSignal;

/*
Build pour Android

Modifier le versionname et code dans manifest
tns build android --release --key-store-path /Users/vincentduprez/gits/Martingale/goprofapp/androidDistrib/release.keystore --key-store-password Romulus2000 --key-store-alias goprof --key-store-alias-password Romulus2000 --copy-to /Users/vincentduprez/gits/Martingale/goprofapp/androidDistrib/app.apk --log trace
Aller sur https://play.google.com/apps/publish

*/

//import {SocketIO} from 'nativescript-socketio';
const server = "https://dev.goprof.fr:8840";

var SocketIO = require("nativescript-socket.io");

@Injectable()
export class Data {
  //on récupère les messages enregistrés localement

  filesModel = { files: [] };
  screenW = screen.mainScreen.widthDIPs;
  screenH = screen.mainScreen.heightDIPs;
  socket;
  user = {
    id: 0,
    fname: "",
    lname: "",
    prof: 0,
    available: 2,
    game: 0,
    sid: null,
    phone: "",
    pass: "",
    pass2: "",
  };
  activeTab: number;

  profileSrc = null;
  socketConnected = false;

  notificationsModel = { notifications: [], loaded: false };
  pagesModel = { pages: [], loaded: false };
  demandesModel = { demandes: [], loaded: false };

  conversationsModel = { conversations: [], loaded: false };
  openConversation: any = { loaded: false };

  openHour = null;

  creditCardsModel = { cards: null, loaded: false };

  openQuoteModel = { quote: null, loaded: false };

  videosModel = { videos: [], loaded: false };
  openVideo: any = null;

  profsModel = { profs: [], loaded: false };
  openProf: any = null;
  openProfAgendaModel: any = { elements: [], hours: [], loaded: false };
  agendaModel: any = { hours: [], loaded: false };

  //model pour la liste des disponibilités quand on cherche
  dispoModel = { hours: [], loaded: false };

  order: any = {}; //commande de cours;

  stripeModel = {
    account: null,
    balance: null,
    pendingTransactions: null,
    availableTransactions: null,
    loaded: false,
  };

  appref;
  tokbox = { tok: "", sid: "", api: "" };
  twilio = { token: null };

  //colors (used by calendar events)
  greyish = new Color(200, 188, 26, 100);
  green = new Color(100, 250, 100, 255);

  //Alert message at bottom
  public alert = { show: false, message: "", buttons: [] };

  constructor(
    private appRef: ApplicationRef,
    public routerExtensions: RouterExtensions,
    private _ngZone: NgZone
  ) {
    this.appref = appRef;

    console.log("inside DATASERVICE");

    SocketIO.enableDebug();
    this.socket = SocketIO.connect(server, {});

    this.socket.on("connect_error", (socket) => {
      console.log("Socket error!");
    });

    this.socket.on("connect", (data) => {
      this._ngZone.run(() => {
        this.socketConnected = true;

        console.log("CONNECTED TO SERVER");

        //this.socket.emit("connected",{  });
        this.socket.emit("connectData", {
          uuid: device.uuid,
          region: device.region,
          language: device.language,
          deviceType: device.deviceType,
          manufacturer: device.manufacturer,
          model: device.model,
          sdkVersion: device.sdkVersion,
        });
      });
    });
    this.socket.on("disconnect", () => {
      this._ngZone.run(() => {
        this.socketConnected = false;
      });
    });
    this.socket.on("reconnecting", () => {
      this._ngZone.run(() => {
        this.socketConnected = false;
      });
    });
    this.socket.on("reconnect", () => {
      this._ngZone.run(() => {
        this.socketConnected = true;
      });
    });

    this.socket.on("updateModel", (model) => {
      this._ngZone.run(() => {
        console.log(" ------ updating model " + model.name + " -------");
        console.log(model);

        //update model data
        this[model.name] = model.data;

        console.log(JSON.stringify(model, null, 4));

        //if conversations, update les données de openconversation aussi, sans le remplacer (pour mettre a jour le 'read' dans la conversation)
        if (model.name == "conversationsModel" && this.openConversation) {
          this.conversationsModel.conversations.forEach((conversation) => {
            if (this.openConversation.id == conversation.id) {
              this.openConversation.last_message_time_uts =
                conversation.last_message_time_uts;
              this.openConversation.text = conversation.text;
              this.openConversation.users = conversation.users;
            }
          });
        }

        // Compta
        if (model.name == "stripeModel") {
          console.log(JSON.stringify(model.data.pendingTransactions, null, 4));
          console.log(
            JSON.stringify(model.data.availableTransactions, null, 4)
          );
        }

        //profs, trier
        if (model.name == "profsModel") {
          this.shuffle(this.profsModel.profs);
          this.profsModel.profs.sort((a, b) => {
            if (a.available == 1) return 1;
            else return -1;
          });
        }

        //calendar events prof
        if (model.name == "openProfAgendaModel") {
          var days = {};
          model.data.hours.forEach((hour) => {
            hour.start = moment.unix(hour.start_uts);
            hour.end = moment.unix(hour.end_uts);

            if (!days[moment.unix(hour.start_uts).format("YYYY-DDD")])
              days[moment.unix(hour.start_uts).format("YYYY-DDD")] = [hour];
            else
              days[moment.unix(hour.start_uts).format("YYYY-DDD")].push(hour);
          });

          this.openProfAgendaModel.days = [];
          for (const prop in days) {
            this.openProfAgendaModel.days.push(days[prop]);
          }
        }

        //agenda user
        if (model.name == "agendaModel") {
          this.agendaModel.loaded = false;
          var days = {};
          model.data.hours.forEach((hour) => {
            hour.start = moment.unix(hour.start_uts);
            hour.end = moment.unix(hour.end_uts);

            if (!days[moment.unix(hour.start_uts).format("YYYY-DDD")])
              days[moment.unix(hour.start_uts).format("YYYY-DDD")] = [hour];
            else
              days[moment.unix(hour.start_uts).format("YYYY-DDD")].push(hour);
          });

          this.agendaModel.days = [];
          for (const prop in days) {
            this.agendaModel.days.push(days[prop]);
          }
        }

        //dispo model
        if (model.name == "dispoModel") {
          this.dispoModel.hours.forEach((hour) => {
            //d'abord creer les objets moments
            hour.start = moment.unix(hour.start_uts);
            hour.end = moment.unix(hour.end_uts);
          });
        }

        //notifications
        if (model.name == "notificationsModel") {
          model.data.notifications.forEach((n) => {
            n.received = moment.unix(n.received_uts);
            n.eventDate = moment.unix(n.eventDate_uts);
          });
        }

        //set loaded flag to true
        this[model.name].loaded = true;

        //log results
        //console.log(this[model.name]);

        //refresh des views
        this.appRef.tick();
      });
    });

    this.socket.on("updateMessages", (data) => {
      console.log(" ------ updating chat -------");
      console.log(data);

      var conversation = this.conversationsModel.conversations.find((c) => {
        return c.conversation_id == data.conversation_id;
      });
      if (conversation) conversation.last_access_uts = moment().unix();

      if (!this.openConversation.loaded) {
        //si openconversations est null mais qu'on recoit quand même des messages, on force l'ouverture et on affiche
        console.log("A");
        this.openConversation = {};
        this.openConversation.id = data.conversation_id;
        this.openConversation.messages = data.messages;
        this.openConversation.members = data.members; //should be set in future version
        this.openConversation.loaded = true;
      } else if (this.openConversation.id == data.conversation_id) {
        console.log("B");

        this.openConversation.messages = data.messages;
        this.openConversation.loaded = true;
      }

      this.appRef.tick(); //unnecesary if ran into zone...
    });

    this.socket.on("updateConversation", (data) => {
      console.log("server updateConversation");
      console.log(data);

      //notifier l'utilisateur si pas son propre message
      if (data.sender.id != this.user.id) {
        //quelqu'un d'autre completement
        if (
          (this.routerExtensions.router.isActive("/messages", true) &&
            this.openConversation.id != data.conversation_id) ||
          !this.routerExtensions.router.isActive("/messages", true)
        ) {
          this.alert.message =
            "Psst! Tu as un nouveau message de la part de " +
            data.sender.fname +
            ".";
          this.alert.buttons = [
            {
              label: "Ignorer",
              action: () => {
                this.alert.show = false;
              },
            },
            {
              label: "Voir le message",
              action: () => {
                //on fait un newconversation, mais le serveur comprend que la conversation existe et ouvre la conversation
                this.alert.show = false;
                if (data.sender.id)
                  this.socket.emit("newConversation", {
                    userID: data.sender.id,
                  });
                this.openConversation = { loaded: false };
                this.routerExtensions.navigate(["/messages"]);
              },
            },
          ];
          this.alert.show = true;
        }

        if (
          this.openConversation.id == data.conversation_id &&
          this.routerExtensions.router.isActive("/messages", true)
        )
          this.socket.emit("getMessages", {
            conversation_id: data.conversation_id,
          });
      }

      //recharger les conversations (et donc les compteurs...)
      console.log("reload conversation");
      this.socket.emit("getConversations");
    });

    this.socket.on("userAlert", (data) => {
      console.log(data);
      if (data.type == "profnewrequest") {
        this.socket.emit("getDemandes");
        this.alert.message = data.message;
        this.alert.buttons = [
          {
            label: "Ignorer",
            action: () => {
              this.alert.show = false;
            },
          },
          {
            label: "Voir",
            action: () => {
              this.alert.show = false;
              this.routerExtensions.navigate(["/demandes"], {
                clearHistory: true,
                transition: {
                  name: "curlUp",
                  duration: 500,
                  curve: "linear",
                },
              });
            },
          },
        ];
        this.alert.show = true;
      } else {
        this.alert.message = data.message;
        this.alert.buttons = [
          {
            label: "Ok",
            action: () => {
              this.alert.show = false;
            },
          },
        ];
        this.alert.show = true;
      }
    });

    this.socket.on("tokBoxData", (data) => {
      console.log("received tokboxdata");
      console.log(data);
      this.tokbox = data;
    });

    this.socket.on("twilioData", (token) => {
      console.log("received twiliodata");
      console.log(token);
      this.twilio.token = token;
    });

    this.socket.on("loginOK", (data) => {
      this._ngZone.run(() => {
        this.user = data;

        this.profileSrc =
          "https://www.goprof.fr/profilepics/" + this.user.id + ".jpg";

        if (isIOS) {
          TnsOneSignal.sendTagValue("userid", this.user.id + "");
        } else if (isAndroid) {
          TnsOneSignal.sendTag("userid", this.user.id + "");
        }

        // To get demandes notifications after login
        this.socket.emit("getDemandes");
        console.log(this.user);

        /*
                this.alert.message = "Bienvenue "+this.user.fname;
                this.alert.buttons = [{label:'Ok', action:()=> { this.alert.show = false; }}];
                this.alert.show = true;
                */

        this.routerExtensions.navigate(["/home"]);
      });
    });

    this.socket.on("logout", (data) => {});
  }

  requestModel(
    model,
    forceUpdate = false,
    extraData = {} // si le service dispose déja du model, il ne va pas le recharger, sauf si forceUpdate est vrai.
  ) {
    console.log(
      "request model update to dataservice for model " + model + " ."
    );

    //faire une demande au serveur uniquement si loaded est false ou forceupdate est true
    if (!this[model].loaded || forceUpdate) {
      console.log("request accepted by dataservice, sending request to server");
      this.socket.emit("getModel", { requestedModel: model, data: extraData });
    } else
      console.log(
        "request rejected by dataservice, service already has a version of the model."
      );
  }

  refreshUI() {
    this.appRef.tick();
  }

  messageBulletCount() {
    if (!this.conversationsModel.loaded) return 0;
    var res = 0;
    this.conversationsModel.conversations.forEach((conversation) => {
      if (conversation.last_access_uts < conversation.last_message_time_uts)
        res++;
    });
    return res;
  }

  demandeBulletCount() {
    // if (!this.demandesModel.loaded) return 0;
    // console.log("----------------------------------------------");
    // console.log(this.demandesModel.demandes.length);
    // if (!this.demandesModel.loaded) return 0;
    // var res = 0;
    // this.demandesModel.demandes.forEach((demande) => {
    //   console.log("----------------------------------------------");
    //   console.log(demande);
    //   console.log("----------------------------------------------");
    //   // if (demande.last_access_uts < demande.last_message_time_uts) res++;
    // });
    return this.demandesModel.demandes.length;
  }

  screenInfo() {
    return platformModule.screen.mainScreen; // .widthPixels .heightPixels .scale
  }

  vCenterAndroid(
    e //17: center of its container in both the vertical and horizontal 1: horizontal center of its container 16: vertical center of its container
  ) {
    if (e.object.android) e.object.android.setGravity(17);
  }

  humantimeuts(uts) {
    return moment.unix(uts).format("HH:mm");
  }

  shuffle(a: Array<any>) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  }
}
