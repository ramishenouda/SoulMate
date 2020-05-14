/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { HubHelperService } from './hub-helper.service';

describe('Service: HubHelper', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HubHelperService]
    });
  });

  it('should ...', inject([HubHelperService], (service: HubHelperService) => {
    expect(service).toBeTruthy();
  }));
});
