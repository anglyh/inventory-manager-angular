import { Component, computed, input } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'error';

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
  error: 'btn-error',
};

/**
 * Always the default size (see CLAUDE.md): there is no size input on purpose.
 * The radius comes from daisy (`--radius-field`), so `btn-circle` in `customClass` stays round.
 */
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

  type = input<"button" | "submit" | "reset">('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  customClass = input<string>('');
  /** Para botones de solo ícono: el host no pasa sus atributos al <button> interno. */
  ariaLabel = input<string | null>(null);

  buttonClasses = computed(() => {
    const base =
      'btn flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer';
    const variantClass = VARIANT_CLASS[this.variant()];
    const stateClass = this.loading() ? 'opacity-70 pointer-events-none' : '';
    return `${base} ${variantClass} ${stateClass} ${this.customClass()}`.trim();
  });
}
