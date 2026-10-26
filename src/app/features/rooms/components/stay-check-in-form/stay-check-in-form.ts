import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerChevronDown, tablerMinus, tablerPlus, tablerStar, tablerTrash } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { SegmentedControl, type SegmentedOption } from '@/shared/components/segmented-control/segmented-control';
import { MAX_MONEY, moneyValidator } from '@/shared/utils/form-validators';
import type { DocumentType, Guest, RateKind, Room, RoomType, Sex, StoreSettings } from '../../interfaces/room.interface';
import type { CheckInRequest, PaymentMethod } from '../../interfaces/stay.interface';
import {
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_TYPES,
  GUARDIAN_RELATION_LABEL,
  GUARDIAN_RELATIONS,
  HOUR_SHORTCUTS,
  MAX_STAY_HOURS,
  MIN_STAY_HOURS,
  PAYMENT_METHOD_OPTIONS,
  TRAVEL_REASONS,
} from '../../utils/stay-labels';
import { limaInputToIso, suggestedCheckOut } from '../../utils/stay-time';
import { createGuestGroup, createMinorGroup, futureValidator } from '../../utils/check-in-form';
import { StayGuestFields } from '../stay-guest-fields/stay-guest-fields';

export interface GuestLookupRequest {
  index: number;
  documentType: DocumentType;
  documentNumber: string;
}

export interface GuestLookupResult {
  index: number;
  guest: Guest;
}

const toCents = (value: number) => Math.round(value * 100);

/** Horas con las que arranca la tarifa por horas. */
const DEFAULT_HOURS = 3;

/** Igual que el backend: por horas = horas × precio por hora; noche = precio por noche. */
const referencePrice = (kind: RateKind, hours: number, type: RoomType) =>
  kind === 'HOURLY' ? (toCents(Number(type.hourPrice)) * hours) / 100 : Number(type.nightPrice);

/**
 * Formulario de check-in (presentacional): arma el body del POST /stay.
 * El primer huésped de la lista es siempre el principal (titular); el resto son acompañantes.
 * La búsqueda del huésped la hace el contenedor: se emite `guestLookup` y vuelve por `foundGuest`.
 */
@Component({
  selector: 'stay-check-in-form',
  imports: [ReactiveFormsModule, DecimalPipe, NgIcon, Button, SegmentedControl, StayGuestFields],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerChevronDown, tablerMinus, tablerPlus, tablerStar, tablerTrash })],
  templateUrl: './stay-check-in-form.html',
})
export class StayCheckInForm {
  private fb = inject(FormBuilder).nonNullable;

  room = input.required<Room>();
  roomType = input.required<RoomType>();
  settings = input.required<StoreSettings>();
  saving = input(false);
  error = input<string | null>(null);
  /** Índice de la fila buscándose (spinner en el documento). */
  lookingUp = input<number | null>(null);
  foundGuest = input<GuestLookupResult | null>(null);

  submitted = output<CheckInRequest>();
  guestLookup = output<GuestLookupRequest>();
  cancelled = output<void>();

  readonly documentTypes = DOCUMENT_TYPES;
  readonly documentTypeLabel = DOCUMENT_TYPE_LABEL;
  readonly guardianRelations = GUARDIAN_RELATIONS;
  readonly guardianRelationLabel = GUARDIAN_RELATION_LABEL;
  readonly travelReasons = TRAVEL_REASONS;
  readonly paymentOptions = PAYMENT_METHOD_OPTIONS;

  readonly minHours = MIN_STAY_HOURS;
  readonly maxHours = MAX_STAY_HOURS;
  readonly hourOptions: SegmentedOption<string>[] = HOUR_SHORTCUTS.map(hours => ({ value: String(hours), label: `${hours} h` }));

  readonly rateOptions = computed<SegmentedOption<RateKind>[]>(() => {
    const type = this.roomType();
    return [
      { value: 'HOURLY', label: 'Por horas', title: `S/ ${Number(type.hourPrice).toFixed(2)} por hora` },
      { value: 'NIGHT', label: 'Por noche', title: `S/ ${Number(type.nightPrice).toFixed(2)}` },
    ];
  });

  readonly submitAttempted = signal(false);
  readonly minorsOpen = signal(false);

  form = this.fb.group({
    rateKind: this.fb.control<RateKind>('NIGHT'),
    /** Solo cuenta en la tarifa por horas. */
    hours: this.fb.control(DEFAULT_HOURS),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01), Validators.max(MAX_MONEY), moneyValidator]),
    expectedCheckOut: this.fb.control('', [futureValidator]),
    travelReason: this.fb.control(''),
    notes: this.fb.control('', [Validators.maxLength(500)]),
    /** El índice 0 es el huésped principal. */
    guests: this.fb.array([createGuestGroup(this.fb)]),
    minors: this.fb.array([] as ReturnType<typeof createMinorGroup>[]),
    payMethod: this.fb.control<PaymentMethod>('CASH'),
  });

  /** Todo lo que lee la plantilla sale de esta señal (app zoneless). */
  private value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly rateKind = computed(() => this.value().rateKind ?? 'NIGHT');
  readonly hours = computed(() => this.value().hours ?? DEFAULT_HOURS);
  /** Atajo marcado; ninguno si las horas se eligieron con − / + (p. ej. 5 h). */
  readonly hourShortcut = computed(() => {
    const hours = this.hours();
    return HOUR_SHORTCUTS.includes(hours) ? String(hours) : null;
  });
  /** Precio de referencia del tipo de habitación; lo cobrado puede ser otro. */
  readonly listPrice = computed(() => referencePrice(this.rateKind(), this.hours(), this.roomType()));
  readonly referenceText = computed(() => {
    const type = this.roomType();
    const total = `S/ ${this.listPrice().toFixed(2)}`;
    return this.rateKind() === 'HOURLY'
      ? `${this.hours()} h × S/ ${Number(type.hourPrice).toFixed(2)} = ${total}`
      : `${total} por noche`;
  });
  readonly price = computed(() => {
    const amount = this.value().amount;
    return typeof amount === 'number' && amount > 0 ? amount : 0;
  });
  readonly priceDiffers = computed(() => {
    const amount = this.value().amount;
    return typeof amount === 'number' && amount !== this.listPrice();
  });

  readonly guestCount = computed(() => this.value().guests?.length ?? 1);
  readonly companionSlots = computed(() => Math.max(0, this.room().capacity - 1));
  readonly canAddCompanion = computed(() => this.guestCount() < this.room().capacity);
  readonly minorCount = computed(() => this.value().minors?.length ?? 0);

  readonly payMethod = computed(() => this.value().payMethod ?? 'CASH');

  /** Al cambiar de habitación (o al llegar los datos) se arranca de cero con lo sugerido. */
  resetOnRoom = effect(() => {
    const type = this.roomType();
    const settings = this.settings();
    this.room();
    untracked(() => {
      this.form.controls.guests.clear();
      this.form.controls.guests.push(createGuestGroup(this.fb));
      this.form.controls.minors.clear();
      // Siempre se cobra al ingresar; las horas extra se cobran al salir.
      this.form.reset({ payMethod: 'CASH', travelReason: '', notes: '', hours: DEFAULT_HOURS });
      this.applyRate('NIGHT', DEFAULT_HOURS, type, settings);
      this.submitAttempted.set(false);
      this.minorsOpen.set(false);
    });
  });

  patchFoundGuest = effect(() => {
    const found = this.foundGuest();
    if (!found) return;
    const row = untracked(() => this.form.controls.guests.at(found.index));
    if (!row) return;
    const { guest } = found;
    row.patchValue({
      fullName: guest.fullName,
      birthDate: guest.birthDate,
      sex: guest.sex,
      nationality: guest.nationality,
      residence: guest.residence,
      phone: guest.phone ?? '',
    });
  });

  get guests() {
    return this.form.controls.guests;
  }

  get minors() {
    return this.form.controls.minors;
  }

  setRate(kind: RateKind) {
    this.applyRate(kind, this.hours(), this.roomType(), this.settings());
  }

  /** Cambiar las horas vuelve a poner el precio de referencia y la salida prevista. */
  setHours(hours: number | string) {
    const next = Math.min(MAX_STAY_HOURS, Math.max(MIN_STAY_HOURS, Math.round(Number(hours))));
    if (!Number.isFinite(next)) return;
    this.applyRate('HOURLY', next, this.roomType(), this.settings());
  }

  setPayMethod(method: PaymentMethod) {
    this.form.controls.payMethod.setValue(method);
  }

  addCompanion() {
    if (!this.canAddCompanion()) return;
    this.guests.push(createGuestGroup(this.fb));
  }

  removeGuest(index: number) {
    if (index === 0 || this.guests.length <= 1) return;
    this.guests.removeAt(index);
  }

  /** Pasa un acompañante al primer lugar: el primero es el principal. */
  makePrincipal(index: number) {
    if (index <= 0) return;
    const row = this.guests.at(index);
    this.guests.removeAt(index, { emitEvent: false });
    this.guests.insert(0, row);
  }

  addMinor() {
    this.minors.push(createMinorGroup(this.fb));
    this.minorsOpen.set(true);
  }

  removeMinor(index: number) {
    this.minors.removeAt(index);
  }

  lookup(index: number) {
    const row = this.guests.at(index);
    if (!row) return;
    const documentNumber = row.controls.documentNumber.value.trim();
    if (!documentNumber) return;
    this.guestLookup.emit({ index, documentType: row.controls.documentType.value, documentNumber });
  }

  invalid(control: AbstractControl): boolean {
    return this.submitAttempted() && control.invalid;
  }

  onSubmit() {
    if (this.saving()) return;
    this.submitAttempted.set(true);
    if (this.minors.invalid) this.minorsOpen.set(true);
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const body: CheckInRequest = {
      roomId: this.room().id,
      rateKind: raw.rateKind,
      ...(raw.rateKind === 'HOURLY' && { hours: raw.hours }),
      amount: raw.amount!,
      // No se da fiado: el servidor cobra la tarifa completa al ingresar (un precio en 0 no genera pago).
      paymentMethod: raw.payMethod,
      expectedCheckOut: limaInputToIso(raw.expectedCheckOut) ?? undefined,
      guests: raw.guests.map((guest, index) => ({
        documentType: guest.documentType,
        documentNumber: guest.documentNumber.trim(),
        fullName: guest.fullName.trim(),
        birthDate: guest.birthDate,
        sex: guest.sex as Sex,
        nationality: guest.nationality.trim(),
        residence: guest.residence.trim(),
        phone: guest.phone.trim() || undefined,
        isHolder: index === 0,
      })),
    };
    if (raw.travelReason.trim()) body.travelReason = raw.travelReason.trim();
    if (raw.notes.trim()) body.notes = raw.notes.trim();
    if (raw.minors.length) {
      body.minors = raw.minors.map(minor => ({
        fullName: minor.fullName.trim(),
        birthDate: minor.birthDate,
        guardianRelation: minor.guardianRelation,
        documentType: minor.documentNumber.trim() ? minor.documentType : undefined,
        documentNumber: minor.documentNumber.trim() || undefined,
        accreditation: minor.accreditation.trim() || undefined,
      }));
    }
    this.submitted.emit(body);
  }

  private applyRate(kind: RateKind, hours: number, type: RoomType, settings: StoreSettings) {
    this.form.patchValue({
      rateKind: kind,
      hours,
      amount: referencePrice(kind, hours, type),
      expectedCheckOut: suggestedCheckOut(kind, hours, settings),
    });
  }
}
