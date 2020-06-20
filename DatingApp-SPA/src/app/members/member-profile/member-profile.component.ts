import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/_models/user';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { NgForm } from '@angular/forms';
import { UserService } from 'src/app/_services/user.service';
import { AuthService } from 'src/app/_services/Auth.service';

@Component({
  selector: 'app-member-profile',
  templateUrl: './member-profile.component.html',
  styleUrls: ['./member-profile.component.css']
})
export class MemberProfileComponent implements OnInit {
  @ViewChild('editForm') editForm: NgForm;
  user: User;
  tempUser: User;
  photoUrl: string;

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.editForm.dirty) {
        $event.returnValue = true;
    }
  }
  constructor(private route: ActivatedRoute, private alertify: AlertifyService,
              private userSerivce: UserService, private authService: AuthService) { }

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.user = data.user;
      this.tempUser = Object.assign({}, this.user);
    });

    this.authService.currentPhotoUrl.subscribe(photoUrl => this.photoUrl = photoUrl);
  }

  updateUser() {
    this.userSerivce.updateUser(this.authService.decodedToken.nameid, this.user).subscribe(next => {
      this.alertify.success('Profile updated successfully');
      this.editForm.reset(this.user);
      this.tempUser = Object.assign({}, this.user);
    }, error => {
      this.alertify.error(error);
    });
  }

  noChanges() {
    if (this.tempUser.introduction !== this.user.introduction || this.tempUser.interests !== this.user.interests
        || this.tempUser.city !== this.user.city || this.tempUser.country !== this.user.country) {
          return false;
    }

    return true;
  }
  updateMainPhoto(photoUrl) {
    this.user.photoUrl = photoUrl;
  }
}
