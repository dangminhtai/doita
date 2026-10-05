"use client";
import { useEffect, useState } from "react";
import { Ship, Plus, Feather } from "@/components/icons";
import { useApp, flushNotifications, type Row } from "@/components/app-context";
import {
  Select,
  Button,
  Field,
  Empty,
  PageTitle,
  Visibility,
  DateLabel,
  Modal,
} from "@/components/ui";
import { ThemeArt } from "@/components/theme-art";
import { ActionScope } from "@/components/ui";
import { useCollection } from "@/components/collection";
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
import { useConfirmation } from "@/components/confirmation";

export function PrayerScreen() {
  const askConfirmation = useConfirmation();
  const { data: d, user, run, notify } = useApp();
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
      e.preventDefault();
      void askConfirmation(C.prayer.leaveDraft, {
        action: C.common.continue,
      }).then((accepted) => {
        if (accepted)
          (e as CustomEvent<{ resume: () => void }>).detail.resume();
      });
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
  const collection = useCollection("prayers", { filter });
  const drafts = useCollection("prayers", { filter: "drafts" });
  const prayers = collection.rows;
  async function save(status: string) {
    if (
      !prayerSchema.safeParse({ content: body, visibility, resurface }).success
    ) {
      notify(C.errors.invalid, true);
      return;
    }
    if (
      status === "released" &&
      !(await askConfirmation(
        t(C.prayer.confirmVisibility, {
          visibility:
            visibility === "private" ? C.common.private : C.common.partner,
        }),
      ))
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
        <ActionScope scope="prayer-compose">
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
              {draftId && (
                <Button
                  secondary
                  onClick={async () => {
                    if (await askConfirmation(C.prayer.leaveDraft))
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
        </ActionScope>
      )}
      {prayers.length > 0 && filter !== "archived" && (
        <section
          className={`river ${released ? "released" : ""} ${!prayers.length || filter === "archived" ? "compact" : ""}`}
          onAnimationEnd={() => setReleased(false)}
          aria-label={C.prayer.river}
        >
          <div className="boats">
            {prayers.slice(0, 8).map((p, i) => (
              <button
                key={p.id}
                className="boat"
                style={{ animationDelay: `${i * -1.7}s` }}
                onClick={() => setSelected(p)}
                aria-label={`${C.prayer.open} · ${d.profiles.find((x) => x.id === p.author_id)?.display_name ?? C.home.partner} · ${new Date(p.created_at).toLocaleDateString("vi-VN", { timeZone: d.couple?.timezone })}`}
              >
                <svg
                  className="paper-boat"
                  viewBox="0 0 80 50"
                  width="64"
                  height="44"
                  aria-hidden="true"
                >
                  <path
                    d="M4 27 40 8 76 27 62 45H18Z"
                    fill="var(--theme-paper)"
                  />
                  <path
                    d="M4 27h72M40 8v19L18 45m22-18 22 18"
                    fill="none"
                    stroke="var(--theme-primary)"
                    strokeWidth="2"
                  />
                </svg>
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
      )}
      <div className="filters">
        <Field label={C.common.filters}>
          <Select value={filter} onValueChange={(e) => setFilter(e)}>
            <option value="all">{C.common.all}</option>
            <option value="mine">{C.common.mine}</option>
            <option value="theirs">{C.common.theirs}</option>
            <option value="archived">{C.common.archived}</option>
          </Select>
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
      {collection.loading && <p role="status">{C.common.loading}</p>}
      {collection.error && (
        <div role="alert">
          <p>{C.redesign.paginationError}</p>
          <Button secondary onClick={collection.retry}>
            {C.common.retry}
          </Button>
        </div>
      )}
      {!prayers.length && !collection.loading && !collection.error && (
        <Empty>
          <ThemeArt asset="emptyPrayer" size={140} />
          {filter !== "all" ? (
            <>
              {C.common.noResults}
              <Button secondary onClick={() => setFilter("all")}>
                {C.common.clearFilters}
              </Button>
            </>
          ) : (
            <>{C.prayer.empty}</>
          )}
        </Empty>
      )}
      {collection.more && (
        <Button
          secondary
          disabled={collection.loading}
          onClick={collection.loadMore}
        >
          {C.common.more}
        </Button>
      )}
      {(drafts.rows.length > 0 || drafts.loading || drafts.error) && (
        <section className="section">
          <h2>{C.prayer.drafts}</h2>
          {drafts.rows.map((p) => (
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
          {drafts.loading && <p role="status">{C.common.loading}</p>}
          {drafts.error && (
            <div role="alert">
              <p>{C.redesign.paginationError}</p>
              <Button secondary onClick={drafts.retry}>
                {C.common.retry}
              </Button>
            </div>
          )}
          {drafts.more && (
            <Button
              secondary
              disabled={drafts.loading}
              onClick={drafts.loadMore}
            >
              {C.common.more}
            </Button>
          )}
        </section>
      )}
      {selected && (
        <Modal title={C.prayer.open} onClose={() => setSelected(null)}>
          <ActionScope scope={`prayer:${selected.id}`}>
            <span className="tag">
              {selected.visibility === "private"
                ? C.common.private
                : C.common.shared}
            </span>
            <p className="letter pre-wrap">{selected.content}</p>
            <p>
              {
                d.profiles.find((x) => x.id === selected.author_id)
                  ?.display_name
              }
            </p>
            <DateLabel date={selected.created_at} />
            {collection.children.some(
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
                      (await askConfirmation(C.common.confirmDelete, {
                        title: C.common.delete,
                        action: C.common.delete,
                        destructive: true,
                      })) &&
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
          </ActionScope>
        </Modal>
      )}
    </>
  );
}
