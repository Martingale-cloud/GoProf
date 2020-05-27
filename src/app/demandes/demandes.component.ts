import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit  } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "nativescript-angular/router";
import { View } from "tns-core-modules/ui/core/view";

import { WebView, LoadEventData } from "tns-core-modules/ui/web-view";
import { TextField } from "tns-core-modules/ui/text-field";

import { Data } from "../shared/data/data.service";
import {AnimationCurve} from "tns-core-modules/ui/enums"; 

import * as moment from 'moment';

import { isIOS } from "tns-core-modules/platform";

import {Color} from 'tns-core-modules/color'


declare function alert(message:string);

import { RadListViewComponent } from "nativescript-ui-listview/angular";

import { layout } from "tns-core-modules/utils/utils";






@Component({
  moduleId: module.id,
  selector: "ns-demandes",
  templateUrl: "demandes.component.html",
  styleUrls: ["demandes.component.css"]
})
export class DemandesComponent implements OnInit 
{
    private animationApplied = false;
    private leftItem: View;
    private rightItem: View;
    private mainView: View;

    @ViewChild("myListView", { static: true }) listViewComponent: RadListViewComponent;                                    

        constructor(public data:Data,private page: Page, private appRef:ApplicationRef, private routerExtensions: RouterExtensions) 
        {
            this.data.socket.emit('getDemandes');
        }



        
        
        
        ngOnInit() 
        {

   
        }

        

        pull($event)
        {
            console.log('pull..');
        }
        

        humanDateFromUnix(ts)
        {
            return moment.unix(ts).format('DD/MM/YYYY');
        }
        humanTimeFromUnix(ts)
        {
            return moment.unix(ts).format('HH:mm');
        }

      






    public accepter(item) {
        this.data.socket.emit('answerDemande', {hour_id:item.id, accept:true});
    }
    public refuser(item) {
        this.data.socket.emit('answerDemande', {hour_id:item.id, accept:false});
    }

       



}


