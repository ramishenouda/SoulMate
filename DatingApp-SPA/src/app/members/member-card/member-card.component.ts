import { Component, OnInit, Input } from '@angular/core';
import { User } from 'src/app/_models/user';
import { UserService } from 'src/app/_services/user.service';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { AuthService } from 'src/app/_services/Auth.service';

@Component({
  selector: 'app-member-card',
  templateUrl: './member-card.component.html',
  styleUrls: ['./member-card.component.css']
})
export class MemberCardComponent implements OnInit {
  @Input() user: User;
  @Input() messages: boolean;

  constructor(private userService: UserService, private alertify: AlertifyService,
              private authService: AuthService) { }

  ngOnInit() {
  }

  sendLike(recipientId: number) {
    this.userService.sendLike(this.authService.currentUser.id, recipientId).subscribe(() => {
      this.alertify.success('Liked');
    }, error => {
      this.alertify.error(error);
    });
  }

  unlike(recipientId: number) {
    this.userService.unlike(this.authService.currentUser.id, recipientId).subscribe(() => {
      this.alertify.success('Unliked');
    }, error => {
      this.alertify.error(error);
    });
  }
}
