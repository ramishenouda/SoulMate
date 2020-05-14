import { Component, OnInit } from '@angular/core';
import { AuthService } from './_services/Auth.service';
import { AlertifyService } from './_services/alertify.service';
import { UserService } from './_services/user.service';
import { HubService } from './_services/hub.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private authService: AuthService, private alertify: AlertifyService,
              private userService: UserService) { }
  ngOnInit() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
      this.authService.setToken(token);
      this.authService.setUser(user);
      this.authService.changeMemberPhoto(user.photoUrl);
    } else if (token || user ) {
      this.authService.logOut();
      this.alertify.error('An error occurred, please login again.');
      return;
    }

    if (token) {
      this.userService.getUser(this.authService.decodedToken.nameid).subscribe(
        (x => { }), error => {
          this.alertify.error('Sorry, we don\'t accept fake tokens :D');
          this.authService.logOut();
        }
      );
    }
  }
}
