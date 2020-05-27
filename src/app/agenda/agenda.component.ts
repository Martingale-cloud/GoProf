import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit  } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "nativescript-angular/router";

import { WebView, LoadEventData } from "tns-core-modules/ui/web-view";
import { TextField } from "tns-core-modules/ui/text-field";

import { Data } from "../shared/data/data.service";
import {AnimationCurve} from "tns-core-modules/ui/enums"; 

import * as moment from 'moment';

import { isIOS } from "tns-core-modules/platform";

import {Color} from 'tns-core-modules/color'









@Component({
  moduleId: module.id,
  selector: "ns-agenda",
  templateUrl: "agenda.component.html",
  styleUrls: ["agenda.component.css"]
})
export class AgendaComponent implements OnInit 
{


    private dayNames = ["Dimanche", "Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"]



                                            

    constructor(public data:Data,private page: Page, private appRef:ApplicationRef, private routerExtensions: RouterExtensions) 
    {

        
    }


    
    
    
    ngOnInit() 
    {
        this.data.socket.emit('getAgenda');

    }
    
    
    hourTap(hour)
    {
        this.data.openHour = hour;
        this.data.routerExtensions.navigate(["/heure"]);
    }

    dayTitle(day)
    {
      return this.dayNames[day[0].start.format('d')] + " " + day[0].start.format("DD/MM/YYYY");
    }




}


