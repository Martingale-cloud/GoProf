import { Component, ViewChild, ElementRef, AfterViewInit, ApplicationRef, OnInit  } from "@angular/core";
import { Page } from "tns-core-modules/ui/page";

import { Data } from "../shared/data/data.service";

import * as moment from 'moment';

import {AnimationCurve} from "tns-core-modules/ui/enums"; 

import * as animation from "tns-core-modules/ui/animation";






@Component({
  moduleId: module.id,
  selector: "ns-conversations",
  templateUrl: "conversations.component.html",
  styleUrls: ["conversations.component.css"]
})
export class ConversationsComponent implements OnInit 
{
        constructor(public data:Data) 
        {
            //this.data.socket.emit('getConversations'); automatiquement depuis le serveur au login
            moment.locale('fr'); //sets moment in french;
        }

        ngOnInit() 
        {

   
        }

        openConversation(conversation,event)
        {
            //set last time now instantly to update bullet
            

            this.data.openConversation = conversation;
            this.data.openConversation.messages = [];
            this.data.openConversation.loaded = true;
            this.data.socket.emit('getMessages', {conversation_id: conversation.id});
            event.view.animate({
                translate: { x:100, y:0 },
                opacity : 0,
                duration: 250,
                curve: AnimationCurve.easeInOut
            }).then( () => 
            {
                this.data.routerExtensions.navigate(["/messages"]);
                conversation.last_access_uts = moment().unix();
            });
        }


        conversations() //return conversations with newest messages on top
        {
            return [
            ...this.data.conversationsModel.conversations.filter(c => {return c.last_access_uts < c.last_message_time_uts}).sort((a,b)=> {return a.last_message_time_uts < b.last_message_time_uts ? 1 : -1 ;})
            , 
            ...this.data.conversationsModel.conversations.filter(c => {return c.last_access_uts >= c.last_message_time_uts}).sort((a,b)=> {return a.last_message_time_uts < b.last_message_time_uts ? 1 : -1 ;})
            ];
        }


        humanTimeFromUts(uts)
        {
            return moment.unix(uts).calendar();
        }

        hasNewMessages(conversation)
        {
            console.log('---')
            console.log(conversation.id)
            console.log(conversation.last_message_time_uts)
            console.log(conversation.last_access_uts)
            console.log (conversation.last_message_time_uts > conversation.last_access);
            
            return conversation.last_message_time_uts > conversation.last_access_uts;
        }

        notMeArray(members)
        {
            var arr = [];
            members.forEach(member => {
                if(member.id != this.data.user.id)arr.push(member);
            });
            return arr;
        }

}