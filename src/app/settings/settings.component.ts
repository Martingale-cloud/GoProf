import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit, NgZone  } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "nativescript-angular/router";
import { Image } from "tns-core-modules/ui/image";


var camera = require("nativescript-camera");



import { Data } from "../shared/data/data.service";


declare function alert(message:string);


import { ImageSource } from 'tns-core-modules/image-source';
import { StackLayout } from "tns-core-modules/ui/layouts/stack-layout/stack-layout";


declare function alert(message:string);





@Component({
  moduleId: module.id,
  selector: "ns-settings",
  templateUrl: "settings.component.html",
  styleUrls: ["settings.component.css"]
})
export class SettingsComponent implements OnInit 
{

  @ViewChild("profilepic", { static: true }) profilepic: Image;
  @ViewChild("imagecontainer", { static: true }) imagecontainer: StackLayout;

                                                

        constructor(public data:Data,private page: Page, private appRef:ApplicationRef, private routerExtensions: RouterExtensions, private zone: NgZone) 
        {
            
           
        }



        
        
        
        ngOnInit() 
        {

   
        }

        save()
        {
          this.data.socket.emit('setUserData',this.data.user);
        }



        changeProfilePicture()
        {

                camera.requestPermissions().then(
                () => {
                    camera.takePicture({ width: 480, height: 480, keepAspectRatio: true, saveToGallery: true }).
                    then((imageAsset) => 
                    {
                        console.log("Result is an image asset instance");
                        var image = new Image();
                        image.src = imageAsset;

                        let source = new ImageSource(); 
                        source.fromAsset(imageAsset).then((source) => 
                        { 
                          var b64encoded = source.toBase64String("jpg",60); 
                          var imageString = "data:image/jpg;base64,"+b64encoded;

                        
                          /*
                          Hack : settimeout + ngzone
                          Apparemnt ça fonctionne.. la l'image ets correctement rechargée, sinon c'est éxécuté trop tot...
                          */


                          setTimeout( () => {this.zone.run(()=>{
                            this.data.profileSrc = imageString;
                          })}, 100);


                          
                          this.data.socket.emit('setUserProfilePic',{ image: imageString });

                          
                            
                        });
                    });


                },() => { alert('Vous devez autoriser GoProf a utiliser votre camera pour changer la photo de profil.') }
                );
        }


}




