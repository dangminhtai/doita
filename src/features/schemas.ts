import { z } from "zod";
import { APP_CONFIG as A } from "@/config/app.config";
export const authSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().max(60),
});
export const signupSchema = authSchema.extend({
  name: authSchema.shape.name.min(1),
  gender: z.enum(["male", "female", "other", "undisclosed"]),
});
export const noteSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(A.notes.maxLength),
  type: z.enum(["text", "checklist"]),
  visibility: z.enum(["private", "partner", "couple"]),
});
export const prayerSchema = z.object({
  content: z.string().trim().min(1).max(A.prayer.maxLength),
  visibility: z.enum(["private", "partner"]),
  resurface: z.boolean(),
});
export const dailySchema = z.string().trim().min(1).max(3000);
export const inviteSchema = z
  .string()
  .trim()
  .regex(/^[A-Fa-f0-9]{24}$/);
export const pushSchema = z.object({
  endpoint: z.url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(200),
  }),
});
