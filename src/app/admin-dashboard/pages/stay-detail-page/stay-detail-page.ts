import { Button } from '@/shared/components/button/button';
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerAlertCircle,
  tablerArrowLeft,
  tablerCash,
  tablerCircleCheck,
  tablerClockExclamation,
  tablerDoorExit,
  tablerWorld,
} from '@ng-icons/tabler-icons';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { resolveApiError } from '@/shared/utils/api-error';
import { StayService } from '@/features/rooms/services/stay.service';
import { StayGuests } from '@/features/rooms/components/stay-guests/stay-guests';
import { StayAccount } from '@/features/rooms/components/stay-account/stay-account';
import { StayChargeDialog } from '@/features/rooms/components/stay-charge-dialog/stay-charge-dialog';
import { StayPaymentDialog } from '@/features/rooms/components/stay-payment-dialog/stay-payment-dialog';
import { StayCheckOutDialog } from '@/features/rooms/components/stay-check-out-dialog/stay-check-out-dialog';
import type {
  CheckOutRequest,
  CreateStayChargeRequest,
  CreateStayPaymentRequest,
  StayDetail,
} from '@/features/rooms/interfaces/stay.interface';
import { rateText } from '@/features/rooms/utils/stay-labels';
import { formatDuration, minutesSince } from '@/features/rooms/utils/stay-time';

type DialogKind = 'charge' | 'payment' | 'checkOut';

@Component({
  selector: 'app-stay-detail-page',
  imports: [
    Button,
    DatePipe,
    DecimalPipe,
    NgIcon,
    StayGuests,
    StayAccount,
    StayChargeDialog,
    StayPaymentDialog,
    StayCheckOutDialog,
  ],
  viewProviders: [
    provideIcons({ tablerAlertCircle, tablerArrowLeft, tablerCash, tablerCircleCheck, tablerClockExclamation, tablerDoorExit, tablerWorld }),
  ],
  templateUrl: './stay-detail-page.html',
})
export class StayDetailPage {
  private stayService = inject(StayService);
  private router = inject(Router);
  private location = inject(Location);
  private notification = inject(GlobalNotificationService);

  /**
   * Vuelve a donde estaba (tablero o registro, con sus filtros y página).
   * Si se entró directo por URL no hay historial propio: va al tablero.
   */
  goBack() {
    const navigationId = (this.location.getState() as { navigationId?: number } | null)?.navigationId ?? 1;
    if (navigationId > 1) this.location.back();
    else void this.router.navigate(['/rooms']);
  }

  readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map(params => params.get('id') ?? '')), {
    requireSync: true,
  });

  readonly stayResource = rxResource({
    params: () => this.id() || undefined,
    stream: ({ params: id }) => this.stayService.getStay(id),
  });

  readonly stay = computed(() => (this.stayResource.hasValue() ? this.stayResource.value() : null));
  readonly isActive = computed(() => this.stay()?.status === 'ACTIVE');
  readonly balance = computed(() => Number(this.stay()?.balance ?? 0));
  readonly holderName = computed(() => this.stay()?.guests.find(guest => guest.isHolder)?.fullName ?? null);
  /** Minutos pasados de la salida prevista; el backend los da junto al adicional sugerido. */
  private overdueMinutes = computed(() => {
    const stay = this.stay();
    if (!stay || stay.status !== 'ACTIVE') return 0;
    return Math.max(0, stay.suggestedExtra?.overdueMinutes ?? minutesSince(stay.expectedCheckOut));
  });
  readonly overdue = computed(() => this.overdueMinutes() > 0);
  readonly overdueLabel = computed(() => formatDuration(this.overdueMinutes()));
  /** Solo si ya corresponde cobrar algo (pasada la tolerancia). */
  readonly extraSuggested = computed(() => {
    const extra = this.stay()?.suggestedExtra;
    return extra && Number(extra.amount) > 0 ? extra : null;
  });

  readonly rateText = rateText;

  readonly dialog = signal<DialogKind | null>(null);
  readonly saving = signal(false);
  readonly dialogError = signal<string | null>(null);
  readonly migrationsSaving = signal(false);

  openDialog(kind: DialogKind) {
    this.dialogError.set(null);
    this.dialog.set(kind);
  }

  onDialogClosed(kind: DialogKind) {
    if (this.dialog() === kind) this.dialog.set(null);
    this.dialogError.set(null);
  }

  addCharge(body: CreateStayChargeRequest) {
    this.mutate(id => this.stayService.addCharge(id, body), 'Horas extra agregadas', 'No se pudieron agregar las horas extra.');
  }

  addPayment(body: CreateStayPaymentRequest) {
    this.mutate(id => this.stayService.addPayment(id, body), 'Pago registrado', 'No se pudo registrar el pago.');
  }

  checkOut(body: CheckOutRequest) {
    this.mutate(id => this.stayService.checkOut(id, body), null, 'No se pudo cerrar la estadía.', stay => {
      this.notification.show(`Salida registrada: la ${stay.roomNumber} pasa a limpieza`);
      void this.router.navigate(['/rooms']);
    });
  }

  toggleMigrations(reported: boolean) {
    const stay = this.stay();
    if (!stay || this.migrationsSaving()) return;
    this.migrationsSaving.set(true);
    this.stayService.setMigrationsReported(stay.id, reported).subscribe({
      next: updated => {
        this.migrationsSaving.set(false);
        this.stayResource.set(updated);
      },
      error: error => {
        this.migrationsSaving.set(false);
        // El toggle ya cambió en pantalla: se vuelve a leer el estado real.
        this.stayResource.reload();
        this.notifyError(error, 'No se pudo actualizar el reporte a Migraciones.');
      },
    });
  }

  private mutate(
    request: (id: string) => Observable<StayDetail>,
    successMessage: string | null,
    fallback: string,
    onSuccess?: (stay: StayDetail) => void,
  ) {
    const stay = this.stay();
    if (!stay || this.saving()) return;
    this.saving.set(true);
    this.dialogError.set(null);
    request(stay.id).subscribe({
      next: updated => {
        this.saving.set(false);
        this.dialog.set(null);
        this.stayResource.set(updated);
        if (successMessage) this.notification.show(successMessage);
        onSuccess?.(updated);
      },
      error: error => {
        this.saving.set(false);
        const resolved = resolveApiError(error, fallback);
        if (resolved.redirect) {
          void this.router.navigate([resolved.redirect]);
          return;
        }
        // 409 (caja cerrada, saldo pendiente) y 422 se leen dentro del modal.
        if (this.dialog()) this.dialogError.set(resolved.message);
        else this.notification.show(resolved.message, 'error');
      },
    });
  }

  private notifyError(error: unknown, fallback: string) {
    const resolved = resolveApiError(error, fallback);
    if (resolved.redirect) void this.router.navigate([resolved.redirect]);
    else this.notification.show(resolved.message, 'error');
  }
}
