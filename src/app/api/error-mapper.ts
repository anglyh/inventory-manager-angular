import type { ApiError, ValidationFieldError } from './interfaces/api.interface';

interface MappedError {
  toast?: string;                           // mensaje general
  fields?: Record<string, string>;          // errores por campo para el form
  redirect?: string;                        // ruta a donde redirigir
}

export function mapApiError(error: ApiError): MappedError {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return { fields: buildFieldMap(error.fields) }; // ya no necesitas ?? []
    case 'UNAUTHORIZED':
      return { redirect: '/auth/login' };
    case 'NOT_FOUND':
      return { toast: 'No se encontró: puede que se haya eliminado.' };
    case 'CONFLICT':
      return { toast: error.message };
    case 'INVALID_JSON':
    case 'BAD_REQUEST':
      return { toast: error.message };
    case 'DB_ERROR':
      // El backend responde "Base de datos no disponible": para el usuario es un problema de conexión.
      return { toast: 'No se pudo conectar. Inténtalo de nuevo en un momento.' };
    case 'INTERNAL_ERROR':
    default:
      return { toast: 'Algo salió mal, intenta de nuevo' };
  }
}

// Convierte el array en un Record para acceder por nombre de campo
function buildFieldMap(fields: ValidationFieldError[]): Record<string, string> {
  return Object.fromEntries(
    fields.map(f => [f.field, f.message])
  );
}