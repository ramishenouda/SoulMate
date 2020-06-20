import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResult } from '../_models/pagination';
import { map } from 'rxjs/operators';
import { Message } from '../_models/message';


@Injectable({
  providedIn: 'root'
})
export class MessageService {

  baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getMessages(id: number, page?, itemsPerPage?, messageContainer?) {
    const paginatedResult: PaginatedResult<Message[]> = new PaginatedResult<Message[]>();

    let params = new HttpParams();
    params = params.append('MessageContainer', messageContainer);
    if (page && itemsPerPage) {
      params = params.append('pageNumber', page);
      params = params.append('pageSize', itemsPerPage);
    }

    return this.http.get<Message[]>(this.baseUrl + 'users/' + id + '/messages', {observe: 'response', params})
      .pipe(
        map(response => {
          paginatedResult.result = response.body;
          if (response.headers.get('Pagination')) {
            paginatedResult.pagination = JSON.parse(response.headers.get('Pagination'));
          }

          return paginatedResult;
        })
      );
  }

  getLastMessage(id: number, recipientId: number) {
    return this.http.get<any>(this.baseUrl + 'users/' + id + '/messages/lastMessage/' + recipientId);
  }

  getUnreadMessages(id: number, recipientId: number = -1) {
    return this.http.get<Message[]>(this.baseUrl + 'users/' + id + '/messages/unread/' + recipientId);
  }

  getMessagesThread(id: number, recipientId: number, page?, maximumId?) {
    const paginatedResult: PaginatedResult<Message[]> = new PaginatedResult<Message[]>();

    let params = new HttpParams();
    params = params.append('pageNumber', page);
    if (!maximumId) {
      maximumId = -1;
    }
    return this.http.get<Message[]>(this.baseUrl + 'users/' + id + '/messages/thread/' + recipientId + '/' + maximumId,
       {observe: 'response', params})
      .pipe(
        map(response => {
          paginatedResult.result = response.body;
          if (response.headers.get('Pagination')) {
            paginatedResult.pagination = JSON.parse(response.headers.get('Pagination'));
          }

          return paginatedResult;
        })
      );
  }


  sendMessage(id: number, message: Message) {
    return this.http.post<Message>(this.baseUrl + 'users/' + id + '/messages', message);
  }

  deleteMessage(userId: number, messageId: number) {
    return this.http.post(this.baseUrl + 'users/' + userId + '/messages/' + messageId, {});
  }

  markAsRead(userId: number, messageId: number) {
    return this.http.post(this.baseUrl + 'users/' + userId + '/messages/' + messageId + '/read', {}).subscribe();
  }

  markAsReceived(userId: number, messageId: number) {
    return this.http.post(this.baseUrl + 'users/' + userId + '/messages/' + messageId + '/receive', {}).subscribe();
  }

}
