import type { components } from 'src/app/api/generated/schema';

export type ReportOverview = components['schemas']['ReportOverview'];
export type ReportSummary = ReportOverview['summary'];
export type ReportRooms = ReportOverview['rooms'];
export type ReportDailyPoint = ReportOverview['daily'][number];
export type ProductRanking = ReportOverview['products'][number];
export type ReportPrevious = ReportOverview['previous'];
export type InventorySnapshot = ReportOverview['inventory'];
export type ReportMigrations = ReportOverview['migrations'];
export type ReportPayments = ReportOverview['payments'];
export type ReportFlows = ReportOverview['flows'];

/** Escala del período navegable con flechas. */
export type ReportScale = 'day' | 'week' | 'month' | 'year';

export type ReportStore = ReportOverview['store'];
export type ReportLodging = ReportOverview['lodging'];
export type ReportTotal = ReportOverview['total'];
