import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertTriangle, tablerChevronRight, tablerPackage, tablerPlaneArrival } from '@ng-icons/tabler-icons';
import type { InventorySnapshot, ReportMigrations, ReportTotal } from '../../interfaces/report.interface';
import { money, plural } from '../../utils/report-math';

export interface AttentionItem {
  id: string;
  icon: string;
  text: string;
  /** Una línea corta debajo del título (p. ej. de dónde sale el monto). */
  note?: string;
  hint: string;
  link: string;
  /** Filtro que abre la lista ya filtrada (p. ej. `{ migrations: 'pending' }`). */
  queryParams?: Record<string, string>;
  tone: 'error' | 'warning';
  /** Detalle debajo del título (p. ej. qué productos reponer). */
  details?: { id: string; label: string; value: string }[];
  /** Cuántos más hay fuera del detalle. */
  more?: number;
}

/** Solo lo que pide acción: faltante de caja, reportes a Migraciones y productos por reponer. */
export function attentionItems(
  total: ReportTotal,
  inventory: InventorySnapshot,
  migrations: ReportMigrations,
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const shortage = Number(total.cashShortage);
  if (shortage > 0) {
    items.push({
      id: 'cash',
      icon: 'tablerAlertTriangle',
      text: `Faltaron ${money(shortage)} al cerrar caja`,
      note: `${plural(total.cashShortageCount, 'cierre', 'cierres')} con menos dinero del esperado · se resta de tu ganancia`,
      hint: 'Cajas que cerraron con menos dinero del que debía haber',
      link: '/cash-register/history',
      tone: 'error',
    });
  }
  const pendingMigrations = migrations.pendingCount;
  if (pendingMigrations > 0) {
    items.push({
      id: 'migrations',
      icon: 'tablerPlaneArrival',
      text: `${plural(pendingMigrations, 'estadía', 'estadías')} por reportar a Migraciones`,
      hint: 'Huéspedes extranjeros que todavía no se reportaron',
      link: '/stays',
      queryParams: { migrations: 'pending' },
      tone: 'warning',
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
      queryParams: { stock: 'low' },
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
  viewProviders: [provideIcons({ tablerAlertTriangle, tablerChevronRight, tablerPackage, tablerPlaneArrival })],
  templateUrl: './report-attention.html',
})
export class ReportAttention {
  items = input.required<AttentionItem[]>();
}
