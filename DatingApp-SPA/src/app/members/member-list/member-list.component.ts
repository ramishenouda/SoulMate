import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/_models/user';
import { UserService } from 'src/app/_services/user.service';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { ActivatedRoute } from '@angular/router';
import { Pagination, PaginatedResult } from 'src/app/_models/pagination';
import { HubHelperService } from 'src/app/_services/hub-helper.service';

@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.css']
})
export class MemberListComponent implements OnInit {
  users: User[];
  user: User = JSON.parse(localStorage.getItem('user'));
  userParams: any = {};
  genderList = [{value: 'male', display: 'Males'}, {value: 'female', display: 'Females'}];
  pagination: Pagination;
  messages = false;
  screenWidth: number;
  constructor(private userService: UserService, private alertify: AlertifyService,
              private route: ActivatedRoute, private hubHelper: HubHelperService) { }

  ngOnInit() {
    this.screenWidth = screen.width;
    this.hubHelper.location = 'list';
    this.hubHelper.deepLocation = -1;

    this.route.data.subscribe(data => {
      this.users = data.users.result;
      this.pagination = data.users.pagination;
    });

    this.userParams.gender = this.user.gender === 'male' ? 'female' : 'male';
    this.userParams.minAge = 18;
    this.userParams.maxAge = 99;
  }

  pageChanged(event: any): void {
    this.pagination.currentPage = event.page;
    this.loadUsers();
  }

  resetFilters() {
    this.userParams.gender = this.user.gender === 'male' ? 'female' : 'male';
    this.userParams.orderBy = 'lastActive';
    this.userParams.minAge = 18;
    this.userParams.maxAge = 99;
  }

  loadUsers() {
    this.userService
      .getUsers(this.pagination.currentPage, this.pagination.itemsPerPage, this.userParams, 'noConnection')
        .subscribe((res: PaginatedResult<User[]>) => {
          this.users = res.result;
          this.pagination = res.pagination;
          // tslint:disable-next-line: prefer-for-of
          for (let i = 0; i < this.users.length; i++) {
            this.userService.checkUserSoul(this.user.id, this.users[i].id).subscribe(
              (isSoul) => {
                this.users[i].isSoul = isSoul;
              }
            );
          }
        },
        error => {
          this.alertify.error(error);
        }
      );
  }
}
