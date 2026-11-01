import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerCheck, tablerChevronDown } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';
import { trimmedRequired } from '@/shared/utils/form-validators';
import type { CreateRoomRequest, Room, RoomType, UpdateRoomRequest } from '../../interfaces/room.interface';

export type RoomSubmit =
  | { id: null; body: CreateRoomRequest }
  | { id: string; body: UpdateRoomRequest };

/** Crear o editar una habitación en un modal. El tipo se elige de una lista con sus tarifas. */
@Component({
  selector: 'room-form',
  imports: [ReactiveFormsModule, DecimalPipe, NgIcon, Button, Modal],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerCheck, tablerChevronDown })],
  templateUrl: './room-form.html',
})
export class RoomForm {
  private fb = inject(FormBuilder).nonNullable;

  open = input(false);
  saving = input(false);
  error = input<string | null>(null);
  /** null = crear. */
  room = input<Room | null>(null);
  roomTypes = input.required<RoomType[]>();

  submitted = output<RoomSubmit>();
  cancelled = output<void>();
  closed = output<void>();

  readonly submitAttempted = signal(false);

  form = this.fb.group({
    number: this.fb.control('', [trimmedRequired, Validators.maxLength(10)]),
    floor: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(99)]),
    roomTypeId: this.fb.control('', [Validators.required]),
  });

  private readonly roomTypeId = toSignal(this.form.controls.roomTypeId.valueChanges, { initialValue: '' });

  /** Tipos activos, más el actual de la habitación aunque esté desactivado. */
  readonly options = computed(() => {
    const current = this.room()?.roomTypeId;
    return this.roomTypes().filter(type => type.isActive || type.id === current);
  });

  readonly selected = computed(() => this.roomTypes().find(type => type.id === this.roomTypeId()) ?? null);

  /** Con un huésped dentro no se cambia el tipo: la tarifa ya se cobró con el anterior. */
  readonly typeLocked = computed(() => this.room()?.status === 'OCCUPIED');

  resetOnOpen = effect(() => {
    if (!this.open()) return;
    const room = this.room();
    untracked(() => {
      this.submitAttempted.set(false);
      const onlyType = this.options().length === 1 ? this.options()[0].id : '';
      this.form.reset({
        number: room?.number ?? '',
        floor: room?.floor ?? null,
        roomTypeId: room?.roomTypeId ?? onlyType,
      });
    });
  });

  invalid(name: keyof typeof this.form.controls): boolean {
    return this.submitAttempted() && this.form.controls[name].invalid;
  }

  chooseType(type: RoomType) {
    this.form.controls.roomTypeId.setValue(type.id);
    this.form.controls.roomTypeId.markAsDirty();
    (document.activeElement as HTMLElement | null)?.blur();
  }

  onSubmit() {
    if (this.saving()) return;
    this.submitAttempted.set(true);
    if (this.form.invalid) return;
    const { number, floor, roomTypeId } = this.form.getRawValue();
    const room = this.room();
    if (room) {
      this.submitted.emit({ id: room.id, body: { number: number.trim(), floor, roomTypeId } });
      return;
    }
    const body: CreateRoomRequest = { number: number.trim(), roomTypeId };
    if (floor !== null) body.floor = floor;
    this.submitted.emit({ id: null, body });
  }
}
