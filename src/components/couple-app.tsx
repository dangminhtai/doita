"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  House,
  NotebookPen,
  Ship,
  Camera,
  Sparkles,
  Users,
  Menu,
  X,
  CircleCheck,
  CircleAlert,
} from "@/components/icons";
import { CONTENT as C } from "@/config/content.vi";
import { enabled } from "@/config/app.config";
import { AppProvider, useApp } from "./app-context";
import { AuthScreen, PairScreen } from "@/features/auth/screen";
import { HomeScreen, DailyScreen } from "@/features/daily/screen";
import { NotesScreen } from "@/features/notes/screen";
import { PrayerScreen } from "@/features/prayer/screen";
import { MemoriesScreen } from "@/features/memories/screen";
import { ActivitiesScreen } from "@/features/activities/screen";
import { SettingsScreen } from "@/features/settings/screen";
import { NotificationBell } from "./notification-bell";
import { DefaultAvatar, ThemeArt } from "./theme-art";
import { LinkedContent } from "./linked-content";
import { ConfirmationProvider } from "./confirmation";
export function CoupleApp({ initialPage = "home" }: { initialPage?: string }) {
  return (
    <AppProvider>
      <ConfirmationProvider>
        <Shell initialPage={initialPage} />
      </ConfirmationProvider>
    </AppProvider>
  );
}
function Shell({ initialPage }: { initialPage: string }) {
  const [page, setPage] = useState(initialPage),
    [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const restoreScroll = useRef<number | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () =>
      document.documentElement.classList.toggle(
        "keyboard-open",
        !!viewport && window.innerHeight - viewport.height > 150,
      );
    const visibility = () =>
      document.documentElement.classList.toggle(
        "page-hidden",
        document.visibilityState !== "visible",
      );
    document.addEventListener("visibilitychange", visibility);
    viewport?.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      document.documentElement.classList.remove("page-hidden");
      viewport?.removeEventListener("resize", resize);
      document.documentElement.classList.remove("keyboard-open");
    };
  }, []);
  useEffect(() => {
    if (!menu) return;
    const focusable = () => [
      ...(sidebar.current?.querySelectorAll<HTMLElement>("a,button") ?? []),
    ];
    focusable()[0]?.focus({ preventScroll: true });
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        e.preventDefault();
      }
      if (e.key === "Tab") {
        const nodes = focusable();
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keydown", keydown);
      menuButton.current?.focus({ preventScroll: true });
    };
  }, [menu]);
  const {
    user,
    data,
    loading,
    loadError,
    load,
    message,
    error,
    recovery,
    notify,
  } = useApp();
  const scrollKey = useCallback(
    (path = location.pathname + location.search) =>
      `couple-view:${user?.id}:${data.couple?.id}:scroll:${path}`,
    [user?.id, data.couple?.id],
  );
  const savedScroll = useCallback(() => {
    try {
      return (
        Number(sessionStorage.getItem(scrollKey())) ||
        history.state?.doitaScroll ||
        0
      );
    } catch {
      return history.state?.doitaScroll ?? 0;
    }
  }, [scrollKey]);
  useEffect(() => {
    const pop = () => {
      restoreScroll.current = savedScroll();
      setPage(location.pathname.slice(1) || "home");
      setMenu(false);
      notify("");
    };
    window.addEventListener("popstate", pop);
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    const storeScroll = () => {
      if (restoreScroll.current !== null) return;
      history.replaceState(
        { ...history.state, doitaScroll: window.scrollY },
        "",
      );
    };
    window.addEventListener("scroll", storeScroll, { passive: true });
    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("scroll", storeScroll);
      history.scrollRestoration = previous;
    };
  }, [notify, savedScroll]);
  useEffect(() => {
    if (loading) return;
    if (restoreScroll.current === null && savedScroll() > 0)
      restoreScroll.current = savedScroll();
    if (restoreScroll.current === null) return;
    const position = restoreScroll.current;
    const restore = (ready = false) => {
      window.scrollTo({ top: position });
      if (
        ready ||
        document.documentElement.scrollHeight - innerHeight >= position
      )
        restoreScroll.current = null;
    };
    const ready = () => {
      if (restoreScroll.current !== null) restore(true);
    };
    window.addEventListener("couple-list-ready", ready);
    const timer = requestAnimationFrame(() => restore());
    return () => {
      cancelAnimationFrame(timer);
      window.removeEventListener("couple-list-ready", ready);
    };
  }, [page, loading, savedScroll]);
  const go = (next: string) => {
    const destination = new URL(`/${next}`, location.origin);
    const nextPage = destination.pathname.slice(1);
    if (
      destination.pathname + destination.search ===
      location.pathname + location.search
    ) {
      setMenu(false);
      return;
    }
    const navigate = () => {
      history.replaceState(
        { ...history.state, doitaScroll: window.scrollY },
        "",
      );
      try {
        sessionStorage.setItem(scrollKey(), String(window.scrollY));
      } catch {}
      setPage(nextPage);
      setMenu(false);
      notify("");
      history.pushState(
        { doitaScroll: nextPage === page ? window.scrollY : 0 },
        "",
        destination.pathname + destination.search,
      );
      window.dispatchEvent(new Event("couple-location-change"));
      if (nextPage !== page) window.scrollTo({ top: 0 });
    };
    if (
      !window.dispatchEvent(
        new CustomEvent("couple-before-navigate", {
          cancelable: true,
          detail: { resume: navigate },
        }),
      )
    )
      return;
    navigate();
  };
  const nav = [
    { id: "home", icon: House, flag: true },
    { id: "notes", icon: NotebookPen, flag: enabled("notes") },
    { id: "prayer", icon: Ship, flag: enabled("prayer") },
    { id: "memories", icon: Camera, flag: enabled("memories") },
    { id: "activities", icon: Sparkles, flag: enabled("activities") },
    { id: "settings", icon: Users, flag: true },
  ].filter((x) => x.flag);
  const pageTables: Record<string, string[]> = {
    home: [
      "daily_sessions",
      "daily_answers",
      "streaks",
      "moods",
      "special_dates",
      "memories",
    ],
    daily: [
      "daily_sessions",
      "daily_answers",
      "daily_feedback",
      "streaks",
      "streak_events",
    ],
    notes: ["notes", "note_items"],
    prayer: ["prayers", "prayer_events"],
    memories: ["memories"],
    activities: ["activities", "activity_sessions"],
    settings: ["profiles", "couple_members", "special_dates"],
  };
  const pageError = (pageTables[page] ?? [])
    .map((t) => data.errors[t])
    .find(Boolean);
  const content =
    !user || recovery ? (
      <AuthScreen />
    ) : loading && !data.couple ? (
      <p className="empty">{C.common.loading}</p>
    ) : loadError ? (
      <div role="alert">
        <p>{C.errors.loadFailed}</p>
        <button onClick={() => void load()}>{C.common.retry}</button>
      </div>
    ) : !data.couple ? (
      <PairScreen />
    ) : pageError ? (
      <div role="alert">
        <p>{pageError}</p>
        <button onClick={() => void load()}>{C.common.retry}</button>
      </div>
    ) : page === "daily" && enabled("daily") ? (
      <DailyScreen />
    ) : page === "notes" && enabled("notes") ? (
      <NotesScreen />
    ) : page === "prayer" && enabled("prayer") ? (
      <PrayerScreen />
    ) : page === "memories" && enabled("memories") ? (
      <MemoriesScreen />
    ) : page === "activities" && enabled("activities") ? (
      <ActivitiesScreen />
    ) : page === "settings" ? (
      <SettingsScreen go={go} />
    ) : (
      <HomeScreen go={go} />
    );
  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        {C.redesign.skipContent}
      </a>
      <header className="topbar">
        <a
          className="brand"
          href="/home"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <ThemeArt asset="heart" size={36} />
          <span>{C.brand.name}</span>
        </a>
        {user && data.couple && !recovery && (
          <nav className="desktop-nav" aria-label={C.common.openMenu}>
            {nav
              .filter((x) => x.id !== "settings")
              .map(({ id, icon: Icon }) => (
                <a
                  key={id}
                  href={`/${id}`}
                  className={
                    page === id || (page === "daily" && id === "home")
                      ? "active"
                      : ""
                  }
                  aria-current={
                    page === id || (page === "daily" && id === "home")
                      ? "page"
                      : undefined
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    go(id);
                  }}
                >
                  <Icon size={19} />
                  <span>{C.nav[id as keyof typeof C.nav]}</span>
                </a>
              ))}
          </nav>
        )}

        {user && data.couple && enabled("notifications") && !recovery && (
          <NotificationBell key={`${user.id}:${data.couple.id}`} go={go} />
        )}
        {user && data.couple && (
          <button
            ref={menuButton}
            className="icon-button mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? C.common.close : C.common.openMenu}
            aria-expanded={menu}
            aria-controls="couple-sidebar"
          >
            {menu ? <X /> : <Menu />}
          </button>
        )}
        {user && data.couple && (
          <button
            className="avatar desktop-profile"
            onClick={() => go("settings")}
            aria-label={C.nav.settings}
          >
            <DefaultAvatar
              index={Math.max(
                0,
                data.members.findIndex((m) => m.user_id === user.id),
              )}
            />
          </button>
        )}
      </header>
      <div className="app-body">
        {user && data.couple && (
          <aside
            ref={sidebar}
            id="couple-sidebar"
            className={menu ? "sidebar open" : "sidebar"}
          >
            {menu && (
              <button className="text-button" onClick={() => setMenu(false)}>
                {C.common.close}
              </button>
            )}
            <p>
              <small>{C.home.eyebrow}</small>
            </p>
            <nav>
              {nav.map(({ id, icon: Icon }) => (
                <a
                  key={id}
                  href={`/${id}`}
                  aria-current={
                    page === id || (page === "daily" && id === "home")
                      ? "page"
                      : undefined
                  }
                  className={
                    page === id || (page === "daily" && id === "home")
                      ? "active"
                      : ""
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    go(id);
                  }}
                >
                  <Icon size={20} />
                  {C.nav[id as keyof typeof C.nav]}
                </a>
              ))}
            </nav>
          </aside>
        )}
        <main id="main-content" className={`main page-${page}`} inert={menu}>
          {message && (
            <div
              role={error ? "alert" : "status"}
              aria-live="polite"
              className={`toast ${error ? "error" : ""}`}
            >
              {error ? (
                <CircleAlert size={22} aria-hidden="true" />
              ) : (
                <CircleCheck size={22} aria-hidden="true" />
              )}
              <p>{message}</p>
              <button
                className="text-button"
                onClick={() => notify("")}
                aria-label={C.common.close}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="page-controls">{content}</div>
          {user && data.couple && !recovery && !pageError && (
            <LinkedContent
              key={page}
              table={
                page === "daily"
                  ? "daily_sessions"
                  : page === "prayer"
                    ? "prayers"
                    : page === "notes"
                      ? "notes"
                      : page === "activities"
                        ? "activities"
                        : page === "settings"
                          ? "special_dates"
                          : page === "home"
                            ? "moods"
                            : "memories"
              }
            />
          )}
        </main>
      </div>
      {user && data.couple && (
        <nav className="bottom-nav" inert={menu}>
          {nav
            .filter((x) => x.id !== "activities")
            .map(({ id, icon: Icon }) => (
              <a
                key={id}
                href={`/${id}`}
                aria-label={C.nav[id as keyof typeof C.nav]}
                aria-current={
                  page === id || (page === "daily" && id === "home")
                    ? "page"
                    : undefined
                }
                className={
                  page === id || (page === "daily" && id === "home")
                    ? "active"
                    : ""
                }
                onClick={(e) => {
                  e.preventDefault();
                  go(id);
                }}
              >
                <Icon size={21} />
                <span>{C.nav[id as keyof typeof C.nav]}</span>
              </a>
            ))}
        </nav>
      )}
    </div>
  );
}
