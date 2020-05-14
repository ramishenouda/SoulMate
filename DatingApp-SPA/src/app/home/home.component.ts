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

  constructor(private http: HttpClient, private authService: AuthService) { }

  ngOnInit() { }

  registerToggle() {
    this.registerMode = true;
  }

  cancelRegisterMode(event: boolean) {
    this.registerMode = event;
  }

  loggedIn() {
    return this.authService.loggedIn();
  }
}
