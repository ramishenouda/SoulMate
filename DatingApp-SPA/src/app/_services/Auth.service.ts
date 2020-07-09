import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';
import { User } from '../_models/user';
import { BehaviorSubject } from 'rxjs';
import { HubService } from './hub.service';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  baseUrl = environment.apiUrl + 'auth/';
  jwtHelper = new JwtHelperService();
  decodedToken: any;
  currentUser: User;
  photoUrl = new BehaviorSubject<string>(environment.assetsPath + 'user.png');
  currentPhotoUrl = this.photoUrl.asObservable();

  constructor(private http: HttpClient, private hub: HubService, private messageService: MessageService) { }

  changeMemberPhoto(photoUrl: string) {
    this.photoUrl.next(photoUrl);
  }

  login(model: any) {
    localStorage.clear();
    return this.http.post(this.baseUrl + 'login', model)
      .pipe(
        map((response: any) => {
          const user = response;
          if (user) {
            localStorage.setItem('token', user.token);
            localStorage.setItem('user', JSON.stringify(user.user));
            // sets the decodedToken to be equal to token.
            this.setToken(user.token);
            // sets the current user to be equal to user.
            this.setUser(user.user);
            // Changing the member photo.
            this.changeMemberPhoto(this.currentUser.photoUrl);
            // Setuping up the hub for messages.
            this.hub.setupHub();
            this.recieveUnreadMessages();
          }
        })
      );
  }

  register(user: User) {
    return this.http.post(this.baseUrl + 'register', user);
  }

  logOut() {
    localStorage.clear();
    this.hub.disconnectHub();
  }

  loggedIn() {
    const token = localStorage.getItem('token');
    return !this.jwtHelper.isTokenExpired(token);
  }

  setToken(token: any) {
    this.decodedToken = this.jwtHelper.decodeToken(token);
  }
  setUser(user: User) {
      this.currentUser = user;
  }

  recieveUnreadMessages() {
    this.messageService.getUnreadMessages(this.decodedToken.nameid).subscribe(
      messages => {
        messages.forEach(message => {
          if (message.isReceived === false && message.recipientId === this.currentUser.id) {
            this.messageService.markAsReceived(this.currentUser.id, message.id);
            this.hub.hubConnection.invoke('markMessageAsReceived', message.senderId, message.id);
          }
        });
      }
    );
  }
}
