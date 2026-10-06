"use client";
import { useEffect, useRef, useState } from "react";
import { Pin, Plus } from "@/components/icons";
import { useApp, type Row } from "@/components/app-context";
import {
  Select,
  Button,
  Field,
  Empty,
  PageTitle,
  Visibility,
  Modal,
  ActionScope,
  DateLabel,
} from "@/components/ui";
import { ScopedForm } from "@/components/ui";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { APP_CONFIG as A } from "@/config/app.config";
import { rpc } from "@/lib/supabase/browser";
import { noteSchema } from "@/features/schemas";
import { useCollection } from "@/components/collection";
import { ThemeArt, ProfileAvatar } from "@/components/theme-art";
import { useViewState } from "@/components/view-state";
import {
  emptyNoteDraft,
  parseNoteDraft,
  noteDraftKey,
  type NoteDraft,
} from "./draft";
import { useConfirmation } from "@/components/confirmation";

export function NotesScreen() {
  const askConfirmation = useConfirmation();
  const { data: d, user, run, notify } = useApp();
  const [search, setSearch] = useViewState("notes-search", "");
  const [filter, setFilter] = useViewState("notes-filter", "all");
  const [selected, setSelected] = useState<Row | null>(null);
  const collection = useCollection("notes", { search, filter });
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState<NoteDraft>(emptyNoteDraft);
  const { editing, title, body, type, visibility } = draft;
  const editor = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      editor.current?.scrollIntoView({ block: "start", behavior: "instant" });
      editor.current
        ?.querySelector<HTMLInputElement>("input:not([type=hidden])")
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, editing]);
  const activeKey = `couple-draft:${user?.id}:${d.couple?.id}:note-active`;
  const restore = (id: string | null) => {
    try {
      return user
        ? parseNoteDraft(
            localStorage.getItem(noteDraftKey(user.id, id, d.couple!.id)),
          )
        : null;
    } catch {
      return null;
    }
  };
  const persist = (next: NoteDraft) => {
    setDraft(next);
    if (!user) return;
    try {
      localStorage.setItem(
        noteDraftKey(user.id, next.editing, d.couple!.id),
        JSON.stringify(next),
      );
      localStorage.setItem(activeKey, next.editing ?? "new");
    } catch {
      notify(C.notes.draftStorageError, true);
    }
  };
  const update = (patch: Partial<NoteDraft>) => persist({ ...draft, ...patch });
  useEffect(() => {
    if (!user) return;
    try {
      const active = localStorage.getItem(activeKey);
      let restored = parseNoteDraft(
        localStorage.getItem(
          noteDraftKey(
            user.id,
            active && active !== "new" ? active : null,
            d.couple!.id,
          ),
        ),
      );
      const previousActiveKey = `couple-draft:${user.id}:note-active`;
      const previousId = localStorage.getItem(previousActiveKey);
      const previousKey = noteDraftKey(
        user.id,
        previousId && previousId !== "new" ? previousId : null,
      );
      const previous = parseNoteDraft(localStorage.getItem(previousKey));
      if (!restored && previous) {
        const belongs =
          previous.editing &&
          d.notes.some(
            (n) => n.id === previous.editing && n.author_id === user.id,
          );
        restored = belongs
          ? previous
          : { ...previous, editing: null, visibility: "private" };
        localStorage.setItem(
          noteDraftKey(user.id, restored.editing, d.couple!.id),
          JSON.stringify(restored),
        );
        localStorage.setItem(activeKey, restored.editing ?? "new");
        localStorage.removeItem(previousKey);
        localStorage.removeItem(previousActiveKey);
        if (!belongs) notify(C.notes.legacyDraftPrivate);
      }
      const legacyKey = `couple-draft:${user.id}:note`;
      const legacy = localStorage.getItem(legacyKey);
      if (!restored && legacy) {
        restored = { ...emptyNoteDraft(), body: legacy };
        localStorage.setItem(
          noteDraftKey(user.id, null, d.couple!.id),
          JSON.stringify(restored),
        );
        localStorage.removeItem(legacyKey);
      }
      setDraft(restored ?? emptyNoteDraft());
      setOpen(
        Boolean(
          restored && (restored.body || restored.title || restored.editing),
        ),
      );
    } catch {
      notify(C.notes.draftStorageError, true);
    }
  }, [user?.id, d.couple?.id]);
  useEffect(() => {
    if (!open || !(body || title || editing)) return;
    const guard = (e: Event) => {
      e.preventDefault();
      void askConfirmation(C.notes.leaveDraft, {
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
  }, [open, body, title, editing]);
  const edit = (n: Row) => {
    persist(
      restore(n.id) ?? {
        editing: n.id,
        title: n.title,
        body: n.content,
        type: n.type,
        visibility: n.visibility,
      },
    );
    setOpen(true);
  };
  const notes = collection.rows;
  return (
    <>
      <PageTitle
        title={C.notes.title}
        action={
          <Button
            onClick={() => {
              persist(restore(null) ?? emptyNoteDraft());
              setOpen(true);
            }}
          >
            <Plus size={18} />
            {C.notes.new}
          </Button>
        }
      />
      {open && (
        <section ref={editor} className="note-editor">
          <ScopedForm
            className="composer"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = noteSchema.safeParse({
                title,
                content: body,
                type,
                visibility,
              });
              if (!result.success) {
                notify(C.errors.invalid, true);
                return;
              }
              const ok = await run(() =>
                rpc("save_note", {
                  p_title: title,
                  p_content: body,
                  p_type: type,
                  p_visibility: visibility,
                  p_id: editing,
                }),
              );
              if (ok) {
                try {
                  if (user)
                    localStorage.removeItem(
                      noteDraftKey(user.id, editing, d.couple!.id),
                    );
                  localStorage.removeItem(activeKey);
                } catch {}
                setDraft(emptyNoteDraft());
                setOpen(false);
              }
            }}
          >
            <Field label={C.common.title}>
              <input
                required
                value={title}
                maxLength={120}
                placeholder={C.notes.titlePlaceholder}
                onChange={(e) => update({ title: e.target.value })}
              />
            </Field>
            <div className="form-grid">
              <Field label={C.notes.type}>
                <Select value={type} onValueChange={(e) => update({ type: e })}>
                  <option value="text">{C.notes.text}</option>
                  <option value="checklist">{C.notes.checklist}</option>
                </Select>
              </Field>
              <Visibility
                value={visibility}
                onChange={(visibility) => update({ visibility })}
              />
            </div>
            <Field label={C.common.content}>
              <textarea
                required
                maxLength={A.notes.maxLength}
                value={body}
                onChange={(e) => update({ body: e.target.value })}
                placeholder={C.notes.bodyPlaceholder}
              />
            </Field>
            <small>
              {type === "checklist" ? C.notes.checklistHint : C.notes.draft}
            </small>
            <div className="row">
              <Button type="submit">{C.common.save}</Button>
              <Button
                secondary
                onClick={async () => {
                  if (
                    !body ||
                    (await askConfirmation(C.common.unsaved, {
                      action: C.common.close,
                    }))
                  )
                    setOpen(false);
                }}
              >
                {C.common.close}
              </Button>
            </div>
          </ScopedForm>
        </section>
      )}
      <div className="filters">
        <Field label={C.common.search}>
          <input
            type="search"
            placeholder={C.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <Field label={C.common.filters}>
          <Select value={filter} onValueChange={(e) => setFilter(e)}>
            <option value="all">{C.common.all}</option>
            <option value="private">{C.common.private}</option>
            <option value="theirs">{C.common.theirs}</option>
            <option value="shared">{C.common.shared}</option>
          </Select>
        </Field>
      </div>
      <div className="notes-grid">
        {notes.map((n) => (
          <article
            key={n.id}
            className={`note-card ${n.type === "checklist" ? "checklist-paper" : "envelope-card"}`}
            data-motion-item={n.id}
          >
            <ActionScope scope={`note:${n.id}`}>
              <div className="row-between">
                <span className="tag">
                  {n.visibility === "private"
                    ? C.common.private
                    : n.visibility === "partner"
                      ? C.common.partner
                      : C.common.shared}
                </span>
                {n.is_pinned && <Pin size={16} />}
              </div>
              <div className="letter-sender">
                <ProfileAvatar
                  userId={n.author_id}
                  index={Math.max(
                    0,
                    d.members.findIndex((m) => m.user_id === n.author_id),
                  )}
                />
                <span>
                  {t(C.redesign.fromTo, {
                    from:
                      d.profiles.find((p) => p.id === n.author_id)
                        ?.display_name ?? C.home.partner,
                    to:
                      n.visibility === "private"
                        ? C.home.you
                        : (d.profiles.find((p) => p.id !== n.author_id)
                            ?.display_name ?? C.home.partner),
                  })}
                </span>
              </div>
              <h2>{n.title}</h2>
              {n.type === "checklist" ? (
                <div className="checklist">
                  {collection.children
                    .filter((i) => i.note_id === n.id)
                    .sort((a, b) => a.position - b.position)
                    .map((i) => (
                      <label key={i.id}>
                        <input
                          type="checkbox"
                          checked={i.completed}
                          onChange={() =>
                            void run(() =>
                              rpc("toggle_note_item", { p_id: i.id }),
                            )
                          }
                        />
                        <span className={i.completed ? "done" : ""}>
                          {i.content}
                        </span>
                      </label>
                    ))}
                </div>
              ) : (
                <button
                  className="letter-preview"
                  onClick={() => setSelected(n)}
                >
                  <span className="pre-wrap">
                    {n.content.slice(0, 160)}
                    {n.content.length > 160 ? "…" : ""}
                  </span>
                  <span className="open-letter-label">
                    {C.redesign.openLetter}
                  </span>
                  <ThemeArt asset="heart" size={48} />
                </button>
              )}
              <small>
                <DateLabel date={n.created_at} />
              </small>
              {n.author_id === user?.id && (
                <details className="note-actions action-menu">
                  <summary
                    aria-label={t(C.redesign.actionsFor, { title: n.title })}
                  >
                    {C.redesign.actions}
                  </summary>
                  <div className="row">
                    <button onClick={() => edit(n)}>{C.common.edit}</button>
                    <button
                      onClick={() =>
                        void run(() =>
                          rpc("note_action", { p_id: n.id, p_action: "pin" }),
                        )
                      }
                    >
                      {n.is_pinned ? C.notes.unpin : C.notes.pin}
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          await askConfirmation(C.common.confirmDelete, {
                            title: C.common.delete,
                            action: C.common.delete,
                            destructive: true,
                          })
                        )
                          void run(() =>
                            rpc("note_action", {
                              p_id: n.id,
                              p_action: "delete",
                            }),
                          );
                      }}
                    >
                      {C.common.delete}
                    </button>
                  </div>
                </details>
              )}
            </ActionScope>
          </article>
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
      {!notes.length && !collection.loading && !collection.error && (
        <Empty>
          <ThemeArt asset="emptyNotes" size={140} />
          {search || filter !== "all" ? (
            <>
              {C.common.noResults}
              <Button
                secondary
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                {C.common.clearFilters}
              </Button>
            </>
          ) : (
            <>{C.notes.empty}</>
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
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <div className="letter-reader">
            <span className="tag">
              {selected.visibility === "private"
                ? C.common.private
                : selected.visibility === "partner"
                  ? C.common.partner
                  : C.common.shared}
            </span>
            <p className="letter pre-wrap">{selected.content}</p>
            <p>
              {
                d.profiles.find((p) => p.id === selected.author_id)
                  ?.display_name
              }
            </p>
            <DateLabel date={selected.created_at} />
            {selected.author_id === user?.id && (
              <Button
                onClick={() => {
                  const note = selected;
                  setSelected(null);
                  edit(note);
                }}
              >
                {C.common.edit}
              </Button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
