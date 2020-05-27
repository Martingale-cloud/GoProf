import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit  } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";

import { Data } from "../shared/data/data.service";

import * as moment from 'moment';

import {AnimationCurve} from "tns-core-modules/ui/enums"; 

import * as animation from "tns-core-modules/ui/animation";






@Component({
  moduleId: module.id,
  selector: "ns-heure",
  templateUrl: "heure.component.html",
  styleUrls: ["heure.component.css"]
})
export class heureComponent implements OnInit 
{
        constructor(public data:Data) 
        {
            moment.locale('fr'); //sets moment in french;
        }

        ngOnInit() 
        {

   
        }
    

        humanTime(time)
        {
            return moment(time).calendar();
        }


        openConversation()
        {
            if(this.data.user.prof == 1)//prof
            {
                if(this.data.openHour.user_id) this.data.socket.emit('newConversation',{userID:this.data.openHour.user_id});
                this.data.openConversation = {loaded:false};
                this.data.routerExtensions.navigate(["/messages"]);
            }
            else //élève
            {
                if(this.data.openHour.prof_id) this.data.socket.emit('newConversation',{userID:this.data.openHour.prof_id});
                this.data.openConversation = {loaded:false};
                this.data.routerExtensions.navigate(["/messages"]);
            }
            
            
        }

        openProfID(id)
        {
            var prof = this.data.profsModel.profs.find(prof => {return id == prof.id});
            if(prof) 
            {
                this.data.openProf = prof;
                this.data.routerExtensions.navigate(["/prof"]);
                
            }


            
        }



       

}