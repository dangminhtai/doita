"use client";
import { useEffect, useState } from "react";
import { Ship, Plus, Feather } from "lucide-react";
import { useApp, flushNotifications, type Row } from "@/components/app-context";
import {
  Button,
  Field,
  Empty,
  PageTitle,
  Visibility,
  More,
  DateLabel,
  Modal,
} from "@/components/ui";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { APP_CONFIG as A } from "@/config/app.config";
import { rpc } from "@/lib/supabase/browser";
import { prayerSchema } from "@/features/schemas";
import { useViewState } from "@/components/view-state";
import prompts from "../../../data/prayer-prompts.json";
import {
  emptyPrayerDraft,
  parsePrayerDraft,
  prayerDraftKey,
  type PrayerDraft,
} from "./draft";
export function PrayerScreen() {
  const { data: d, user, run, notify, limit } = useApp();
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState<PrayerDraft>(emptyPrayerDraft),
    [selected, setSelected] = useState<Row | null>(null),
    [released, setReleased] = useState(false),
    [promptIndex, setPromptIndex] = useState(0);
  const [filter, setFilter] = useViewState("prayer-filter", "all");
  const { body, visibility, resurface, draftId } = draft;
  const prefix = `couple-draft:${user!.id}:prayer:${d.couple!.id}`;
  const read = (id: string | null) => {
    try {
      return parsePrayerDraft(
        localStorage.getItem(prayerDraftKey(user!.id, d.couple!.id, id)),
      );
    } catch {
      return null;
    }
  };
  const persist = (next: PrayerDraft) => {
    setDraft(next);
    try {
      localStorage.setItem(
        prayerDraftKey(user!.id, d.couple!.id, next.draftId),
        JSON.stringify(next),
      );
      localStorage.setItem(prefix + ":active", next.draftId ?? "new");
    } catch {
      notify(C.notes.draftStorageError, true);
    }
  };
  useEffect(() => {
    try {
      const active = localStorage.getItem(prefix + ":active");
      let restored = read(active && active !== "new" ? active : null);
      const legacyKey = `couple-draft:${user!.id}:prayer`;
      const legacy = localStorage.getItem(legacyKey);
      if (!restored && legacy) {
        restored = { ...emptyPrayerDraft(), body: legacy };
        localStorage.setItem(
          prayerDraftKey(user!.id, d.couple!.id, null),
          JSON.stringify(restored),
        );
        localStorage.removeItem(legacyKey);
      }
      setDraft(restored ?? emptyPrayerDraft());
      setOpen(Boolean(restored?.body));
    } catch {
      notify(C.notes.draftStorageError, true);
    }
  }, [prefix]);
  useEffect(() => {
    if (!open || !body) return;
    const guard = (e: Event) => {
      if (!confirm(C.prayer.leaveDraft)) e.preventDefault();
    };
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("couple-before-navigate", guard);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("couple-before-navigate", guard);
      window.removeEventListener("beforeunload", unload);
    };
  }, [open, body]);
  const prayers = d.prayers.filter(
    (p) =>
      p.status === (filter === "archived" ? "archived" : "released") &&
      (filter === "all" ||
        filter === "archived" ||
        (filter === "mine"
          ? p.author_id === user?.id
          : p.author_id !== user?.id)),
  );
  async function save(status: string) {
    if (
      !prayerSchema.safeParse({ content: body, visibility, resurface }).success
    ) {
      notify(C.errors.invalid, true);
      return;
    }
    if (
      status === "released" &&
      !confirm(
        t(C.prayer.confirmVisibility, {
          visibility:
            visibility === "private" ? C.common.private : C.common.partner,
        }),
      )
    )
      return;
    const ok = await run(
      () =>
        rpc("save_prayer", {
          p_content: body,
          p_visibility: visibility,
          p_resurface: resurface,
          p_status: status,
          p_id: draftId,
        }),
      status === "released" ? C.prayer.released : C.common.success,
    );
    if (ok) {
      try {
        localStorage.removeItem(
          prayerDraftKey(user!.id, d.couple!.id, draftId),
        );
        localStorage.removeItem(prefix + ":active");
      } catch {}
      setDraft(emptyPrayerDraft());
      setOpen(false);
      if (status === "released") {
        setReleased(true);
        void flushNotifications();
      }
    }
  }
  return (
    <>
      <PageTitle
        title={C.prayer.title}
        subtitle={C.prayer.subtitle}
        action={
          <Button
            onClick={() => {
              setOpen(!open);
            }}
          >
            <Plus size={18} />
            {C.prayer.write}
          </Button>
        }
      />
      {open && (
        <section className="composer">
          <div className="prompt-hint">
            <Feather size={20} />
            <div>
              <b>{C.prayer.prompt}</b>
              <p>{prompts[promptIndex % prompts.length].prompt}</p>
            </div>
            <Button secondary onClick={() => setPromptIndex(promptIndex + 1)}>
              {C.activities.reroll}
            </Button>
          </div>
          <Field label={C.common.content}>
            <textarea
              value={body}
              onChange={(e) => persist({ ...draft, body: e.target.value })}
              maxLength={A.prayer.maxLength}
              placeholder={C.prayer.placeholder}
            />
          </Field>
          <div className="row-between">
            <small>
              {t(C.prayer.count, {
                count: body.length,
                max: A.prayer.maxLength,
              })}
            </small>
            <Visibility
              prayer
              value={visibility}
              onChange={(visibility) =>
                persist({
                  ...draft,
                  visibility: visibility as PrayerDraft["visibility"],
                })
              }
            />
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={resurface}
              onChange={(e) =>
                persist({ ...draft, resurface: e.target.checked })
              }
            />
            {C.prayer.resurface}
          </label>
          <div className="row">
            <small>
              {t(C.common.sharedHint, {
                visibility:
                  visibility === "private"
                    ? C.common.private
                    : C.common.partner,
              })}
            </small>
            {draftId && (
              <Button
                secondary
                onClick={() => {
                  if (confirm(C.prayer.leaveDraft))
                    persist(read(null) ?? emptyPrayerDraft());
                }}
              >
                {C.prayer.newDraft}
              </Button>
            )}
            <Button onClick={() => void save("released")}>
              <Ship size={18} />
              {C.prayer.release}
            </Button>
            <Button secondary onClick={() => void save("draft")}>
              {C.prayer.draft}
            </Button>
            <Button secondary onClick={() => setOpen(false)}>
              {C.common.close}
            </Button>
          </div>
        </section>
      )}
      <section
        className={`river ${released ? "released" : ""} ${!prayers.length || filter === "archived" ? "compact" : ""}`}
        onAnimationEnd={() => setReleased(false)}
        aria-label={C.prayer.river}
      >
        <div className="river-caption">
          <span>{C.prayer.river}</span>
          <p>{C.prayer.subtitle}</p>
        </div>
        <div className="boats">
          {prayers.slice(0, 12).map((p, i) => (
            <button
              key={p.id}
              className="boat"
              style={{ animationDelay: `${i * -1.7}s` }}
              onClick={() => setSelected(p)}
              aria-label={`${C.prayer.open} · ${d.profiles.find((x) => x.id === p.author_id)?.display_name ?? C.home.partner} · ${new Date(p.created_at).toLocaleDateString("vi-VN", { timeZone: d.couple?.timezone })}`}
            >
              <Ship size={40} />
              <small>
                {new Date(p.created_at).toLocaleDateString("vi-VN", {
                  day: "numeric",
                  month: "numeric",
                  timeZone: d.couple?.timezone,
                })}
              </small>
            </button>
          ))}
        </div>
        {released && (
          <Ship className="launch-boat" size={44} aria-hidden="true" />
        )}
      </section>
      <div className="filters">
        <Field label={C.common.filters}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">{C.common.all}</option>
            <option value="mine">{C.common.mine}</option>
            <option value="theirs">{C.common.theirs}</option>
            <option value="archived">{C.common.archived}</option>
          </select>
        </Field>
      </div>
      <div className="prayer-list">
        {prayers.map((p) => (
          <button
            key={p.id}
            className="prayer-row"
            onClick={() => setSelected(p)}
          >
            <Ship size={22} />
            <span>
              {p.content.length > 80 ? p.content.slice(0, 80) + "…" : p.content}
            </span>
            <small>
              <DateLabel date={p.created_at} />
            </small>
          </button>
        ))}
      </div>
      {!prayers.length && (
        <Empty>
          {filter !== "all" ? (
            <>
              {C.common.noResults}
              <Button secondary onClick={() => setFilter("all")}>
                {C.common.clearFilters}
              </Button>
            </>
          ) : (
            <>
              {C.prayer.empty}
              <Button onClick={() => setOpen(true)}>{C.prayer.write}</Button>
            </>
          )}
        </Empty>
      )}
      {d.prayers.length >= limit && <More />}
      {d.prayers.some((p) => p.status === "draft") && (
        <section className="section">
          <h2>{C.prayer.drafts}</h2>
          {d.prayers
            .filter((p) => p.status === "draft" && p.author_id === user?.id)
            .map((p) => (
              <button
                key={p.id}
                className="prayer-row"
                onClick={() => {
                  persist(
                    read(p.id) ?? {
                      body: p.content,
                      draftId: p.id,
                      visibility: p.visibility,
                      resurface: p.metadata?.resurface ?? true,
                    },
                  );
                  setOpen(true);
                }}
              >
                <Feather size={20} />
                {p.content.slice(0, 60)}
              </button>
            ))}
        </section>
      )}
      {selected && (
        <Modal title={C.prayer.open} onClose={() => setSelected(null)}>
          <span className="tag">
            {selected.visibility === "private"
              ? C.common.private
              : C.common.shared}
          </span>
          <p className="letter pre-wrap">{selected.content}</p>
          <p>
            {d.profiles.find((x) => x.id === selected.author_id)?.display_name}
          </p>
          <DateLabel date={selected.created_at} />
          {d.prayerEvents.some(
            (e) => e.prayer_id === selected.id && e.type === "resurfaced",
          ) && <p>{C.prayer.returned}</p>}
          {selected.author_id === user?.id && (
            <div className="row">
              <Button
                secondary
                onClick={async () => {
                  if (
                    await run(
                      () =>
                        rpc("prayer_action", {
                          p_id: selected.id,
                          p_action:
                            selected.status === "archived"
                              ? "restore"
                              : "archive",
                        }),
                      selected.status === "archived"
                        ? C.common.success
                        : C.prayer.archiveSaved,
                    )
                  )
                    setSelected(null);
                }}
              >
                {selected.status === "archived"
                  ? C.common.restore
                  : C.prayer.archive}
              </Button>
              <Button
                secondary
                onClick={async () => {
                  if (
                    confirm(C.common.confirmDelete) &&
                    (await run(() =>
                      rpc("prayer_action", {
                        p_id: selected.id,
                        p_action: "delete",
                      }),
                    ))
                  )
                    setSelected(null);
                }}
              >
                {C.common.delete}
              </Button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
