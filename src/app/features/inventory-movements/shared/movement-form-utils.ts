import { AbstractControl, ValidatorFn } from '@angular/forms';
import { extractApiError } from '@/api/extract-api-error';
import { mapApiError } from '@/api/error-mapper';
import { moneyValidator, trimmedRequired } from '@/shared/utils/form-validators';

// Se movieron a shared/utils; se reexportan para no romper los imports existentes.
export { moneyValidator, trimmedRequired };
export { resolveApiError } from '@/shared/utils/api-error';

export const quantityValidator: ValidatorFn = (control) =>
  Number.isSafeInteger(control.value) && control.value > 0 ? null : { quantity: true };

/** Cantidad contada: vacío significa "sin contar"; si hay valor, entero desde 0. */
export const countValidator: ValidatorFn = (control) => {
  const value = control.value;
  if (value === null || value === '') return null;
  return Number.isSafeInteger(value) && value >= 0 ? null : { count: true };
};

export const itemsRequired: ValidatorFn = (control) =>
  control.value?.length > 0 ? null : { itemsRequired: true };

export function toCents(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) : 0;
}

export function lineCents(price: number | null, quantity: number | null): number {
  return Number.isSafeInteger(quantity) && quantity! > 0 ? toCents(price) * quantity! : 0;
}

export function normalizeProductSearch(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function controlError(control: AbstractControl): string | null {
  if (!control.touched || !control.errors) return null;
  if (control.hasError('server')) return String(control.getError('server'));
  if (control.hasError('required')) return 'Completa este campo.';
  if (control.hasError('quantity')) return 'Ingresa una cantidad entera mayor a cero.';
  if (control.hasError('money')) return 'Ingresa un monto desde 0, con hasta dos decimales.';
  if (control.hasError('count')) return 'Ingresa un número entero desde 0.';
  return 'Revisa este valor.';
}

/** Conserva los datos y muestra también los errores que no corresponden a un control. */
export function applyMovementError(error: unknown, form: AbstractControl): string {
  const apiError = extractApiError(error);
  const mapped = mapApiError(apiError);
  if (mapped.fields) {
    for (const [field, message] of Object.entries(mapped.fields)) {
      const control = form.get(field.replace(/\[(\d+)\]/g, '.$1'));
      if (control) {
        control.setErrors({ ...control.errors, server: message });
        control.markAsTouched();
      }
    }
    return Object.values(mapped.fields).join(' · ') || 'Revisa los datos del formulario.';
  }
  return mapped.toast || apiError.message || 'No se pudo registrar. Intenta nuevamente.';
}
