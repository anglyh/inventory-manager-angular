import { Component, computed, input } from '@angular/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import type { ProductRanking } from '../../interfaces/report.interface';

interface RankingRow {
  id: string;
  name: string;
  value: number;
  /** Ancho de la barra en % respecto al primero. */
  share: number;
}

function toRows(products: ProductRanking[], pick: (product: ProductRanking) => number): RankingRow[] {
  const max = Math.max(0, ...products.map(pick));
  return products.map((product) => ({
    id: product.productId,
    name: product.productName,
    value: pick(product),
    share: max > 0 ? (Math.max(pick(product), 0) / max) * 100 : 0,
  }));
}

@Component({
  selector: 'report-top-products',
  imports: [DecimalPipe, NgTemplateOutlet],
  templateUrl: './report-top-products.html',
})
export class ReportTopProducts {
  topSold = input.required<ProductRanking[]>();
  topProfit = input.required<ProductRanking[]>();

  readonly soldRows = computed(() => toRows(this.topSold(), (product) => product.quantity));
  readonly profitRows = computed(() => toRows(this.topProfit(), (product) => Number(product.profit)));
}
