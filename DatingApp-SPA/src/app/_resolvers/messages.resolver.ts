import { Injectable } from '@angular/core';
import { Resolve, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AlertifyService } from '../_services/alertify.service';
import { Message } from '../_models/message';
import { AuthService } from '../_services/Auth.service';
import { MessageService } from '../_services/message.service';
import { UserService } from '../_services/user.service';

@Injectable()
export class MessagesResolver implements Resolve<Message[]> {
    soulToPush: any = {};
    soulsThumbnail: any = [];

    constructor(private userService: UserService, private messageService: MessageService,
                private auth: AuthService, private alertify: AlertifyService, private router: Router) { }
    resolve(route: ActivatedRouteSnapshot): any {
      this.userService.getUserSouls(this.auth.decodedToken.nameid).subscribe(souls => {
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < souls.result.length; i++) {
          this.messageService.getLastMessage(this.auth.decodedToken.nameid, souls.result[i].id).subscribe(message => {
            this.soulToPush = souls.result[i];
            if (!message.content) {
              this.soulToPush.contentSenderId = -1;
              this.soulToPush.content = 'Say Hi to ' + souls.result[i].knownAs + '.';
            } else {
              this.soulToPush.contentSenderId = message.senderId;
              if (message.content.length > 15) {
                this.soulToPush.content = message.content.slice(0, 15) + '...';
              } else {
                this.soulToPush.content = message.content;
              }
            }

            this.soulToPush.contentDate = message.sentDate;
            this.soulsThumbnail[i] = this.soulToPush;
          }, error => {
            this.alertify.error('Error on retrieving data');
            this.router.navigate(['/home']);
          });
        }
      });
      return this.soulsThumbnail;
    }
}
