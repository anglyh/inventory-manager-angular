import { ValidationErrors, ValidatorFn } from '@angular/forms';

/** Monto desde 0 con hasta dos decimales; la obligatoriedad depende del campo. */
export const moneyValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === '') return null;
  const cents = Number(value) * 100;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    && Number.isSafeInteger(Math.round(cents)) && Math.abs(cents - Math.round(cents)) < 0.000001
    ? null : { money: true };
};

/** Obligatorio sin contar los espacios: el backend recorta antes de validar. */
export const trimmedRequired: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() ? null : { required: true };

/** Tope de los montos que acepta el backend (numeric(10, 2)). */
export const MAX_MONEY = 99999999.99;
