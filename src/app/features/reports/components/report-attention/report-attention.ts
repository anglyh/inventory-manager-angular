import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertTriangle, tablerChevronRight, tablerPackage } from '@ng-icons/tabler-icons';
import type { InventorySnapshot, ReportTotal } from '../../interfaces/report.interface';
import { money, plural } from '../../utils/report-math';

export interface AttentionItem {
  id: string;
  icon: string;
  text: string;
  hint: string;
  link: string;
  tone: 'error' | 'warning';
  /** Detalle debajo del título (p. ej. qué productos reponer). */
  details?: { id: string; label: string; value: string }[];
  /** Cuántos más hay fuera del detalle. */
  more?: number;
}

/** Solo lo que pide acción: faltante de caja y productos por reponer. */
export function attentionItems(total: ReportTotal, inventory: InventorySnapshot): AttentionItem[] {
  const items: AttentionItem[] = [];
  const shortage = Number(total.cashShortage);
  if (shortage > 0) {
    items.push({
      id: 'cash',
      icon: 'tablerAlertTriangle',
      text: `Faltó ${money(shortage)} en caja`,
      hint: 'Cajas que cerraron con menos dinero del que debía haber',
      link: '/cash-register/history',
      tone: 'error',
    });
  }
  const lowStock = inventory.lowStockCount;
  if (lowStock > 0) {
    const details = inventory.lowStockProducts.map(product => ({
      id: product.productId,
      label: product.productName,
      value: `quedan ${product.stock} · mín. ${product.minStock}`,
    }));
    items.push({
      id: 'stock',
      icon: 'tablerPackage',
      text: `${plural(lowStock, 'producto', 'productos')} por reponer`,
      hint: 'Stock en o bajo el mínimo',
      link: '/products',
      tone: 'warning',
      details,
      more: lowStock - details.length,
    });
  }
  return items;
}

/** Lista de avisos; si no hay ninguno, no se muestra. */
@Component({
  selector: 'report-attention',
  imports: [RouterLink, NgIcon],
  viewProviders: [provideIcons({ tablerAlertTriangle, tablerChevronRight, tablerPackage })],
  templateUrl: './report-attention.html',
})
export class ReportAttention {
  items = input.required<AttentionItem[]>();
}
