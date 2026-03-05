import { Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
})
export class Button {
  buttonText = input.required<string>();
  class = input<string>();
}
