import { Component, OnInit, Pipe, PipeTransform, ViewChild } from '@angular/core';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { UserService } from 'src/app/_services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/app/_models/user';
import { NgxGalleryOptions, NgxGalleryImage, NgxGalleryAnimation } from '@kolkov/ngx-gallery';
import { TabsetComponent } from 'ngx-bootstrap/tabs/ngx-bootstrap-tabs';
import { HubHelperService } from 'src/app/_services/hub-helper.service';
import { AuthService } from 'src/app/_services/Auth.service';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.css']
})
export class MemberDetailComponent implements OnInit {
  @ViewChild('tabSet', { static: true }) tabSet: TabsetComponent;
  user: User;
  messageTap: boolean; // used for reading messaging
  isLiked: number;
  galleryOptions: NgxGalleryOptions[];
  galleryImages: NgxGalleryImage[];

  constructor(private userService: UserService, private alertify: AlertifyService, private authService: AuthService,
              private route: ActivatedRoute, private router: Router, private hubHelper: HubHelperService) { }

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.user = data.user;
      if (this.authService.currentUser.id !== this.user.id) {
        this.userService.isLiked(this.authService.currentUser.id, this.user.id).subscribe(
          value => {
            this.isLiked = value === true ? 1 : 0;
          }, error => {
            this.alertify.error('Error while retrieving some data');
            this.router.navigate(['/lists']);
          }
        );
      } else {
        this.isLiked = 2;
      }
    });

    this.route.queryParams.subscribe(params => {
      const selectedTab = +params.tab;
      this.tabSet.tabs[selectedTab > 0 ? selectedTab : 0].active = true;
      this.messageTap = selectedTab === 2 ? true : false;
    });
    this.galleryOptions = [
      {
        width: '100%',
        height: '484px',
        imagePercent: 100,
        thumbnailsColumns: 5,
        imageAnimation: NgxGalleryAnimation.Slide,
      },
      {
        breakpoint: 800,
        width: '100%',
        height: '400px',
        imagePercent: 100,
        thumbnailsColumns: 4,
        imageAnimation: NgxGalleryAnimation.Slide,
      },
      {
        breakpoint: 400,
        width: '100%',
        height: '400px',
        imagePercent: 100,
        thumbnailsColumns: 4,
        imageAnimation: NgxGalleryAnimation.Slide,
      }
    ];

    this.galleryImages = this.getImages();
  }

  getImages() {
    const imagesUrl = [];
    for (const photo of this.user.photos) {
      imagesUrl.push({
        small: photo.url,
        medium: photo.url,
        big: photo.url
      });
    }

    return imagesUrl;
  }

  selectTab(tabId: number) {
    this.tabSet.tabs[tabId].active = true;
  }

  triggerMessageTap(value: boolean) {
    this.messageTap = value;
    this.hubHelper.location = value ? 'memberMessageBox' : '';
    this.hubHelper.deepLocation = value ? this.user.knownAs : '';
  }

  sendLike() {
    (document.getElementById('likeButton') as HTMLInputElement).disabled = true;

    this.userService.sendLike(this.authService.currentUser.id, this.user.id).subscribe(() => {
      this.isLiked = 1;
      this.alertify.success('Liked');
    }, error => {
      this.alertify.message('Calm down :D');
      (document.getElementById('likeButton') as HTMLInputElement).disabled = true;
    });
  }

  unlike() {
    this.userService.unlike(this.authService.currentUser.id, this.user.id).subscribe(() => {
      this.isLiked = 0;
      this.alertify.success('Unliked');
    }, error => {
      this.alertify.error(error);
    });
  }
}
