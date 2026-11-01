import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.html',
})
export class Modal {
  isOpen = input(false);
  /** Clases extra para la caja (tamaño, padding); se suman a las base. */
  boxClass = input('');
  /** Nombre accesible del dialog cuando no tiene un título asociado. */
  label = input<string | null>(null);
  /**
   * Se emite cuando el dialog termina de cerrarse (backdrop, ESC o código),
   * después de su animación de salida. Es el momento seguro para limpiar los
   * datos que muestra el contenido: hacerlo antes lo vacía mientras se anima.
   */
  closed = output<void>();
  private dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');

  modalEffect = effect(() => {
    const dialog = this.dialogRef()?.nativeElement;
    if (!dialog) return;

    if (this.isOpen()) {
      if (!dialog.open) dialog.showModal()
    } else {
      dialog.close()
    }
  })

  open() {
    this.dialogRef()?.nativeElement.showModal();
  }

  close() {
    this.dialogRef()?.nativeElement.close();
  }

  /** El evento nativo `close` llega al iniciar la salida; se espera a que terminen sus transiciones. */
  async onNativeClose(dialog: HTMLDialogElement) {
    const exitAnimations = dialog.getAnimations({ subtree: true }).map(animation => animation.finished);
    await Promise.allSettled(exitAnimations);

    // Si se reabrió durante la salida, ya no corresponde avisar que se cerró.
    if (!dialog.open) this.closed.emit();
  }
}
