import { Component, OnInit, OnDestroy,ApplicationRef, ElementRef, ViewChild, Input, Output, EventEmitter} from "@angular/core";
import { Page } from "tns-core-modules/ui/page";
import {View} from 'tns-core-modules/ui/core/view'; 

import {AnimationCurve} from "tns-core-modules/ui/enums"; 


@Component({
  selector: "ns-btn",
  moduleId: module.id,
  templateUrl: "./btn.component.html",
  styleUrls: ["btn.component.css"]
})


export class Btn implements OnInit {

  @Input('text') labelText;
  
  @Input('color') color;
  @Output() taponbtn: EventEmitter<Object> = new EventEmitter<Object>();
  _highlight : Boolean;
  
  @ViewChild('btn', { static: true }) btn: ElementRef;


  
  constructor(private page: Page) 
  {
    if(!this.color) this.color = "#c45177";
  }

  vCenterAndroid(e) //17: center of its container in both the vertical and horizontal 1: horizontal center of its container 16: vertical center of its container
  { 
    if (e.object.android)e.object.android.setGravity(17);
  }


    //Highlight value
  get highlight(): Boolean {
    // transform value for display
    return this._highlight;
  }
  
  @Input()
  set highlight(newvalue:Boolean) {
    console.log('prev value: ', this._highlight);
    console.log('new highlight value: ', newvalue);
    this._highlight = newvalue;

    //set styles
    

    if(this._highlight )
    {
      this.btn.nativeElement.getViewById("over").style.backgroundColor = this.color;
      this.btn.nativeElement.getViewById("over").style.color = '#ffffff';

    }
    else
    {
      this.btn.nativeElement.getViewById("over").style.backgroundColor = 'transparent';
      this.btn.nativeElement.getViewById("over").style.color = this.color;
    }

  }

  ngOnInit(): void 
  {

    if(this.color)
    {
      this.btn.nativeElement.getViewById("under").style.borderColor = this.color;
      this.btn.nativeElement.getViewById("under2").style.borderColor = this.color;
      this.btn.nativeElement.getViewById("over").style.color = this.color;
      this.btn.nativeElement.getViewById("over").style.borderColor = this.color;
    }
    if(this._highlight )
    {
      this.btn.nativeElement.getViewById("over").style.backgroundColor = this.color;
      this.btn.nativeElement.getViewById("over").style.color = '#ffffff';

    }
    else
    {
      this.btn.nativeElement.getViewById("over").style.backgroundColor = 'transparent';
      this.btn.nativeElement.getViewById("over").style.color = this.color;
    }
        

  }

  tapped()
  {
  this.taponbtn.emit();

  }


}







