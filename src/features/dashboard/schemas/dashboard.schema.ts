import { z } from "zod";

/**
 * Schema for the top summary section (stat cards)
 * Represents aggregated counts of job statuses.
 */
export const DashboardStatsSchema = z.object({
  total: z.number().nonnegative().default(0),
  saved: z.number().nonnegative().default(0),
  applied: z.number().nonnegative().default(0),
  interview: z.number().nonnegative().default(0),
  offers: z.number().nonnegative().default(0),
  hired: z.number().nonnegative().default(0),
});

/**
 * Schema for distribution of job statuses
 * Used in the donut/pie chart.
 */
export const StatusDistributionSchema = z.array(
  z.object({
    status: z.string(), // Should match JobStatus at runtime
    count: z.number().nonnegative(),
  })
).default([]);

/**
 * Schema for trend data over time
 * Used in the line chart.
 */
export const TrendPointSchema = z.array(
  z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    count: z.number().nonnegative(),
  })
).default([]);

/**
 * Schema for recently added jobs (latest 3 items)
 * Used in the "Recent Jobs" panel.
 */
export const RecentJobSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    status: z.string(), // JobStatus in runtime
    createdAt: z.string().optional().nullable(),
  })
).default([]);

/**
 * Main Dashboard data schema (server response contract)
 * Combines stats, distribution, trend, and recent jobs.
 */
export const DashboardDataSchema = z.object({
  stats: DashboardStatsSchema,
  statusDistribution: StatusDistributionSchema,
  trend: TrendPointSchema,
  recentJobs: RecentJobSchema,
});

/**
 * TypeScript types inferred from Zod schemas
 * These are used across front-end and server layers.
 */
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type StatusDistribution = z.infer<typeof StatusDistributionSchema>;
export type TrendPoint = z.infer<typeof TrendPointSchema>;
export type RecentJob = z.infer<typeof RecentJobSchema>[number];
export type DashboardData = z.infer<typeof DashboardDataSchema>;
