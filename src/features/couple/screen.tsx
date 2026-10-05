"use client";
import { useEffect, useRef, useState } from "react";
import { Heart, Calendar } from "@/components/icons";
import { useApp, clearDrafts } from "@/components/app-context";
import {
  Select,
  Button,
  Field,
  PageTitle,
  DateLabel,
  useDraft,
} from "@/components/ui";
import { ProfileAvatar } from "@/components/theme-art";
import { useViewState } from "@/components/view-state";
import { useCollection } from "@/components/collection";
import { localDate, nextOccurrence } from "@/lib/date";
import { ScopedForm } from "@/components/ui";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { enabled } from "@/config/app.config";
import { rpc } from "@/lib/supabase/browser";
import { useConfirmation } from "@/components/confirmation";

export function CoupleScreen() {
  const askConfirmation = useConfirmation();
  const { data: d, user, run, notify } = useApp();
  const [panel, setPanel] = useViewState("couple-panel", "profile");
  const panelInitialized = useRef(false);
  useEffect(() => {
    if (panelInitialized.current) return;
    panelInitialized.current = true;
    if (new URLSearchParams(location.search).get("panel") === "account")
      setPanel("account");
  }, [setPanel]);
  const [dateSearch, setDateSearch] = useViewState("dates-search", "");
  const [dateFilter, setDateFilter] = useViewState("dates-filter", "all");
  const dates = useCollection("special_dates", {
    search: dateSearch,
    filter: dateFilter,
  });
  const [customLabel, setCustomLabel] = useState("");
  const [repeatRule, setRepeatRule] = useState("none");
  const today = localDate(new Date(), d.couple!.timezone);
  const [start, setStart] = useState(d.couple?.relationship_start_date ?? ""),
    [title, setTitle] = useState(""),
    [date, setDate] = useState(""),
    [kind, setKind] = useState("meetup"),
    [dateId, setDateId] = useState<string | null>(null),
    [weekly, setWeekly] = useDraft("weekly");
  return (
    <>
      <PageTitle title={C.settings.title} />
      <nav className="settings-tabs" aria-label={C.settings.title}>
        {(["profile", "dates", "weekly", "account"] as const)
          .filter((id) => id !== "dates" || enabled("specialDates"))
          .filter((id) => id !== "weekly" || enabled("weekly"))
          .map((id) => (
            <button
              key={id}
              aria-pressed={panel === id}
              onClick={() => setPanel(id)}
            >
              {id === "account"
                ? C.couples.leave
                : id === "profile"
                  ? C.nav.couple
                  : C.redesign[id]}
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
                <ProfileAvatar userId={m.user_id} index={i} />
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
              () => rpc("update_couple_settings", { p_start: start || null }),
              C.settings.saved,
            );
          }}
        >
          <Field label={C.couples.start}>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <Button type="submit">{C.common.save}</Button>
        </ScopedForm>
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
                <Select
                  value={kind}
                  onValueChange={(e) => {
                    setKind(e);
                    setRepeatRule(
                      ["birthday", "anniversary"].includes(e)
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
                </Select>
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
                <Select
                  value={repeatRule}
                  onValueChange={(e) => setRepeatRule(e)}
                >
                  <option value="none">{C.redesign.repeatNone}</option>
                  <option value="yearly">{C.redesign.repeatYearly}</option>
                </Select>
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
                <Select
                  value={dateFilter}
                  onValueChange={(e) => setDateFilter(e)}
                >
                  <option value="all">{C.common.all}</option>
                  {Object.entries(C.settings.kinds).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
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
                      onClick={async () => {
                        if (
                          await askConfirmation(C.common.confirmDelete, {
                            title: C.common.delete,
                            action: C.common.delete,
                            destructive: true,
                          })
                        )
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
          <h2>{C.couples.leave}</h2>
          <div className="danger-zone">
            <button
              onClick={async () => {
                if (
                  await askConfirmation(C.couples.confirmLeave, {
                    title: C.couples.leave,
                    action: C.couples.leave,
                    destructive: true,
                  })
                )
                  void run(async () => {
                    await rpc("leave_couple");
                    clearDrafts();
                  });
              }}
            >
              {C.couples.leave}
            </button>
          </div>
        </section>
      </section>
    </>
  );
}
