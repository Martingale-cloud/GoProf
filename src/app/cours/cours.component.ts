import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit  } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "nativescript-angular/router";
import { Data } from "../shared/data/data.service";
import { ios } from "tns-core-modules/application/application";

import { Video } from "nativescript-videoplayer";
import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';


declare function alert(message:string);




@Component({
  moduleId: module.id,
  selector: "ns-cours",
  templateUrl: "cours.component.html",
  styleUrls: ["cours.component.css"]
})
export class CoursComponent implements OnInit 
{
        matiere = 'Français';
        timer;
        isFS = false;

        videoData = {id:0, time:0, total:0, pct:0, playing:false, filling:true}
        player;


        constructor(public data:Data,private page: Page, private appRef:ApplicationRef, private routerExtensions: RouterExtensions) 
        {
                this.timer = setInterval(() => 
                {
                        
                        if(this.videoData.id != 0)
                        {
                                if(this.player)
                                {
                                 
                                        this.videoData.time = Math.round(this.player.getCurrentTime()/1000);
                                        this.videoData.total = Math.round(this.player.getDuration()/1000);
                                        this.videoData.pct = (this.videoData.time/this.videoData.total) *100;
                                        if(isNaN(this.videoData.pct)) this.videoData.pct = 0;
                                }
                        }
                }, 500);
           
        } 



        ngOnInit() 
        {
                this.data.socket.emit('getVideos');
                console.log(this.data.screenInfo().widthPixels);
        }
        ngOnDestroy()
        {
                if(this.player) this.player.destroy()
                this.videoData.total = 0;
                this.videoData.time = 0;
                this.videoData.pct = 0;
        }

        openPlayer(obj)
        {

                //reset rapide des données
                this.videoData.id = 0;
                this.videoData.total = 1;
                this.videoData.time = 1;
                this.videoData.pct = 1;

                console.log(1);

                
                //créer le nouveau player si il n'existe pas encore
                if(!this.player)
                {
                        this.player = new Video();
                        this.player.on('tap',() => 
                        {
                                if(this.isFS) //uniquement en full
                                {
                                        this.videoData.filling = !this.videoData.filling;
                                        this.player.setMode("PORTRAIT",this.videoData.filling);
                                }
                                
                        })
                }
                else 
                {
                     //retirer de son parent
                     this.player.parent.removeChild(this.player);   
                }

                console.log(2);
           
                this.player.src = obj.videoURL;
                this.player.controls = false;
                this.player.autoplay = true;
                this.player.observeCurrentTime = true;

                if(ios)this.player.setMode("PORTRAIT",true); //remplir l'écran par défaut pour éviter le petir liseret noir

                console.log(3);

                this.videoData.id = obj.id;
                this.videoData.playing = true;
                this.isFS = false;

                console.log(4);

                const stack = this.page.getViewById("videostack"+obj.id) as StackLayout;

                console.log(5);
                this.player.width = stack.getActualSize().width;
                console.log(6);
                this.player.height = Math.round((stack.getActualSize().width/16)*9);
                console.log(7);
                stack.addChild(this.player);

                

                

                
        }


        fs(fs)
        {
                if(fs) //going fullscreen
                        { 
                                
                                
                                var headerHeight = (<StackLayout>this.page.getViewById("header")).getActualSize().height;

                                var destinationHeight = this.data.screenW;
                                var destinationWidth = this.data.screenH-headerHeight+15; // 15 = taille des spikes



                                
                                this.isFS = true;
                                
                                        
                                this.player.parent.removeChild(this.player);
                                
                                //Changer la taille du lecteur
                                this.player.width = destinationWidth;
                                this.player.height = destinationHeight; 

                                //Déplacer le lecteur
                                this.player.left = -(this.player.width - this.data.screenW)/2; 
                                this.player.top = (this.player.width - this.player.height )/2; 
                                this.player.rotate = 90;

                                //Essayer de lui donner des boutons de controle...
                                //this.player.controls = true;

                                //ne pas remplir le lecteur
                                if(ios)this.player.setMode("PORTRAIT",false); 
                                                                
                                
                                //Faire apparaitre le stack plein écran
                                const stack = this.page.getViewById("fsPlayerStack") as StackLayout;
                                stack.row = 1;
                                stack.addChild(this.player);


                        }
                        else //back to normal
                        {
                                

                                const stack2 = this.page.getViewById("videostack"+this.videoData.id) as StackLayout;

                                this.isFS = false;
                                
                                this.player.parent.removeChild(this.player);
                                
                                //changer la taille du lecteur
                                this.player.width = stack2.getActualSize().width;
                                this.player.height = Math.round((stack2.getActualSize().width/16)*9); 

                                //Déplacer le lecteur
                                this.player.rotate = 0;

                                //Essayer de lui donner des boutons de controle...
                                //this.player.controls = false;

                                //Remplir le lecteur
                                if(ios)this.player.setMode("PORTRAIT",true); 


                                stack2.addChild(this.player);

                                //dégager le stack plein écran 
                                const stack = this.page.getViewById("fsPlayerStack") as StackLayout;
                                stack.row = 2;
                        }
        }

        play(play)
        {
                if(this.player && this.videoData.id > 0)
                {
                        if(play)
                        {
                                this.player.play();
                                this.videoData.playing = true;
                        }
                        else 
                        { 
                                this.player.pause();
                                this.videoData.playing = false;
                        }
                }
        }

        seek(seconds)
        {
                this.videoData.time += seconds;
                this.player.seekToTime(this.videoData.time*1000);
        }
        

        human(s)
        {
                var m = Math.floor(s/60);
                return this.pad(m,2) +':' + this.pad((s-m*60),2);
        }

        pad(num, places) {
                var zero = places - num.toString().length + 1;
                return Array(+(zero > 0 && zero)).join("0") + num;
              }

    
      

}


