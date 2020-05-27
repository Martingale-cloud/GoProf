import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit  } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "nativescript-angular/router";

import { WebView, LoadEventData } from "tns-core-modules/ui/web-view";
import { TextField } from "tns-core-modules/ui/text-field";

import { Data } from "../shared/data/data.service";
import {AnimationCurve} from "tns-core-modules/ui/enums"; 

import * as moment from 'moment';
import { View } from "tns-core-modules/ui/core/view";

import { isIOS } from "tns-core-modules/platform";

import {Color} from 'tns-core-modules/color'
import { layout } from "tns-core-modules/utils/utils";


declare function alert(message:string);


import { RadListViewComponent } from "nativescript-ui-listview/angular";
import { ListViewEventData, RadListView } from "nativescript-ui-listview";






@Component({
  moduleId: module.id,
  selector: "ns-notifications",
  templateUrl: "notifications.component.html",
  styleUrls: ["notifications.component.css"]
})
export class NotificationsComponent implements OnInit 
{
    
    private animationApplied = false;
    private leftItem: View;
    private rightItem: View;
    private mainView: View;
         
    @ViewChild("myListView", { static: true }) listViewComponent: RadListViewComponent;                                    


        constructor(public data:Data,private page: Page, private appRef:ApplicationRef, private routerExtensions: RouterExtensions) 
        {
            this.data.socket.emit('getNotifications');
        }



        
        
        
        ngOnInit() 
        {

   
        }


        pull($event)
        {
            this.data.socket.emit('getNotifications');
            return true;
            
        }
        

        humanTime(m)
        {
            return m.calendar();
        }

      

       
        // >> angular-listview-swipe-action-multiple
    public onCellSwiping(args: ListViewEventData) {
        var swipeLimits = args.data.swipeLimits;
        var swipeView = args['swipeView'];
        this.mainView = args['mainView'];
        this.leftItem = swipeView.getViewById('left-stack');
        this.rightItem = swipeView.getViewById('right-stack');

        if (args.data.x > 0) {
            var leftDimensions = View.measureChild(
                <View>this.leftItem.parent,
                this.leftItem,
                layout.makeMeasureSpec(Math.abs(args.data.x), layout.EXACTLY),
                layout.makeMeasureSpec(this.mainView.getMeasuredHeight(), layout.EXACTLY));
            View.layoutChild(<View>this.leftItem.parent, this.leftItem, 0, 0, leftDimensions.measuredWidth, leftDimensions.measuredHeight);
            this.hideOtherSwipeTemplateView("left");
        } else {
            var rightDimensions = View.measureChild(
                <View>this.rightItem.parent,
                this.rightItem,
                layout.makeMeasureSpec(Math.abs(args.data.x), layout.EXACTLY),
                layout.makeMeasureSpec(this.mainView.getMeasuredHeight(), layout.EXACTLY));

            View.layoutChild(<View>this.rightItem.parent, this.rightItem, this.mainView.getMeasuredWidth() - rightDimensions.measuredWidth, 0, this.mainView.getMeasuredWidth(), rightDimensions.measuredHeight);
            this.hideOtherSwipeTemplateView("right");
        }
    }

    private hideOtherSwipeTemplateView(currentSwipeView: string) {
        switch (currentSwipeView) {
            case "left":
                if (this.rightItem.getActualSize().width != 0) {
                    View.layoutChild(<View>this.rightItem.parent, this.rightItem, this.mainView.getMeasuredWidth(), 0, this.mainView.getMeasuredWidth(), 0);
                }
                break;
            case "right":
                if (this.leftItem.getActualSize().width != 0) {
                    View.layoutChild(<View>this.leftItem.parent, this.leftItem, 0, 0, 0, 0);
                }
                break;
            default:
                break;
        }
    }
    // << angular-listview-swipe-action-multiple
    // >> angular-listview-swipe-action-multiple-limits
    public onSwipeCellStarted(args: ListViewEventData) {
        var swipeLimits = args.data.swipeLimits;
        swipeLimits.threshold = args['mainView'].getMeasuredWidth() * 0.2; // 20% of whole width
        swipeLimits.left = swipeLimits.right = args['mainView'].getMeasuredWidth() * 0.65 // 65% of whole width
    }
    // << angular-listview-swipe-action-multiple-limits
    public onSwipeCellFinished(args: ListViewEventData) {
        if (args.data.x > 200) {
            console.log("Perform left action");
        } else if (args.data.x < -200) {
            console.log("Perform right action");
        }
        this.animationApplied = false;
    }


    public onNotifTap(notif)
    {
        /*
        InAppNotifications.getInstance().showNotification(notif.text, notif.title, () => {
        });
      */
    }

    public onLeftSwipeClick(args: ListViewEventData) {
        //this.data.socket.emit('answerDemande', {hour_id:args.object.bindingContext.id, accept:true});
        //console.log(args.object.bindingContext);
        
        /*InAppNotifications.getInstance().showNotification(args.object.bindingContext.text, args.object.bindingContext.title, () => {
            console.log('tap');
        });
        */
        this.listViewComponent.listView.notifySwipeToExecuteFinished();
    }

    public onRightSwipeClick(args: ListViewEventData) {
        //this.data.socket.emit('answerDemande', {hour_id:args.object.bindingContext.id, accept:false});

        this.data.notificationsModel.notifications.splice(this.data.notificationsModel.notifications.indexOf(args.object.bindingContext),1);
        console.log(args.object.bindingContext);

        this.listViewComponent.listView.notifySwipeToExecuteFinished();
    }
       





}


