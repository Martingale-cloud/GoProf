import { Component, OnDestroy } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/directives/dialogs";
 import { Data } from "./../data/data.service";

 import * as camera from "nativescript-camera";
import { Image } from "tns-core-modules/ui/image";
var app = require('tns-core-modules/application');
var permissions = require("nativescript-permissions");

import { ImageSource, fromAsset } from "tns-core-modules/image-source";
import { ImageAsset } from "tns-core-modules/image-asset";

var LoadingIndicator = require("nativescript-loading-indicator").LoadingIndicator;


import { isIOS,isAndroid, screen } from "tns-core-modules/platform";
import { AndroidActionBarIconVisibility } from "tns-core-modules/ui/enums/enums";


declare var AVCaptureDevicePositionBack:any;
declare var UIImageOrientationRight:any;
declare function alert(message:string);

var imageModule = require("tns-core-modules/ui/image");
var img;
var myImageSource: ImageSource;


declare var AVCaptureDevicePositionFront:any;
declare var UIImageOrientationLeftMirrored:any;
declare var NSDataBase64EncodingEndLineWithLineFeed:any;
declare function alert(message:string);

//for ios camera
declare var AVCaptureSessionPreset640x480
declare var AVCaptureDevice
declare var AVCaptureDeviceInput
declare var AVCaptureVideoPreviewLayer
declare var UIView
declare var AVCaptureSession
declare var AVCaptureStillImageOutput
declare var AVMediaTypeVideo;
declare var UIImage;
declare var AudioServicesPlaySystemSound;
declare var UIGraphicsBeginImageContextWithOptions;
declare var CGRectMake;
declare var UIGraphicsGetImageFromCurrentImageContext;
declare var UIGraphicsEndImageContext;
declare var UIImageJPEGRepresentation;
declare var CGSizeMake;
declare var AVCaptureSessionPreset1920x1080;


  // for android camera2
  declare var java;
  declare var android;

@Component({
    moduleId: module.id,
    selector: "my-modal",
    templateUrl: "newPage.modal.html",
    styleUrls: ["newPage.modal.css"]
})
export class newpageModalComponent implements OnDestroy {
 


    private session; 


    public sources;
    public page = 'choice';
    public loader = new LoadingIndicator();
    public loaderOptions = {
        message: 'Une petite seconde...',
        progress: 0.65,
        android: {
            indeterminate: true,
            cancelable: false,
            max: 100,
            progressNumberFormat: "%1d/%2d",
            progressPercentFormat: 0.53,
            progressStyle: 1,
            secondaryProgress: 1
        },
        ios: {
            details: "Electron transporte ta photo a toute vitesse!",
            square: false,
            margin: 20,
            dimBackground: true,
            color: "#29536e"
        }
        };

        output;
    photoSrc = "";
   



    device = null; //(ios or android)



    fiches_user_id = 0





    sockedSentCreatePageWithThis = this.sockedSentCreatePage.bind(this)
 


    public constructor(public data:Data, private params: ModalDialogParams) {
        
        
        console.log('constructing modal');
        console.log(isAndroid);
        this.device = 'ios';
            if(isAndroid) this.device = 'android'
        
        this.sources = [
            {label:"Annuler", value:"none"},
            {label:"Depuis mon appareil photo", value:"camera"},
            {label:"Depuis mes fichiers", value:"files"},
            {label:"Page blanche", value:"blank"},
            {label:"Page quadrillée", value:"grid"},
            {label:"Page isométrique", value:"isometric"},
            {label:"Dupliquer la page en cours", value:"copy"}
        ];

        if(params.context.bootOnCamera) this.page = "camera";


        if(!this.data.pagesModel.loaded)this.data.socket.emit('getPages');

        this.data.socket.once('createPage', this.sockedSentCreatePageWithThis);


        

    }

    ngOnDestroy() 
    {
        
        this.data.socket.off('createPage', this.sockedSentCreatePageWithThis);
        console.log('destroyed...');
        
    }

    pullFiles($event)
        {
            console.log($event);
            this.data.socket.emit('getPages');
            $event.object.notifyPullToRefreshFinished();
            return true;
        }

    sockedSentCreatePage(page)
    {
        //la page a été crée on ferme le modal
        console.log("callback!");
        if(page.src == this.photoSrc) //c'est notre upload
        {
            console.log('the same!')
            this.loader.hide();
            this.params.closeCallback("camera");
        }
        else if(page.pageType = "file")
        {
            console.log('not the same..')
            this.loader.hide();
            this.params.closeCallback("file");
        }
    }

    

 
    public close(res: string) {
        if(res == "camera" && isIOS )this.page = "camera"; //android bypass en camera live
        
        else if(res == "files")
        {
            this.data.socket.emit('getPages');
            this.page = "files";
        }

        else this.params.closeCallback(res);
    }

    public useFile(page)
    {
        //this.loader.show(this.loaderOptions);
        //envoi au serveur, le serveur va comprendre que c'est une page de type file et ajouter les données hires depuis le serveur
        
        console.log(page);
        this.data.socket.emit('openPage',{ id:page.id });

    }

  

  creatingView(e: any) 
    {
      
      

            this.session = new AVCaptureSession();
            this.session.sessionPreset = AVCaptureSessionPreset1920x1080;
            // Adding capture device
            var device = AVCaptureDevice.defaultDeviceWithDeviceTypeMediaTypePosition("AVCaptureDeviceTypeBuiltInWideAngleCamera",AVMediaTypeVideo,AVCaptureDevicePositionBack);
            var input = AVCaptureDeviceInput.deviceInputWithDeviceError(device);
            if (!input) {
                throw new Error("Error trying to open camera.");
            }
            this.session.addInput(input);
            this.output = new AVCaptureStillImageOutput();
            this.session.addOutput(this.output);
            this.session.startRunning();
            var videoLayer = AVCaptureVideoPreviewLayer.layerWithSession(this.session);
            var view = UIView.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size: { width: 375, height: 603 } }); 
            videoLayer.frame = view.bounds;
            view.layer.addSublayer(videoLayer);
            e.view = view;
    }

    takePicture()
    {
        
            this.loader.show(this.loaderOptions);
            var videoConnection = this.output.connections[0];
        
            this.output.captureStillImageAsynchronouslyFromConnectionCompletionHandler(videoConnection, (buffer, error) => 
            {
                    this.session.stopRunning();
                    
                    var imageData = AVCaptureStillImageOutput.jpegStillImageNSDataRepresentation(buffer);
                    var image = UIImage.imageWithData(imageData);



                    AudioServicesPlaySystemSound(144);
                    
                    var image = UIImage.imageWithCGImageScaleOrientation(image.CGImage,1,UIImageOrientationRight);

                    UIGraphicsBeginImageContextWithOptions(CGSizeMake(750, 1206), true, image.scale); //soit image.size soit CGSizeMake(100.0, 100.0)
                    image.drawInRect(CGRectMake(0, -64, 750, 1270)); //dessine par dessus le canvas, ça déborde un peu au dessus et en dessous
                    var rotatedimage =  UIGraphicsGetImageFromCurrentImageContext();
                    UIGraphicsEndImageContext();
                    
                
                    var b64encoded = UIImageJPEGRepresentation(rotatedimage,0.6).base64EncodedStringWithOptions(NSDataBase64EncodingEndLineWithLineFeed);
                    this.photoSrc = "data:image/jpg;base64,"+b64encoded;
                    //this.page = "choice";

                    this.data.socket.emit('createPage',{ pageType : "camera", conversationID : 0, src : this.photoSrc });
            });
        

        
    }


    cancelTakePicture()
    {
        this.page = "choice";
    }

   

 
 



































}

