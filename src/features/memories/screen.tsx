"use client";
import { useState, useEffect } from "react";
import { Camera, Plus } from "lucide-react";
import { useApp, type Row } from "@/components/app-context";
import {
  Button,
  Field,
  PageTitle,
  Empty,
  More,
  DateLabel,
  useDraft,
  Modal,
} from "@/components/ui";
import { CONTENT as C } from "@/config/content.vi";
import { rpc, db } from "@/lib/supabase/browser";
import { localDate } from "@/lib/date";
export function MemoriesScreen() {
  const { data: d, user, run, notify, limit } = useApp();
  const [open, setOpen] = useState(false),
    [body, setBody] = useDraft("memory"),
    [file, setFile] = useState<File | null>(null),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<Row | null>(null),
    [detail, setDetail] = useState<Row[]>([]);
  const today = localDate(new Date(), d.couple!.timezone);
  const memories = d.memories.filter(
    (m) => filter === "all" || m.type === filter,
  );
  const old = d.memories.filter(
    (m) =>
      m.created_at.slice(0, 10) < today &&
      m.created_at.slice(5, 10) === today.slice(5),
  );
  useEffect(() => {
    setDetail([]);
    if (!selected?.source_id) return;
    if (selected.type === "daily")
      db()
        .from("daily_answers")
        .select("*")
        .eq("session_id", selected.source_id)
        .then(({ data }) => setDetail(data ?? []));
    if (selected.type === "note")
      db()
        .from("notes")
        .select("*")
        .eq("id", selected.source_id)
        .then(({ data }) => setDetail(data ?? []));
    if (selected.type === "prayer")
      db()
        .from("prayers")
        .select("*")
        .eq("id", selected.source_id)
        .then(({ data }) => setDetail(data ?? []));
  }, [selected?.id]);
  return (
    <>
      <PageTitle
        title={C.memories.title}
        subtitle={C.memories.subtitle}
        action={
          <Button onClick={() => setOpen(!open)}>
            <Plus size={18} />
            {C.memories.new}
          </Button>
        }
      />
      {open && (
        <form
          className="composer"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!body.trim() || body.length > 5000) {
              notify(C.errors.invalid, true);
              return;
            }
            const ok = await run(async () => {
              let path: null | string = null;
              if (file) {
                if (
                  !["image/jpeg", "image/png", "image/webp"].includes(
                    file.type,
                  ) ||
                  file.size > 5 * 1024 * 1024
                )
                  throw new Error("Invalid file");
                const ext = file.type.split("/")[1];
                path = `${d.couple!.id}/${user!.id}/${crypto.randomUUID()}.${ext}`;
                const uploaded = await db()
                  .storage.from("memories")
                  .upload(path, file, {
                    contentType: file.type,
                    upsert: false,
                  });
                if (uploaded.error) throw uploaded.error;
              }
              try {
                await rpc("save_memory", { p_content: body, p_photo: path });
              } catch (e) {
                if (path) await db().storage.from("memories").remove([path]);
                throw e;
              }
            });
            if (ok) {
              setBody("");
              setFile(null);
              setOpen(false);
            }
          }}
        >
          <Field label={C.common.content}>
            <textarea
              required
              maxLength={5000}
              placeholder={C.memories.body}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          <Field label={C.memories.photo}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Button type="submit">{C.common.save}</Button>
        </form>
      )}
      {old.length > 0 && (
        <section className="on-this-day">
          <h2>{C.memories.onThisDay}</h2>
          {old.map((m) => (
            <button
              className="text-button"
              key={m.id}
              onClick={() => setSelected(m)}
            >
              {m.content ||
                C.memories.types[m.type as keyof typeof C.memories.types]}
            </button>
          ))}
        </section>
      )}
      <div className="filters">
        <Field label={C.common.filters}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">{C.common.all}</option>
            {Object.entries(C.memories.types).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="timeline">
        {memories.map((m) => (
          <article key={m.id} className="memory-card">
            <div className="timeline-dot">
              <Camera size={18} />
            </div>
            <span className="tag">
              {C.memories.types[m.type as keyof typeof C.memories.types] ??
                C.memories.types.moment}
            </span>
            <DateLabel date={m.created_at} />
            <button className="memory-open" onClick={() => setSelected(m)}>
              {m.content ||
                C.memories.types[m.type as keyof typeof C.memories.types]}
            </button>
            {m.photo_path && <MemoryPhoto path={m.photo_path} />}
          </article>
        ))}
      </div>
      {!memories.length && <Empty />}
      {d.memories.length >= limit && <More />}
      {selected && (
        <Modal
          title={
            C.memories.types[selected.type as keyof typeof C.memories.types] ??
            C.memories.title
          }
          onClose={() => setSelected(null)}
        >
          <DateLabel date={selected.created_at} />
          <p className="pre-wrap">{selected.content}</p>
          {detail.map((row) => (
            <p className="pre-wrap" key={row.id ?? row.user_id}>
              <b>
                {
                  d.profiles.find(
                    (p) => p.id === (row.user_id ?? row.author_id),
                  )?.display_name
                }
              </b>
              <br />
              {row.content}
            </p>
          ))}
          {selected.photo_path && <MemoryPhoto path={selected.photo_path} />}{" "}
          {selected.author_id === user?.id && (
            <Button
              secondary
              onClick={async () => {
                if (
                  confirm(C.common.confirmDelete) &&
                  (await run(async () => {
                    await rpc("delete_memory", { p_id: selected.id });
                    if (selected.photo_path) {
                      const { error } = await db()
                        .storage.from("memories")
                        .remove([selected.photo_path]);
                      if (error) console.error(error);
                    }
                  }))
                )
                  setSelected(null);
              }}
            >
              {C.common.delete}
            </Button>
          )}
        </Modal>
      )}
    </>
  );
}
function MemoryPhoto({ path }: { path: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    db()
      .storage.from("memories")
      .createSignedUrl(path, 300)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? "");
      });
    return () => {
      active = false;
    };
  }, [path]);
  return url ? (
    <img className="memory-photo" src={url} alt={C.memories.types.moment} />
  ) : null;
}
