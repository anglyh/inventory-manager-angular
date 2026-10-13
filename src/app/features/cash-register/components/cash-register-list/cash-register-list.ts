import { Component, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerChevronDown, tablerChevronRight, tablerLock, tablerLockOpen } from '@ng-icons/tabler-icons';
import type { CashRegister } from '../../interfaces/cash-register.interface';
import { absoluteAmount, DIFFERENCE_CLASS, differenceSign, differenceTone } from '../../shared/cash-register-format';

@Component({
  selector: 'cash-register-list',
  imports: [DatePipe, DecimalPipe, RouterLink, NgIcon],
  viewProviders: [provideIcons({ tablerChevronDown, tablerChevronRight, tablerLock, tablerLockOpen })],
  templateUrl: './cash-register-list.html',
})
export class CashRegisterList {
  registers = input.required<CashRegister[]>();

  readonly differenceClass = DIFFERENCE_CLASS;
  readonly differenceTone = differenceTone;
  readonly differenceSign = differenceSign;
  readonly absoluteAmount = absoluteAmount;
}
