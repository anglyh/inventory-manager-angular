import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.html',
})
export class Modal {
  /** Se emite cuando el dialog termina de cerrarse (backdrop, ESC o código). */
  isOpen = input(false);
  closed = output<void>();
  private dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');

  modalEffect = effect(() => {
    const dialog = this.dialogRef()?.nativeElement;
    if (!dialog) return;

    if (this.isOpen()) {
      dialog.showModal()
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
}
