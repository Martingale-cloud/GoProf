import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit  } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";

import { Data } from "../shared/data/data.service";

import * as moment from 'moment';

import {AnimationCurve} from "tns-core-modules/ui/enums"; 

import * as animation from "tns-core-modules/ui/animation";






@Component({
  moduleId: module.id,
  selector: "ns-confirmcours",
  templateUrl: "confirmcours.component.html",
  styleUrls: ["confirmcours.component.css"]
})
export class ConfirmcoursComponent implements OnInit 
{
        constructor(public data:Data) 
        {
            moment.locale('fr'); //sets moment in french;
        }

        ngOnInit() 
        {
            if (!this.data.stripeModel.loaded)
                this.data.socket.emit('getStripeData');
            this.data.socket.emit('getCreditCards');
        }

        displayCCIcon(brand)
        {
            if(brand == "Visa") return "";
            else if(brand == "MasterCard") return "";
            else return "";
        }

        confirm(card)
        {
            this.data.order.card = card;
            
            console.log(this.data.order);
            this.data.socket.emit('reserver',this.data.order);
            this.data.routerExtensions.navigate(["/agenda"]);
        }

        gotocc()
        {
            this.data.routerExtensions.navigate(["/creditcards"]);
        }

       

        humanTime(m)
        {
            return m.calendar();
        }

        calcRealCost()
        {
            if (((-this.data.stripeModel.account.balance) / 100) > this.data.order.hour.fixed_price)
                return 0;
            return this.data.order.hour.fixed_price - ((-this.data.stripeModel.account.balance) / 100);
        }

       

}