
import { Component, ViewChild, ElementRef, ApplicationRef,  AfterViewInit, OnInit,  OnDestroy, ChangeDetectorRef, ViewContainerRef } from "@angular/core";
import { WebView, LoadEventData } from 'tns-core-modules/ui/web-view';
let webViewInterfaceModule = require('nativescript-webview-interface');

declare function alert(message:string);

import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "nativescript-angular/router";
import { Data } from "../shared/data/data.service";

import * as dialogs from "tns-core-modules/ui/dialogs";


import { isIOS } from "tns-core-modules/platform";






@Component({
  moduleId: module.id,
  selector: "ns-game",
  templateUrl: "game.component.html",
  styleUrls: ["game.component.css"]
})
export class GameComponent implements AfterViewInit, OnDestroy 
{
        @ViewChild('webView', { static: true }) webView: ElementRef;
        private wvInterface;
        private nativeWebView: WebView;


        constructor(public data:Data,private page: Page, private appRef:ApplicationRef, private routerExtensions: RouterExtensions, private vcRef: ViewContainerRef) 
        {
        }

     

        ngAfterViewInit()
        {
           
            this.nativeWebView = this.webView.nativeElement;
            //if vincent
            if(this.data.user.game == 2)
            {

                console.log(this.data.socket);
                
                dialogs.action({
                    message: "Dev Version?",
                    cancelButtonText: "Cancel",
                    actions: ["Offline Dev", "Online Dev", "Real"]
                }).then(result => {
                    if(result == "Offline Dev")
                    {
                        dialogs.prompt("ip?", "dev machine IP?").then(r => {
                            this.wvInterface = new webViewInterfaceModule.WebViewInterface(this.nativeWebView, r.result+':3000/?dev');
                        });
                    }
                    else if(result == "Online Dev")
                    {
                        this.wvInterface = new webViewInterfaceModule.WebViewInterface(this.nativeWebView, 'https://betagame.goprof.fr?dev');
                    }
                    else if(result == "Real")
                    {
                        this.wvInterface = new webViewInterfaceModule.WebViewInterface(this.nativeWebView, 'https://betagame.goprof.fr?'+this.data.user.sid);
                        console.log('https://betagame.goprof.fr?'+this.data.user.sid);
                    }
                });
                

                


                
                
            }
            else this.wvInterface = new webViewInterfaceModule.WebViewInterface(this.nativeWebView, 'https://betagame.goprof.fr?'+this.data.user.sid);


        
        }

        
        ngOnDestroy() {
            // cleaning up references/listeners.
            console.log('session destroy');
           
        }

        
   
}