import { Injectable, HostListener, Component } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { MemberProfileComponent } from '../members/member-profile/member-profile.component';

@Injectable()
export class PreventUnsavedChanges implements CanDeactivate<MemberProfileComponent> {
    canDeactivate(component: MemberProfileComponent) {
        if (component.editForm.dirty) {
            return confirm('Changes you made will be unsaved. Are you sure you want to continue?');
        }
        return true;
    }
}
