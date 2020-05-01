import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'timeAgoMessages'})
export class TimeAgoPipeMessages implements PipeTransform {
  transform(value: Date) {
    const currentSeconds = new Date().valueOf();
    const valueSeconds = new Date(value).valueOf();
    const lastActive = (currentSeconds - valueSeconds) / 1000;

    return this.getLastActive(lastActive);
  }

  getLastActive(time: number): string {
    // The time is in seconds at first
    if (time < 45) {
      return 'seconds ago';
    }
    // Now minutes
    time /= 60;
    if ( time < 2) {
      return '1 Minute ago';
    } else if (time < 60) {
      return this.writeTime(time, ' Minutes ago');
    }
    // Now hours
    time /= 60;

    if ( time < 2) {
      return '1 Hour ago';
    } else if (time < 24) {
      return this.writeTime(time, ' Hours ago');
    }
    // Now days
    time /= 24;
    if ( time < 2) {
      return '1 Day ago';
    } else if (time < 60) {
      return this.writeTime(time, ' Days ago');
    }
    // Now months
    time /= 30.417;
    if ( time < 2) {
      return '1 Month ago';
    } else if (time < 12) {
      return this.writeTime(time, ' Months ago');
    }
    // Now Years
    time /= 12;
    if (time < 2) {
      return this.writeTime(time, ' Year ago');
    } else {
      return this.writeTime(time, ' Years ago');
    }
  }

  writeTime(time: number, message: string) {
    time = Math.floor(time);
    time = 0 ? time++ : time;
    return time + message;
  }
}

