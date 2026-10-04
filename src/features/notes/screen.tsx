"use client";
import { useEffect, useState } from "react";
import { Pin, Plus } from "lucide-react";
import { useApp, type Row } from "@/components/app-context";
import {
  Button,
  Field,
  Empty,
  PageTitle,
  Visibility,
  More,
  DateLabel,
} from "@/components/ui";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { APP_CONFIG as A } from "@/config/app.config";
import { rpc } from "@/lib/supabase/browser";
import { noteSchema } from "@/features/schemas";
import { useViewState } from "@/components/view-state";
import {
  emptyNoteDraft,
  parseNoteDraft,
  noteDraftKey,
  type NoteDraft,
} from "./draft";
export function NotesScreen() {
  const { data: d, user, run, notify, limit } = useApp();
  const [search, setSearch] = useViewState("notes-search", "");
  const [filter, setFilter] = useViewState("notes-filter", "all");
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState<NoteDraft>(emptyNoteDraft);
  const { editing, title, body, type, visibility } = draft;
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
      if (!confirm(C.notes.leaveDraft)) e.preventDefault();
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
  const notes = d.notes
    .filter(
      (n) =>
        (filter === "all" ||
          (filter === "private"
            ? n.visibility === "private"
            : n.visibility !== "private")) &&
        (n.title + " " + n.content)
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
  return (
    <>
      <PageTitle
        title={C.notes.title}
        subtitle={C.notes.subtitle}
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
        <form
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
              <select
                value={type}
                onChange={(e) => update({ type: e.target.value })}
              >
                <option value="text">{C.notes.text}</option>
                <option value="checklist">{C.notes.checklist}</option>
              </select>
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
            <small>
              {t(C.common.sharedHint, {
                visibility:
                  visibility === "private"
                    ? C.common.private
                    : visibility === "partner"
                      ? C.common.partner
                      : C.common.shared,
              })}
            </small>
            <Button type="submit">{C.common.save}</Button>
            <Button
              secondary
              onClick={() => {
                if (!body || confirm(C.common.unsaved)) setOpen(false);
              }}
            >
              {C.common.close}
            </Button>
          </div>
        </form>
      )}
      <div className="filters">
        <small>{C.notes.searchScope}</small>
        <Field label={C.common.search}>
          <input
            type="search"
            placeholder={C.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <Field label={C.common.filters}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">{C.common.all}</option>
            <option value="private">{C.common.private}</option>
            <option value="shared">{C.common.shared}</option>
          </select>
        </Field>
      </div>
      <div className="notes-grid">
        {notes.map((n) => (
          <article key={n.id} className="note-card">
            <div className="row-between">
              <span className="tag">
                {n.visibility === "private"
                  ? C.common.private
                  : C.common.shared}
              </span>
              {n.is_pinned && <Pin size={16} />}
            </div>
            <h2>{n.title}</h2>
            {n.type === "checklist" ? (
              <div className="checklist">
                {d.items
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
              <p className="pre-wrap">{n.content}</p>
            )}
            <small>
              <DateLabel date={n.created_at} />
            </small>
            {n.author_id === user?.id && (
              <div className="row note-actions">
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
                  onClick={() => {
                    if (confirm(C.common.confirmDelete))
                      void run(() =>
                        rpc("note_action", { p_id: n.id, p_action: "delete" }),
                      );
                  }}
                >
                  {C.common.delete}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {!notes.length && (
        <Empty>
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
            <>
              {C.notes.subtitle}
              <Button onClick={() => setOpen(true)}>{C.notes.new}</Button>
            </>
          )}
        </Empty>
      )}
      {d.notes.length >= limit && <More />}
    </>
  );
}
