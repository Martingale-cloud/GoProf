import {
  Component,
  ViewChild,
  ElementRef,
  ApplicationRef,
  AfterViewInit,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewContainerRef,
} from "@angular/core";
import { WebView, LoadEventData } from "tns-core-modules/ui/web-view";
let webViewInterfaceModule = require("nativescript-webview-interface");
import * as app from "tns-core-modules/application";
import { ImageSource } from "tns-core-modules/image-source";

var LoadingIndicator = require("nativescript-loading-indicator")
  .LoadingIndicator;

import * as webViewModule from "tns-core-modules/ui/web-view";
import * as fs from "tns-core-modules/file-system";

import * as dialogs from "tns-core-modules/ui/dialogs";

declare function alert(message: string);
const timer = require("tns-core-modules/timer");

var permissions = require("nativescript-permissions");

import { View } from "tns-core-modules/ui/core/view";
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "nativescript-angular/router";
import { Data } from "../shared/data/data.service";

import { ModalDialogService } from "nativescript-angular/directives/dialogs";
import { newpageModalComponent } from "./../shared/modals/newPage.modal";

import { isIOS, isAndroid } from "tns-core-modules/platform";

//@ts-ignore
import { LocalVideo, VideoActivity, RemoteVideo } from "nativescript-twilio-video";
import { Image } from "tns-core-modules/ui/image";
import * as camera from "nativescript-camera";

import { registerElement } from "nativescript-angular/element-registry";
registerElement("LocalVideo", () => LocalVideo);
//@ts-ignore
registerElement("RemoteVideo", () => RemoteVideo);

declare var AVCaptureDevicePositionBack;
declare var AVCaptureDevicePositionFront;
declare var com: any;
declare var android: any;
declare var AVCaptureDevice: any;
declare var AVMediaTypeVideo: any;
declare var AVMediaTypeAudio: any;
declare var UIApplication: any;
declare var NSURL: any;
declare var UIApplicationOpenSettingsURLString: any;
declare var AVAudioSession: any;

@Component({
  moduleId: module.id,
  selector: "ns-live",
  templateUrl: "live.component.html",
  styleUrls: ["live.component.css"],
})
export class LiveComponent implements OnInit, OnDestroy {
  @ViewChild("webView", { static: true }) webView: ElementRef;
  private wvInterface;
  private nativeWebView: WebView;
  public cameraPage = { id: "camera", thumbnail: "" };
  public activePage = this.cameraPage;
  public pages = [];
  public drawLineData = [];

  public device;

  public container: any;
  public localVideo: any;
  public remoteVideo: any;
  public accessToken: string;
  public room: string = "room_" + this.data.openConversation.id;
  public name: string = this.data.user.fname + " " + this.data.user.lname;
  public error: string;
  public videoActivity: VideoActivity;

  public camMode = false;
  public photoSrc;

  public loader = new LoadingIndicator();
  public loaderOptions = {
    message: "Une petite seconde...",
    progress: 0.65,
    android: {
      indeterminate: true,
      cancelable: false,
      max: 100,
      progressNumberFormat: "%1d/%2d",
      progressPercentFormat: 0.53,
      progressStyle: 1,
      secondaryProgress: 1,
    },
    ios: {
      details: "Electron transporte ta photo a toute vitesse!",
      square: false,
      margin: 20,
      dimBackground: true,
      color: "#29536e",
    },
  };

  constructor(
    private modal: ModalDialogService,
    public data: Data,
    private page: Page,
    private appRef: ApplicationRef,
    private routerExtensions: RouterExtensions,
    private vcRef: ViewContainerRef
  ) {
    console.log("constructing LiveComponent");

    this.videoActivity = new VideoActivity();

    this.device = "ios";
    if (isAndroid) this.device = "android";
  }

  start() {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("---------------------------------------------------------");
    console.log("|------                 start!                       ----|");
    console.log("---------------------------------------------------------");
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

    this.localVideo = this.page.getViewById("local-video");
    this.remoteVideo = this.page.getViewById("remote-video");

    this.videoActivity.localVideoView = this.localVideo.localVideoView;

    if (isAndroid) {
      this.localVideo.originX = 1;
      this.localVideo.originY = 0;

      this.localVideo.animate({
        scale: { x: 0.5, y: 0.5 },
        duration: 100,
      });
    }

    this.videoActivity.remoteVideoView = this.remoteVideo.remoteVideoView;

    this.videoActivity.event.on("error", (reason) => {
      console.log("big error");
      console.log(reason.object["reason"]);
      this.error = reason.object["reason"];
      console.log(JSON.stringify(reason.object["reason"]));
    });

    this.videoActivity.event.on("didConnectToRoom", (r) => {
      // if (r.object['count'] < 1) return;
      console.log("didConnectToRoom");
      // this.toggle_local_video_size();
    });

    this.videoActivity.event.on("didFailToConnectWithError", (r) => {
      console.log("didFailToConnectWithError");
      console.log(r);
    });

    this.videoActivity.event.on("participantDidConnect", (r) => {
      // if (r.object['count'] < 1) return;
      console.log("participantDidConnect");
      // this.toggle_local_video_size();
    });

    this.videoActivity.event.on("participantDidDisconnect", (r) => {
      console.log("participantDidDisconnect");
      // this.toggle_local_video_size();
    });

    this.videoActivity.event.on("participantUnpublishedAudioTrack", (r) => {
      console.log("participantUnpublishedAudioTrack");
    });

    this.videoActivity.event.on("participantPublishedVideoTrack", (r) => {
      console.log("participantPublishedVideoTrack");
    });

    this.videoActivity.event.on("participantUnpublishedVideoTrack", (r) => {
      console.log("participantUnpublishedVideoTrack");
    });

    this.videoActivity.event.on("onAudioTrackSubscribed", (r) => {
      console.log("onAudioTrackSubscribed");
    });

    this.videoActivity.event.on("onAudioTrackUnsubscribed", (r) => {
      console.log("onAudioTrackUnsubscribed");
    });

    this.videoActivity.event.on("onVideoTrackSubscribed", (r) => {
      console.log("onVideoTrackSubscribed");
    });

    this.videoActivity.event.on("onVideoTrackUnsubscribed", (r) => {
      console.log("onVideoTrackUnsubscribed 00");
    });

    this.videoActivity.event.on("participantDisabledVideoTrack", (r) => {
      console.log("participantDisabledVideoTrack");
    });

    this.videoActivity.event.on("participantEnabledVideoTrack", (r) => {
      console.log("participantEnabledVideoTrack");
    });

    this.videoActivity.event.on("participantDisabledAudioTrack", (r) => {
      console.log("participantDisabledAudioTrack");
    });

    this.videoActivity.event.on("participantEnabledAudioTrack", (r) => {
      console.log("participantEnabledAudioTrack");
    });

    this.get_permissions().then(() => {
      console.log(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
      );
      console.log("RETTUUUUUUUUUURRRNNNN FROOOOOMMM GEET PERMISSIONS");
      //this.videoActivity.start_preview(); -> connecting to a room also activates preview...

      this.connect_to_room();
    });
  }

  switchCamera(
    frontOrBack //back front switch
  ) {
    //console.log(this.videoActivity.cameraCapturer.getCameraSource());
    if (isAndroid) {
      if (
        (frontOrBack == "front" || frontOrBack == "switch") &&
        this.videoActivity.cameraCapturer.getCameraSource() == "BACK_CAMERA"
      ) {
        this.localVideo.localVideoView.setMirror(true);
        this.videoActivity.cameraCapturer.switchCamera();
      } else if (
        (frontOrBack == "back" || frontOrBack == "switch") &&
        this.videoActivity.cameraCapturer.getCameraSource() == "FRONT_CAMERA"
      ) {
        this.localVideo.localVideoView.setMirror(false);
        this.videoActivity.cameraCapturer.switchCamera();
      }
    }

    if (isIOS) {
      /*
                if(  ( frontOrBack == 'front' || frontOrBack == 'switch' ) && this.videoActivity.camera.source== 1)
                {
                        this.videoActivity.localVideoView.mirror = true;
                        this.videoActivity.camera.selectSource(0)
                }
                else if(  ( frontOrBack == 'back' || frontOrBack == 'switch' ) && this.videoActivity.camera.source == 0)
                {
                         this.videoActivity.localVideoView.mirror = false;
                         this.videoActivity.camera.selectSource(1)
                } 
                */
    }
  }

  clickOwnCamera() {
    this.switchCamera("switch");
  }

  take() {

    if(isAndroid)
    {
        this.videoActivity.cameraCapturer.takePicture(new com.twilio.video.CameraCapturer.PictureListener({
        onShutter : () => {},
        onPictureTaken : (bytes:any) => 
        {
            
                this.photoSrc = "data:image/jpg;base64,"+android.util.Base64.encodeToString(bytes, android.util.Base64.DEFAULT); //android
                //this.photoSrc = "data:image/jpg;base64,"bytes.base64EncodedStringWithOptions(0); //ios
           
            this.data.socket.emit('createPage',{ pageType : "camera", conversationID : 0, src : this.photoSrc });
            this.switchCamMode(false)
        }
        }));
    }

      if (isIOS) {
        console.log('---------------------------------------------------------')
        this.newPageChoice(true);
      }
      // this.newPageChoice(true);
      //   camera.takePicture()
      // .then((imageAsset) => {
      //     console.log("Result is an image asset instance");
      //     var image = new Image();
      //     image.src = imageAsset;
      // }).catch((err) => {
      //     console.log("Error -> " + err.message);
      // });

      // this.videoActivity.cameraCapturer.takePicture(
      //   new com.twilio.video.CameraCapturer.PictureListener({
      //     onShutter: () => {},
      //     onPictureTaken: (bytes: any) => {
      //       this.loader.show(this.loaderOptions);

      //       this.photoSrc =
      //         "data:image/jpg;base64," +
      //         android.util.Base64.encodeToString(
      //           bytes,
      //           android.util.Base64.DEFAULT
      //         ); //android
      //       //this.photoSrc = "data:image/jpg;base64,"bytes.base64EncodedStringWithOptions(0); //ios

      //       this.data.socket.emit("createPage", {
      //         pageType: "camera",
      //         conversationID: 0,
      //         src: this.photoSrc,
      //       });
      //       this.switchCamMode(false);
      //     },
      //   })
      // );
  }

  camIconClick() {
    if (isAndroid) this.switchCamMode(true);
    else this.newPageChoice(true);
  }

  switchCamMode(isCamMode) {
    if (isCamMode) {
      this.camMode = true;
      this.switchCamera("back");
      if (isAndroid)
        this.localVideo.animate({
          scale: { x: 1, y: 1 },
          duration: 300,
        });
    } else {
      this.camMode = false;
      this.switchCamera("front");
      if (isAndroid)
        this.localVideo.animate({
          scale: { x: 0.5, y: 0.5 },
          duration: 300,
        });
    }
  }

  //Server communication events

  serverDrawLine(data) {
    this.wvInterface.emit("drawLine", data);
  }
  serverUndoDraw(data) {
    this.wvInterface.emit("undoDraw", data);
  }
  serverCreatePage(page) {
    if (this.wvInterface) {
      this.pages.push(page);

      console.log("just before create page");
      this.wvInterface.emit("createPage", page);
      //on l'ouvre
      this.activePage = page;
      this.wvInterface.emit("switchPage", page);

      if (page.src == this.photoSrc) {
        //c'est notre upload
        console.log("the same!");
        this.loader.hide();
      }

      this.appRef.tick();
    } else {
      alert("interface manquante, merci de réessayer");
    }
  }
  serverSwitchPage(data) {
    if (data.pageID == "camera") {
      this.activePage = this.cameraPage;
    } else
      this.pages.forEach((page) => {
        if (page.id == data.pageID) {
          this.activePage = page;

          this.wvInterface.emit("switchPage", page);
        }
      });
    this.appRef.tick();
  }

  ngOnInit() {
    console.log("method: ngoninit");
    console.log("tokbox data used:");
    console.log(this.data.tokbox);

    // fake crash
    // throw new java.lang.Exception("Forced an exception.");

    this.nativeWebView = this.webView.nativeElement;
    console.log("finding native webview..");
    console.log(this.nativeWebView);
    this.wvInterface = new webViewInterfaceModule.WebViewInterface(
      this.nativeWebView,
      "https://goprof.fr/draw.html"
    );

    //disable bounce

    this.webView.nativeElement.on(
      WebView.loadStartedEvent,
      (args: LoadEventData) => {
        if (this.webView.nativeElement.android) {
          this.webView.nativeElement.android
            .getSettings()
            .setLoadWithOverviewMode(true);
          this.webView.nativeElement.android
            .getSettings()
            .setUseWideViewPort(true);
        } else {
          this.webView.nativeElement.ios.scrollView.minimumZoomScale = 1.0;
          this.webView.nativeElement.ios.scrollView.maximumZoomScale = 1.0;
          this.webView.nativeElement.ios.scalesPageToFit = false;
          this.webView.nativeElement.ios.scrollView.bounces = false;
          this.webView.nativeElement.ios.allowsMagnification = false;
        }
      }
    );
    this.webView.nativeElement.on(
      WebView.loadFinishedEvent,
      (args: LoadEventData) => {
        if (this.webView.nativeElement.ios) {
          console.log("Yeah....");
          console.log(this.webView.nativeElement.ios);
          this.webView.nativeElement.ios.scrollView.minimumZoomScale = 1.0;
          this.webView.nativeElement.ios.scrollView.maximumZoomScale = 1.0;
          this.webView.nativeElement.ios.scalesPageToFit = false;
          this.webView.nativeElement.ios.scrollView.bounces = false;
          this.webView.nativeElement.ios.allowsMagnification = false;
        }
      }
    );

    //listen for line draws
    this.wvInterface.on("undoDraw", (data) => {
      // this.drawLineData.push(data)
      this.data.socket.emit("undoDraw", data);
    });

    this.wvInterface.on("drawLine", (data) => {
      this.drawLineData.push(data)
      this.data.socket.emit("drawLine", data);
    });

    //thumbnail Updates
    this.wvInterface.on("updateThumbnail", (data) => {
      console.log('end')
      this.activePage.thumbnail = data;
      // console.log(this.drawLineData)
      // this.drawLineData.forEach(data => {this.data.socket.emit("eraseLine", data)})
      // this.drawLineData = [];
      // console.log(this.drawLineData)
      this.data.refreshUI();
    });

    this.wvInterface.on("log", (data) => {
      console.log(data);
    });

    //Server events listen

    this.data.socket.on("drawLine", this.serverDrawLine.bind(this));
    this.data.socket.on("undoDraw", this.serverUndoDraw.bind(this));
    this.data.socket.on("createPage", this.serverCreatePage.bind(this));
    this.data.socket.on("switchPage", this.serverSwitchPage.bind(this));
  }

  ngAfterViewInit() {
    console.log("AFTER VIEW INIT");
    this.start();

    /*
            var timer = require("tns-core-modules/timer");
            
            timer.setTimeout(() => {
                console.log('timer finished');
                
            }, 500)

            */
  }

  ngOnDestroy() {
    // cleaning up references/listeners.
    console.log("NGDESTROY");
    if (this.wvInterface) {
      this.wvInterface.destroy();
      this.wvInterface = null;
    }

    //cleanup listeners
    this.data.socket.off("drawLine");
    this.data.socket.off("createPage");
    this.data.socket.off("switchPage");
    this.data.socket.off("undoDraw");

    console.log("session disconnect");
    //couper la video
    this.videoActivity.destroy_local_video();
    this.videoActivity.disconnect();
  }

  newPage(pageType) {
    console.log("method: newpage");
  }

  switchPage(pageID) {
    console.log("method: switchpage");
    this.data.socket.emit("switchPage", { pageID: pageID });
  }

  save() {
    console.log("method: save");
    this.wvInterface.callJSFunction("getCanvasData", {}, (result) => {
      this.data.socket.emit("saveToFiles", {
        title: "test",
        src: result.image,
        thumbnail: result.thumbnail,
      });
      alert("La feuille a été enregistrée dans tes fichiers!");
    });
  }

  newPageChoice(bootOnCamera) {
    console.log("method: newpagechoice");
    console.log("DISABLE VIDEO");
    console.log(this.videoActivity.localVideoTrack);

    // if (isIOS) {
    this.modal
      .showModal(newpageModalComponent, {
        context: { bootOnCamera: bootOnCamera },
        fullscreen: false,
        viewContainerRef: this.vcRef,
      })
      .then((res) => {
        console.log("res: " + res);
        if (res == "camera") {
          if (isAndroid) {
            this.switchCamMode(true);
          } /* IOS already took picture inside modal */
        } else if (res == "file") {
        } else if (res == "none") {
        } else
          this.data.socket.emit("createPage", {
            pageType: res,
            conversationID: 0,
          }); //res = blank, quad ou copy
      })
      .catch((err) => {
        console.log(err);
      });
    // }
    console.log("aftermodal");
  }

  back() {
    //shut down live connection
    console.log("method: back");

    //change page
    this.routerExtensions.back();
  }


  tapUndo() {
    this.wvInterface.emit("tapUndo");
  }

  //Cam functions

  check_permissions(): boolean {
    var audio, camera;

    if (app.android) {
      audio = permissions.hasPermission("android.permission.RECORD_AUDIO");
      camera = permissions.hasPermission("android.permission.CAMERA");
    } else {
      camera = AVCaptureDevice.authorizationStatusForMediaType(
        AVMediaTypeVideo
      );
      audio = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeAudio);
      if (camera < 3) camera = false;
      if (audio < 3) audio = false;
    }

    if (!audio || !camera) return false;
    else return true;
  }

  get_permissions(): Promise<any> {
    return new Promise((resolve, reject) => {
      var has_permissions = this.check_permissions();

      if (has_permissions) {
        resolve();
        return;
      }

      if (app.android) {
        permissions
          .requestPermissions(
            ["android.permission.RECORD_AUDIO", "android.permission.CAMERA"],
            "I need these permissions because I'm cool"
          )
          .then((response) => {
            console.dir(response);
            resolve(response);
          })
          .catch((e) => {
            console.dir(e);
            console.log("Uh oh, no permissions - plan B time!");
            var has_permissions = this.check_permissions();

            if (!has_permissions) {
              dialogs
                .alert(
                  "without mic and camera permissions \n you cannot connect. \n please allow permissions in settings and try again."
                )
                .then(() => {});
            }
          });
      } else {
        Promise.all([
          this.ios_mic_permission(),
          this.ios_camera_permission(),
        ]).then(
          (values) => {
            console.log(JSON.stringify(values));
            resolve();
          },
          (reason) => {
            console.log(JSON.stringify(reason));
            this.error = reason;

            dialogs
              .alert(
                "without mic and camera permissions \n you cannot connect. \n please allow permissions in settings and try again."
              )
              .then(() => {
                UIApplication.sharedApplication.openURL(
                  NSURL.URLWithString(UIApplicationOpenSettingsURLString)
                );
              });

            reject();
          }
        );
      }
    });
  }

  ios_mic_permission(): Promise<any> {
    return new Promise((resolve, reject) => {
      var has_asked = AVCaptureDevice.authorizationStatusForMediaType(
        AVMediaTypeAudio
      );

      if (has_asked === 2) {
        reject("mic permission denied");
        return;
      }

      AVAudioSession.sharedInstance().requestRecordPermission((bool) => {
        if (bool === true) {
          resolve(bool);
          return;
        }
        reject("mic permission denied");
      });
    });
  }

  ios_camera_permission(): Promise<any> {
    return new Promise((resolve, reject) => {
      var has_asked = AVCaptureDevice.authorizationStatusForMediaType(
        AVMediaTypeVideo
      );

      if (has_asked === 2) {
        reject("camera permission denied");
        return;
      }

      AVCaptureDevice.requestAccessForMediaTypeCompletionHandler(
        AVMediaTypeVideo,
        (bool) => {
          if (bool === true) {
            resolve(bool);
            return;
          }
          reject("camera permission denied");
        }
      );
    });
  }

  public disconnect() {
    console.log("disconnect...");
    if (this.videoActivity.room) {
      this.videoActivity.disconnect();
    }
  }

  public connect_to_room(): void {
    this.videoActivity.set_access_token(this.data.twilio.token);
    this.videoActivity.connect_to_room(this.room, { video: true, audio: true });
  }
}
