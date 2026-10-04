"use client";
import { useState, useEffect, useRef } from "react";
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
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { rpc, db, authenticatedFetch } from "@/lib/supabase/browser";
import { uncertainWrite } from "@/lib/request";
import { useViewState } from "@/components/view-state";
export function MemoriesScreen() {
  const { data: d, user, run, notify, limit } = useApp();
  const [open, setOpen] = useState(false),
    [body, setBody] = useDraft("memory"),
    [file, setFile] = useState<File | null>(null),
    [selected, setSelected] = useState<Row | null>(null),
    [detail, setDetail] = useState<Row[]>([]),
    [detailError, setDetailError] = useState(false),
    [detailAttempt, setDetailAttempt] = useState(0);
  const [filter, setFilter] = useViewState("memories-filter", "all");
  const upload = useRef<{ file: File | null; path: string } | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const uploadKey = `couple-draft:${user!.id}:${d.couple!.id}:memory-upload`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(uploadKey) ?? "null");
      if (
        saved &&
        typeof saved.path === "string" &&
        saved.path.startsWith(`${d.couple!.id}/${user!.id}/`)
      ) {
        upload.current = { file: null, path: saved.path };
        setUploadedName(saved.name ?? "");
      }
    } catch {
      notify(C.common.draftStorageError, true);
    }
  }, [uploadKey]);
  const memories = d.memories.filter(
    (m) => filter === "all" || m.type === filter,
  );
  const old = d.onThisDay;
  useEffect(() => {
    setDetail([]);
    setDetailError(false);
    if (!selected?.source_id) return;
    let active = true;
    const source = {
      daily: ["daily_answers", "session_id"],
      note: ["notes", "id"],
      prayer: ["prayers", "id"],
    }[selected.type as "daily" | "note" | "prayer"];
    if (source)
      void db()
        .from(source[0])
        .select("*")
        .eq(source[1], selected.source_id)
        .then(({ data, error }) => {
          if (!active) return;
          setDetailError(Boolean(error));
          setDetail(data ?? []);
        });
    return () => {
      active = false;
    };
  }, [selected?.id, detailAttempt, user?.id]);
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
              let path: null | string = upload.current?.path ?? null;
              if (file && upload.current?.file === file)
                path = upload.current.path;
              else if (file) {
                if (
                  !["image/jpeg", "image/png", "image/webp"].includes(
                    file.type,
                  ) ||
                  file.size > 5 * 1024 * 1024
                )
                  throw new Error("Invalid file");
                const ext = file.type.split("/")[1];
                path = `${d.couple!.id}/${user!.id}/${crypto.randomUUID()}.${ext}`;
                await rpc("register_memory_asset", { p_path: path });
                const uploaded = await db()
                  .storage.from("memories")
                  .upload(path, file, {
                    contentType: file.type,
                    upsert: false,
                  });
                if (uploaded.error) {
                  await rpc("queue_memory_cleanup", { p_path: path });
                  throw uploaded.error;
                }
                upload.current = { file, path };
                setUploadedName(file.name);
                try {
                  localStorage.setItem(
                    uploadKey,
                    JSON.stringify({ path, name: file.name }),
                  );
                } catch {
                  notify(C.common.draftStorageError, true);
                }
              }
              try {
                await rpc("save_memory", { p_content: body, p_photo: path });
              } catch (e) {
                if (path && !uncertainWrite(e)) {
                  upload.current = null;
                  setUploadedName("");
                  try {
                    localStorage.removeItem(uploadKey);
                  } catch {}
                  await rpc("queue_memory_cleanup", { p_path: path });
                  void authenticatedFetch("/api/assets/cleanup", {
                    method: "POST",
                  }).catch(console.error);
                }
                throw e;
              }
            });
            if (ok) {
              setBody("");
              setFile(null);
              upload.current = null;
              setUploadedName("");
              try {
                localStorage.removeItem(uploadKey);
              } catch {}
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
          {uploadedName && (
            <p role="status">
              {t(C.memories.uploadedPhoto, { name: uploadedName })}
            </p>
          )}
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
      {!memories.length && (
        <Empty>
          {filter === "all" ? (
            <>
              {C.memories.empty}
              <Button onClick={() => setOpen(true)}>{C.memories.new}</Button>
            </>
          ) : (
            <>
              {C.common.noResults}
              <Button secondary onClick={() => setFilter("all")}>
                {C.common.clearFilters}
              </Button>
            </>
          )}
        </Empty>
      )}
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
          {detailError && (
            <div role="alert">
              <p>{C.errors.detailFailed}</p>
              <Button
                secondary
                onClick={() => setDetailAttempt(detailAttempt + 1)}
              >
                {C.common.retry}
              </Button>
            </div>
          )}
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
                if (!confirm(C.common.confirmDelete)) return;
                let pendingCleanup = false;
                const ok = await run(async () => {
                  await rpc("delete_memory", { p_id: selected.id });
                  if (selected.photo_path) {
                    try {
                      const result = await authenticatedFetch(
                        "/api/assets/cleanup",
                        { method: "POST" },
                      );
                      pendingCleanup = result.pending > 0;
                    } catch {
                      pendingCleanup = true;
                    }
                  }
                });
                if (ok) {
                  setSelected(null);
                  if (pendingCleanup) notify(C.memories.cleanupPending);
                }
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
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setUrl("");
    const timer = setInterval(() => {
      if (active) {
        setAttempt(0);
        renew();
      }
    }, 240000);
    const renew = () => {
      db()
        .storage.from("memories")
        .createSignedUrl(path, 300)
        .then(({ data }) => {
          if (active) setUrl(data?.signedUrl ?? "");
        });
    };
    renew();
    window.addEventListener("focus", renew);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", renew);
    };
  }, [path, attempt]);
  return url ? (
    <img
      className="memory-photo"
      src={url}
      alt={C.memories.types.moment}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (attempt < 2) setAttempt(attempt + 1);
        else setUrl("");
      }}
    />
  ) : null;
}
