import { Component, input, output } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { DOCUMENT_TYPE_LABEL, DOCUMENT_TYPES } from '../../utils/stay-labels';
import type { GuestFormGroup } from '../../utils/check-in-form';

/**
 * Datos de un huésped adulto del check-in. El documento va primero: al salir del número
 * se emite `lookup` y, si ya se hospedó antes, el contenedor completa el resto.
 */
@Component({
  selector: 'stay-guest-fields',
  imports: [ReactiveFormsModule],
  templateUrl: './stay-guest-fields.html',
  host: { class: 'block' },
})
export class StayGuestFields {
  group = input.required<GuestFormGroup>();
  submitAttempted = input(false);
  lookingUp = input(false);
  lookup = output<void>();

  readonly documentTypes = DOCUMENT_TYPES;
  readonly documentTypeLabel = DOCUMENT_TYPE_LABEL;

  invalid(control: AbstractControl): boolean {
    return this.submitAttempted() && control.invalid;
  }
}
