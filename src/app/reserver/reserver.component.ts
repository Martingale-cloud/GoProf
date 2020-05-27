import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit  } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";

import { Data } from "../shared/data/data.service";

import * as moment from 'moment';

import {AnimationCurve} from "tns-core-modules/ui/enums"; 

import * as animation from "tns-core-modules/ui/animation";


import { SelectedIndexChangedEventData } from "nativescript-drop-down";





@Component({
  moduleId: module.id,
  selector: "ns-reserver",
  templateUrl: "reserver.component.html",
  styleUrls: ["reserver.component.css"]
})
export class ReserverComponent implements OnInit 
{

    daylist = ["Aujourd'hui","Demain"];
    selecteddayIndex = 0;
    

    request = {matiere:0, jour:0};


        constructor(public data:Data) 
        {
            //this.data.socket.emit('getProfs');
            moment.locale('fr'); //sets moment in french;


            var daycursor = moment().add(24,'hour');
            for (let i = 0; i < 14; i++) 
            {
                daycursor.add(1,'day');
                this.daylist.push(daycursor.format("dddd D MMMM"))
                
                
            }

        }

        nextDay()
        {
            this.request.jour++;
        }

        ngOnInit() 
        {
            this.data.socket.emit('getProfs');
            this.getDispo();
        }


        // Matiere
        matieresArray = ['Français','Maths','Histoire','Geo','Anglais','Espagnol','Allemand','Physique','SVT'];
        matieredblabel = ['need_francais','need_math','need_histoire','need_geo','need_anglais','need_espagnol','need_allemand','need_physique','need_svt'];

        selectedIndex = 0;  
        onMatierechange(evt : SelectedIndexChangedEventData)
        {
            console.log(evt);

        }

        onMatiereclose()
        {

        }



        onJourchange(evt : SelectedIndexChangedEventData)
        {
            console.log(evt);
            this.request.jour = evt.newIndex; //car le callback est appelé avant de changer la valeur, on la change nous même...
            this.getDispo();
        }

        onJourclose()
        {
            
        }



        hourTap(hour)
        {
          //si élève : réserver cours

          this.data.order.hour = hour;


            var filterprof = this.data.profsModel.profs.filter(prof => {return prof.id == hour.prof_id});
            if(filterprof[0])this.data.openProf = filterprof[0];
            this.data.order.prof = this.data.openProf;


            this.data.routerExtensions.navigate(["/confirmcours"]);
        } 

        getDispo()
        {
            this.data.dispoModel.loaded = false;
            this.data.socket.emit('getDispo',this.request);
            console.log(this.request);
        }







        openHour(prof,event)
        {
            /*this.data.openProf = prof;
            event.view.animate({
                translate: { x:100, y:0 },
                opacity : 0,
                duration: 250,
                curve: AnimationCurve.easeInOut
            }).then( () => 
            {
                this.data.routerExtensions.navigate(["/prof"]);
            });
            */
        }








        humantimeuts(uts)
        {
            return moment.unix(uts).format("HH:mm");
        }

       

}
