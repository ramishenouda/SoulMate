import { Injectable } from '@angular/core';
import { Resolve, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AlertifyService } from '../_services/alertify.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Message } from '../_models/message';
import { AuthService } from '../_services/Auth.service';
import { MessageService } from '../_services/message.service';

@Injectable()
export class MessagesResolver implements Resolve<Message[]> {
    pageNumber = 1;
    pageSize = 5;
    messageContainer = 'Unread';

    constructor(private messageService: MessageService, private router: Router,
                private auth: AuthService, private alertify: AlertifyService) { }
    resolve(route: ActivatedRouteSnapshot): Observable<Message[]> {
        return this.messageService.getMessages(this.auth.decodedToken.nameid, this.pageNumber,
                this.pageSize, this.messageContainer).pipe(
            catchError(error => {
                this.alertify.error('Problem retrieving messages');
                this.router.navigate(['/home']);
                return of(null);
            })
        );
    }
}
