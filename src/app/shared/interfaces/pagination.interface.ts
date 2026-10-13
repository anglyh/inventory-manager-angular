export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface Options {
  page?: number,
  limit?: number,
  searchTerm?: string,
  category?: string,
}