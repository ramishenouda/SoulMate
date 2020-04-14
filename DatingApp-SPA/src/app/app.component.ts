import { Component, OnInit } from '@angular/core';
import { AuthService } from './_services/Auth.service';
import { AlertifyService } from './_services/alertify.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  constructor(private authService: AuthService, private alertify: AlertifyService) { }
  ngOnInit(): void {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
      this.authService.setToken(token);
      this.authService.setUser(user);
      this.authService.changeMemberPhoto(user.photoUrl);
    } else {
      this.authService.logOut();
      this.alertify.error('An error occurred, please login again.');
    }
  }
}
