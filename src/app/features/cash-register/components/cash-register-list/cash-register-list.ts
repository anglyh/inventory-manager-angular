import { Component, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerCheck,
  tablerChevronRight,
  tablerLock,
  tablerLockOpen,
  tablerTrendingDown,
  tablerTrendingUp,
} from '@ng-icons/tabler-icons';
import type { CashRegister } from '../../interfaces/cash-register.interface';
import { absoluteAmount, DIFFERENCE_VIEW, differenceSign, differenceTone } from '../../shared/cash-register-format';
import { CashStatusPill } from '../cash-status-pill/cash-status-pill';

/** Solo lo que distingue una caja de otra (fecha, responsable, diferencia); el desglose está en el detalle. */
@Component({
  selector: 'cash-register-list',
  imports: [DatePipe, DecimalPipe, RouterLink, NgIcon, CashStatusPill],
  viewProviders: [
    provideIcons({ tablerCheck, tablerChevronRight, tablerLock, tablerLockOpen, tablerTrendingDown, tablerTrendingUp }),
  ],
  templateUrl: './cash-register-list.html',
})
export class CashRegisterList {
  registers = input.required<CashRegister[]>();

  readonly differenceView = DIFFERENCE_VIEW;
  readonly differenceTone = differenceTone;
  readonly differenceSign = differenceSign;
  readonly absoluteAmount = absoluteAmount;
}
