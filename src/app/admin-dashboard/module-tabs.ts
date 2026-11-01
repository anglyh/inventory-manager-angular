import type { ModuleTab } from '@/shared/components/module-tabs/module-tabs';

/** Each module keeps its own settings as admin-only tabs next to its main screen. */
export const ROOMS_TABS: readonly ModuleTab[] = [
  { label: 'Tablero', link: '/rooms' },
  { label: 'Habitaciones', link: '/rooms/manage', adminOnly: true },
  { label: 'Tipos y precios', link: '/rooms/types', adminOnly: true },
];

export const PRODUCTS_TABS: readonly ModuleTab[] = [
  { label: 'Productos', link: '/products' },
  { label: 'Categorías', link: '/products/categories', adminOnly: true },
  { label: 'Proveedores', link: '/products/suppliers', adminOnly: true },
];

export const EXPENSES_TABS: readonly ModuleTab[] = [
  { label: 'Gastos', link: '/expenses', adminOnly: true },
  { label: 'Categorías', link: '/expenses/categories', adminOnly: true },
];
