import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerArrowDownRight,
  tablerArrowUpRight,
  tablerArrowsExchange,
  tablerCash,
  tablerDeviceMobile,
  tablerHistory,
  tablerReceipt,
  tablerScale,
} from '@ng-icons/tabler-icons';
import { RouterLink } from '@angular/router';
import type { CashRegister } from '@/features/cash-register/interfaces/cash-register.interface';
import { Button } from '@/shared/components/button/button';

@Component({
  selector: 'cash-register-session',
  imports: [DatePipe, RouterLink, NgIcon, Button],
  viewProviders: [
    provideIcons({
      tablerArrowDownRight,
      tablerArrowUpRight,
      tablerArrowsExchange,
      tablerCash,
      tablerDeviceMobile,
      tablerHistory,
      tablerReceipt,
      tablerScale,
    }),
  ],
  templateUrl: './cash-register-session.html',
})
export class CashRegisterSession {
  register = input.required<CashRegister>();
  busy = input(false);

  movementRequested = output<void>();
  closeRequested = output<void>();
}
