import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import { Message } from 'src/app/_models/message';
import { UserService } from 'src/app/_services/user.service';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { AuthService } from 'src/app/_services/Auth.service';
import { User } from 'src/app/_models/user';
import { Pagination, PaginatedResult } from 'src/app/_models/pagination';
import { tap } from 'rxjs/operators';
import { HubService } from 'src/app/_services/hub.service';
import { MessageService } from 'src/app/_services/message.service';
import { PaginationComponent } from 'ngx-bootstrap/pagination/public_api';
import { ThrowStmt } from '@angular/compiler';

@Component({
  selector: 'app-member-messages',
  templateUrl: './member-messages.component.html',
  styleUrls: ['./member-messages.component.css']
})
export class MemberMessagesComponent implements OnInit, AfterViewInit {
  @Input() recipient: User;
  @Input() activatedTap: boolean;
  user: any;
  messages: Message[] = [];
  newMessage: any = {};
  messageToSend: Message = new Message();
  messageToRecieve: Message = new Message();
  messagesList: any;
  defaultDate = new Date(1999, 5, 11);
  scrollTop: number;
  pagination: Pagination = new Pagination();
  canGetMessages = 1;
  lastHeight = 0;
  minimumId: number; // for pagination

  constructor(private userService: UserService, private messageService: MessageService,
              private authService: AuthService, private alertify: AlertifyService, private hub: HubService) { }

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user'));
    this.pagination.currentPage = 0;

    this.receiveMessage();
    this.instaniateMessage();
    this.messageReceived();

    const interval = window.setInterval(() => {
      if (this.activatedTap) {
        this.getUnReadMessages();
        clearInterval(interval);
      }
    }, 250);
  }

  ngAfterViewInit() {
    this.messagesList = document.getElementById('messagesList');
    this.scrollTop = this.messagesList.scrollTop;

    this.messagesList.addEventListener('DOMCharacterDataModified', () => {
      if (this.messagesList.scrollTop >= this.scrollTop - 50 ||
          (this.messages[0] !== undefined && this.messages[0].senderId === this.user.id)) {
            if (this.canGetMessages !== 0) {
              this.messagesList.scrollTop = this.messagesList.scrollHeight;
              this.scrollTop = this.messagesList.scrollTop;
            }
      }
    });

    this.messagesList.addEventListener('scroll', () => {
      if (this.messagesList.scrollTop === 0 && this.canGetMessages === 1) {
        this.lastHeight = this.messagesList.scrollHeight;
        this.loadMessages(this.pagination.currentPage + 1);
      }
    });
  }

  getUnReadMessages() {
    this.messageService.getUnreadMessages(this.user.id, this.recipient.id).subscribe((result) => {
      if (result.length !== 0) {
        this.minimumId = result[result.length - 1].id;
        this.messages = result;
      }

      if (result.length < 6) {
        console.log('here');
        this.loadMessages(1);
      }
    }, error => {
      this.alertify.error('Error while loading your messages, try to refresh the page');
    });
  }

  loadMessages(page: number) {
    this.canGetMessages = 0;
    this.messageService
    .getMessagesThread(this.authService.decodedToken.nameid, this.recipient.id, page, this.minimumId)
      .pipe(tap(res => {
        for (const message of res.result) {
          if (message.isReceived === false && message.recipientId === this.user.id) {
            this.messageService.markAsReceived(this.user.id, message.id).subscribe();
          }
        }
      }))
      .subscribe((res: PaginatedResult<Message[]>) => {
        for (const message of res.result) {
          this.messages.push(message);
        }

        if (this.minimumId === undefined && res.result[0]) {
          this.minimumId = res.result[0].id;
          console.log(this.minimumId);
        }

        this.pagination = res.pagination;
        setTimeout(() => {
          this.canGetMessages = 1;
          this.messagesList.scrollTop = this.messagesList.scrollHeight - this.lastHeight;
          if (res.result.length === 0) {
            this.canGetMessages = 2;
          }
        }, 50);
      },
      error => {
        this.alertify.error(error);
      }
    );
  }

  instaniateMessage() {
    this.messageToSend.senderId = this.user.id;
    this.messageToSend.recipientId = this.recipient.id;
    this.messageToSend.senderKnownAs = this.user.knownAs;
    this.messageToSend.recipientKnownAs = this.recipient.knownAs;
    this.messageToSend.senderPhotoUrl = this.user.photoUrl;
    this.messageToSend.recipientPhotoUrl = this.recipient.photoUrl;
    this.messageToSend.sentDate = this.defaultDate;
    this.messageToSend.receivedDate = this.defaultDate;
    this.messageToSend.isReceived = false;
    this.messageToSend.isRead = false;


    this.messageToRecieve.recipientId = this.user.id;
    this.messageToRecieve.senderId = this.recipient.id;
    this.messageToRecieve.recipientKnownAs = this.user.knownAs;
    this.messageToRecieve.senderKnownAs = this.recipient.knownAs;
    this.messageToRecieve.recipientPhotoUrl = this.user.photoUrl;
    this.messageToRecieve.senderPhotoUrl = this.recipient.photoUrl;
  }

  sendMessage(length: number) {
    length++;
    this.hub.hubConnection.invoke('SendMessage', this.user.id, this.recipient.id, this.newMessage.content)
    .then((data: any) => {
        let date = '';
        let id = '';
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < data.length; i++) {
          if (data[i] === '-') {
            for (let j = i + 1; j < data.length; j++) {
              id += data[j];
            }
            break;
          }
          date += data[i];
        }
        this.messages[this.messages.length - length].sentDate = new Date(date);
        this.messages[this.messages.length - length].id = +id;
      }).catch(error => {
        this.alertify.error('Error while sending the message : ' + error);
        this.messages[this.messages.length - length].sentDate = null;
      });
    this.messageToSend.content = this.newMessage.content;
    this.messages.unshift(Object.assign({}, this.messageToSend));
    this.newMessage.content = '';
  }

  receiveMessage() {
    this.hub.hubConnection.on('receiveMessage', (messageId, message, sentDate, recipientKnownAs) => {
      this.messageToRecieve.id = messageId;
      this.messageToRecieve.content = message;
      this.messageToRecieve.sentDate = sentDate;
      this.messages.unshift(Object.assign({}, this.messageToRecieve));
      this.messageService.markAsReceived(this.user.id, message.id);
      if (this.activatedTap) {
        console.log('Reading');
      }
    });
  }

  messageReceived() {
    this.hub.hubConnection.on('messageReceived', (messageId, receiveDate) => {
      this.messages[0].isReceived = true;
      this.messages[0].receivedDate = receiveDate;
    });
  }
}
