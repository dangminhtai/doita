"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Volume2, VolumeX } from "lucide-react";
import { ThemeArt } from "./theme-art";
import { CONTENT as C } from "@/config/content.vi";
import { db, rpc } from "@/lib/supabase/browser";
import { notificationSound } from "@/lib/notifications/sound";
import { useApp, type Row } from "./app-context";
import { Modal, DateLabel, Button } from "./ui";

export function NotificationBell({ go }: { go: (page: string) => void }) {
  const { user, data } = useApp();
  const userId = user!.id;
  const coupleId = data.couple!.id as string;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [marking, setMarking] = useState(false);
  const [limit, setLimit] = useState(50);
  const [announcement, setAnnouncement] = useState("");
  const active = useRef(false);
  const sequence = useRef(0);
  const initialized = useRef(false);
  const seen = useRef(new Set<string>());
  const sessionStarted = useRef(0);
  const sound = useRef<ReturnType<typeof notificationSound> | null>(null);
  const enabled = useRef(true);
  const button = useRef<HTMLButtonElement>(null);
  const preferenceKey = `couple-notification-sound:${userId}`;

  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    try {
      const database = db();
      const [list, count] = await Promise.all([
        database
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .eq("couple_id", coupleId)
          .order("created_at", { ascending: false })
          .limit(limit),
        database
          .from("notifications")
          .select("id", { head: true, count: "exact" })
          .eq("user_id", userId)
          .eq("couple_id", coupleId)
          .is("read_at", null),
      ]);
      if (!active.current || request !== sequence.current) return;
      if (list.error) throw list.error;
      if (count.error) throw count.error;
      const rows = list.data ?? [];
      const fresh =
        initialized.current &&
        rows.some(
          (n) =>
            !seen.current.has(n.id) &&
            !n.read_at &&
            n.actor_id !== userId &&
            Date.parse(n.created_at) >= sessionStarted.current,
        );
      for (const row of rows) seen.current.add(row.id);
      initialized.current = true;
      setItems(rows);
      setUnread(count.count ?? 0);
      setError(false);
      if (fresh) {
        setAnnouncement(
          `${C.notifications.new} ${count.count ?? 0} ${C.notifications.unread.toLowerCase()}.`,
        );
        if (enabled.current) void sound.current?.play();
      }
    } catch (failure) {
      if (!active.current || request !== sequence.current) return;
      console.error("Load notifications", failure);
      setError(true);
    } finally {
      if (active.current && request === sequence.current) setLoading(false);
    }
  }, [userId, coupleId, limit]);

  useEffect(() => {
    active.current = true;
    sessionStarted.current = Date.now();
    sound.current = notificationSound();
    try {
      enabled.current = localStorage.getItem(preferenceKey) !== "off";
    } catch {}
    setSoundEnabled(enabled.current);
    const unlock = () => {
      if (enabled.current) void sound.current?.unlock().catch(() => {});
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      active.current = false;
      sequence.current++;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      sound.current?.dispose();
      sound.current = null;
    };
  }, [preferenceKey]);

  useEffect(() => {
    void refresh();
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const channel = db()
      .channel(`notifications-${userId}-${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          clearTimeout(debounce);
          debounce = setTimeout(() => void refresh(), 100);
        },
      )
      .subscribe();
    const focus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(focus, 30000);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      clearTimeout(debounce);
      clearInterval(timer);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
      void db().removeChannel(channel);
    };
  }, [refresh, userId, coupleId]);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  const markRead = async (item?: Row) => {
    if (marking || !items.length) return false;
    setMarking(true);
    try {
      await rpc(
        "mark_notifications_read",
        item ? { p_ids: [item.id] } : { p_before: items[0].created_at },
      );
      if (!active.current) return false;
      await refresh();
      return true;
    } catch (failure) {
      if (active.current) setError(true);
      console.error("Read notifications", failure);
      return false;
    } finally {
      if (active.current) setMarking(false);
    }
  };
  const toggleSound = () => {
    const next = !enabled.current;
    enabled.current = next;
    setSoundEnabled(next);
    try {
      localStorage.setItem(preferenceKey, next ? "on" : "off");
    } catch {}
    if (next)
      void sound.current
        ?.unlock()
        .then(() => sound.current?.play())
        .catch(() => {});
  };
  return (
    <>
      <button
        ref={button}
        className="icon-button notification-bell"
        aria-label={
          unread
            ? `${C.notifications.inbox}, ${unread} ${C.notifications.unread.toLowerCase()}`
            : C.notifications.inbox
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen(true);
          void refresh();
        }}
      >
        <Bell size={23} />
        {unread > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
        {error && <span className="notification-dot" aria-hidden="true" />}
      </button>
      <span className="sr-only" role="status">
        {announcement}
      </span>
      {open && (
        <Modal title={C.notifications.inbox} onClose={close}>
          <div className="notification-tools">
            <button
              className="text-button"
              onClick={toggleSound}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              {soundEnabled
                ? C.notifications.soundOn
                : C.notifications.soundOff}
            </button>
            {unread > 0 && (
              <button
                className="text-button"
                disabled={marking || error}
                onClick={() => void markRead()}
              >
                {C.notifications.markRead}
              </button>
            )}
          </div>
          {error && (
            <div role="alert">
              <p>{C.notifications.loadError}</p>
              <Button secondary onClick={() => void refresh()}>
                {C.common.retry}
              </Button>
            </div>
          )}
          {loading ? (
            <p>{C.common.loading}</p>
          ) : !error && !items.length ? (
            <div className="empty notification-empty">
              <ThemeArt asset="emptyNotifications" size={120} />
              <p>{C.notifications.empty}</p>
            </div>
          ) : (
            <ul className="notification-list">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    className={`notification-item${item.read_at ? "" : " unread"}`}
                    disabled={marking}
                    onClick={async () => {
                      const destination = new URL(
                        String(item.url),
                        location.origin,
                      );
                      const path = destination.pathname.slice(1);
                      if (destination.origin !== location.origin) return;
                      if (
                        ![
                          "home",
                          "daily",
                          "notes",
                          "prayer",
                          "memories",
                          "activities",
                          "settings",
                        ].includes(path)
                      )
                        return;
                      if (!item.read_at && !(await markRead(item))) return;
                      if (!active.current) return;
                      close();
                      go(path + destination.search);
                    }}
                  >
                    <span>
                      {C.notifications[
                        item.kind as keyof typeof C.notifications
                      ] ?? C.notifications.reminder}
                    </span>
                    <small>
                      <DateLabel date={item.created_at} />
                      {!item.read_at && ` · ${C.notifications.unread}`}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {items.length === limit && (
            <Button secondary onClick={() => setLimit(limit + 50)}>
              {C.common.more}
            </Button>
          )}
        </Modal>
      )}
    </>
  );
}
