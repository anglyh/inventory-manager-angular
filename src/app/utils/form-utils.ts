import { AbstractControl, FormArray, FormGroup, ValidationErrors } from '@angular/forms';
import { mapApiError } from 'src/app/api/error-mapper';
import { extractApiError } from 'src/app/api/extract-api-error';
import { ApiErrorResponse } from 'src/app/api/interfaces/api.interface';

export class FormUtils {
  static namePattern = '([a-zA-Z]+) ([a-zA-Z]+)';
  static emailPattern = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';
  static notOnlySpacesPattern = '^[a-zA-Z0-9]+$';
  static slugPattern = '^[a-z0-9_]+(?:-[a-z0-9_]+)*$';

  static getTextError(errors: ValidationErrors) {
    for (const key of Object.keys(errors)) {
      switch(key) {
        case 'server':
          return String(errors['server']);

        case 'required':
          return 'Este campo es requerido';

        case 'minlength':
          return `Mínimo de ${errors['minlength'].requiredLength} caracteres.`;

        case 'min':
          return `Valor mínimo de ${errors['min'].min}`;

        case 'email':
          return `El valor ingresado no es un correo electrónico`;

        case 'emailTaken':
          return `El correo electrónico ya está siendo usado por otro usuario`;

        case 'pattern':
          return `El formato ingresado no es válido`;

        case 'notEqual':
          return `Las contraseñas no coinciden`;

        default:
          console.log(`Error de validacion no controlado ${key}`)
          return `Error de validación no controlado`
      }
    }

    return null
  }

  static isInvalidField(form: FormGroup, fieldName: string): boolean | null {
    return (
      !!form.controls[fieldName].errors && form.controls[fieldName].touched
    )
  }

  static getFieldError(form: FormGroup, fieldName: string): string | null {
    if (!form.controls[fieldName]) return null;

    const errors = form.controls[fieldName].errors ?? {};
    return FormUtils.getTextError(errors)
  }

  static isInvalidFieldInArray(formArray: FormArray, index: number) {
    return (
      formArray.controls[index].errors && formArray.controls[index].touched
    )
  }

  static getFieldErrorInArray(
    formArray: FormArray,
    index: number
  ): string | null {
    if (formArray.controls.length === 0) return null;

    const errors = formArray.controls[index].errors ?? {}
    return FormUtils.getTextError(errors)
  }

  static isFieldOneEqualFieldTwo(field1: string, field2: string) {
    return (control: AbstractControl) => {
      const field1Value = control.get(field1)?.value;
      const field2Value = control.get(field2)?.value;

      return field1Value === field2Value ? null : { notEqual: true };
    }
  }

  static handleFormError(
    err: unknown,
    form: FormGroup,
    options: {
      onToast?: (message: string) => void;
      onRedirect?: (url: string) => void;
    }
  ) {
    const apiError = extractApiError(err);
    const mapped = mapApiError(apiError);
    
    if (mapped.redirect) {
      options.onRedirect?.(mapped.redirect);
      return;
    }
    if (mapped.fields) {
      for (const [field, message] of Object.entries(mapped.fields)) {
        form.get(field)?.setErrors({ server: message });
        form.get(field)?.markAsTouched();
      }
    }
    if (mapped.toast) {
      options.onToast?.(mapped.toast);
    }
  }

  // static isValidProduct(product: Product)
}