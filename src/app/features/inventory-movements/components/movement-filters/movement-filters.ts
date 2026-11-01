import { Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerAlertTriangle, tablerBan, tablerClipboardCheck, tablerPackage, tablerShoppingCart, tablerTruck, tablerX,
} from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { OptionSelector } from '@/shared/components/option-selector/option-selector';
import { DateRangeFilter } from '@/shared/components/date-range-filter/date-range-filter';
import type { ProductOption } from '@/features/products/interfaces/product.interface';
import type { MovementFilters as Filters } from '../../interfaces/inventory-movement.interface';
import { MovementHistoryMapper } from '../../mappers/movement-history.mapper';
import { GROUP_OPTIONS, KIND_VIEW } from '../../shared/movement-labels';

/** Del tono de la lista ("bg-success-soft text-success") solo interesa el color del texto, para el ícono. */
const textColorOf = (tone: string) => tone.split(' ').find(token => token.startsWith('text-')) ?? '';

@Component({
  selector: 'movement-filters',
  imports: [OptionSelector, DateRangeFilter, Button, NgIcon],
  viewProviders: [provideIcons({
    tablerAlertTriangle, tablerBan, tablerClipboardCheck, tablerPackage, tablerShoppingCart, tablerTruck, tablerX,
  })],
  templateUrl: './movement-filters.html',
})
export class MovementFilters {
  filters = input.required<Filters>();
  products = input<ProductOption[]>([]);
  filtersChange = output<Filters>();

  readonly groupChips = GROUP_OPTIONS.map(option => {
    const view = option.kind ? KIND_VIEW[option.kind] : null;
    return { ...option, icon: view?.icon ?? null, iconClass: view ? textColorOf(view.tone) : '' };
  });

  /** Producto y fechas (y tipo/motivo si llegaron por URL); el tipo y la caja tienen su propio control. */
  activeCount = computed(() => MovementHistoryMapper.activeFiltersCount(this.filters()));

  productName = computed(() => {
    const id = this.filters().productId;
    return id ? this.products().find(product => product.id === id)?.name ?? '' : '';
  });

  update(changes: Partial<Filters>) {
    this.filtersChange.emit({ ...this.filters(), ...changes });
  }

  /** Conserva el tipo (chips) y la caja, que se quitan desde sus propios controles. */
  clear() {
    const { group, cashRegisterId } = this.filters();
    this.filtersChange.emit({ group, cashRegisterId });
  }

  selectProduct(product: ProductOption | null) {
    if (product) this.update({ productId: product.id });
  }
}
