"use client";
import { useState } from "react";
import { Pin, Plus } from "lucide-react";
import { useApp, type Row } from "@/components/app-context";
import {
  Button,
  Field,
  Empty,
  PageTitle,
  Visibility,
  useDraft,
  More,
  DateLabel,
} from "@/components/ui";
import { CONTENT as C } from "@/config/content.vi";
import { APP_CONFIG as A } from "@/config/app.config";
import { rpc } from "@/lib/supabase/browser";
import { noteSchema } from "@/features/schemas";
export function NotesScreen() {
  const { data: d, user, run, notify, limit } = useApp();
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState<string | null>(null),
    [title, setTitle] = useState(""),
    [body, setBody] = useDraft("note"),
    [type, setType] = useState("text"),
    [visibility, setVisibility] = useState("couple");
  const edit = (n: Row) => {
    setEditing(n.id);
    setTitle(n.title);
    setBody(n.content);
    setType(n.type);
    setVisibility(n.visibility);
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
              setEditing(null);
              setTitle("");
              setOpen(!open);
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
              setBody("");
              setTitle("");
              setEditing(null);
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
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <div className="form-grid">
            <Field label={C.notes.type}>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="text">{C.notes.text}</option>
                <option value="checklist">{C.notes.checklist}</option>
              </select>
            </Field>
            <Visibility value={visibility} onChange={setVisibility} />
          </div>
          <Field label={C.common.content}>
            <textarea
              required
              maxLength={A.notes.maxLength}
              value={body}
              onChange={(e) => setBody(e.target.value)}
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
      {!notes.length && <Empty />}
      {d.notes.length >= limit && <More />}
    </>
  );
}
