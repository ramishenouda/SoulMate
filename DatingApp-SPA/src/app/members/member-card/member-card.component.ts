import { Component, OnInit, Input } from '@angular/core';
import { User } from 'src/app/_models/user';
import { UserService } from 'src/app/_services/user.service';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { AuthService } from 'src/app/_services/Auth.service';
import { MessageService } from 'src/app/_services/message.service';
import { Message } from 'src/app/_models/message';

@Component({
  selector: 'app-member-card',
  templateUrl: './member-card.component.html',
  styleUrls: ['./member-card.component.css']
})
export class MemberCardComponent implements OnInit {
  @Input() user: User;
  @Input() isSoul: boolean;
  @Input() likee: boolean;
  likeTrigger = false;

  constructor(private userService: UserService, private alertify: AlertifyService,
              private authService: AuthService, private messageService: MessageService) { }

  ngOnInit() {}

  sendLike(recipientId: number) {
    if (this.likeTrigger) {
      return;
    }

    this.likeTrigger = true;
    this.userService.sendLike(this.authService.currentUser.id, recipientId).subscribe((response: any) => {
      this.alertify.success('Liked');
      this.likee = true;
      if (response.isSoul === true && response.lastMessage === false) {
        const message = new Message();
        message.content = 'Say hi to ' + this.user.knownAs;
        message.senderId = this.authService.decodedToken.nameid;
        message.recipientId = this.user.id;
        this.isSoul = true;
        this.messageService.sendMessage(this.authService.decodedToken.nameid, message).subscribe(
          e => {}, error => console.log(error)
        );
      } else if (response.isSoul) {
        this.isSoul = true;
      }
      this.likeTrigger = false;
    }, error => {
      this.alertify.error(error);
      this.likeTrigger = false;
    });
  }

  unlike(recipientId: number) {
    if (this.likeTrigger) {
      return;
    }
    this.likeTrigger = true;
    this.userService.unlike(this.authService.currentUser.id, recipientId).subscribe(() => {
      this.isSoul = false;
      this.likee = false;
      this.likeTrigger = false;
      this.alertify.success('Unliked');
    }, error => {
      this.likeTrigger = false;
      this.alertify.error(error);
    });
  }
}
