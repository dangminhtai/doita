import { readFileSync, writeFileSync } from "node:fs";
const literal = (x) => "'" + String(x).replaceAll("'", "''") + "'";
const lines = ["-- Generated from data/*.json; safe to rerun.", "begin;"];
for (const [table, file] of [
  ["daily_prompts", "daily-prompts"],
  ["activities", "activities"],
]) {
  for (const row of JSON.parse(readFileSync(`data/${file}.json`, "utf8"))) {
    const keys = Object.keys(row);
    const values = Object.values(row).map((v) =>
      typeof v === "boolean"
        ? String(v)
        : typeof v === "number"
          ? String(v)
          : Array.isArray(v)
            ? literal(JSON.stringify(v)) + "::jsonb"
            : literal(v),
    );
    lines.push(
      `insert into public.${table}(${keys.join(",")}) values(${values.join(",")}) on conflict(id) do update set ${keys
        .filter((k) => k !== "id")
        .map((k) => `${k}=excluded.${k}`)
        .join(",")};`,
    );
  }
}
lines.push("commit;");
writeFileSync("supabase/seed.sql", lines.join("\n") + "\n");
console.log("supabase/seed.sql updated");
