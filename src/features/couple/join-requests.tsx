"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/app-context";
import { useConfirmation } from "@/components/confirmation";
import { Button } from "@/components/ui";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { actionErrorMessage } from "@/lib/action-error";
import { db, rpc } from "@/lib/supabase/browser";

type JoinRequest = {
  id: string;
  public_id: string;
  requester_id: string;
  display_name: string;
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "cancelled"
    | "expired"
    | "unavailable";
};

export function JoinRequests({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user, data, run, load } = useApp();
  const ask = useConfirmation();
  const [items, setItems] = useState<JoinRequest[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const active = useRef(false);
  const revision = useRef(0);
  const inFlight = useRef(false);
  const refreshedAccepts = useRef(new Set<string>());
  const userId = user?.id;
  const coupleId = data.couple?.id as string | undefined;
  const refresh = useCallback(async () => {
    if (!userId) return;
    const version = ++revision.current;
    try {
      const rows = (await rpc("list_join_requests")) as JoinRequest[];
      if (!active.current || version !== revision.current) return;
      setItems(
        coupleId
          ? rows.filter(
              (row) => row.status === "pending" && row.requester_id !== userId,
            )
          : rows.slice(0, 1),
      );
      setError("");
      const accepted = rows[0];
      if (
        !coupleId &&
        accepted?.status === "accepted" &&
        !refreshedAccepts.current.has(accepted.id)
      ) {
        const loaded = await load();
        if (loaded && active.current && version === revision.current)
          refreshedAccepts.current.add(accepted.id);
      }
    } catch (failure) {
      if (active.current && version === revision.current)
        setError(actionErrorMessage(failure));
    } finally {
      if (active.current && version === revision.current) setLoading(false);
    }
  }, [userId, coupleId, load]);

  useEffect(() => {
    active.current = true;
    setItems([]);
    setLoading(true);
    refreshedAccepts.current.clear();
    const visibleRefresh = () => {
      if (document.visibilityState !== "hidden" && !inFlight.current)
        void refresh();
    };
    visibleRefresh();
    const channel = db()
      .channel(`join-requests-${userId}-${coupleId ?? "unpaired"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couple_join_requests",
          filter: coupleId
            ? `couple_id=eq.${coupleId}`
            : `requester_id=eq.${userId}`,
        },
        visibleRefresh,
      )
      .subscribe();
    // Visible-tab fallback also catches an approval missed while offline.
    const timer = setInterval(visibleRefresh, 15000);
    window.addEventListener("focus", visibleRefresh);
    document.addEventListener("visibilitychange", visibleRefresh);
    return () => {
      active.current = false;
      revision.current++;
      clearInterval(timer);
      window.removeEventListener("focus", visibleRefresh);
      document.removeEventListener("visibilitychange", visibleRefresh);
      void db().removeChannel(channel);
    };
  }, [userId, coupleId, refresh]);
  useEffect(() => {
    if (refreshKey) void refresh();
  }, [refreshKey, refresh]);

  const decide = async (row: JoinRequest, accept: boolean | null) => {
    if (inFlight.current) return;
    inFlight.current = true;
    const scopeRevision = revision.current;
    try {
      if (
        accept !== null &&
        !(await ask(
          t(accept ? C.couples.confirmJoin : C.couples.confirmReject, {
            name: row.display_name || C.home.partner,
          }),
          { action: accept ? C.couples.accept : C.couples.reject },
        ))
      )
        return;
      if (!active.current || scopeRevision !== revision.current) return;
      setActing(row.id);
      await run(async () => {
        if (accept === null) await rpc("cancel_join_request", { p_id: row.id });
        else {
          const accepted = await rpc("review_join_request", {
            p_id: row.id,
            p_accept: accept,
          });
          if (accept && !accepted) {
            await refresh();
            throw new Error("invalid invite");
          }
        }
        await refresh();
      });
    } finally {
      inFlight.current = false;
      if (active.current) setActing(null);
    }
  };
  if (loading) return <p role="status">{C.common.loading}</p>;
  if (error)
    return (
      <div role="status">
        <p>{error}</p>
        <Button secondary onClick={() => void refresh()}>
          {C.common.retry}
        </Button>
      </div>
    );
  if (!items.length) return null;
  return (
    <section className="join-requests" aria-label={C.couples.requests}>
      <h3>{C.couples.requests}</h3>
      {items.map((row) => (
        <div key={row.id} className="join-request">
          <p>
            {coupleId ? (
              row.display_name || C.home.partner
            ) : (
              <code>{row.public_id}</code>
            )}
          </p>
          <p role="status">{C.couples[row.status]}</p>
          {row.status === "pending" && (
            <div className="row">
              {coupleId ? (
                <>
                  <Button
                    disabled={!!acting}
                    onClick={() => void decide(row, true)}
                  >
                    {C.couples.accept}
                  </Button>
                  <Button
                    secondary
                    disabled={!!acting}
                    onClick={() => void decide(row, false)}
                  >
                    {C.couples.reject}
                  </Button>
                </>
              ) : (
                <Button
                  secondary
                  disabled={!!acting}
                  onClick={() => void decide(row, null)}
                >
                  {C.couples.cancel}
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
