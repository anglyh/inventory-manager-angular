import { Component, computed, input } from '@angular/core';

type ButtonVariant = "primary" | "secondary" | "accent" | "outline" | "ghost";

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  host: {
    class: 'contents'
  }
})
export class Button {
  variant = input<ButtonVariant>('primary');
  size = input<"sm" | "md" | "lg">("md");

  type = input<"button" | "submit" | "reset">('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  customClass = input<string>('');

  buttonClasses = computed(() => {
    const base = 'btn flex items-center justify-center gap-2 rounded-md transition-colors duration-200';
    const variantClass = `btn-${this.variant()}`
    const sizeClass = `btn-${this.size()}`

    const stateClass = this.loading() ? 'opacity-70 pointer-events-none' : '';
    return `${base} ${variantClass} ${sizeClass} ${stateClass} ${this.customClass()}`.trim();
  })
}
