import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit  } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "nativescript-angular/router";
import { View } from "tns-core-modules/ui/core/view";
import { WebView, LoadEventData } from "tns-core-modules/ui/web-view";
import { TextField } from "tns-core-modules/ui/text-field";

import { Data } from "../shared/data/data.service";
import {AnimationCurve} from "tns-core-modules/ui/enums"; 


import { isIOS } from "tns-core-modules/platform";

declare function alert(message:string);








@Component({
  moduleId: module.id,
  selector: "ns-home",
  templateUrl: "home.component.html",
  styleUrls: ["home.component.css"]
})
export class HomeComponent implements OnInit 
{
        public webviewsrc = "http://goprof.fr/draw.html";
        public url = "https://www.google.com";

        public connectStatus = "not connected";
        labMoved = false;
        labLight = false;

        logo;
        
        


        constructor(public data:Data,private page: Page, private appRef:ApplicationRef, private routerExtensions: RouterExtensions) 
        {
            
           
        }


        connect(userid)
        {
                
                
        }

        setAvailable(status)
        {
            this.data.user.available = status;
            this.data.socket.emit('setUserData',this.data.user);

        }

        goto(url)
        {
            this.routerExtensions.navigate([url]);
        }

        call(userid)
        {
               
        }


        mainscroll(ev)
        {
            (<View>this.page.getViewById("logo")).animate({translate: { x: 0, y: -ev.scrollY/2}, duration: 0});            
        }



        ngOnInit() 
        {
            console.log('oninit homecomponent');
            
            if(this.data.user == null)
            {
                console.log("user not logged!");
                 
                this.routerExtensions.navigate(["/login"], { //login, gaemenu only for game dev
                    clearHistory: true,
                    transition: {
                        name: "curlDown",
                        duration: 500,
                        curve: "linear"
                    }
                });
                
            }
        

        
        }

        ngAfterViewInit()
        {
        
        

        }

        debug()
        {
            console.log(this.data);
        }


        openLive()
        {
            this.routerExtensions.navigate(["/live"], {
                transition: {
                    name: "curlDown",
                    duration: 500,
                    curve: "linear"
                }
            });
        }

       

        openCours()
        {
 
            this.routerExtensions.navigate(["/cours"], {
                transition: {
                    name: "curlDown",
                    duration: 300,
                    curve: "linear"
                }
            }).then(()=>{ });


        }



        opengame()
        {
            console.log('openGame');
            this.routerExtensions.navigate(["/game"], {
                clearHistory: true,
                transition: {
                    name: "curlDown",
                    duration: 500,
                    curve: "linear"
                }
            });
        }


       



}


