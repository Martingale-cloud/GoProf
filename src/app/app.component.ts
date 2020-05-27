import { Component, OnInit, ElementRef, ViewChild, AfterViewInit} from "@angular/core";
import * as email from "nativescript-email";
import { Page } from "tns-core-modules/ui/page";
import {AnimationCurve} from "tns-core-modules/ui/enums"; 
import {View, isIOS, isAndroid} from 'tns-core-modules/ui/core/view'; 

import { Data } from "./shared/data/data.service";

import { RouterExtensions } from "nativescript-angular/router";

declare var CGSizeMake;


@Component({
    selector: "ns-app",
    templateUrl: "./app.component.html",
    styleUrls: ["app.component.css"],
})
export class AppComponent implements OnInit, AfterViewInit  { 

    menuOpen = false;
    


    constructor(public data:Data, private page: Page,public routerExtensions: RouterExtensions)
    {
        //remove top bar Android
        //page.actionBarHidden = true;  //fait planter sur ios...
        
        if(isAndroid)page.actionBarHidden = true;



    }

    openMenu()
    {


       if(!this.menuOpen)
        {
            

            (<View>this.page.getViewById("appContainer")).animate({
                        translate: { x:220, y:50 },
                        opacity:1,
                        scale: {x:0.85,y:0.85} ,
                        duration: 250,
                        rotate:5,
                        curve: AnimationCurve.easeInOut
                    }).then(()=>{this.menuOpen = true;});
            
            (<View>this.page.getViewById("menu")).animate({
                        translate: { x:0, y:0 },
                        curve: AnimationCurve.easeInOut,
                        duration: 250
                    });
        }
       
        else this.closeMenu();
        
    }

    closeMenu()
    {
        if(this.menuOpen)
        {
            (<View>this.page.getViewById("appContainer")).animate({
                            translate: { x:0, y:0 },
                            opacity:1,
                            scale: {x:1,y:1} ,
                            duration: 250,
                            rotate:0,
                            curve: AnimationCurve.easeInOut
                        }).then(()=>{this.menuOpen = false;});
            
            (<View>this.page.getViewById("menu")).animate({
                        translate: { x:-30, y:0 },
                        curve: AnimationCurve.easeInOut,
                        duration: 250
                    });
        }
        
    }

    contact()
    {
        email.compose({
            subject: "Contact depuis l'application Goprof",
            to: ['contact@goprof.fr'],
            body: "Bonjour,"
        })
    }

    logout()
    {
        this.data.socket.emit('logout',{});
        this.closeMenu();
        this.data.user.id = 0;
        this.routerExtensions.navigate(["/login"], {
            clearHistory: true});
    }

    goto(url)
    {
        this.routerExtensions.navigate([url]);
        this.closeMenu();
    }

    shouldShowBackBtn()
    {
        if( this.data.routerExtensions.router.isActive('/player', true) ) return true;
        else if( this.data.routerExtensions.router.isActive('/messages', true) ) return true;
        else if( this.data.routerExtensions.router.isActive('/prof', true) ) return true;
        else if( this.data.routerExtensions.router.isActive('/confirmcours', true) ) return true;
        else if( this.data.routerExtensions.router.isActive('/heure', true) ) return true;
        else if( this.data.routerExtensions.router.isActive('/profagenda', true) ) return true;
        else if( this.data.routerExtensions.router.isActive('/addhours', true) ) return true;
        else return false;
    }

    back()
    {
        //change page
        this.routerExtensions.back();
    }
   

    ngOnInit()
    {
                

        
    }


    appclick()
    {
        if(this.menuOpen) this.closeMenu();
    }

    ngAfterViewInit()
    {
        //appContainer shadow
        /*
        if(ios)
        {

            let appCont = this.page.getViewById('appContainer');
            appCont.ios.layer.masksToBounds = false;
            appCont.ios.layer.shadowOpacity = 0.4;
            appCont.ios.layer.shadowRadius = 25.0;
            appCont.ios.layer.shadowColor = new Color('#000000').ios.CGColor;
            appCont.ios.layer.shadowOffset = CGSizeMake(0.0, 0.0);
        }
        */


    }

}
