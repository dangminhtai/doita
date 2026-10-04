"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  db,
  rpc,
  configured,
  authenticatedFetch,
} from "@/lib/supabase/browser";
import { CONTENT as C } from "@/config/content.vi";
import { enabled } from "@/config/app.config";
import { actionErrorMessage } from "@/lib/action-error";
export type Row = Record<string, any>;
export type Data = {
  couple: Row | null;
  profiles: Row[];
  members: Row[];
  daily: Row | null;
  answers: Row[];
  feedback: Row[];
  streak: Row | null;
  events: Row[];
  notes: Row[];
  items: Row[];
  prayers: Row[];
  prayerEvents: Row[];
  memories: Row[];
  moods: Row[];
  activities: Row[];
  activityHistory: Row[];
  dates: Row[];
};
const blank: Data = {
  couple: null,
  profiles: [],
  members: [],
  daily: null,
  answers: [],
  feedback: [],
  streak: null,
  events: [],
  notes: [],
  items: [],
  prayers: [],
  prayerEvents: [],
  memories: [],
  moods: [],
  activities: [],
  activityHistory: [],
  dates: [],
};
type Context = {
  user: User | null;
  data: Data;
  loading: boolean;
  busy: boolean;
  message: string;
  error: boolean;
  limit: number;
  setLimit: (n: number) => void;
  load: () => Promise<void>;
  run: (fn: () => Promise<unknown>, message?: string) => Promise<boolean>;
  notify: (message: string, error?: boolean) => void;
  recovery: boolean;
  setRecovery: (b: boolean) => void;
  logout: () => Promise<void>;
};
const AppContext = createContext<Context | null>(null);
export function useApp() {
  return useContext(AppContext)!;
}
export function clearDrafts() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith("couple-draft:")) localStorage.removeItem(key);
  }
}
export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [data, setData] = useState<Data>(blank),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false),
    [limit, setLimit] = useState(30),
    [recovery, setRecovery] = useState(false);
  const notify = useCallback((msg: string, err = false) => {
    setMessage(msg);
    setError(err);
  }, []);
  const load = useCallback(async () => {
    if (!user) return;
    try {
      const database = db();
      const membership = await database
        .from("couple_members")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (membership.error) throw membership.error;
      const profile = await database
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (profile.error) throw profile.error;
      if (!membership.data) {
        setData({ ...blank, profiles: profile.data ? [profile.data] : [] });
        return;
      }
      const cid = membership.data.couple_id;
      const couple = await database
        .from("couples")
        .select("*")
        .eq("id", cid)
        .single();
      if (couple.error) throw couple.error;
      if (enabled("daily")) await rpc("ensure_daily");
      const tables = [
        "couple_members",
        "daily_sessions",
        "streaks",
        "streak_events",
        "notes",
        "prayers",
        "memories",
        "moods",
        "activities",
        "activity_sessions",
        "special_dates",
        "profiles",
      ];
      const results = await Promise.all(
        tables.map(async (table) => {
          let q = database
            .from(table)
            .select(
              table === "daily_sessions" ? "*,daily_prompts(prompt)" : "*",
            );
          if (!["profiles", "activities"].includes(table))
            q = q.eq("couple_id", cid);
          if (table === "profiles")
            q = q.in("id", [
              user.id,
              ...((
                await database
                  .from("couple_members")
                  .select("user_id")
                  .eq("couple_id", cid)
              ).data?.map((m) => m.user_id) ?? []),
            ]);
          if (table === "daily_sessions")
            q = q.order("date", { ascending: false }).limit(30);
          else if (table === "streak_events")
            q = q.order("date", { ascending: false }).limit(90);
          else if (["notes", "prayers", "memories"].includes(table))
            q = q.order("created_at", { ascending: false }).limit(limit);
          else if (["moods", "activity_sessions"].includes(table))
            q = q.order("created_at", { ascending: false }).limit(90);
          else if (table === "special_dates")
            q = q.order("date", { ascending: true });
          const result = await q;
          if (result.error) throw result.error;
          return (result.data ?? []) as unknown as Row[];
        }),
      );
      const t: Record<string, Row[]> = Object.fromEntries(
        tables.map((table, i) => [table, results[i]]),
      );
      const latest = t.daily_sessions[0] ?? null;
      const today: Row | null = latest
        ? { ...latest, prompt: latest.daily_prompts?.prompt }
        : null;
      const children = [
        ["daily_answers", "session_id", today ? [today.id] : []],
        ["daily_feedback", "session_id", today ? [today.id] : []],
        ["note_items", "note_id", t.notes.map((n) => n.id)],
        ["prayer_events", "prayer_id", t.prayers.map((n) => n.id)],
      ] as const;
      await Promise.all(
        children.map(async ([table, column, ids]) => {
          t[table] = [];
          if (!ids.length) return;
          // Pagination avoids the default REST row cap, including long checklists.
          for (let offset = 0; ; offset += 500) {
            const { data: rows, error } = await database
              .from(table)
              .select("*")
              .in(column, ids)
              .order(
                table === "daily_answers"
                  ? "submitted_at"
                  : table === "note_items"
                    ? "position"
                    : "created_at",
                { ascending: true },
              )
              .range(offset, offset + 499);
            if (error) throw error;
            t[table].push(...rows);
            if (rows.length < 500) break;
          }
        }),
      );
      setData({
        couple: couple.data,
        profiles: t.profiles,
        members: t.couple_members,
        daily: today,
        answers: t.daily_answers.filter((a: Row) => a.session_id === today?.id),
        feedback: t.daily_feedback.filter(
          (a: Row) => a.session_id === today?.id,
        ),
        streak: t.streaks[0] ?? null,
        events: t.streak_events,
        notes: t.notes,
        items: t.note_items,
        prayers: t.prayers,
        prayerEvents: t.prayer_events,
        memories: t.memories,
        moods: t.moods,
        activities: t.activities,
        activityHistory: t.activity_sessions,
        dates: t.special_dates,
      });
    } catch (e) {
      console.error("Load data", e);
      const missingTable =
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        e.code === "PGRST205";
      notify(missingTable ? C.errors.databaseSetup : C.errors.generic, true);
    } finally {
      setLoading(false);
    }
  }, [user, limit, notify]);
  useEffect(() => {
    if (!configured()) {
      setLoading(false);
      return;
    }
    const client = db();
    client.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: listener } = client.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") setRecovery(true);
        setUser(session?.user ?? null);
        if (!session) setData(blank);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (user) {
      setLoading(true);
      void load();
    }
  }, [user?.id, limit]);
  useEffect(() => {
    const cid = data.couple?.id;
    if (!cid || !user) return;
    const channel = db().channel(`couple-${cid}`);
    for (const table of [
      "daily_sessions",
      "notes",
      "moods",
      "prayers",
      "memories",
    ])
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `couple_id=eq.${cid}` },
        () => {
          void load();
        },
      );
    channel.subscribe();
    return () => {
      void db().removeChannel(channel);
    };
  }, [data.couple?.id, user?.id, load]);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(console.error);
  }, []);
  const run = async (
    fn: () => Promise<unknown>,
    msg = C.common.success as string,
  ) => {
    if (busy) return false;
    setBusy(true);
    setMessage("");
    const actionPath = location.pathname;
    try {
      const result = await fn();
      if (result === false) return false;
      if (location.pathname === actionPath) notify(msg);
      await load();
      return true;
    } catch (e) {
      console.error("Action failed", e);
      if (location.pathname === actionPath) notify(actionErrorMessage(e), true);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    clearDrafts();
    await db().auth.signOut();
    setUser(null);
    setData(blank);
    setMessage("");
  };
  return (
    <AppContext.Provider
      value={{
        user,
        data,
        loading,
        busy,
        message,
        error,
        limit,
        setLimit,
        load,
        run,
        notify,
        recovery,
        setRecovery,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export async function flushNotifications() {
  try {
    await authenticatedFetch("/api/push", {
      method: "POST",
      body: JSON.stringify({ action: "flush" }),
    });
  } catch (e) {
    console.error("Deferred push", e);
  }
}
