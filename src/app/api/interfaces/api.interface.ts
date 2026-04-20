export interface ApiErrorResponse {
    success: false;
    error: ApiError;
  }
  
  export interface ValidationFieldError {
    field: string;
    message: string;
  }
  
  export type ErrorCode =
    | 'UNAUTHORIZED'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'BAD_REQUEST'
    | 'INTERNAL_ERROR'
    | 'INVALID_JSON'
    | 'DB_ERROR'
    | 'VALIDATION_ERROR';
  
  export type ApiError =
    | { code: 'VALIDATION_ERROR'; message: string; fields: ValidationFieldError[] }
    | { code: Exclude<ErrorCode, 'VALIDATION_ERROR'>; message: string; field?: string };