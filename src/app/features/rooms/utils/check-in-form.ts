import { AbstractControl, NonNullableFormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { trimmedRequired } from '@/shared/utils/form-validators';
import type { DocumentType, GuardianRelation, Sex } from '../interfaces/room.interface';
import { DEFAULT_NATIONALITY } from './stay-labels';
import { ageFromBirthDate, limaInputToIso } from './stay-time';

const ADULT_AGE = 18;

export const adultValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const age = ageFromBirthDate(control.value);
  if (age === null) return { date: true };
  return age < ADULT_AGE ? { minor: true } : null;
};

export const minorValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const age = ageFromBirthDate(control.value);
  if (age === null) return { date: true };
  return age >= ADULT_AGE ? { adult: true } : null;
};

export const futureValidator = (control: AbstractControl): ValidationErrors | null => {
  const iso = limaInputToIso(control.value);
  if (!iso) return { required: true };
  return new Date(iso).getTime() <= Date.now() ? { past: true } : null;
};

export function createGuestGroup(fb: NonNullableFormBuilder) {
  return fb.group({
    documentType: fb.control<DocumentType>('DNI'),
    documentNumber: fb.control('', [trimmedRequired, Validators.maxLength(20)]),
    fullName: fb.control('', [trimmedRequired, Validators.maxLength(150)]),
    birthDate: fb.control('', [Validators.required, adultValidator]),
    sex: fb.control<Sex | ''>('', [Validators.required]),
    nationality: fb.control(DEFAULT_NATIONALITY, [trimmedRequired, Validators.maxLength(60)]),
    residence: fb.control('', [trimmedRequired, Validators.maxLength(150)]),
    phone: fb.control('', [Validators.maxLength(20)]),
  });
}

export function createMinorGroup(fb: NonNullableFormBuilder) {
  return fb.group({
    fullName: fb.control('', [trimmedRequired, Validators.maxLength(150)]),
    birthDate: fb.control('', [Validators.required, minorValidator]),
    guardianRelation: fb.control<GuardianRelation>('PARENT'),
    documentType: fb.control<DocumentType>('DNI'),
    documentNumber: fb.control('', [Validators.maxLength(20)]),
    accreditation: fb.control('', [Validators.maxLength(200)]),
  });
}

export type GuestFormGroup = ReturnType<typeof createGuestGroup>;
export type MinorFormGroup = ReturnType<typeof createMinorGroup>;
