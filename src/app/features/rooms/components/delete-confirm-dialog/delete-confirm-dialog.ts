import { Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';

/**
 * Confirma una eliminación. Si la API la rechaza, muestra el motivo y,
 * cuando hay una salida razonable (desactivar), la ofrece como acción.
 */
@Component({
  selector: 'delete-confirm-dialog',
  imports: [Button, Modal, NgIcon],
  viewProviders: [provideIcons({ tablerAlertCircle })],
  templateUrl: './delete-confirm-dialog.html',
})
export class DeleteConfirmDialog {
  open = input(false);
  title = input.required<string>();
  hint = input('Esta acción no se puede deshacer.');
  busy = input(false);
  error = input<string | null>(null);
  /** Acción alternativa tras un rechazo (p. ej. "Desactivar en su lugar"); null = sin alternativa. */
  alternativeLabel = input<string | null>(null);

  confirmed = output<void>();
  alternative = output<void>();
  cancelled = output<void>();
  closed = output<void>();
}
