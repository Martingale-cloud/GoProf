import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit, OnDestroy  } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "nativescript-angular/router";
import { Data } from "../shared/data/data.service";
import { isAndroid } from "tns-core-modules/platform";
import { Video } from "nativescript-videoplayer";


declare function alert(message:string);




@Component({
  moduleId: module.id,
  selector: "ns-player",
  templateUrl: "player.component.html",
  styleUrls: ["player.component.css"]
})
export class PlayerComponent implements OnInit 
{
    private _videoPlayer: Video;
    private completed: boolean;
    public showInfo = false;

        constructor(public data:Data,private page: Page, private appRef:ApplicationRef, private routerExtensions: RouterExtensions) 
        {
            
            this.completed = false;
           
        }

        // /Applications/Iris.app/Contents/MacOS/ffmpeg -i /Volumes/data/export/reconnaitre-le-participe-passe.mov -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart output.mp4
        // ffmpeg -i /rendu -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/31.mp4

        /*
        astuce : Process en batch via shell script
        d'abord remplir la DB, renommer les sources en #.mov
        */

        // -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/

        /*
        LEO

        ffmpeg -i ./Rendu\ Manon/52.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/52.mp4
        ffmpeg -i ./Rendu\ Manon/53.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/53.mp4
        ffmpeg -i ./Rendu\ Manon/54.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/54.mp4
        ffmpeg -i ./Rendu\ Manon/55.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/55.mp4
        ffmpeg -i ./Rendu\ Manon/56.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/56.mp4
        ffmpeg -i ./Rendu\ Manon/57.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/57.mp4
        ffmpeg -i ./Rendu\ Manon/58.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/58.mp4
        ffmpeg -i ./Rendu\ Manon/59.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/59.mp4
        ffmpeg -i ./Rendu\ Manon/60.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/60.mp4
        ffmpeg -i ./Rendu\ Manon/61.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/61.mp4
        ffmpeg -i ./Rendu\ Manon/62.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/62.mp4
        ffmpeg -i ./Rendu\ Manon/63.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/63.mp4
        ffmpeg -i ./Rendu\ Manon/64.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/64.mp4
        ffmpeg -i ./Rendu\ Manon/65.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/65.mp4
        ffmpeg -i ./Rendu\ Manon/66.mp4 -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart 720/66.mp4



        creer une image : 

        ffmpeg -y  -i 720/31.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/31.jpg
        ffmpeg -y  -i 720/32.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/32.jpg
        ffmpeg -y  -i 720/33.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/33.jpg
        ffmpeg -y  -i 720/34.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/34.jpg
        ffmpeg -y  -i 720/35.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/35.jpg
        ffmpeg -y  -i 720/36.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/36.jpg
        ffmpeg -y  -i 720/37.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/37.jpg
        ffmpeg -y  -i 720/38.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/38.jpg
        ffmpeg -y  -i 720/39.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/39.jpg
        ffmpeg -y  -i 720/40.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/40.jpg
        ffmpeg -y  -i 720/41.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/41.jpg
        ffmpeg -y  -i 720/42.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/42.jpg
        ffmpeg -y  -i 720/43.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/43.jpg
        ffmpeg -y  -i 720/44.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/44.jpg
        ffmpeg -y  -i 720/45.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/45.jpg
        ffmpeg -y  -i 720/46.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/46.jpg
        ffmpeg -y  -i 720/47.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/47.jpg
        ffmpeg -y  -i 720/48.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/48.jpg
        ffmpeg -y  -i 720/49.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/49.jpg
        ffmpeg -y  -i 720/50.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/50.jpg
        ffmpeg -y  -i 720/51.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/51.jpg
        ffmpeg -y  -i 720/52.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/52.jpg
        ffmpeg -y  -i 720/53.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/53.jpg
        ffmpeg -y  -i 720/54.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/54.jpg
        ffmpeg -y  -i 720/55.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/55.jpg
        ffmpeg -y  -i 720/56.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/56.jpg
        ffmpeg -y  -i 720/57.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/57.jpg
        ffmpeg -y  -i 720/58.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/58.jpg
        ffmpeg -y  -i 720/59.mp4 -f mjpeg -vframes 1 -ss 15 -s 640x360 720/59.jpg







        */


        ngOnInit() 
        {
            this._videoPlayer = <Video>this.page.getViewById("nativeVideoPlayer");
        }

        ngOnDestroy()
        {
            this._videoPlayer.destroy();
            console.log('leaving video');
        }

        public videoFinished(args) {
                this.completed = true;

                this.routerExtensions.navigate(["/cours"], {
                        transition: {
                            name: "curlUp",
                            duration: 300,
                            curve: "linear"
                        }
                    });

            }


          public pauseVideo() {
            this._videoPlayer.pause();
        }


        /**
         * Play the video
         */
        public playVideo() {
            this._videoPlayer.play();
            this.completed = false;
        }



}


