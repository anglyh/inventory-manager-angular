import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CashRegisterService } from '@/features/cash-register/services/cash-register.service';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { VoidMovementDialog } from '@/features/inventory-movements/components/void-movement-dialog/void-movement-dialog';
import { InventoryMovementList } from '@/features/inventory-movements/components/inventory-movement-list/inventory-movement-list';
import { MovementFilters } from '@/features/inventory-movements/components/movement-filters/movement-filters';
import { AuthService } from '@/auth/services/auth.service';
import type {
  InventoryMovement,
  MovementCursor,
  MovementFilters as Filters,
} from '@/features/inventory-movements/interfaces/inventory-movement.interface';
import { MovementHistoryMapper } from '@/features/inventory-movements/mappers/movement-history.mapper';
import { InventoryMovementService } from '@/features/inventory-movements/services/inventory-movement.service';
import { ProductService } from '@/features/products/services/product.service';
import { InfiniteScrollDirective } from '@/shared/directives/infinite-scroll.directive';
import { extractApiError } from '@/api/extract-api-error';
import { mapApiError } from '@/api/error-mapper';
import { Button } from '@/shared/components/button/button';

@Component({
  selector: 'app-movements-history-page',
  imports: [InventoryMovementList, MovementFilters, InfiniteScrollDirective, VoidMovementDialog, Button],
  templateUrl: './movements-history-page.html',
})
export class MovementsHistoryPage {
  readonly isAdmin = inject(AuthService).isAdmin;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private movementService = inject(InventoryMovementService);
  private productService = inject(ProductService);
  private notificationService = inject(GlobalNotificationService);
  private cashRegisterService = inject(CashRegisterService);

  private request?: Subscription;

  movements = signal<InventoryMovement[]>([]);
  nextCursor = signal<MovementCursor | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  voidOpen = signal(false);
  voidTarget = signal<InventoryMovement | null>(null);
  voiding = signal(false);
  voidError = signal<string | null>(null);

  /** La URL es la fuente de verdad: los filtros sobreviven a recargas y se pueden compartir. */
  private queryParams = toSignal(this.route.queryParamMap, { requireSync: true });
  filters = computed(() => MovementHistoryMapper.fromParams(this.queryParams()));

  productsResource = rxResource({
    stream: () => this.productService.listProductOptions(),
  });

  constructor() {
    // Cada cambio de filtros reinicia la paginación sin cursor, como pide el contrato.
    effect(() => {
      const filters = this.filters();
      untracked(() => this.load(filters, null));
    });

    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  onFiltersChange(filters: Filters) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: MovementHistoryMapper.toParams(filters),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  loadMore() {
    const cursor = this.nextCursor();
    if (!cursor || this.loading() || this.error()) return;
    this.load(this.filters(), cursor);
  }

  retry() {
    this.load(this.filters(), this.movements().length ? this.nextCursor() : null);
  }

  openVoid(movement: InventoryMovement) {
    this.voidError.set(null);
    this.voidTarget.set(movement);
    this.voidOpen.set(true);
  }

  closeVoid() {
    this.voidOpen.set(false);
  }

  /** Esc, el fondo o el código: el modal ya terminó de animarse, se limpia su contenido. */
  onVoidClosed() {
    this.voidOpen.set(false);
    this.voidTarget.set(null);
    this.voidError.set(null);
  }

  confirmVoid(reason: string) {
    const movement = this.voidTarget();
    if (!movement || this.voiding()) return;

    this.voiding.set(true);
    this.voidError.set(null);

    this.movementService.voidMovement(movement.id, { reason }).subscribe({
      next: () => {
        this.closeVoidAfterSave();
        this.notificationService.show('Movimiento anulado');
        // Una venta anulada cambia el efectivo y las ventas de la caja abierta.
        if (movement.reason === 'SALE') this.cashRegisterService.currentCashRegisterResource.reload();
        this.refreshMovement(movement.id);
      },
      error: error => {
        this.voiding.set(false);
        const apiError = extractApiError(error);
        const mapped = mapApiError(apiError);
        if (mapped.redirect) {
          void this.router.navigate([mapped.redirect]);
          return;
        }
        if (apiError.code === 'NOT_FOUND') {
          this.closeVoidAfterSave();
          this.notificationService.show('El movimiento ya no existe', 'error');
          this.load(this.filters(), null);
          return;
        }
        // 409/422: el modal sigue abierto para que el motivo concreto se pueda leer.
        const message = (mapped.fields ? Object.values(mapped.fields).join(' · ') : mapped.toast)
          || apiError.message || 'No se pudo anular el movimiento.';
        // Si el modal se cerró mientras se enviaba, el motivo no se perdería en silencio.
        if (this.voidOpen()) this.voidError.set(message);
        else this.notificationService.show(message, 'error');
      },
    });
  }

  /**
   * El 204 no trae body: se pide el movimiento para mostrar lo que guardó el
   * servidor sin perder la posición del scroll. Si falla, se recarga la lista.
   */
  private refreshMovement(id: string) {
    this.movementService.getMovement(id).subscribe({
      next: updated => this.movements.update(list => list.map(item => (item.id === id ? updated : item))),
      error: () => this.load(this.filters(), null),
    });
  }

  private closeVoidAfterSave() {
    this.voiding.set(false);
    this.voidOpen.set(false);
  }

  private load(filters: Filters, cursor: MovementCursor | null) {
    // Una respuesta de filtros anteriores nunca debe mezclarse con la actual.
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    if (!cursor) this.movements.set([]);

    this.request = this.movementService
      .getMovements(MovementHistoryMapper.toQuery(filters, cursor))
      .subscribe({
        next: page => {
          this.movements.update(current => (cursor ? [...current, ...page.data] : page.data));
          this.nextCursor.set(page.nextCursor);
          this.loading.set(false);
        },
        error: error => {
          const apiError = extractApiError(error);
          const mapped = mapApiError(apiError);
          if (mapped.redirect) {
            void this.router.navigate([mapped.redirect]);
            return;
          }
          const message = mapped.fields ? Object.values(mapped.fields).join(' · ') : mapped.toast;
          this.error.set(message || apiError.message || 'No se pudo cargar el historial.');
          this.loading.set(false);
        },
      });
  }
}
