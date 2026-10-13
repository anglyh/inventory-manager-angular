/**
 * Categoría tal como la devuelve el API.
 */
export interface Category {
  id: string;
  userId: string;
  name: string;
  createdAt: string; // ISO date
}

export interface CategoryUpsertBody {
  name: string;
}

