import { Component, OnInit } from '@angular/core';
import { AuthService } from '../_services/Auth.service';
import { AlertifyService } from '../_services/alertify.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  model: any = {};
  photoUrl: string;
  screenSize: number;
  loggin: boolean;
  constructor(public authService: AuthService, private alertify: AlertifyService, private router: Router, private spinner: NgxSpinnerService) { }

  ngOnInit() {
    this.screenSize = window.innerWidth;
    this.loggin = false;
    this.authService.currentPhotoUrl.subscribe(photoUrl => this.photoUrl = photoUrl);
  }

  login() {
    this.loggin = true;
    this.spinner.show()
    this.authService.login(this.model).subscribe(next => {
      this.alertify.success('Logged in successfully');
      this.loggin = false;
    }, error => {
      if (typeof error === 'object') {
        error = error.title;
        this.spinner.hide();
      }
      this.alertify.error(error);
      this.loggin = false;
      this.spinner.hide();
    }, () => {
      this.router.navigate(['/members']);
      this.loggin = false;
      this.spinner.hide();
    });
  }

  loggedIn() {
    return this.authService.loggedIn();
  }

  logOut() {
    this.authService.logOut();
    this.alertify.message('logged out');
    this.router.navigate(['/home']);
  }
}
