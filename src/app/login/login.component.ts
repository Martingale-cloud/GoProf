import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit, NgZone   } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "nativescript-angular/router";
import {AnimationCurve} from "tns-core-modules/ui/enums"; 
import { View } from "tns-core-modules/ui/core/view";
import { TextField } from "tns-core-modules/ui/text-field";

import { DatePicker } from "tns-core-modules/ui/date-picker";

import { Data } from "../shared/data/data.service";

declare function alert(message:string);

import * as dialogs from "tns-core-modules/ui/dialogs";

import { isIOS, isAndroid } from "tns-core-modules/platform";

import { WebView, LoadEventData } from 'tns-core-modules/ui/web-view';
let webViewInterfaceModule = require('nativescript-webview-interface');
import * as webViewModule from "tns-core-modules/ui/web-view";
import * as utils from "tns-core-modules/utils/utils";
import * as frame from "tns-core-modules/ui/frame";



@Component({
  moduleId: module.id,
  selector: "ns-login",
  templateUrl: "login.component.html",
  styleUrls: ["login.component.css"]
})
export class LoginComponent implements OnInit 
{

    

   step="none";
   registerForm:any = {stripeToken : null, prof:0, address_line1:"", address_city:"", address_postal_code:"", dob_d:null, dob_m:null, dob_y:null, fname:"", lname:"", mail:"",phone:"", pass:"", pass2:"", need_math:true, need_histoire:false, need_francais:false, need_geo:false, need_anglais:true, need_espagnol:false, need_allemand:false, need_physique:false, need_svt:false, classe:"cm1", schoolcode:"", bio:""};
   loginForm:any = {mail:"", pass:""};
   datePicker;

   waitingforregister=false;


        webview;
        private wvInterface;
        private nativeWebView: WebView;


        constructor(public data:Data,private page: Page, private appRef:ApplicationRef, private routerExtensions: RouterExtensions, private _ngZone: NgZone) 
        {
            console.log('inside login component');
            
            this.data.socket.on('userAlert',(returndata) => 
            {
                this._ngZone.run(() => {
                    this.step = 'login';
                });
            })
           
        }



        test()
        {
            console.log('test');
        }




        ngOnInit() 
        {
            this.data.user = {id:0, fname:"", lname:"", prof:0, available:0, game:0, sid:null, phone:"", pass:"", pass2:""};  
        }
        
        
        initWebView(evt)
        {
         

            console.log('init webview');
            this.nativeWebView = this.page.getViewById('webView');
            console.log(this.nativeWebView);
            this.wvInterface = new webViewInterfaceModule.WebViewInterface(this.nativeWebView, 'https://goprof.fr/appcgu.html');

            this.wvInterface.on('log', (data) => 
            {
                console.log('webview log');
                console.log(data);
            });
            this.wvInterface.on('result', (data) => 
            {
                console.log('webview result');
                console.log(data);

                //continue register process with stripe token
                
                this.registerForm.stripeToken = data.token;
                this.data.socket.emit('register',this.registerForm);
                
            });

        }
        









        ngAfterViewInit()
        {


            this.openNone();
        }





        login()
        {

            this.step = 'wait';
            console.log("loging in...");
            this.data.socket.emit('login',this.loginForm);   
        }
        register()
        {
            console.log("register...");
            

            if (isIOS) {
                frame.topmost().nativeView.endEditing(true);
             }
             if (isAndroid) {
               utils.ad.dismissSoftInput();
             }

            //copy dob data
            this.registerForm.dob_d = this.datePicker.day;
            this.registerForm.dob_m = this.datePicker.month;
            this.registerForm.dob_y = this.datePicker.year;

            



            if(this.registerForm.prof == 0)
            {
                this.data.socket.emit('register',this.registerForm);
            }
            else if (this.registerForm.prof == 1)
            {
                  this.wvInterface.emit('doStripeRequest',this.registerForm)
            }

            console.log(this.registerForm);
            this.waitingforregister = true;


        }

        rp()
        {
            dialogs.prompt({
                title: "Mot de passe oublié",
                message: "Veuillez nous indiquer votre adresse e-mail",
                okButtonText: "Ok",
                cancelButtonText: "Annuler",
                defaultText: this.loginForm.mail,
                inputType: dialogs.inputType.text
            }).then(r => {
                console.log(r);
                if(r.result)
                {
                    console.log('sending..');
                    this.data.socket.emit('resetpass',{mail:r.text});
                }
            });
        }



        openLogin()
        {
            this.step = 'login';
        }
        openRegister()
        {
            this.step = 'register';
        }
        openNone()
        {
            
            //show logo
           // (<View>this.page.getViewById("logo")).animate({opacity:1,duration: 2000,translate: { x:0, y:0 },curve: AnimationCurve.spring,delay:220,});

            //show perso
            //(<View>this.page.getViewById("perso")).animate({opacity:1,duration: 3000,translate: { x:0, y:0 },curve: AnimationCurve.spring,delay:1220,});
            

            this.step = 'none';
                        
        }



        /* DOB datepicker */
        onPickerLoaded(args) { //this is NOT zero based ! 
            this.datePicker = <DatePicker>args.object;
            this.datePicker.year = 1980;
            this.datePicker.month = 1;
            this.datePicker.day = 1;
            this.datePicker.minDate = new Date(1900, 1, 1);
            this.datePicker.maxDate = new Date(2020, 1, 1);
        }

}


