import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';
import { MAX_MONEY, moneyValidator, trimmedRequired } from '@/shared/utils/form-validators';
import type { CreateRoomTypeRequest, RoomType, UpdateRoomTypeRequest } from '../../interfaces/room.interface';

export type RoomTypeSubmit =
  | { id: null; body: CreateRoomTypeRequest }
  | { id: string; body: UpdateRoomTypeRequest };

const moneyValidators = [Validators.required, Validators.min(0), Validators.max(MAX_MONEY), moneyValidator];

/** Crear o editar un tipo de habitación (con sus tarifas) en un modal. */
@Component({
  selector: 'room-type-form',
  imports: [ReactiveFormsModule, NgIcon, Button, Modal],
  viewProviders: [provideIcons({ tablerAlertCircle })],
  templateUrl: './room-type-form.html',
})
export class RoomTypeForm {
  private fb = inject(FormBuilder).nonNullable;

  open = input(false);
  saving = input(false);
  error = input<string | null>(null);
  /** null = crear. */
  roomType = input<RoomType | null>(null);

  submitted = output<RoomTypeSubmit>();
  cancelled = output<void>();
  closed = output<void>();

  readonly submitAttempted = signal(false);

  form = this.fb.group({
    name: this.fb.control('', [trimmedRequired, Validators.maxLength(60)]),
    capacity: this.fb.control<number | null>(2, [Validators.required, Validators.min(1), Validators.max(20)]),
    description: this.fb.control('', [Validators.maxLength(300)]),
    hourPrice: this.fb.control<number | null>(null, moneyValidators),
    nightPrice: this.fb.control<number | null>(null, moneyValidators),
    extraHourPrice: this.fb.control<number | null>(null, moneyValidators),
  });

  resetOnOpen = effect(() => {
    if (!this.open()) return;
    const type = this.roomType();
    untracked(() => {
      this.submitAttempted.set(false);
      if (!type) {
        this.form.reset();
        return;
      }
      this.form.reset({
        name: type.name,
        capacity: type.capacity,
        description: type.description ?? '',
        hourPrice: Number(type.hourPrice),
        nightPrice: Number(type.nightPrice),
        extraHourPrice: Number(type.extraHourPrice),
      });
    });
  });

  invalid(name: keyof typeof this.form.controls): boolean {
    return this.submitAttempted() && this.form.controls[name].invalid;
  }

  onSubmit() {
    if (this.saving()) return;
    this.submitAttempted.set(true);
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const body = {
      name: raw.name.trim(),
      capacity: raw.capacity!,
      hourPrice: raw.hourPrice!,
      nightPrice: raw.nightPrice!,
      extraHourPrice: raw.extraHourPrice!,
    };
    const description = raw.description.trim();
    const type = this.roomType();
    if (type) {
      this.submitted.emit({ id: type.id, body: { ...body, description: description || null } });
    } else {
      this.submitted.emit({ id: null, body: description ? { ...body, description } : body });
    }
  }
}
