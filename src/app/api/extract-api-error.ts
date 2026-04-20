import { HttpErrorResponse } from '@angular/common/http';
import type { ApiError } from './interfaces/api.interface';

export function extractApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse && err.error?.error?.code) {
    return err.error.error as ApiError;
  }
  return { code: 'INTERNAL_ERROR', message: 'Algo salió mal, intenta de nuevo' };
}