export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor?: {
    cursorDate: string;
    cursorId: string;
  };
}

export interface Options {
  page?: number,
  limit?: number,
  searchTerm?: string,
  category?: string,
}