import type { DocumentType, GuardianRelation, RateKind, RoomStatus, Sex } from '../interfaces/room.interface';
import type { PaymentMethod, StayCharge } from '../interfaces/stay.interface';

type StayChargeKind = StayCharge['kind'];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  DNI: 'DNI',
  CE: 'Carné de extranjería',
  PASSPORT: 'Pasaporte',
  PTP: 'PTP',
  OTHER: 'Otro',
};

/** Etiqueta corta para tablas. */
export const DOCUMENT_TYPE_SHORT: Record<DocumentType, string> = {
  DNI: 'DNI',
  CE: 'CE',
  PASSPORT: 'Pas.',
  PTP: 'PTP',
  OTHER: 'Doc.',
};

export const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABEL) as DocumentType[];

export const SEX_LABEL: Record<Sex, string> = { M: 'Masculino', F: 'Femenino' };

export const GUARDIAN_RELATION_LABEL: Record<GuardianRelation, string> = {
  PARENT: 'Padre o madre',
  TUTOR: 'Tutor',
  RESPONSIBLE: 'Responsable',
};

export const GUARDIAN_RELATIONS = Object.keys(GUARDIAN_RELATION_LABEL) as GuardianRelation[];

export const RATE_KIND_LABEL: Record<RateKind, string> = { HOURLY: 'Por horas', NIGHT: 'Por noche' };

/** "Por horas · 3 h" o "Por noche". */
export function rateText(rateKind: RateKind, hours: number | null | undefined): string {
  return rateKind === 'HOURLY' && hours ? `${RATE_KIND_LABEL.HOURLY} · ${hours} h` : RATE_KIND_LABEL[rateKind];
}

/** Atajos de horas en el check-in; el resto se elige con − / +. */
export const HOUR_SHORTCUTS = [1, 2, 3, 4, 6];
export const MIN_STAY_HOURS = 1;
export const MAX_STAY_HOURS = 48;

export const CHARGE_KIND_LABEL: Record<StayChargeKind, string> = {
  RATE: 'Tarifa',
  EXTRA_HOURS: 'Horas extra',
  OTHER: 'Otro',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = { CASH: 'Efectivo', YAPE: 'Yape' };

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'YAPE', label: 'Yape' },
];

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  FREE: 'Libre',
  OCCUPIED: 'Ocupada',
  CLEANING: 'Limpieza',
};

export const TRAVEL_REASONS = ['Turismo', 'Trabajo', 'Salud', 'Estudios', 'Visita familiar', 'Otro'];

export const DEFAULT_NATIONALITY = 'Peruana';
