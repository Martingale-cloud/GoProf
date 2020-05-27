import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit  } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";

import { Data } from "../shared/data/data.service";

import * as moment from 'moment';

import {AnimationCurve} from "tns-core-modules/ui/enums"; 

import * as animation from "tns-core-modules/ui/animation";






@Component({
  moduleId: module.id,
  selector: "ns-addhours",
  templateUrl: "addhours.component.html",
  styleUrls: ["addhours.component.css"]
})
export class AddhoursComponent implements OnInit 
{
    formData = {add : true, days : { lun:false, mar:false, mer:false, jeu:false, ven:false, sam:false, dim:false}, hours : {h6:false, h7:false, h8:false, h9:false, h10:false, h11:false, h12:false, h13:false, h14:false, h15:false, h16:false, h17:false, h18:false, h19:false, h20:false}, noDays:10   }
    step = 1;

    constructor(public data:Data) 
        {
            moment.locale('fr'); //sets moment in french;
        }

        ngOnInit() 
        {

   
        }


        submit()
        {
            this.data.socket.emit('addhours',this.formData);
            this.data.routerExtensions.navigate(["/profagenda"]);
        }

       

        humanTime(time)
        {
            return moment(time).calendar();
        }

       

}