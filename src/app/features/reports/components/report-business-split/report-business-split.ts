import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { ReportLodging, ReportPrevious, ReportStore, ReportTotal } from '../../interfaces/report.interface';

/**
 * Resultado de cada negocio por separado (tienda y hospedaje) y cómo se llega a la ganancia neta:
 * se suma la diferencia neta de caja (sobrantes − faltantes) y se restan los gastos generales.
 */
@Component({
  selector: 'report-business-split',
  imports: [DecimalPipe],
  templateUrl: './report-business-split.html',
  host: { class: 'block' },
})
export class ReportBusinessSplit {
  store = input.required<ReportStore>();
  lodging = input.required<ReportLodging>();
  total = input.required<ReportTotal>();
  previous = input.required<ReportPrevious>();

  /** Un resultado se marca en rojo solo si es pérdida. */
  isNegative(value: string): boolean {
    return Number(value) < 0;
  }
}
