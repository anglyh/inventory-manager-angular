import type { components } from 'src/app/api/generated/schema';

export type ReportOverview = components['schemas']['ReportOverview'];
export type ReportSummary = ReportOverview['summary'];
export type ReportPayments = ReportOverview['payments'];
export type ReportCash = ReportOverview['cash'];
export type ReportLosses = ReportOverview['losses'];
export type ReportDailyPoint = ReportOverview['daily'][number];
export type ProductRanking = ReportOverview['topSold'][number];
export type ProductLoss = ReportOverview['topLosses'][number];

/** Escala del período navegable con flechas. */
export type ReportScale = 'day' | 'week' | 'month';
