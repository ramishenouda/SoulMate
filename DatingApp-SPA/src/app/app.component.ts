import { Component, OnInit } from '@angular/core';
import { AuthService } from './_services/Auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  constructor(private authService: AuthService) { }
  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if(token) {
      this.authService.setToken(token);
    }
  }
}
