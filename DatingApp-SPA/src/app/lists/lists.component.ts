import { Component, OnInit } from '@angular/core';
import { User } from '../_models/user';
import { Pagination, PaginatedResult } from '../_models/pagination';
import { UserService } from '../_services/user.service';
import { ActivatedRoute } from '@angular/router';
import { AlertifyService } from '../_services/alertify.service';
import { AuthService } from '../_services/Auth.service';
import { HubHelperService } from '../_services/hub-helper.service';

@Component({
  selector: 'app-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.css']
})
export class ListsComponent implements OnInit {
  users: User[];
  pagination: Pagination;
  likesParam: string;
  userId: number;
  isLoaded = true;

  constructor(private userService: UserService, private authService: AuthService,
              private route: ActivatedRoute, private alertify: AlertifyService, private hubHelper: HubHelperService) { }

  ngOnInit() {
    this.hubHelper.location = 'list';
    this.hubHelper.deepLocation = -1;

    this.route.data.subscribe(data => {
      this.isLoaded = true;
      this.pagination = data.users.pagination;
      this.likesParam = 'likers';
      this.loadUsers();
    });
    this.userId = this.authService.decodedToken.nameid;
  }

  loadUsers() {
    this.userService
      .getUsers(this.pagination.currentPage, this.pagination.itemsPerPage, 'mix', this.likesParam)
        .subscribe((res: PaginatedResult<User[]>) => {
          this.users = res.result;
          // tslint:disable-next-line: prefer-for-of
          for (let i = 0; i < this.users.length; i++) {
            this.userService.checkUserSoul(this.userId, this.users[i].id).subscribe(
              (isSoul) => {
                if (this.users[i] !== undefined) {
                  this.users[i].isSoul = isSoul;
                  if (isSoul && this.likesParam === 'likers') {
                    this.users[i].likee = true;
                  } else if (this.likesParam === 'likees') {
                    this.users[i].likee = true;
                  }
                }
              }
            );
          }
          this.pagination = res.pagination;
        },
        error => {
          this.alertify.error(error);
        }
      );
  }

  pageChanged(event: any): void {
    this.pagination.currentPage = event.page;
    this.loadUsers();
  }
}
