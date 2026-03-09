import { Component, ElementRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.html',
})
export class Modal { 
  // Referencia nativa al <dialog>
  dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');

  // Exponemos métodos que el padre puede llamar
  open() {
    this.dialogRef()?.nativeElement.showModal();
  }

  close() {
    this.dialogRef()?.nativeElement.close();
  }
}
