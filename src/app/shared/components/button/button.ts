import { Component, computed, input } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';

/**
 * Literales completos para que Tailwind/DaisyUI los detecten en build de producción.
 * Evita `btn-${variant}`: el scanner no ve `btn-primary` y purga esas clases.
 */
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
};

const SIZE_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

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
    const base =
      'btn flex items-center justify-center gap-2 rounded-md transition-colors duration-200';
    const variantClass = VARIANT_CLASS[this.variant()];
    const sizeClass = SIZE_CLASS[this.size()];
    const stateClass = this.loading() ? 'opacity-70 pointer-events-none' : '';
    return `${base} ${variantClass} ${sizeClass} ${stateClass} ${this.customClass()}`.trim();
  });
}
