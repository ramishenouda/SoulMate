import { Component, OnInit } from '@angular/core';
import { AuthService } from './_services/Auth.service';
import { AlertifyService } from './_services/alertify.service';
import { UserService } from './_services/user.service';
import { MessageService } from './_services/message.service';
import { HubService } from './_services/hub.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  tabNumber: number;

  constructor(private authService: AuthService, private alertify: AlertifyService,
              private userService: UserService, private messageService: MessageService, private hub: HubService) { }
  ngOnInit() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
      this.authService.setToken(token);
      this.authService.setUser(user);
      this.authService.changeMemberPhoto(user.photoUrl);
      this.recieveUnreadMessages();
    } else if (token || user ) {
      this.authService.logOut();
      this.alertify.error('An error occurred, please login again.');
      return;
    }

    if (token) {
      this.userService.getUser(this.authService.decodedToken.nameid).subscribe(
        (x => { }), error => {
          this.alertify.error('There\'s an error with your login info try to relogin');
          this.authService.logOut();
        }
      );
    }
  }

  recieveUnreadMessages() {
    this.messageService.getUnreadMessages(this.authService.decodedToken.nameid).subscribe(
      messages => {
        messages.forEach(message => {
          if (message.isReceived === false && message.recipientId === this.authService.currentUser.id) {
            this.messageService.markAsReceived(this.authService.currentUser.id, message.id);
            this.hub.hubConnection.invoke('markMessageAsReceived', message.senderId, message.id);
          }
        });
      }
    );
  }
}
