import { z } from "zod";
const configSchema = z.object({
  timezone: z.string(),
  streak: z.object({
    enabled: z.boolean(),
    repairPerMonth: z.literal(2),
  }),
  daily: z.object({ enabled: z.boolean() }),
  notes: z.object({
    enabled: z.boolean(),
    maxLength: z.number().int().positive(),
  }),
  prayer: z.object({
    enabled: z.boolean(),
    maxLength: z.number().int().positive(),
  }),
  memories: z.object({ enabled: z.boolean() }),
  presence: z.object({ enabled: z.boolean() }),
  activities: z.object({ enabled: z.boolean() }),
  notifications: z.object({ enabled: z.boolean() }),
  features: z.record(z.string(), z.boolean()),
});
export const APP_CONFIG = configSchema.parse({
  timezone: "Asia/Ho_Chi_Minh",
  streak: { enabled: true, repairPerMonth: 2 },
  daily: { enabled: true },
  notes: { enabled: true, maxLength: 5000 },
  prayer: { enabled: true, maxLength: 1000 },
  memories: { enabled: true },
  presence: { enabled: true },
  activities: { enabled: true },
  notifications: { enabled: true },
  features: {
    weekly: true,
    specialDates: true,
    games: false,
    ai: false,
    voiceNotes: false,
    calendar: false,
  },
});
export function enabled(feature: string): boolean {
  const value = APP_CONFIG[feature as keyof typeof APP_CONFIG];
  return typeof value === "object" && "enabled" in value
    ? Boolean(value.enabled)
    : (APP_CONFIG.features[feature] ?? false);
}
