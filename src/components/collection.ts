"use client";
import { useEffect, useRef, useState } from "react";
import { dayBoundary } from "@/lib/date";
import { db } from "@/lib/supabase/browser";
import { useApp, type Row } from "./app-context";
type Options = { search?: string; filter?: string; from?: string; to?: string };
export function useCollection(
  table: "notes" | "memories" | "prayers" | "special_dates",
  options: Options = {},
) {
  const { data, user } = useApp();
  const { search = "", filter = "all", from = "", to = "" } = options;
  const source = table === "special_dates" ? data.dates : data[table];
  const [settledSearch, setSettledSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setSettledSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const key = `couple-view:${user?.id}:${data.couple?.id}:collection:${table}:${JSON.stringify(options)}`;
  // Provider snapshots include drafts and other filters; render only this query's result.
  const [rows, setRows] = useState<Row[]>([]);
  const [children, setChildren] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [more, setMore] = useState(false),
    [attempt, setAttempt] = useState(0);
  const version = useRef(0);
  useEffect(() => {
    if (!loading) window.dispatchEvent(new Event("couple-list-ready"));
  }, [loading]);
  useEffect(() => {
    const current = ++version.current;
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    void (async () => {
      try {
        let wanted = 30;
        try {
          const requested = Number(sessionStorage.getItem(key));
          wanted = Math.max(30, Number.isSafeInteger(requested) ? requested : 30);
        } catch {}
        const all: Row[] = [];
        let cursor: Row | undefined;
        let hasMore = false;
        do {
          let q = db().from(table).select("*").eq("couple_id", data.couple!.id);
          if (table === "notes") {
            if (filter === "private") q = q.eq("visibility", "private");
            if (filter === "shared") q = q.neq("visibility", "private");
            if (filter === "theirs") q = q.neq("author_id", user!.id);
            q = q.order("is_pinned", { ascending: false });
          } else if (table === "prayers") {
            q = q.eq(
              "status",
              filter === "drafts"
                ? "draft"
                : filter === "archived"
                  ? "archived"
                  : "released",
            );
            if (filter === "drafts") q = q.eq("author_id", user!.id);
            if (filter === "mine") q = q.eq("author_id", user!.id);
            if (filter === "theirs") q = q.neq("author_id", user!.id);
          } else if (table === "special_dates") {
            if (filter !== "all") q = q.eq("kind", filter);
          } else {
            if (filter === "photos") q = q.not("photo_path", "is", null);
            else if (filter !== "all") q = q.eq("type", filter);
          }
          if (settledSearch.trim()) {
            // Quoted PostgREST operands preserve commas/parentheses in user text.
            const pattern = `"%${settledSearch.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[%_]/g, "\\$&")}%"`;
            q =
              table === "notes" || table === "special_dates"
                ? q.or(
                    `title.ilike.${pattern},${table === "notes" ? "content" : "custom_label"}.ilike.${pattern}`,
                  )
                : q.ilike(
                    "content",
                    `%${settledSearch.trim().replace(/[%_]/g, "\\$&")}%`,
                  );
          }
          if (from)
            q = q.gte("created_at", dayBoundary(from, data.couple!.timezone));
          if (to)
            q = q.lt(
              "created_at",
              dayBoundary(
                new Date(Date.parse(to + "T00:00:00Z") + 86400000)
                  .toISOString()
                  .slice(0, 10),
                data.couple!.timezone,
              ),
            );
          if (cursor) {
            const tail =
              table === "special_dates"
                ? `date.gt.${cursor.date},and(date.eq.${cursor.date},id.gt.${cursor.id})`
                : `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`;
            if (table === "notes" && cursor.is_pinned)
              q = q.or(`is_pinned.eq.false,and(is_pinned.eq.true,or(${tail}))`);
            else {
              if (table === "notes") q = q.eq("is_pinned", false);
              q = q.or(tail);
            }
          }
          const result = await q
            .order(table === "special_dates" ? "date" : "created_at", {
              ascending: table === "special_dates",
            })
            .order("id", { ascending: table === "special_dates" })
            .abortSignal(controller.signal)
            .limit(30);
          if (result.error) throw result.error;
          const page = (result.data ?? []) as Row[];
          const seen = new Set(all.map((r) => r.id));
          const unique = page.filter((r) => !seen.has(r.id));
          all.push(...unique);
          hasMore = page.length === 30 && unique.length > 0;
          cursor = page.at(-1);
          if (!active || version.current !== current) return;
        } while (hasMore && all.length < wanted);
        if (active && version.current === current) {
          const childRows: Row[] = [];
          const childTable =
            table === "notes"
              ? "note_items"
              : table === "prayers"
                ? "prayer_events"
                : null;
          if (childTable && all.length) {
            for (let start = 0; start < all.length; start += 100) {
              const ids = all.slice(start, start + 100).map((r) => r.id);
              for (let offset = 0; ; offset += 500) {
                const childResult = await db()
                  .from(childTable)
                  .select("*")
                  .in(table === "notes" ? "note_id" : "prayer_id", ids)
                  .order(table === "notes" ? "position" : "created_at", {
                    ascending: true,
                  })
                  .order("id", { ascending: true })
                  .range(offset, offset + 499)
                  .abortSignal(controller.signal);
                if (childResult.error) throw childResult.error;
                childRows.push(...(childResult.data ?? []));
                if ((childResult.data?.length ?? 0) < 500) break;
              }
            }
          }
          if (!active || version.current !== current) return;
          setRows(all);
          setChildren(childRows);
          setMore(hasMore);
        }
      } catch {
        if (active && version.current === current) setError(true);
      } finally {
        if (active && version.current === current) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [
    table,
    settledSearch,
    filter,
    from,
    to,
    user?.id,
    data.couple?.id,
    source,
    attempt,
  ]);
  const loadMore = () => {
    try {
      sessionStorage.setItem(key, String(rows.length + 30));
    } catch {}
    setAttempt((n) => n + 1);
  };
  return {
    rows,
    children,
    loading,
    error,
    more,
    loadMore,
    retry: () => setAttempt((n) => n + 1),
  };
}
