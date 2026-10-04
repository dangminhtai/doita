"use client";
import { useEffect, useState } from "react";
import { Bell, Download, Heart, LogOut, Calendar } from "lucide-react";
import { useApp, clearDrafts, type Row } from "@/components/app-context";
import {
  Button,
  Field,
  PageTitle,
  DateLabel,
  Empty,
  useDraft,
} from "@/components/ui";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { enabled } from "@/config/app.config";
import { db, rpc, authenticatedFetch } from "@/lib/supabase/browser";
export function SettingsScreen({ go }: { go: (p: string) => void }) {
  const { data: d, user, run, notify, logout } = useApp();
  const profile = d.profiles.find((p) => p.id === user?.id);
  const [name, setName] = useState(profile?.display_name ?? ""),
    [timezone, setTimezone] = useState(
      d.couple?.timezone ?? "Asia/Ho_Chi_Minh",
    ),
    [start, setStart] = useState(d.couple?.relationship_start_date ?? ""),
    [resurface, setResurface] = useState(profile?.resurfacing ?? true),
    [title, setTitle] = useState(""),
    [date, setDate] = useState(""),
    [kind, setKind] = useState("meetup"),
    [dateId, setDateId] = useState<string | null>(null),
    [weekly, setWeekly] = useDraft("weekly");
  async function togglePush(enable: boolean) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      notify(C.settings.pushUnsupported, true);
      return;
    }
    await run(async () => {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!enable) {
        if (subscription) {
          await authenticatedFetch("/api/push", {
            method: "DELETE",
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          await subscription.unsubscribe();
        }
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        notify(C.settings.pushDenied, true);
        return false;
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("Missing VAPID");
      const padding = "=".repeat((4 - (key.length % 4)) % 4);
      const raw = atob((key + padding).replace(/-/g, "+").replace(/_/g, "/"));
      const applicationServerKey = new Uint8Array(
        [...raw].map((c) => c.charCodeAt(0)),
      );
      subscription ??= await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      await authenticatedFetch("/api/push", {
        method: "POST",
        body: JSON.stringify(subscription.toJSON()),
      });
    });
  }
  async function exportData() {
    await run(async () => {
      const tables = [
        "profiles",
        "couples",
        "couple_members",
        "daily_sessions",
        "daily_answers",
        "daily_feedback",
        "streaks",
        "streak_events",
        "notes",
        "note_items",
        "prayers",
        "prayer_events",
        "memories",
        "memory_items",
        "moods",
        "activity_sessions",
        "special_dates",
      ];
      const out: Record<string, Row[]> = {};
      for (const table of tables) {
        out[table] = [];
        for (let offset = 0; ; offset += 500) {
          const { data, error } = await db()
            .from(table)
            .select("*")
            .order(
              table === "couple_members" || table === "streaks"
                ? "couple_id"
                : table === "daily_answers"
                  ? "session_id"
                  : "id",
              { ascending: true },
            )
            .range(offset, offset + 499);
          if (error) throw error;
          out[table].push(...data);
          if (data.length < 500) break;
        }
      }
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "gan-nhau-data.json";
      link.click();
      URL.revokeObjectURL(url);
    });
  }
  return (
    <>
      <PageTitle title={C.settings.title} />
      <section className="settings-grid">
        <div className="settings-card">
          <Heart size={24} />
          <h2>{C.couples.invite}</h2>
          <code className="invite-code">{d.couple?.invite_code}</code>
          <p>{C.couples.expires}</p>
          {d.members.length < 2 && <p>{C.couples.waiting}</p>}
          <Button
            secondary
            onClick={() => void run(() => rpc("rotate_invite"))}
          >
            {C.couples.rotate}
          </Button>
        </div>
        <form
          className="settings-card"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              () =>
                rpc("update_settings", {
                  p_name: name,
                  p_timezone: timezone,
                  p_start: start || null,
                  p_resurfacing: resurface,
                }),
              C.settings.saved,
            );
          }}
        >
          <Field label={C.couples.profile}>
            <input
              value={name}
              maxLength={60}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label={C.couples.timezone}>
            <select
              value={timezone}
              disabled={!!d.daily}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {C.couples.timezones.map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </select>
            {d.daily && <small>{C.couples.timezoneLocked}</small>}
          </Field>
          <Field label={C.couples.start}>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={resurface}
              onChange={(e) => setResurface(e.target.checked)}
            />
            {C.settings.resurface}
          </label>
          <Button type="submit">{C.common.save}</Button>
        </form>
        {enabled("notifications") && (
          <section className="settings-card">
            <Bell />
            <h2>{C.settings.notifications}</h2>
            <div className="row">
              <Button onClick={() => void togglePush(true)}>
                {C.settings.enablePush}
              </Button>
              <Button secondary onClick={() => void togglePush(false)}>
                {C.settings.disablePush}
              </Button>
            </div>
            <h3>{C.settings.install}</h3>
            <p>{C.settings.installHint}</p>
          </section>
        )}
        {enabled("specialDates") && (
          <section className="settings-card">
            <Calendar />
            <h2>{C.settings.special}</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await run(() =>
                    rpc("save_special_date", {
                      p_title: title,
                      p_date: date,
                      p_kind: kind,
                      p_id: dateId,
                    }),
                  )
                ) {
                  setTitle("");
                  setDate("");
                  setDateId(null);
                }
              }}
            >
              <Field label={C.common.title}>
                <input
                  required
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              <Field label={C.common.date}>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
              <Field label={C.settings.kind}>
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  {Object.entries(C.settings.kinds).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Button type="submit">
                {dateId ? C.common.edit : C.common.save}
              </Button>
            </form>
            {d.dates.map((x) => (
              <div className="date-row" key={x.id}>
                <p>
                  {x.title}
                  <br />
                  <DateLabel date={x.date} />
                </p>
                {x.author_id === user?.id && (
                  <>
                    <button
                      className="text-button"
                      onClick={() => {
                        setTitle(x.title);
                        setDate(x.date);
                        setKind(x.kind);
                        setDateId(x.id);
                      }}
                    >
                      {C.common.edit}
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        if (confirm(C.common.confirmDelete))
                          void run(() =>
                            rpc("delete_special_date", { p_id: x.id }),
                          );
                      }}
                    >
                      {C.common.delete}
                    </button>
                  </>
                )}
              </div>
            ))}
          </section>
        )}
        {enabled("weekly") && (
          <section className="settings-card">
            <h2>{C.settings.weekly}</h2>
            {C.settings.weeklyQuestions.map((q, i) => (
              <p key={q}>
                {t(C.common.count, { count: i + 1 })}. {q}
              </p>
            ))}
            <Field label={C.common.content}>
              <textarea
                maxLength={5000}
                value={weekly}
                onChange={(e) => setWeekly(e.target.value)}
              />
            </Field>
            <Button
              onClick={async () => {
                if (
                  await run(() =>
                    rpc("save_memory", { p_content: weekly, p_type: "weekly" }),
                  )
                )
                  setWeekly("");
              }}
            >
              {C.common.save}
            </Button>
          </section>
        )}
        <section className="settings-card">
          <div className="row">
            <Button secondary onClick={() => void exportData()}>
              <Download size={18} />
              {C.settings.export}
            </Button>
            <Button secondary onClick={() => void logout()}>
              <LogOut size={18} />
              {C.auth.signOut}
            </Button>
          </div>
          <button className="text-button" onClick={() => go("admin")}>
            {C.nav.admin}
          </button>
          <div className="danger-zone">
            <button
              onClick={() => {
                if (confirm(C.couples.confirmLeave))
                  void run(async () => {
                    await rpc("leave_couple");
                    clearDrafts();
                  });
              }}
            >
              {C.couples.leave}
            </button>
            <button
              onClick={() => {
                if (confirm(C.settings.confirmAccount))
                  void run(async () => {
                    await authenticatedFetch("/api/account", {
                      method: "DELETE",
                    });
                    await logout();
                  });
              }}
            >
              {C.settings.deleteAccount}
            </button>
          </div>
        </section>
      </section>
    </>
  );
}
export function AdminScreen() {
  const [result, setResult] = useState<{
    counts: Record<string, number>;
    jobs: Row[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    authenticatedFetch("/api/admin")
      .then((data) => {
        if (active) setResult(data);
      })
      .catch(() => {
        if (active) setResult(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <>
      <PageTitle title={C.admin.title} />
      {loading ? (
        <p>{C.common.loading}</p>
      ) : !result ? (
        <p>{C.admin.notAdmin}</p>
      ) : (
        <>
          <p>{C.admin.healthy}</p>
          <h2>{C.admin.counts}</h2>
          <dl className="admin-counts">
            {Object.entries(result.counts).map(([k, v]) => (
              <div key={k}>
                <dt>{C.admin.labels[k as keyof typeof C.admin.labels]}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <h2>{C.admin.jobs}</h2>
          {result.jobs.map((job) => (
            <article
              className="settings-card"
              key={C.system[job.name as keyof typeof C.system]}
            >
              <b>{C.system[job.name as keyof typeof C.system]}</b>
              <p>{C.system[job.status as keyof typeof C.system]}</p>
              <p>
                {job.last_completed_at && (
                  <DateLabel date={job.last_completed_at} />
                )}
              </p>
              <p>{job.error ? C.errors.generic : null}</p>
            </article>
          ))}
          {!result.jobs.length && <Empty />}
        </>
      )}
    </>
  );
}
