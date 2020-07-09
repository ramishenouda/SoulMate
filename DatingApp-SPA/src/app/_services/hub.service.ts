import { Injectable } from '@angular/core';
import { HubConnection } from '@microsoft/signalr';
import * as signalR from '@microsoft/signalr';
import { AlertifyService } from './alertify.service';
import { HubHelperService } from './hub-helper.service';

@Injectable({
  providedIn: 'root'
})
export class HubService {
  public hubConnection: HubConnection;
  constructor(private alertify: AlertifyService, private hubHelper: HubHelperService) {
    this.setupHub();
  }

 setupHub() {
   if (localStorage.getItem('user') !== null) {
      const date = new Date();
      this.hubConnection = new signalR.HubConnectionBuilder()
       .withUrl(`http://localhost:5000/chatHub?Authorization=${localStorage.getItem('token')}`)
       .build();

      this.hubConnection.start().catch(error => {
        this.alertify.error('Error while connecting to the hub, try refreshing the page');
      });

      this.getServertimezoneOffset();
      this.onReceivedMessage();
    }
  }

  disconnectHub() {
    this.hubConnection.stop();
  }

  onReceivedMessage() {
    this.hubConnection.on('receiveMessage', (messageId, message, sentDate, senderId, senderKnownAs) => {
      if (this.hubHelper.location !== 'messageBox' && this.hubHelper.deepLocation !== senderId) {
        let messageForNotfication = '';
        let index = 0;
        while (messageForNotfication.length < 55 && index < message.length) {
          messageForNotfication += message[index++];
        }
        if (index < message.length) {
          messageForNotfication += '...';
        }
        this.alertify.message('<span style="font-weight:bold">' + senderKnownAs + ': </span>' + messageForNotfication);
      }
    });
  }

  getServertimezoneOffset() {
    this.hubConnection.on('serverTimezoneOffset', (serverTimezoneOffset) => {
      localStorage.setItem('timezoneOffset', (new Date().getTimezoneOffset() * 60 * 1000).toString());
    });
  }
}
