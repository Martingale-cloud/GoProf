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
  selector: "ns-profagenda",
  templateUrl: "profagenda.component.html",
  styleUrls: ["profagenda.component.css"]
})
export class ProfagendaComponent implements OnInit 
{


        private dayNames = ["Dimanche", "Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"]


                                                

        constructor(public data:Data,private page: Page, private appRef:ApplicationRef, private routerExtensions: RouterExtensions) 
        {

            
        }


        
        
        
        ngOnInit() 
        {


            //si on est prof on charge son propre profagenda
            if(this.data.user.prof == 1)
            {
              this.data.socket.emit('getProfAgenda',{userID:this.data.user.id});
            }
        }


        dayTitle(day)
        {
          return this.dayNames[day[0].start.format('d')] + " " + day[0].start.format("DD/MM/YYYY");
        }

       

        
        hourTap(hour)
        {
          console.log(hour);
          //si élève : réserver cours

          if(this.data.user.prof == 0)
          {
              if(hour.available)
              {
                    this.data.order.hour = hour;
                    this.data.order.prof = this.data.openProf;
                    this.data.routerExtensions.navigate(["/confirmcours"]);
              }
              else
              {
                this.data.alert.message = "Ce cours n'est plus disponible....";
                this.data.alert.buttons = [{label:'Ok', action:()=> { this.data.alert.show = false; }}];
                this.data.alert.show = true;
              }
          }

          if(this.data.user.prof == 1 && !hour.showOptions)
          {
              hour.showOptions = true;
          }


        } 

        hideHourOptions(hour)
        {
          hour.showOptions = false;
        }
        
        deleteHour(hour)
        {
          this.data.socket.emit('deletehour',hour.id);
          hour.showOptions = false;
          hour.deleted = true;
          //this.data.openProfAgendaModel.loaded = false;
        }



}


