import { SegmentedControl } from '@/shared/components/segmented-control/segmented-control';
import { Button } from '@/shared/components/button/button';
import { Component, computed, input, linkedSignal, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { ProductRanking } from '../../interfaces/report.interface';

type ProductSort = 'quantity' | 'profit';

/** Productos visibles de entrada; el resto se abre con "Ver más". */
const TOP_SIZE = 5;
/** La lista completa puede traer cientos de productos: se pagina. */
const PAGE_SIZE = 10;
/** Con más páginas que esto se muestran solo los extremos y las vecinas de la actual. */
const MAX_PAGE_BUTTONS = 7;

@Component({
  selector: 'report-products',
  imports: [SegmentedControl, Button, DecimalPipe],
  templateUrl: './report-products.html',
})
export class ReportProducts {
  products = input.required<ProductRanking[]>();

  readonly sorts: { value: ProductSort; label: string; title: string }[] = [
    { value: 'quantity', label: 'Más vendidos', title: 'Lo que más sale: no puede faltar en el estante' },
    { value: 'profit', label: 'Más ganancia', title: 'Lo que más plata deja, aunque se venda menos' },
  ];

  readonly sort = signal<ProductSort>('quantity');
  /** Lista completa abierta ("Ver más"). */
  readonly expanded = signal(false);

  readonly sorted = computed(() => {
    const key = this.sort();
    const value = (item: ProductRanking) => (key === 'quantity' ? item.quantity : Number(item.profit));
    return [...this.products()].sort((a, b) => value(b) - value(a) || a.productName.localeCompare(b.productName));
  });

  readonly hasMore = computed(() => this.sorted().length > TOP_SIZE);

  /** Página actual (desde 1); vuelve a la primera al cambiar el orden o los datos. */
  readonly page = linkedSignal({ source: this.sorted, computation: () => 1 });

  readonly pageCount = computed(() =>
    this.expanded() ? Math.max(1, Math.ceil(this.sorted().length / PAGE_SIZE)) : 1,
  );
  readonly start = computed(() => (this.expanded() ? (this.page() - 1) * PAGE_SIZE : 0));
  readonly visible = computed(() =>
    this.sorted().slice(this.start(), this.start() + (this.expanded() ? PAGE_SIZE : TOP_SIZE)),
  );

  /** Filas vacías que completan la última página: así el paginador no cambia de lugar. */
  readonly fillers = computed(() =>
    this.pageCount() > 1 ? Array.from({ length: PAGE_SIZE - this.visible().length }, (_, i) => i) : [],
  );

  /** Botones del paginador; `null` es un "…". */
  readonly pageButtons = computed<(number | null)[]>(() => {
    const total = this.pageCount();
    const current = this.page();
    if (total <= MAX_PAGE_BUTTONS) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, null, total];
    if (current >= total - 3) return [1, null, total - 4, total - 3, total - 2, total - 1, total];
    return [1, null, current - 1, current, current + 1, null, total];
  });

  setSort(sort: ProductSort) {
    this.sort.set(sort);
  }

  toggleExpanded() {
    this.expanded.update((open) => !open);
    this.page.set(1);
  }
}
