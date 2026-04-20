import { FormUtils } from '@/utils/form-utils';
import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-error-label',
  imports: [],
  templateUrl: './form-error-label.html',
})
export class FormErrorLabel {
  control = input.required<AbstractControl>();

  get errorMessage() {
    const errors = this.control().errors || {};
    return this.control().touched && Object.keys(errors).length > 0
      ? FormUtils.getTextError(errors)
      : null;
  }
}
