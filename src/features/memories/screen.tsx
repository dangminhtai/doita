"use client";
import { useState, useEffect, useRef, Fragment } from "react";
import { Camera, Plus } from "lucide-react";
import { useApp, type Row } from "@/components/app-context";
import {
  Button,
  Field,
  PageTitle,
  Empty,
  DateLabel,
  useDraft,
  Modal,
} from "@/components/ui";
import { ScopedForm } from "@/components/ui";
import { ThemeArt } from "@/components/theme-art";
import { useCollection } from "@/components/collection";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { rpc, db, authenticatedFetch } from "@/lib/supabase/browser";
import { uncertainWrite } from "@/lib/request";
import { useViewState } from "@/components/view-state";
export function MemoriesScreen() {
  const { data: d, user, run, notify } = useApp();
  const [open, setOpen] = useState(false),
    [body, setBody] = useDraft("memory"),
    [file, setFile] = useState<File | null>(null),
    [selected, setSelected] = useState<Row | null>(null),
    [detail, setDetail] = useState<Row[]>([]),
    [detailError, setDetailError] = useState(false),
    [detailLoading, setDetailLoading] = useState(false),
    [detailAttempt, setDetailAttempt] = useState(0);
  const [filter, setFilter] = useViewState("memories-filter", "all");
  const [search, setSearch] = useViewState("memories-search", "");
  const [from, setFrom] = useViewState("memories-from", "");
  const [to, setTo] = useViewState("memories-to", "");
  const collection = useCollection("memories", { filter, search, from, to });
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
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
  const memories = collection.rows;
  const old = d.onThisDay;
  useEffect(() => {
    setDetail([]);
    setDetailError(false);
    setDetailLoading(Boolean(selected?.source_id));
    if (!selected?.source_id) return;
    let active = true;
    const source = {
      daily: ["daily_answers", "session_id"],
      note: ["notes", "id"],
      prayer: ["prayers", "id"],
    }[selected.type as "daily" | "note" | "prayer"];
    if (!source) setDetailLoading(false);
    if (source)
      void db()
        .from(source[0])
        .select("*")
        .eq(source[1], selected.source_id)
        .then(({ data, error }) => {
          if (!active) return;
          setDetailError(Boolean(error));
          setDetailLoading(false);
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
        <ScopedForm
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
              onChange={(e) => {
                const next = e.target.files?.[0];
                if (
                  next &&
                  (!["image/jpeg", "image/png", "image/webp"].includes(
                    next.type,
                  ) ||
                    next.size > 5 * 1024 * 1024)
                ) {
                  notify(C.errors.invalidFile, true);
                  return;
                }
                setFile(next ?? null);
              }}
            />
          </Field>
          {preview && (
            <img
              className="upload-preview"
              src={preview}
              alt={C.redesign.photoPreview}
              width={320}
              height={240}
            />
          )}
          {uploadedName && (
            <p role="status">
              {t(C.memories.uploadedPhoto, { name: uploadedName })}
            </p>
          )}
          <Button type="submit">{C.common.save}</Button>
          <Button secondary onClick={() => setOpen(false)}>
            {C.common.close}
          </Button>
        </ScopedForm>
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
      <div className="filters memory-filters">
        <Field label={C.redesign.memorySearch}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <Field label={C.redesign.fromDate}>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field label={C.redesign.toDate}>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
        <Field label={C.common.filters}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">{C.common.all}</option>
            <option value="photos">{C.redesign.photosOnly}</option>
            {Object.entries(C.memories.types).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="timeline">
        {memories.map((m, i) => (
          <Fragment key={m.id}>
            {(i === 0 ||
              new Date(memories[i - 1].created_at).toLocaleDateString("vi-VN", {
                month: "long",
                year: "numeric",
                timeZone: d.couple?.timezone,
              }) !==
                new Date(m.created_at).toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                  timeZone: d.couple?.timezone,
                })) && (
              <h2 className="timeline-month">
                {new Date(m.created_at).toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                  timeZone: d.couple?.timezone,
                })}
              </h2>
            )}
            <article
              className={`memory-card ${m.photo_path ? "photo-polaroid" : ""}`}
            >
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
          </Fragment>
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
      {!memories.length && !collection.loading && !collection.error && (
        <Empty>
          <ThemeArt asset="emptyMemories" size={140} />
          {filter === "all" && !search && !from && !to ? (
            <>
              {C.memories.empty}
            </>
          ) : (
            <>
              {C.common.noResults}
              <Button
                secondary
                onClick={() => {
                  setFilter("all");
                  setSearch("");
                  setFrom("");
                  setTo("");
                }}
              >
                {C.common.clearFilters}
              </Button>
            </>
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
          {detailLoading && <p role="status">{C.common.loading}</p>}
          {selected.source_id &&
            !detailLoading &&
            !detailError &&
            !detail.length && <p>{C.redesign.noSource}</p>}
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
export function MemoryPhoto({ path }: { path: string }) {
  const node = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false),
    [url, setUrl] = useState(""),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    if (node.current) observer.observe(node.current);
    return () => observer.disconnect();
  }, [path]);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    let expires = 0;
    setError(false);
    setUrl("");
    const renew = async () => {
      if (document.visibilityState !== "visible" || Date.now() < expires)
        return;
      try {
        const result = await db()
          .storage.from("memories")
          .createSignedUrl(path, 300);
        if (!active) return;
        if (result.error || !result.data?.signedUrl) {
          setError(true);
          return;
        }
        expires = Date.now() + 240000;
        setUrl(result.data.signedUrl);
      } catch {
        if (active) setError(true);
      }
    };
    void renew();
    window.addEventListener("focus", renew);
    return () => {
      active = false;
      window.removeEventListener("focus", renew);
    };
  }, [path, attempt, visible]);
  return (
    <div ref={node} className="memory-media">
      {error ? (
        <div role="status">
          <p>{C.redesign.signedPhotoExpired}</p>
          <Button secondary onClick={() => setAttempt((n) => n + 1)}>
            {C.common.retry}
          </Button>
        </div>
      ) : url ? (
        <img
          className="memory-photo"
          src={url}
          width={640}
          height={480}
          alt={C.memories.types.moment}
          loading="lazy"
          decoding="async"
          onError={() => {
            if (attempt < 1) setAttempt(attempt + 1);
            else setError(true);
          }}
        />
      ) : visible ? (
        <span>{C.common.loading}</span>
      ) : null}
    </div>
  );
}
