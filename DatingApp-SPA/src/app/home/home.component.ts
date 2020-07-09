import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../_services/Auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit
{
  registerMode = false;
  learnMoreMode = false;

  constructor(private http: HttpClient, private authService: AuthService) { }

  ngOnInit() { }

  registerToggle() {
    this.registerMode = !this.registerMode;
  }

  learnMoreToggle() {
    this.learnMoreMode = !this.learnMoreMode;
  }

  loggedIn() {
    return this.authService.loggedIn();
  }
}
