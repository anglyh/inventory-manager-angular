// src/app/shared/interfaces/selectable-option.interface.ts

/**
 * Contrato para ítems que se pueden mostrar y seleccionar en listados
 * (autocomplete, dropdown, etc.). Cualquier DTO con id y name es compatible.
 */
export type SelectableOption<TExtra = {}> = {
  name: string;
  id: string;
} & TExtra;