"use client";
import { useEffect, useState } from "react";
import { useApp, type Row } from "./app-context";
import { Modal, Button, DateLabel } from "./ui";
import { db } from "@/lib/supabase/browser";
import { CONTENT as C } from "@/config/content.vi";

export function LinkedContent({
  table,
}: {
  table:
    | "notes"
    | "prayers"
    | "daily_sessions"
    | "memories"
    | "activities"
    | "special_dates"
    | "moods";
}) {
  const { user } = useApp();
  const [id, setId] = useState<string | null>(null);
  const [row, setRow] = useState<Row | null>(null);
  const [answers, setAnswers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const update = () =>
      setId(new URLSearchParams(location.search).get("item"));
    update();
    window.addEventListener("popstate", update);
    window.addEventListener("couple-location-change", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("couple-location-change", update);
    };
  }, []);
  useEffect(() => {
    setRow(null);
    setAnswers([]);
    setError(false);
    if (!id) return;
    let active = true;
    setLoading(true);
    void (async () => {
      try {
        const result = await db()
          .from(table)
          .select(table === "daily_sessions" ? "*,daily_prompts(prompt)" : "*")
          .eq("id", id)
          .maybeSingle();
        if (result.error) throw result.error;
        if (!active) return;
        setRow(result.data);
        if (result.data && table === "daily_sessions") {
          const detail = await db()
            .from("daily_answers")
            .select("*")
            .eq("session_id", id);
          if (detail.error) throw detail.error;
          if (active) setAnswers(detail.data ?? []);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [table, id, retry, user?.id]);
  const close = () => {
    const url = new URL(location.href);
    url.searchParams.delete("item");
    history.replaceState(history.state, "", url.pathname + url.search);
    setId(null);
  };
  if (!id) return null;
  return (
    <Modal title={C.notifications.inbox} onClose={close}>
      {loading ? (
        <p role="status">{C.common.loading}</p>
      ) : error ? (
        <div role="alert">
          <p>{C.errors.detailFailed}</p>
          <Button onClick={() => setRetry(retry + 1)}>{C.common.retry}</Button>
        </div>
      ) : !row ? (
        <p>{C.common.missingContent}</p>
      ) : (
        <>
          {row.title && <h3>{row.title}</h3>}
          {row.visibility && (
            <span className="tag">
              {row.visibility === "private"
                ? C.common.private
                : row.visibility === "partner"
                  ? C.common.partner
                  : C.common.shared}
            </span>
          )}
          <p className="pre-wrap">
            {row.content ?? row.description ?? row.daily_prompts?.prompt}
          </p>
          {table === "moods" && row.mood && (
            <p>{C.moods[row.mood as keyof typeof C.moods] ?? row.mood}</p>
          )}
          {(row.date ?? row.created_at) && (
            <DateLabel date={row.date ?? row.created_at} />
          )}
          {table === "daily_sessions" && row.status !== "completed" && (
            <p>{C.daily.wait}</p>
          )}
          {answers.map((answer) => (
            <p key={answer.user_id} className="pre-wrap">
              {answer.content}
            </p>
          ))}
        </>
      )}
      <Button secondary onClick={close}>
        {C.common.back}
      </Button>
    </Modal>
  );
}
