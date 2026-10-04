"use client";
import { useState } from "react";
import { Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { useApp } from "@/components/app-context";
import { Button, Field, PageTitle } from "@/components/ui";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { rpc } from "@/lib/supabase/browser";
import { recommend, type Activity } from "./recommend";
export function ActivitiesScreen() {
  const { data: d, run } = useApp();
  const [time, setTime] = useState(15),
    [energy, setEnergy] = useState("low"),
    [preference, setPreference] = useState("random"),
    [chosen, setChosen] = useState<Activity | null>(null),
    [seen, setSeen] = useState<string[]>([]),
    [attempted, setAttempted] = useState(false);
  function choose() {
    setAttempted(true);
    const pool = recommend(
      d.activities as Activity[],
      time,
      energy,
      preference,
      [...d.activityHistory.map((x) => x.activity_id), ...seen],
    );
    const next = pool[Math.floor(Math.random() * pool.length)] ?? null;
    setChosen(next);
    if (next) setSeen([...seen, next.id]);
  }
  return (
    <>
      <PageTitle title={C.activities.title} subtitle={C.activities.subtitle} />
      <section className="activity-controls">
        <Field label={C.activities.time}>
          <select
            value={time}
            onChange={(e) => {
              setTime(Number(e.target.value));
              setChosen(null);
            }}
          >
            {[5, 15, 30, 60].map((n) => (
              <option key={n} value={n}>
                {t(C.activities.minutes, { count: n })}
              </option>
            ))}
          </select>
        </Field>
        <Field label={C.activities.energy}>
          <select
            value={energy}
            onChange={(e) => {
              setEnergy(e.target.value);
              setChosen(null);
            }}
          >
            {(["low", "normal", "high"] as const).map((x) => (
              <option key={x} value={x}>
                {C.activities[x]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={C.activities.preference}>
          <select
            value={preference}
            onChange={(e) => {
              setPreference(e.target.value);
              setChosen(null);
            }}
          >
            {(
              ["random", "chat", "play", "watch", "romantic", "future"] as const
            ).map((x) => (
              <option key={x} value={x}>
                {C.activities[x]}
              </option>
            ))}
          </select>
        </Field>
        <Button onClick={choose}>
          <Sparkles size={18} />
          {C.activities.choose}
        </Button>
      </section>
      {chosen ? (
        <article className="activity-result">
          <Sparkles size={36} />
          <span className="tag">
            {t(C.activities.minutes, { count: chosen.duration })}
          </span>
          <h2>{chosen.title}</h2>
          <p>{chosen.description}</p>
          <div className="row">
            <Button
              onClick={() =>
                void run(() =>
                  rpc("log_activity", { p_activity: chosen.id, p_rating: 0 }),
                )
              }
            >
              {C.activities.complete}
            </Button>
            <Button secondary onClick={choose}>
              {C.activities.reroll}
            </Button>
          </div>
          <div className="row">
            <button
              className="text-button"
              onClick={() =>
                void run(() =>
                  rpc("log_activity", { p_activity: chosen.id, p_rating: 1 }),
                )
              }
            >
              <ThumbsUp size={18} />
              {C.activities.like}
            </button>
            <button
              className="text-button"
              onClick={() =>
                void run(() =>
                  rpc("log_activity", { p_activity: chosen.id, p_rating: -1 }),
                )
              }
            >
              <ThumbsDown size={18} />
              {C.activities.dislike}
            </button>
          </div>
        </article>
      ) : (
        <div className="activity-placeholder">
          <Sparkles size={54} />
          <p>{attempted ? C.activities.none : C.activities.subtitle}</p>
        </div>
      )}
    </>
  );
}
