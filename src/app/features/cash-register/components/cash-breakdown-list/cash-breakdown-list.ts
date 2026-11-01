import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerArrowDownLeft,
  tablerArrowUpRight,
  tablerBed,
  tablerCashBanknote,
  tablerReceipt,
  tablerWallet,
} from '@ng-icons/tabler-icons';
import type { CashBreakdownKey, CashBreakdownRow } from '../../utils/cash-breakdown';

interface RowView {
  icon: string;
  /** Ícono y monto cuando la fila tiene valor; en cero quedan en neutro. */
  tile: string;
  amount: string;
}

const ROW_VIEW: Record<CashBreakdownKey, RowView> = {
  opening: { icon: 'tablerWallet', tile: 'bg-base-200 text-neutral', amount: '' },
  cashSales: { icon: 'tablerReceipt', tile: 'bg-success-soft text-success', amount: 'text-success' },
  cashStays: { icon: 'tablerBed', tile: 'bg-success-soft text-success', amount: 'text-success' },
  cashIn: { icon: 'tablerArrowUpRight', tile: 'bg-success-soft text-success', amount: 'text-success' },
  cashOut: { icon: 'tablerArrowDownLeft', tile: 'bg-error-soft text-error', amount: 'text-error' },
  expected: { icon: 'tablerCashBanknote', tile: 'bg-primary text-primary-content', amount: '' },
};

const MUTED: RowView = { icon: '', tile: 'bg-base-200 text-neutral', amount: 'text-neutral' };

/** Filas del desglose del efectivo: ingresos en verde, retiros en rojo y el esperado al final. */
@Component({
  selector: 'cash-breakdown-list',
  imports: [DecimalPipe, NgIcon],
  viewProviders: [
    provideIcons({ tablerArrowDownLeft, tablerArrowUpRight, tablerBed, tablerCashBanknote, tablerReceipt, tablerWallet }),
  ],
  host: { class: 'block' },
  templateUrl: './cash-breakdown-list.html',
})
export class CashBreakdownList {
  rows = input.required<CashBreakdownRow[]>();

  /** El color es una señal: un ingreso o retiro en cero no se pinta. */
  view(row: CashBreakdownRow): RowView {
    const view = ROW_VIEW[row.key];
    return row.sign && Number(row.value) === 0 ? { ...MUTED, icon: view.icon } : view;
  }
}
