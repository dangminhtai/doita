"use client";
import { useEffect, useState } from "react";
import {
  Heart,
  House,
  NotebookPen,
  Ship,
  Camera,
  Sparkles,
  Users,
  Menu,
  X,
} from "lucide-react";
import { CONTENT as C } from "@/config/content.vi";
import { enabled } from "@/config/app.config";
import { AppProvider, useApp } from "./app-context";
import { AuthScreen, PairScreen } from "@/features/auth/screen";
import { HomeScreen, DailyScreen } from "@/features/daily/screen";
import { NotesScreen } from "@/features/notes/screen";
import { PrayerScreen } from "@/features/prayer/screen";
import { MemoriesScreen } from "@/features/memories/screen";
import { ActivitiesScreen } from "@/features/activities/screen";
import {
  SettingsScreen,
  AdminScreen,
  PrivacyScreen,
} from "@/features/settings/screen";
export function CoupleApp({ initialPage = "home" }: { initialPage?: string }) {
  return (
    <AppProvider>
      <Shell initialPage={initialPage} />
    </AppProvider>
  );
}
function Shell({ initialPage }: { initialPage: string }) {
  const [page, setPage] = useState(initialPage),
    [menu, setMenu] = useState(false);
  const { user, data, loading, message, error, recovery, busy, notify } =
    useApp();
  useEffect(() => {
    const pop = () => {
      setPage(location.pathname.slice(1) || "home");
      setMenu(false);
      notify("");
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [notify]);
  const go = (next: string) => {
    if (next === page) {
      setMenu(false);
      return;
    }
    if (
      !window.dispatchEvent(
        new Event("couple-before-navigate", { cancelable: true }),
      )
    )
      return;
    setPage(next);
    setMenu(false);
    notify("");
    history.pushState(null, "", `/${next}`);
    window.scrollTo({ top: 0 });
  };
  const nav = [
    { id: "home", icon: House, flag: true },
    { id: "notes", icon: NotebookPen, flag: enabled("notes") },
    { id: "prayer", icon: Ship, flag: enabled("prayer") },
    { id: "memories", icon: Camera, flag: enabled("memories") },
    { id: "activities", icon: Sparkles, flag: enabled("activities") },
    { id: "settings", icon: Users, flag: true },
  ].filter((x) => x.flag);
  const content =
    page === "privacy" ? (
      <PrivacyScreen />
    ) : !user || recovery ? (
      <AuthScreen />
    ) : loading && !data.couple ? (
      <p className="empty">{C.common.loading}</p>
    ) : !data.couple ? (
      <PairScreen />
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
    ) : page === "admin" ? (
      <AdminScreen />
    ) : (
      <HomeScreen go={go} />
    );
  return (
    <div className="app">
      <header className="topbar">
        <a
          className="brand"
          href="/home"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <Heart size={23} fill="currentColor" />
          <span>{C.brand.name}</span>
        </a>
        <p>{C.brand.tagline}</p>
        <button
          className="icon-button mobile-menu"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? C.common.close : C.nav.settings}
        >
          {menu ? <X /> : <Menu />}
        </button>
        {user && data.couple && (
          <button
            className="avatar desktop-profile"
            onClick={() => go("settings")}
            aria-label={C.nav.settings}
          >
            {(
              data.profiles.find((p) => p.id === user.id)?.display_name ||
              C.home.you
            ).slice(0, 1)}
          </button>
        )}
      </header>
      <div className="app-body">
        {user && data.couple && (
          <aside className={menu ? "sidebar open" : "sidebar"}>
            <p className="eyebrow">{C.home.eyebrow}</p>
            <nav>
              {nav.map(({ id, icon: Icon }) => (
                <a
                  key={id}
                  href={`/${id}`}
                  aria-current={page === id ? "page" : undefined}
                  className={page === id ? "active" : ""}
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
            <button className="text-button" onClick={() => go("privacy")}>
              {C.nav.privacy}
            </button>
          </aside>
        )}
        <main className="main" aria-busy={busy}>
          {message && (
            <div
              role={error ? "alert" : "status"}
              aria-live="polite"
              className={`toast ${error ? "error" : ""}`}
            >
              {message}
              <button
                className="text-button"
                onClick={() => notify("")}
                aria-label={C.common.close}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {content}
        </main>
      </div>
      {user && data.couple && (
        <nav className="bottom-nav">
          {nav.slice(0, 4).map(({ id, icon: Icon }) => (
            <a
              key={id}
              href={`/${id}`}
              aria-label={C.nav[id as keyof typeof C.nav]}
              aria-current={page === id ? "page" : undefined}
              className={page === id ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                go(id);
              }}
            >
              <Icon size={21} />
              <span>{C.nav[id as keyof typeof C.nav]}</span>
            </a>
          ))}
          <a
            href="/settings"
            className={page === "settings" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              go("settings");
            }}
          >
            <Users size={21} />
            <span>{C.nav.settings}</span>
          </a>
        </nav>
      )}
    </div>
  );
}
