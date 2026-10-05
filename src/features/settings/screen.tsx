"use client";
import { useEffect, useState } from "react";
import { Bell, Heart, LogOut, Calendar } from "lucide-react";
import { useApp, clearDrafts } from "@/components/app-context";
import { Button, Field, PageTitle, DateLabel, useDraft } from "@/components/ui";
import { ThemeArt, DefaultAvatar } from "@/components/theme-art";
import { useViewState } from "@/components/view-state";
import { useCollection } from "@/components/collection";
import { localDate, nextOccurrence } from "@/lib/date";
import { ScopedForm } from "@/components/ui";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { enabled } from "@/config/app.config";
import { db, rpc, authenticatedFetch } from "@/lib/supabase/browser";
import { serviceWorkerReady } from "@/lib/push-device";
export function SettingsScreen({ go }: { go: (page: string) => void }) {
  const { data: d, user, run, notify, logout } = useApp();
  const [panel, setPanel] = useViewState("settings-panel", "profile");
  const [dateSearch, setDateSearch] = useViewState("dates-search", "");
  const [dateFilter, setDateFilter] = useViewState("dates-filter", "all");
  const dates = useCollection("special_dates", {
    search: dateSearch,
    filter: dateFilter,
  });
  const [customLabel, setCustomLabel] = useState("");
  const [repeatRule, setRepeatRule] = useState("none");
  const today = localDate(new Date(), d.couple!.timezone);
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
    [weekly, setWeekly] = useDraft("weekly"),
    [pushState, setPushState] = useState("checking");
  const checkPush = async () => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setPushState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setPushState("denied");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) {
        setPushState("off");
        return;
      }
      const { data, error } = await db()
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", user!.id)
        .eq("endpoint", subscription.endpoint)
        .maybeSingle();
      setPushState(error ? "error" : data ? "on" : "off");
    } catch {
      setPushState("error");
    }
  };
  useEffect(() => {
    void checkPush();
    window.addEventListener("focus", checkPush);
    return () => window.removeEventListener("focus", checkPush);
  }, [user?.id]);
  async function togglePush(enable: boolean) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      notify(C.settings.pushUnsupported, true);
      return;
    }
    await run(async () => {
      const registration = await serviceWorkerReady();
      let subscription = await registration.pushManager.getSubscription();
      if (!enable) {
        if (subscription) {
          await authenticatedFetch("/api/push", {
            method: "DELETE",
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          await subscription.unsubscribe();
        }
        setPushState("off");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState(permission === "denied" ? "denied" : "off");
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
      setPushState("on");
    });
  }
  return (
    <>
      <PageTitle title={C.settings.title} />
      <nav className="settings-tabs" aria-label={C.settings.title}>
        {(["profile", "dates", "notifications", "weekly", "account"] as const)
          .filter((id) => id !== "dates" || enabled("specialDates"))
          .filter((id) => id !== "notifications" || enabled("notifications"))
          .filter((id) => id !== "weekly" || enabled("weekly"))
          .map((id) => (
            <button
              key={id}
              aria-pressed={panel === id}
              onClick={() => setPanel(id)}
            >
              {id === "notifications" ? C.notifications.inbox : C.redesign[id]}
            </button>
          ))}
      </nav>
      <section className="settings-grid">
        <div className="settings-card" hidden={panel !== "profile"}>
          <Heart size={24} />
          <h2>{C.couples.invite}</h2>
          <div className="daily-members">
            {d.members.map((m, i) => (
              <div className="daily-member" key={m.user_id}>
                <DefaultAvatar index={i} />
                <span>
                  {d.profiles.find((p) => p.id === m.user_id)?.display_name ??
                    C.home.partner}
                </span>
              </div>
            ))}
          </div>
          <code className="invite-code">{d.couple?.invite_code}</code>
          <button
            className="text-button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(d.couple!.invite_code);
                notify(C.redesign.copied);
              } catch {
                notify(C.errors.generic, true);
              }
            }}
          >
            {C.redesign.copyInvite}
          </button>
          <p>{C.couples.expires}</p>
          {d.members.length < 2 && <p>{C.couples.waiting}</p>}
          <Button
            secondary
            onClick={() => void run(() => rpc("rotate_invite"))}
          >
            {C.couples.rotate}
          </Button>
        </div>
        <ScopedForm
          className="settings-card"
          hidden={panel !== "profile"}
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
          {!d.daily && (
            <Field label={C.couples.timezone}>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {C.couples.timezones.map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </select>
            </Field>
          )}
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
        </ScopedForm>
        {enabled("notifications") && (
          <section className="settings-card" hidden={panel !== "notifications"}>
            <Bell />
            <h2>{C.settings.notifications}</h2>
            <p role="status">
              {
                C.settings.pushStates[
                  pushState as keyof typeof C.settings.pushStates
                ]
              }
            </p>
            <div className="row">
              <Button
                disabled={
                  pushState === "unsupported" ||
                  pushState === "denied" ||
                  pushState === "checking"
                }
                onClick={() => void togglePush(pushState !== "on")}
              >
                {pushState === "on"
                  ? C.settings.disablePush
                  : C.settings.enablePush}
              </Button>
            </div>
            {pushState === "error" && (
              <Button secondary onClick={() => void checkPush()}>
                {C.common.retry}
              </Button>
            )}
            <h3>{C.settings.install}</h3>
            <p>{C.settings.installHint}</p>
          </section>
        )}
        {enabled("specialDates") && (
          <section className="settings-card" hidden={panel !== "dates"}>
            <Calendar />
            <h2>{C.settings.special}</h2>
            <ScopedForm
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await run(() =>
                    rpc("save_special_date_details", {
                      p_title: title,
                      p_date: date,
                      p_kind: kind,
                      p_id: dateId,
                      p_custom_label: customLabel || null,
                      p_repeat_rule: repeatRule,
                    }),
                  )
                ) {
                  setTitle("");
                  setDate("");
                  setDateId(null);
                }
              }}
            >
              <Field label={C.redesign.eventName}>
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
                <select
                  value={kind}
                  onChange={(e) => {
                    setKind(e.target.value);
                    setRepeatRule(
                      ["birthday", "anniversary"].includes(e.target.value)
                        ? "yearly"
                        : "none",
                    );
                  }}
                >
                  {Object.entries(C.settings.kinds).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              {kind === "custom" && (
                <Field label={C.redesign.customKind}>
                  <input
                    required
                    maxLength={60}
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                  />
                </Field>
              )}
              <Field label={C.redesign.repeat}>
                <select
                  value={repeatRule}
                  onChange={(e) => setRepeatRule(e.target.value)}
                >
                  <option value="none">{C.redesign.repeatNone}</option>
                  <option value="yearly">{C.redesign.repeatYearly}</option>
                </select>
              </Field>
              <Button type="submit">{C.common.save}</Button>
            </ScopedForm>
            <div className="filters">
              <Field label={C.redesign.dateSearch}>
                <input
                  type="search"
                  value={dateSearch}
                  onChange={(e) => setDateSearch(e.target.value)}
                />
              </Field>
              <Field label={C.common.filters}>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">{C.common.all}</option>
                  {Object.entries(C.settings.kinds).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {dates.loading && <p role="status">{C.common.loading}</p>}
            {dates.error && (
              <div role="alert">
                <p>{C.redesign.paginationError}</p>
                <Button secondary onClick={dates.retry}>
                  {C.common.retry}
                </Button>
              </div>
            )}
            {!dates.loading && !dates.error && !dates.rows.length && (
              <p>{C.redesign.noDates}</p>
            )}
            {dates.rows.map((x) => (
              <div className="date-row" key={x.id}>
                <p>
                  <b>{x.title}</b> ·{" "}
                  {x.custom_label ||
                    C.settings.kinds[x.kind as keyof typeof C.settings.kinds]}
                  <small className="next-date">
                    {x.repeat_rule === "yearly" ||
                    (!x.repeat_rule &&
                      ["birthday", "anniversary"].includes(x.kind))
                      ? C.redesign.repeatYearly
                      : C.redesign.repeatNone}
                  </small>
                  <br />
                  <DateLabel date={x.date} />
                  {nextOccurrence(x.date, x.kind, today, x.repeat_rule) && (
                    <small className="next-date">
                      {C.redesign.nextDate}:{" "}
                      <DateLabel
                        date={nextOccurrence(
                          x.date,
                          x.kind,
                          today,
                          x.repeat_rule,
                        )!}
                      />
                    </small>
                  )}
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
                        setCustomLabel(x.custom_label ?? "");
                        setRepeatRule(
                          x.repeat_rule ??
                            (["birthday", "anniversary"].includes(x.kind)
                              ? "yearly"
                              : "none"),
                        );
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
            {dates.more && (
              <Button
                secondary
                disabled={dates.loading}
                onClick={dates.loadMore}
              >
                {C.common.more}
              </Button>
            )}
          </section>
        )}
        {enabled("weekly") && (
          <section className="settings-card" hidden={panel !== "weekly"}>
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
        <section className="settings-card" hidden={panel !== "account"}>
          <h2>{C.redesign.account}</h2>
          <div className="row">
            <Button secondary onClick={() => void logout()}>
              <LogOut size={18} />
              {C.auth.signOut}
            </Button>
          </div>
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
        <section
          className="settings-card theme-card"
          hidden={panel !== "profile"}
        >
          <ThemeArt asset="mascots" size={100} />
          <h2>{C.redesign.theme}</h2>
          <p>{C.redesign.defaultTheme}</p>
          <small>{C.redesign.themeHint}</small>
          <Button secondary onClick={() => go("activities")}>
            {C.nav.activities}
          </Button>
        </section>
      </section>
    </>
  );
}
