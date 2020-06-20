import { Component, OnInit, Input, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { Message } from 'src/app/_models/message';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { AuthService } from 'src/app/_services/Auth.service';
import { User } from 'src/app/_models/user';
import { Pagination, PaginatedResult } from 'src/app/_models/pagination';
import { tap } from 'rxjs/operators';
import { HubService } from 'src/app/_services/hub.service';
import { MessageService } from 'src/app/_services/message.service';
import { HubHelperService } from 'src/app/_services/hub-helper.service';

@Component({
  selector: 'app-member-messages',
  templateUrl: './member-messages.component.html',
  styleUrls: ['./member-messages.component.css']
})
export class MemberMessagesComponent implements OnInit, AfterViewInit {
  // The recipient
  @Input() recipient: User;
  // To Check if the user is on the messages tap.
  @Input() activatedTap: boolean;
  // To check if the user has a connection with the recipient.
  @Input() isSoul: boolean;
  // Used for messages pagination.
  @Input() canGetMessages = 1;
  // Used to check if the user is on the messages page or not, for styling purpose.
  @Input() onMessages = false;
  // Used to store current logged in user.
  @Output() lastSoulId = new EventEmitter<number>();
  user: any;
  // Storing the messages.
  messages: Message[] = [];
  // the next variables are for sending and recieve messages.
  newMessage: any = {};
  messageToSend: Message = new Message();
  messageToRecieve: Message = new Message();
  // to indicate weather we should insert a new line or send the message
  shiftPressed = false;
  // Getting the messages list, to load other messages when the user scroll to the top.
  messagesList: any;
  // Default date for messages (btw, that's my birthday).
  defaultDate = new Date(1999, 5, 11);
  // used to store the scrolling leve, for pagination.
  scrollTop: number;
  // Pagination class, for pagination.
  pagination: Pagination = new Pagination();
  // Storing the messages list height, to check our current scrolling level with the height.
  lastHeight = 0;
  // minimumId for pagination.
  minimumId: number;
  // Stores last unread message Id, for reading.
  lastUnreadReadMessageId: number;
  // To store the screen width
  screenWidth: number;
  constructor(private messageService: MessageService, private authService: AuthService,
              private alertify: AlertifyService, private hub: HubService, private hubHelper: HubHelperService) { }

  ngOnInit() {
    this.screenWidth = screen.width;
    this.user = JSON.parse(localStorage.getItem('user'));
    this.pagination.currentPage = 0;

    const interval = window.setInterval(() => {
      if (this.activatedTap && this.recipient) {
        this.receiveMessageHub();
        this.messageReceivedHub();
        this.markMessageAsReadHub();
        this.markMessageAsReceivedHub();
        this.instaniateTheSendAndRecieveMessage();
        this.getUnReadMessages();
        clearInterval(interval);
      }
    }, 250);
  }

  ngAfterViewInit() {
    document.onkeydown = (e) => {
      // tslint:disable-next-line: deprecation
      if (e.keyCode === 16) {
        this.shiftPressed = true;
      }

      // tslint:disable-next-line: deprecation
      if (this.shiftPressed === false && e.keyCode === 13 && this.newMessage.content !== undefined &&
          this.newMessage.content.trim() !== '') {
        setTimeout(() => {
          this.sendMessage(this.messages.length);
          document.getElementById('messageInput').innerHTML = '';
          this.newMessage.content = '';
        }, 10);
      }
    };

    document.onkeyup = (e) => {
      // tslint:disable-next-line: deprecation
      if (e.keyCode === 16) {
        this.shiftPressed = false;
      }
    };

    document.getElementById('messageInput').focus();
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
    this.messageService.getUnreadMessages(this.user.id, this.recipient.id)
    .pipe(tap(messages => {
      messages.forEach(message => {
        if (message.recipientId === this.user.id && message.isRead === false) {
          this.hub.hubConnection.invoke('MarkMessageAsRead', message.senderId, message.id);
          this.messageService.markAsRead(this.user.id, message.id);
        }
      });
    }))
    .subscribe((result) => {
      if (result.length !== 0) {
        this.minimumId = result[result.length - 1].id;
        this.messages = result;
        this.lastUnreadReadMessageId = result[0].id;
      }

      if (result.length < 6) {
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
      .subscribe((res: PaginatedResult<Message[]>) => {
        for (const message of res.result) {
          this.messages.push(message);
        }

        if (this.minimumId === undefined && res.result[0]) {
          this.minimumId = res.result[0].id;
          this.lastUnreadReadMessageId = res.result[0].id;
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

  instaniateTheSendAndRecieveMessage() {
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
    this.newMessage.isReceived = false;
    this.newMessage.content = this.newMessage.content.trim();
    length++;
    this.hub.hubConnection.invoke('SendMessage', this.user.id, this.recipient.id, this.newMessage.content,
                                  this.hub.hubConnection.connectionId)
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
    document.getElementById('messageInput').innerHTML = '';
  }

  receiveMessageHub() {
    this.hub.hubConnection.on('receiveMessage', (messageId, message, sentDate, senderId) => {
      if (this.recipient.id !== senderId) {
        return;
      }

      this.addReceivedMessage(messageId, message, sentDate);
      if (this.hubHelper.location === 'messageBox' && this.hubHelper.deepLocation === senderId) {
        this.hub.hubConnection.invoke('MarkMessageAsRead', senderId, messageId);
      }
    });
  }

  markMessageAsReadHub() {
    this.hub.hubConnection.on('markMessageAsRead', (readDate, messageId) => {
      for (const message of this.messages) {
        if (message.id === messageId) {
          message.isRead = true;
          message.readDate = readDate;
        }
      }
    });
  }

  markMessageAsReceivedHub() {
    this.hub.hubConnection.on('markMessageAsReceived', (receiveDate, messageId) => {
      for (const message of this.messages) {
        if (message.id === messageId) {
          message.isReceived = true;
          message.readDate = receiveDate;
        }
      }
    });
  }

  messageReceivedHub() {
    this.hub.hubConnection.on('messageReceived', (recipientId, messageId, receiveDate, content, received, hubConnectionId) => {
      this.messages[0].isReceived = received;
      this.messages[0].receivedDate = receiveDate;
      if (this.hub.hubConnection.connectionId !== hubConnectionId) {
        this.addSentMessage(messageId, content, receiveDate, received);
      }
    });
  }

  addSentMessage(messageId, messageContent, sentDate, isReceived) {
    this.messageToSend.content = messageContent;
    this.messageToSend.sentDate = sentDate;
    this.messageToSend.id = messageId;
    this.messageToSend.isReceived = isReceived;
    this.messages.unshift(Object.assign({}, this.messageToSend));
  }

  addReceivedMessage(messageId, messageContent, sentDate) {
    this.messageToRecieve.content = messageContent;
    this.messageToRecieve.sentDate = sentDate;
    this.messageToRecieve.id = messageId;
    this.messages.unshift(Object.assign({}, this.messageToRecieve));
  }

  deleteMessage(id: number) {
    this.alertify.confirm('The message will be only deleted from your box, continue deleting?', () => {
      this.messageService.deleteMessage(this.user.id, id).subscribe(() => {
        this.messages.splice(this.messages.findIndex(m => m.id === id), 1);
        this.alertify.success('Message has been deleted');
      }, error => {
        this.alertify.error('Failed to delete the message');
      });
    });
  }

  quoteMessage(id: number) {
    let quoteMessage: Message;
    for (const message of this.messages) {
      if (message.id === id) {
        quoteMessage = message;
      }
    }

    if (this.newMessage.content !== undefined && this.newMessage.content.length > 0) {
      this.newMessage.content += '\n*' + quoteMessage.content + '*' + '\n';
    } else {
      this.newMessage.content = '*' + quoteMessage.content + '*' + '\n';
    }

    document.getElementById('messageInput').focus();
  }

  sendLastSoulId(id: number) {
    this.lastSoulId.emit(id);
  }
}
