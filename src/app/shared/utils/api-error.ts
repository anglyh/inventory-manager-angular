import { extractApiError } from '@/api/extract-api-error';
import { mapApiError } from '@/api/error-mapper';

/** Mensaje para el usuario o ruta de redirección (sesión vencida) de un error de la API. */
export function resolveApiError(error: unknown, fallback: string): { message: string; redirect?: string } {
  const apiError = extractApiError(error);
  const mapped = mapApiError(apiError);
  if (mapped.redirect) return { message: fallback, redirect: mapped.redirect };
  const message = mapped.fields ? Object.values(mapped.fields).join(' · ') : mapped.toast;
  return { message: message || apiError.message || fallback };
}
