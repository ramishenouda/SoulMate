import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HubHelperService {
  public location = 'home';
  public deepLocation: string;

constructor() { }

}
