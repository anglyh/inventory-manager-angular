import { Component, computed, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAdjustmentsHorizontal, tablerX } from '@ng-icons/tabler-icons';
import { OptionSelector } from '@/shared/components/option-selector/option-selector';
import type { ProductOption } from '@/features/products/interfaces/product.interface';
import type { MovementFilters as Filters, MovementReason, MovementType } from '../../interfaces/inventory-movement.interface';
import { MovementHistoryMapper } from '../../mappers/movement-history.mapper';
import { GROUP_OPTIONS, MOVEMENT_TYPE_LABELS, REASON_LABELS } from '../../shared/movement-labels';

@Component({
  selector: 'movement-filters',
  imports: [OptionSelector, NgIcon],
  viewProviders: [provideIcons({ tablerAdjustmentsHorizontal, tablerX })],
  templateUrl: './movement-filters.html',
})
export class MovementFilters {
  filters = input.required<Filters>();
  products = input<ProductOption[]>([]);
  filtersChange = output<Filters>();

  readonly groupOptions = GROUP_OPTIONS;
  readonly typeOptions = Object.entries(MOVEMENT_TYPE_LABELS) as [MovementType, string][];
  readonly reasonOptions = Object.entries(REASON_LABELS) as [MovementReason, string][];

  panelOpen = signal(false);

  activeCount = computed(() => MovementHistoryMapper.activeFiltersCount(this.filters()));

  productName = computed(() => {
    const id = this.filters().productId;
    return id ? this.products().find(product => product.id === id)?.name ?? '' : '';
  });

  update(changes: Partial<Filters>) {
    this.filtersChange.emit({ ...this.filters(), ...changes });
  }

  /** Conserva el grupo (pestaña) y la caja, que no forman parte del panel. */
  clear() {
    const { group, cashRegisterId } = this.filters();
    this.filtersChange.emit({ group, cashRegisterId });
  }

  selectProduct(product: ProductOption | null) {
    if (product) this.update({ productId: product.id });
  }
}
