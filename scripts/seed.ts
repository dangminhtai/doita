import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { z } from "zod";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
const db = createClient(url, key, { auth: { persistSession: false } });
const prompt = z.object({
  id: z.string(),
  prompt: z.string().min(1),
  category: z.string(),
  difficulty: z.number().int(),
  is_active: z.boolean(),
});
const activity = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string(),
  duration: z.number().int(),
  energy: z.enum(["low", "normal", "high"]),
  relationship_stage: z.string(),
  long_distance: z.boolean(),
  tags: z.array(z.string()),
  enabled: z.boolean(),
});
for (const [table, schema, file] of [
  ["daily_prompts", prompt, "daily-prompts"],
  ["activities", activity, "activities"],
] as const) {
  const rows = z
    .array(schema)
    .parse(JSON.parse(readFileSync(`data/${file}.json`, "utf8")));
  const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`${table}: ${rows.length}`);
}
