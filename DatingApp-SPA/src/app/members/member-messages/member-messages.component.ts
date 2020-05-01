import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Message } from 'src/app/_models/message';
import { UserService } from 'src/app/_services/user.service';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { AuthService } from 'src/app/_services/Auth.service';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-member-messages',
  templateUrl: './member-messages.component.html',
  styleUrls: ['./member-messages.component.css']
})
export class MemberMessagesComponent implements OnInit {
  @ViewChild('messagesList') messagesList: ElementRef;
  @Input() recipientId: number;
  currentUser: number;
  messages: Message[];
  newMessage: any = {};

  constructor(private userService: UserService, private alertify: AlertifyService,
              private authService: AuthService) { }

  ngOnInit() {
    this.loadMessages();
    this.newMessage.recipientId = this.recipientId;
    this.currentUser = +this.authService.decodedToken.nameid;
  }

  loadMessages() {
    this.userService.getMessagesThread(this.authService.decodedToken.nameid, this.recipientId)
    .pipe(tap(messages => {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < messages.length; i++) {
        if (messages[i].isRead === false && messages[i].recipientId === this.currentUser) {
          this.userService.markAsRead(this.currentUser, messages[i].id);
        }
      }
    }))
    .subscribe(messages => {
        this.messages = messages;
        this.messagesList.nativeElement.scrollTop = this.messagesList.nativeElement.scrollHeight;
      }, error => {
        this.alertify.error(error);
      });
  }

  sendMessage() {
    this.userService.sendMessage(this.authService.decodedToken.nameid, this.newMessage)
    .pipe(tap(n => {
        console.log('hehehe');
      })
    )
      .subscribe(message => {
        this.messages.unshift(message);
        this.newMessage.content = '';
        this.messagesList.nativeElement.scrollIntoView({ block: 'end' });
      }, error => {
        this.alertify.error(error);
      });
  }
}
