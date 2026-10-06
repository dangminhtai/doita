"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { UserPlus, Heart, Flame, Hourglass } from "@/components/icons";
import { db, rpc, configured } from "@/lib/supabase/browser";
import { boundedFetch } from "@/lib/request";
import { actionErrorMessage } from "@/lib/action-error";
import type { PublicSpaceData } from "./types";
import { SpaceUnavailable } from "./unavailable";
import { SpaceConnection } from "./connection";

type RequestRow = {
  id: string;
  public_id: string;
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "cancelled"
    | "expired"
    | "unavailable";
};
type Viewer = {
  loading: boolean;
  userId: string | null;
  spaceId: string | null;
  request: RequestRow | null;
  error: boolean;
};
function PublicAvatar({
  source,
  fallback,
}: {
  source: string;
  fallback: string;
}) {
  const [failed, setFailed] = useState("");
  return (
    <Image
      unoptimized
      src={failed === source ? fallback : source}
      width={112}
      height={112}
      alt=""
      className="public-person-avatar"
      onError={() => setFailed(source)}
    />
  );
}
export function PublicSpace({
  publicId,
  initial,
  initialError = "",
}: {
  publicId: string;
  initial: PublicSpaceData | null;
  initialError?: string;
}) {
  const [space, setSpace] = useState(initial);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState(initialError);
  const [viewer, setViewer] = useState<Viewer>({
    loading: true,
    userId: null,
    spaceId: null,
    request: null,
    error: false,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const active = useRef(false);
  const revision = useRef(0);
  const viewerRevision = useRef(0);
  const writing = useRef(false);
  const userScope = useRef<string | null>(null);
  const returnPath = `/p/${publicId}`;
  const refresh = useCallback(async () => {
    const version = ++revision.current;
    try {
      const response = await boundedFetch(`/api/spaces/${publicId}`, {
        cache: "no-store",
      });
      if (!active.current || version !== revision.current) return;
      if (response.status === 404) {
        setUnavailable(true);
        setSpace(null);
        setError("");
        return;
      }
      if (!response.ok)
        throw new Error(
          response.status === 429 ? "public_rate" : "public_load",
        );
      const data = (await response.json()) as PublicSpaceData;
      if (!active.current || version !== revision.current) return;
      setSpace(data);
      setUnavailable(false);
      setError("");
    } catch (failure) {
      if (active.current && version === revision.current)
        setError(failure instanceof Error ? failure.message : "public_load");
    }
  }, [publicId]);
  const refreshViewer = useCallback(async () => {
    const version = ++viewerRevision.current;
    try {
      if (!configured()) throw new Error("unconfigured");
      const client = db();
      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      const userId = data.session?.user.id ?? null;
      if (!active.current || version !== viewerRevision.current) return;
      if (userScope.current !== userId) {
        userScope.current = userId;
        setMessage("");
      }
      if (!userId) {
        setViewer({
          loading: false,
          userId: null,
          spaceId: null,
          request: null,
          error: false,
        });
        return;
      }
      const membership = await client
        .from("couple_members")
        .select("couple_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (membership.error) throw membership.error;
      let ownId: string | null = null;
      if (membership.data) {
        const own = await client
          .from("couples")
          .select("public_id")
          .eq("id", membership.data.couple_id)
          .single();
        if (own.error) throw own.error;
        ownId = own.data.public_id;
      }
      const requests = await client.rpc("list_join_requests");
      if (requests.error) throw requests.error;
      const rows = requests.data as RequestRow[];
      const request =
        rows.find((row) => row.status === "pending") ??
        rows.find((row) => row.public_id === publicId) ??
        null;
      if (active.current && version === viewerRevision.current)
        setViewer({
          loading: false,
          userId,
          spaceId: ownId,
          request,
          error: false,
        });
    } catch {
      if (active.current && version === viewerRevision.current)
        setViewer((old) => ({ ...old, loading: false, error: true }));
    }
  }, [publicId]);
  useEffect(() => {
    active.current = true;
    const visible = () => {
      if (document.visibilityState !== "hidden" && !writing.current) {
        void refresh();
        void refreshViewer();
      }
    };
    void refreshViewer();
    const listener = configured()
      ? db().auth.onAuthStateChange((_event, session) => {
          viewerRevision.current++;
          userScope.current = session?.user.id ?? null;
          setViewer({
            loading: true,
            userId: userScope.current,
            spaceId: null,
            request: null,
            error: false,
          });
          setMessage("");
          // Defer SDK reads until the Auth callback has released its lock.
          setTimeout(() => {
            if (active.current) void refreshViewer();
          }, 0);
        })
      : null;
    const timer = setInterval(visible, 15000);
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    return () => {
      active.current = false;
      revision.current++;
      viewerRevision.current++;
      clearInterval(timer);
      listener?.data.subscription.unsubscribe();
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh, refreshViewer]);
  useEffect(() => {
    if (!viewer.userId || !configured()) return;
    const channel = db()
      .channel(`public-space-viewer-${viewer.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couple_join_requests",
          filter: `requester_id=eq.${viewer.userId}`,
        },
        () => {
          void refreshViewer();
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couple_members",
          filter: `user_id=eq.${viewer.userId}`,
        },
        () => {
          void refreshViewer();
          void refresh();
        },
      )
      .subscribe();
    return () => {
      void db().removeChannel(channel);
    };
  }, [viewer.userId, refreshViewer, refresh]);
  const mutate = async (cancel = false) => {
    if (writing.current || viewer.loading || viewer.error) return;
    if (!viewer.userId) {
      location.assign(`/auth?returnTo=${encodeURIComponent(returnPath)}`);
      return;
    }
    writing.current = true;
    setBusy(true);
    setMessage("");
    const owner = viewer.userId;
    try {
      const session = await db().auth.getSession();
      if (
        session.data.session?.user.id !== owner ||
        userScope.current !== owner
      )
        throw new Error("session_expired");
      if (cancel && viewer.request)
        await rpc("cancel_join_request", { p_id: viewer.request.id });
      else {
        const id = await rpc("request_couple", { p_public_id: publicId });
        if (!id) throw new Error("invalid invite");
      }
      if (active.current && userScope.current === owner) {
        setMessage(cancel ? C.couples.cancelled : C.couples.requestSent);
        await refreshViewer();
        await refresh();
      }
    } catch (failure) {
      if (active.current && userScope.current === owner)
        setMessage(actionErrorMessage(failure));
    } finally {
      writing.current = false;
      if (active.current) setBusy(false);
    }
  };
  if (unavailable) return <SpaceUnavailable />;
  const retry = (
    <button
      className="button secondary"
      type="button"
      onClick={() => {
        void refresh();
        void refreshViewer();
      }}
    >
      {C.common.retry}
    </button>
  );
  if (!space)
    return (
      <section className="public-space-unavailable" role="status">
        <h1>
          {error === "public_rate"
            ? C.publicSpace.rate
            : C.publicSpace.loadError}
        </h1>
        {retry}
      </section>
    );
  const pending = viewer.request?.status === "pending";
  const sameRequest = viewer.request?.public_id === publicId;
  const ownSpace = viewer.spaceId !== null;
  return (
    <>
      {error && (
        <div className="public-space-feedback" role="status">
          <p>
            {error === "public_rate"
              ? C.publicSpace.rate
              : C.publicSpace.loadError}
          </p>
          {retry}
        </div>
      )}
      <article
        className={`public-space-card ${space.memberCount === 2 ? "is-couple" : "is-solo"}`}
      >
        <h1 className="sr-only">{C.publicSpace.title}</h1>
        <div className="public-space-people">
          {space.members.map((member, index) => (
            <section className="public-person" key={index}>
              <PublicAvatar
                source={member.avatarUrl}
                fallback={member.fallbackAvatarUrl}
              />
              <h2>{member.displayName || C.home.partner}</h2>
              <p
                className={`public-person-bio ${member.bio.trim() ? "" : "is-empty"}`}
              >
                {member.bio.trim() ? member.bio : C.publicSpace.emptyBio}
              </p>
            </section>
          ))}
          {space.memberCount === 2 && <SpaceConnection />}
        </div>
        {space.coupleStats && (
          <div className="public-space-stats">
            {space.coupleStats.streakDays !== null && (
              <span>
                <Flame size={22} />
                {t(C.publicSpace.streak, {
                  count: space.coupleStats.streakDays,
                })}
              </span>
            )}
            {space.coupleStats.togetherDays !== null && (
              <span>
                <Heart size={22} />
                {t(C.publicSpace.together, {
                  count: space.coupleStats.togetherDays,
                })}
              </span>
            )}
          </div>
        )}
        {space.memberCount === 1 && (
          <div className="public-space-actions">
            {viewer.error ? (
              <div role="status">
                <p>{C.errors.loadFailed}</p>
                <button
                  className="button secondary"
                  onClick={() => void refreshViewer()}
                >
                  {C.common.retry}
                </button>
              </div>
            ) : viewer.loading ? (
              <p role="status">{C.common.loading}</p>
            ) : ownSpace ? (
              <a className="button secondary" href="/couple">
                {viewer.spaceId === publicId
                  ? C.publicSpace.enter
                  : C.publicSpace.own}
              </a>
            ) : space.memberCount === 1 ? (
              pending ? (
                sameRequest ? (
                  <>
                    <p role="status">
                      <Hourglass size={20} />
                      {C.couples.pending}
                    </p>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => void mutate(true)}
                    >
                      {busy ? C.common.processing : C.couples.cancel}
                    </button>
                  </>
                ) : (
                  <>
                    <p role="status">{C.couples.pendingOther}</p>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => void mutate(true)}
                    >
                      {busy ? C.common.processing : C.couples.cancel}
                    </button>
                  </>
                )
              ) : (
                <>
                  {sameRequest &&
                    viewer.request &&
                    ["rejected", "expired", "unavailable"].includes(
                      viewer.request.status,
                    ) && (
                      <p role="status">{C.couples[viewer.request.status]}</p>
                    )}
                  <button
                    className="button"
                    disabled={busy}
                    aria-busy={busy}
                    onClick={() => void mutate()}
                  >
                    <UserPlus size={22} />
                    {busy ? C.common.processing : C.publicSpace.join}
                  </button>
                </>
              )
            ) : null}
            {message && <p role="status">{message}</p>}
          </div>
        )}
      </article>
    </>
  );
}
