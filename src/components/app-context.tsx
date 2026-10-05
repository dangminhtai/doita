"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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
import { localDate } from "@/lib/date";
import { LatestRequest } from "@/lib/latest-request";
export type Row = Record<string, any>;
export type Data = {
  errors: Record<string, string>;
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
  onThisDay: Row[];
  memoryCount: number;
  moods: Row[];
  activities: Row[];
  activityHistory: Row[];
  dates: Row[];
};
const blank: Data = {
  errors: {},
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
  onThisDay: [],
  memoryCount: 0,
  moods: [],
  activities: [],
  activityHistory: [],
  dates: [],
};
type Context = {
  user: User | null;
  data: Data;
  loading: boolean;
  loadError: boolean;
  busy: boolean;
  busyAction: string | null;
  pendingActions: string[];
  message: string;
  error: boolean;
  limit: number;
  setLimit: (n: number) => void;
  load: () => Promise<boolean>;
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
    [busyAction, setBusyAction] = useState<string | null>(null),
    [pendingActions, setPendingActions] = useState<string[]>([]),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false),
    [limit, setLimit] = useState(30),
    [recovery, setRecovery] = useState(false),
    [loadError, setLoadError] = useState(false);
  const requestVersion = useRef(0);
  const currentUser = useRef<string | null>(null);
  const busyRef = useRef(new Map<string, string>());
  const loadQueue = useRef(new LatestRequest<boolean>());
  const snapshot = useRef<Data>(blank);
  // Keep invalidations until the latest refresh commits, so superseding events
  // cannot discard an earlier table's update.
  const dirtyTables = useRef<Set<string> | null>(null);
  const notify = useCallback((msg: string, err = false) => {
    setMessage(msg);
    setError(err);
  }, []);
  const loadWork = useCallback(async () => {
    if (!user || currentUser.current !== user.id) return false;
    const version = ++requestVersion.current;
    const current = () =>
      version === requestVersion.current && currentUser.current === user.id;
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
        if (!current()) return false;
        setData({ ...blank, profiles: profile.data ? [profile.data] : [] });
        snapshot.current = {
          ...blank,
          profiles: profile.data ? [profile.data] : [],
        };
        setLoadError(false);
        return true;
      }
      const cid = membership.data.couple_id;
      const cached = snapshot.current;
      const dirty = cached.couple?.id === cid ? dirtyTables.current : null;
      const cachedTables: Record<string, Row[]> = {
        couple_members: cached.members,
        profiles: cached.profiles,
        daily_sessions: cached.daily ? [cached.daily] : [],
        streaks: cached.streak ? [cached.streak] : [],
        streak_events: cached.events,
        notes: cached.notes,
        prayers: cached.prayers,
        memories: cached.memories,
        moods: cached.moods,
        activities: cached.activities,
        activity_sessions: cached.activityHistory,
        special_dates: cached.dates,
        daily_answers: cached.answers,
        daily_feedback: cached.feedback,
        note_items: cached.items,
        prayer_events: cached.prayerEvents,
      };
      const couple = await database
        .from("couples")
        .select("*")
        .eq("id", cid)
        .single();
      if (couple.error) throw couple.error;
      const featureErrors: Record<string, string> = dirty
        ? { ...cached.errors }
        : {};
      if (enabled("daily") && (!dirty || dirty.has("daily_sessions"))) {
        try {
          await rpc("ensure_daily");
        } catch (e) {
          featureErrors.daily_sessions = actionErrorMessage(e);
        }
      }
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
          if (dirty && !dirty.has(table)) return cachedTables[table] ?? [];
          delete featureErrors[table];
          try {
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
          } catch (e) {
            console.error("Load feature data", table, e);
            featureErrors[table] = actionErrorMessage(e);
            return [];
          }
        }),
      );
      const t: Record<string, Row[]> = Object.fromEntries(
        tables.map((table, i) => [table, results[i]]),
      );
      const [
        { data: onThisDay, error: anniversaryError },
        { count: memoryCount, error: countError },
      ] = await Promise.all([
        dirty && !dirty.has("memories")
          ? Promise.resolve({ data: cached.onThisDay, error: null })
          : database.rpc("memories_on_this_day"),
        dirty && !dirty.has("memories")
          ? Promise.resolve({ count: cached.memoryCount, error: null })
          : database
              .from("memories")
              .select("id", { head: true, count: "exact" })
              .eq("couple_id", cid),
      ]);
      if (anniversaryError)
        featureErrors.memories = actionErrorMessage(anniversaryError);
      if (countError) featureErrors.memories = actionErrorMessage(countError);
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
          const parent = table.startsWith("daily_")
            ? "daily_sessions"
            : table === "note_items"
              ? "notes"
              : "prayers";
          if (dirty && !dirty.has(parent)) {
            t[table] = cachedTables[table];
            return;
          }
          delete featureErrors[table];
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
            if (error) {
              featureErrors[table] = actionErrorMessage(error);
              break;
            }
            t[table].push(...rows);
            if (rows.length < 500) break;
          }
        }),
      );
      if (!current()) return false;
      setLoadError(false);
      const updated: Data = {
        errors: featureErrors,
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
        onThisDay: onThisDay ?? [],
        memoryCount: memoryCount ?? 0,
        moods: t.moods,
        activities: t.activities,
        activityHistory: t.activity_sessions,
        dates: t.special_dates,
      };
      snapshot.current = updated;
      dirtyTables.current = new Set();
      setData(updated);
      if (
        Object.keys(featureErrors).some(
          (table) =>
            !dirty ||
            dirty.has(table) ||
            (table.startsWith("daily_") && dirty.has("daily_sessions")) ||
            (table === "note_items" && dirty.has("notes")) ||
            (table === "prayer_events" && dirty.has("prayers")),
        )
      ) {
        notify(C.errors.loadFailed, true);
        return false;
      }
      return true;
    } catch (e) {
      if (!current()) return false;
      setLoadError(true);
      console.error("Load data", e);
      const missingTable =
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        e.code === "PGRST205";
      notify(missingTable ? C.errors.databaseSetup : C.errors.generic, true);
      return false;
    } finally {
      if (current()) setLoading(false);
    }
  }, [user, limit, notify]);
  const load = useCallback(() => {
    dirtyTables.current = null;
    return loadQueue.current.run(loadWork);
  }, [loadWork]);
  const refreshTables = useCallback(
    (tables: string[]) => {
      for (const table of tables) dirtyTables.current?.add(table);
      return loadQueue.current.run(loadWork);
    },
    [loadWork],
  );
  useEffect(() => {
    if (!configured()) {
      setLoading(false);
      return;
    }
    const client = db();
    const { data: listener } = client.auth.onAuthStateChange(
      (event, session) => {
        const id = session?.user.id ?? null;
        if (id !== currentUser.current || !session) {
          requestVersion.current++;
          currentUser.current = id;
          snapshot.current = blank;
          dirtyTables.current = null;
          setData(blank);
          setLoadError(false);
          setRecovery(false);
          setLoading(Boolean(id));
        }
        if (event === "PASSWORD_RECOVERY") setRecovery(true);
        setUser(session?.user ?? null);
        if (!session) {
          setLoading(false);
          // Expiry or logout in another tab must not destroy unsent drafts.
          // Explicit logout below clears them after signOut succeeds.
        }
        if (session && location.hash.includes("access_token=")) {
          history.replaceState(
            history.state,
            "",
            location.pathname + location.search,
          );
        }
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
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pending = new Set<string>();
    const refresh = (table: string) => {
      pending.add(table);
      if (table === "couple_members") pending.add("profiles");
      if (
        [
          "daily_sessions",
          "notes",
          "prayers",
          "activity_sessions",
          "special_dates",
        ].includes(table)
      )
        pending.add("memories");
      if (table === "daily_sessions")
        for (const related of ["streaks", "streak_events"])
          pending.add(related);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const tables = [...pending];
        pending.clear();
        void refreshTables(tables);
      }, 200);
    };
    for (const table of [
      "daily_sessions",
      "notes",
      "moods",
      "prayers",
      "memories",
      "special_dates",
      "streaks",
      "streak_events",
      "activity_sessions",
      "couple_members",
    ])
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `couple_id=eq.${cid}` },
        () => refresh(table),
      );
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "couples",
        filter: `id=eq.${cid}`,
      },
      () => refresh("couples"),
    );
    for (const id of data.members.map((m) => m.user_id)) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${id}`,
        },
        () => refresh("profiles"),
      );
    }
    channel.subscribe();
    return () => {
      clearTimeout(timer);
      void db().removeChannel(channel);
    };
  }, [
    data.couple?.id,
    data.members.map((m) => m.user_id).join(","),
    user?.id,
    refreshTables,
  ]);
  useEffect(() => {
    if (!user || data.couple) return;
    const channel = db()
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        () => void load(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couple_members",
          filter: `user_id=eq.${user.id}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      void db().removeChannel(channel);
    };
  }, [user?.id, data.couple?.id, load]);
  useEffect(() => {
    if (!user) return;
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    let date = localDate(new Date(), data.couple?.timezone);
    const timer = setInterval(() => {
      const next = localDate(new Date(), data.couple?.timezone);
      if (next !== date) {
        date = next;
        void load();
      }
    }, 30000);
    const pushTimer = setInterval(() => {
      if (document.visibilityState === "visible") void flushNotifications();
    }, 120000);
    void flushNotifications();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      clearInterval(pushTimer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [user?.id, data.couple?.timezone, load]);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(console.error);
  }, []);
  const run = async (
    fn: () => Promise<unknown>,
    msg = C.common.success as string,
  ) => {
    const element = document.activeElement as HTMLElement | null;
    const scope =
      element?.closest<HTMLElement>("[data-action-scope]")?.dataset
        .actionScope ??
      element?.dataset.actionId ??
      location.pathname;
    const actionKey = `${currentUser.current ?? "auth"}:${scope}`;
    if (busyRef.current.has(actionKey)) return false;
    busyRef.current.set(actionKey, scope);
    setPendingActions([...busyRef.current.values()]);
    setBusyAction(element?.dataset.actionId ?? null);
    setBusy(true);
    setMessage("");
    const actionPath = location.pathname;
    const actionUser = currentUser.current;
    try {
      const result = await fn();
      if (result === false) return false;
      if (actionUser && actionUser === currentUser.current)
        void flushNotifications();
      const affected: Record<string, string[]> = {
        "/profile": ["profiles"],
        "/activities": ["activities", "activity_sessions", "memories"],
        "/notes": ["notes", "memories"],
        "/prayer": ["prayers", "memories"],
        "/memories": ["memories"],
        "/daily": ["daily_sessions", "streaks", "streak_events", "memories"],
      };
      const refreshed = user
        ? await (affected[actionPath]
            ? refreshTables(affected[actionPath])
            : load())
        : true;
      if (
        location.pathname === actionPath &&
        actionUser === currentUser.current
      )
        notify(refreshed ? msg : C.errors.refreshFailed, !refreshed);
      return true;
    } catch (e) {
      console.error("Action failed", e);
      if (
        location.pathname === actionPath &&
        actionUser === currentUser.current
      )
        notify(actionErrorMessage(e), true);
      return false;
    } finally {
      busyRef.current.delete(actionKey);
      setPendingActions([...busyRef.current.values()]);
      setBusy(busyRef.current.size > 0);
      setBusyAction(null);
    }
  };
  const logout = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager?.getSubscription();
        if (subscription) {
          await authenticatedFetch("/api/push", {
            method: "DELETE",
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          await subscription.unsubscribe();
        }
      }
      const { error } = await db().auth.signOut();
      if (error) throw error;
    } catch (e) {
      notify(actionErrorMessage(e), true);
      return;
    }
    requestVersion.current++;
    currentUser.current = null;
    clearDrafts();
    setUser(null);
    setData(blank);
    setMessage("");
    setRecovery(false);
    setLoadError(false);
  };
  return (
    <AppContext.Provider
      value={{
        user,
        data,
        loading,
        loadError,
        busy,
        busyAction,
        pendingActions,
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
