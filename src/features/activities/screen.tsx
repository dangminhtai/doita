"use client";
import { useState } from "react";
import { Sparkles, ThumbsUp, ThumbsDown } from "@/components/icons";
import { useApp } from "@/components/app-context";
import { Select, Button, Field, PageTitle, ActionScope } from "@/components/ui";
import { ThemeArt } from "@/components/theme-art";
import { useViewState } from "@/components/view-state";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { rpc } from "@/lib/supabase/browser";
import { recommend, type Activity } from "./recommend";
export function ActivitiesScreen() {
  const { data: d, run, user } = useApp();
  const [timeValue, setTimeValue] = useViewState("activities-time", "15");
  const time = Number(timeValue),
    setTime = (n: number) => setTimeValue(String(n));
  const [energy, setEnergy] = useViewState("activities-energy", "low");
  const [preference, setPreference] = useViewState(
    "activities-preference",
    "random",
  );
  const [chosen, setChosen] = useState<Activity | null>(null),
    [seen, setSeen] = useState<string[]>([]),
    [attempted, setAttempted] = useState(false);
  const rating = d.activityHistory.find(
    (x) => x.activity_id === chosen?.id && x.user_id === user?.id,
  )?.rating;
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
      <PageTitle title={C.activities.title} />
      <details className="activity-filters">
        <summary>{C.redesign.filterMood}</summary>
        <section className="activity-controls">
          <Field label={C.activities.time}>
            <Select
              value={time}
              onValueChange={(e) => {
                setTime(Number(e));
                setChosen(null);
              }}
            >
              {[5, 15, 30, 60].map((n) => (
                <option key={n} value={n}>
                  {t(C.activities.minutes, { count: n })}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={C.activities.energy}>
            <Select
              value={energy}
              onValueChange={(e) => {
                setEnergy(e);
                setChosen(null);
              }}
            >
              {(["low", "normal", "high"] as const).map((x) => (
                <option key={x} value={x}>
                  {C.activities[x]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={C.activities.preference}>
            <Select
              value={preference}
              onValueChange={(e) => {
                setPreference(e);
                setChosen(null);
              }}
            >
              {(
                [
                  "random",
                  "chat",
                  "play",
                  "watch",
                  "romantic",
                  "future",
                ] as const
              ).map((x) => (
                <option key={x} value={x}>
                  {C.activities[x]}
                </option>
              ))}
            </Select>
          </Field>
        </section>
      </details>
      {!chosen && (
        <Button onClick={choose}>
          <Sparkles size={18} />
          {C.activities.choose}
        </Button>
      )}
      {chosen ? (
        <ActionScope scope={`activity:${chosen.id}`}>
          <article className="activity-result" key={chosen.id}>
            <ThemeArt asset="mascots" size={180} />
            <span className="tag">
              {t(C.activities.minutes, { count: chosen.duration })}
            </span>
            <h2>{chosen.title}</h2>
            <p>{chosen.description}</p>
            <div className="row">
              <Button
                disabled={d.activityHistory.some(
                  (x) =>
                    x.activity_id === chosen.id &&
                    x.user_id === user?.id &&
                    x.rating === 0,
                )}
                onClick={() =>
                  void run(() =>
                    rpc("log_activity", { p_activity: chosen.id, p_rating: 0 }),
                  )
                }
              >
                {d.activityHistory.some(
                  (x) =>
                    x.activity_id === chosen.id &&
                    x.user_id === user?.id &&
                    x.rating === 0,
                )
                  ? C.redesign.alreadyDone
                  : C.activities.complete}
              </Button>
              <Button secondary onClick={choose}>
                {C.activities.reroll}
              </Button>
            </div>
            <div className="row">
              <button
                className="text-button"
                aria-pressed={rating === 1}
                onClick={() =>
                  void run(
                    () =>
                      rpc("log_activity", {
                        p_activity: chosen.id,
                        p_rating: 1,
                      }),
                    C.activities.liked,
                  )
                }
              >
                <ThumbsUp size={18} />
                {C.activities.like}
              </button>
              <button
                className="text-button"
                aria-pressed={rating === -1}
                onClick={() =>
                  void run(
                    () =>
                      rpc("log_activity", {
                        p_activity: chosen.id,
                        p_rating: -1,
                      }),
                    C.activities.disliked,
                  )
                }
              >
                <ThumbsDown size={18} />
                {C.activities.dislike}
              </button>
            </div>
          </article>
        </ActionScope>
      ) : (
        <div className="activity-placeholder">
          <ThemeArt asset="mascots" size={200} />
          <h2>{attempted ? C.activities.none : C.redesign.activityStart}</h2>
          {attempted && (
            <Button
              secondary
              onClick={() => {
                setTime(60);
                setEnergy("high");
                setPreference("random");
                setSeen([]);
                setAttempted(false);
              }}
            >
              {C.redesign.relaxFilters}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
