import { Component, OnInit, Pipe, PipeTransform, ViewChild } from '@angular/core';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { UserService } from 'src/app/_services/user.service';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/_models/user';
import { NgxGalleryOptions, NgxGalleryImage, NgxGalleryAnimation } from '@kolkov/ngx-gallery';
import { TabsetComponent } from 'ngx-bootstrap/tabs/ngx-bootstrap-tabs';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.css']
})
export class MemberDetailComponent implements OnInit {
  @ViewChild('tabSet', { static: true }) tabSet: TabsetComponent;
  user: User;
  galleryOptions: NgxGalleryOptions[];
  galleryImages: NgxGalleryImage[];

  constructor(private userService: UserService, private alertify: AlertifyService,
              private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.user = data.user;
    });

    this.route.queryParams.subscribe(params => {
      const selectedTab = params.tab;
      this.tabSet.tabs[selectedTab > 0 ? selectedTab : 0].active = true;
    });
    this.galleryOptions = [
      {
        width: '100%',
        height: '500px',
        imagePercent: 100,
        thumbnailsColumns: 5,
        imageAnimation: NgxGalleryAnimation.Slide,
        preview: false,
      },
      {
        breakpoint: 800,
        width: '100%',
        height: '400px',
        imagePercent: 100,
        thumbnailsColumns: 4,
        imageAnimation: NgxGalleryAnimation.Slide,
        preview: false,
      },
      {
        breakpoint: 400,
        width: '100%',
        height: '400px',
        imagePercent: 100,
        thumbnailsColumns: 4,
        imageAnimation: NgxGalleryAnimation.Slide,
        preview: false
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

  // loadUser() {
  //   this.userService.getUser(this.route.snapshot.params.id).subscribe(user => {
  //     this.user = user;
  //   }, error => {
  //     this.alertify.error(error);
  //   });
  // }
}
