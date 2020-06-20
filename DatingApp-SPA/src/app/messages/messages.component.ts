import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../_services/Auth.service';
import { User } from '../_models/user';
import { HubHelperService } from '../_services/hub-helper.service';
import { HubService } from '../_services/hub.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {
  souls: any = [];
  soul: User;
  userId: number;
  soulState = 0;
  screenWidth: number;

  constructor(private route: ActivatedRoute, private authService: AuthService,
              private hub: HubService, private hubHelper: HubHelperService) { }

  ngOnInit() {
    this.userId = this.authService.decodedToken.nameid;
    this.screenWidth = window.outerWidth;
    this.route.data.subscribe(data => {
      this.souls = data.souls;
      for (const soul of this.souls) {
        const message: string = soul.content;
        if (message.length > 15) {
          soul.content = message.slice(0, 15) + '...';
        } else {
          soul.content = message;
        }
      }
    });

    this.hub.hubConnection.on('receiveMessage', (messageId, message, sentDate, senderId) => {
      this.arrangeSouls(senderId, message);
    });

    this.hub.hubConnection.on('messageReceived', (recipientId, messageId, receiveDate, content, hubConnectionId) => {
      this.arrangeSouls(recipientId, content);
    });
  }

  arrangeSouls(id: number, lastMessage: string) {
    if (this.souls[0].id === id) {
      this.souls[0].content = lastMessage;
      this.souls[0].content = lastMessage;
      if (lastMessage.length > 15) {
        this.souls[0].content = lastMessage.slice(0, 15) + '...';
      } else {
        this.souls[0].content = lastMessage;
      }
      return;
    }
    let soulToArrange: any;
    for (const soul of this.souls) {
      if (soul.id === id) {
        soulToArrange = soul;
        soulToArrange.content = lastMessage;
        if (lastMessage.length > 15) {
          soulToArrange.content = lastMessage.slice(0, 15) + '...';
        } else {
          soulToArrange.content = lastMessage;
        }
      }
    }

    if (soulToArrange !== undefined) {
      this.souls.splice(this.souls.findIndex(soul => soul.id === id), 1);
      this.souls.unshift(soulToArrange);
    }
  }

  loadMember(index: number) {
    this.soulState = 1;
    this.soul = undefined;
    setTimeout(() => {
      this.soul = this.souls[index];
      this.hubHelper.deepLocation = this.soul.id;
      this.hubHelper.location = 'messageBox';
    }, 50);
  }
}
