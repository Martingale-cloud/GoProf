// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic } from "nativescript-angular/platform";

import { AppModule } from "./app/app.module";


import * as application from 'tns-core-modules/application';
var TnsOneSignal = require('nativescript-onesignal').TnsOneSignal


import { on, uncaughtErrorEvent, android, ios } from "tns-core-modules/application";

declare var UIResponder:any;
declare class UIApplicationDelegate{}
declare var UIApplication:any;
declare var NSDictionary:any;


on(uncaughtErrorEvent, (args) => {
    if (android) {
        // For Android applications, args.android is an NativeScriptError.
        console.log(" ------------------------------------------------");
        console.log(" |||||     NativeScriptError in Android     ||||| ");
        console.log(" ------------------------------------------------");

        console.log(" *** NativeScriptError *** : " + args.android);
        console.log(" *** StackTrace *** : " + args.android.stackTrace);
        console.log(" *** nativeException *** : " + args.android.nativeException);

    } else if (ios) {
        // For iOS applications, args.ios is NativeScriptError.
        console.log(" --------------------------------------------");
        console.log(" |||||     NativeScriptError in iOS     ||||| ");
        console.log(" --------------------------------------------");
        console.log(args.ios);
    }
});





if (application.ios) {
    class MyDelegate extends UIResponder implements UIApplicationDelegate {
  
  
        public static ObjCProtocols = [UIApplicationDelegate]
  
        public applicationDidFinishLaunchingWithOptions(app, launchOptions): boolean {
            
  
            try {
  
                TnsOneSignal.initWithLaunchOptionsAppId(launchOptions, '3612cea5-dbb2-4869-95e5-3aacef3c9cea');
                //TnsOneSignal.inFocusDisplayType = TnsOneSignal.OSNotificationDisplayType.Notification
  
            } catch (error) {
                console.error('error', error)
            }
  
            return true
        }
  
    }
    application.ios.delegate = MyDelegate
  }
  
  if (application.android) {
      application.on(application.launchEvent, function(args: application.ApplicationEventData) {
   
          try {
              TnsOneSignal.setLogLevel(TnsOneSignal.LOG_LEVEL.VERBOSE, TnsOneSignal.LOG_LEVEL.NONE);
              TnsOneSignal.startInit(application.android.context).init();
              TnsOneSignal.setInFocusDisplaying(TnsOneSignal.OSInFocusDisplayOption.Notification);
   
          } catch (error) {
              console.error('error', error)
          }
   
      })
  }



  import * as platform from "tns-core-modules/platform";
  declare const STPPaymentConfiguration;
  
  application.on(application.launchEvent, (args) => {
      if (platform.isIOS) {
          STPPaymentConfiguration.sharedConfiguration().publishableKey = "pk_live_Qm2aS8T4Q3peTCTvBHeQJHjy";
      }
  });
  


// A traditional NativeScript application starts by initializing global objects,
// setting up global CSS rules, creating, and navigating to the main page.
// Angular applications need to take care of their own initialization:
// modules, components, directives, routes, DI providers.
// A NativeScript Angular app needs to make both paradigms work together,
// so we provide a wrapper platform object, platformNativeScriptDynamic,
// that sets up a NativeScript application and can bootstrap the Angular framework.
platformNativeScriptDynamic({ createFrameOnBootstrap: true }).bootstrapModule(AppModule);
