"use client";
import { useState } from "react";
import {
  Flame,
  Heart,
  Ship,
  NotebookPen,
  Sparkles,
  Check,
  Sun,
  Moon,
  CloudRain,
  Wind,
  Leaf,
  Hourglass,
} from "lucide-react";
import { useApp, flushNotifications } from "@/components/app-context";
import { Button, Field, PageTitle, useDraft, DateLabel } from "@/components/ui";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { enabled } from "@/config/app.config";
import { rpc } from "@/lib/supabase/browser";
import { localDate, dayGap, canRepair } from "@/lib/date";
import { dailySchema } from "@/features/schemas";
export function HomeScreen({ go }: { go: (p: string) => void }) {
  const { data: d, user, run } = useApp();
  const today = localDate(new Date(), d.couple?.timezone);
  const st = d.streak;
  const gap = st?.last_completed_date
    ? dayGap(today, st.last_completed_date)
    : 999;
  const streak = gap <= 2 ? (st?.current_streak ?? 0) : 0;
  const names = d.members.map(
    (m) =>
      d.profiles.find((p) => p.id === m.user_id)?.display_name ||
      C.home.partner,
  );
  return (
    <>
      <PageTitle title={C.home.greeting} subtitle={names.join(" & ")} />
      <section className="home-grid">
        <div className="daily-card">
          <span className="eyebrow">{C.nav.daily}</span>
          <h2>{C.home.daily}</h2>
          <p>{C.home.dailyDesc}</p>
          <div className="daily-prompt">
            {d.daily?.daily_prompts?.prompt ?? d.daily?.prompt}
          </div>
          {enabled("daily") && (
            <Button onClick={() => go("daily")}>
              {d.daily?.status === "completed"
                ? C.home.completed
                : C.home.write}
            </Button>
          )}
          <small>{C.home.pending}</small>
        </div>
        {enabled("streak") && (
          <div className="streak-card">
            <Flame size={36} />
            <strong>{streak}</strong>
            <span>{t(C.home.streak, { count: streak })}</span>
            <small>
              {t(C.home.longest, { count: st?.longest_streak ?? 0 })}
            </small>
            <p>{C.home.noPressure}</p>
            {canRepair(
              st?.last_completed_date ?? null,
              today,
              st?.repair_tokens ?? 0,
            ) && (
              <Button
                secondary
                onClick={() => void run(() => rpc("repair_streak"))}
              >
                {C.home.repair}
              </Button>
            )}
          </div>
        )}
      </section>
      <section className="quick-grid">
        {enabled("notes") && (
          <button className="quick-card" onClick={() => go("notes")}>
            <NotebookPen />
            <span>{C.notes.new}</span>
          </button>
        )}
        {enabled("prayer") && (
          <button
            className="quick-card river-mini"
            onClick={() => go("prayer")}
          >
            <Ship />
            <span>{C.home.prayer}</span>
            <small>{C.home.prayerDesc}</small>
          </button>
        )}
        {enabled("activities") && (
          <button className="quick-card" onClick={() => go("activities")}>
            <Sparkles />
            <span>{C.home.activity}</span>
          </button>
        )}
      </section>
      {enabled("presence") && (
        <section className="section">
          <h2>{C.moods.title}</h2>
          <div className="mood-list">
            {(
              ["happy", "tired", "sad", "stressed", "calm", "busy"] as const
            ).map((m, i) => (
              <button
                key={m}
                className={
                  d.moods.find((x) => x.user_id === user?.id)?.mood === m
                    ? "selected"
                    : ""
                }
                onClick={() => void run(() => rpc("set_mood", { p_mood: m }))}
              >
                <span aria-hidden="true">
                  <MoodIcon index={i} />
                </span>
                {C.moods[m]}
              </button>
            ))}
          </div>
          <div className="presence">
            {d.members.map((m) => {
              const mood = d.moods.find((x) => x.user_id === m.user_id);
              return (
                <p key={m.user_id}>
                  <b>
                    {d.profiles.find((p) => p.id === m.user_id)?.display_name ||
                      C.home.partner}
                  </b>
                  {mood && (
                    <>
                      {" "}
                      · {C.moods[mood.mood as keyof typeof C.moods]}{" "}
                      <small>
                        {new Date(mood.created_at).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </>
                  )}
                </p>
              );
            })}
          </div>
          <div className="row">
            {(["hug", "love", "rest", "more"] as const).map((x) => (
              <Button
                key={x}
                secondary
                onClick={() => void run(() => rpc("set_mood", { p_mood: x }))}
              >
                {C.moods[x]}
              </Button>
            ))}
          </div>
        </section>
      )}
      {enabled("specialDates") && d.dates.length > 0 && (
        <section className="section">
          <h2>{C.home.special}</h2>
          {d.dates
            .filter((x) => x.date >= today)
            .slice(0, 3)
            .map((x) => (
              <p key={x.id}>
                <b>{x.title}</b> ·{" "}
                {t(C.home.countdown, { count: dayGap(x.date, today) })}
              </p>
            ))}
        </section>
      )}
      {enabled("memories") && (
        <button className="text-button" onClick={() => go("memories")}>
          {t(C.home.memory, { count: d.memories.length })}
        </button>
      )}
    </>
  );
}
export function DailyScreen() {
  const { data: d, user, run, notify } = useApp();
  const [answer, setAnswer] = useDraft("daily:" + d.daily?.id);
  const [reply, setReply] = useState("");
  const own = d.answers.find((x) => x.user_id === user?.id);
  return (
    <>
      <PageTitle title={C.daily.title} />
      <section className="daily-detail">
        <span className="eyebrow">
          {d.daily && <DateLabel date={d.daily.date} />}
        </span>
        <h2>{d.daily?.prompt}</h2>
        {d.members.length < 2 && <p>{C.daily.needPair}</p>}
        {!own ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!dailySchema.safeParse(answer).success) {
                notify(C.errors.invalid, true);
                return;
              }
              const ok = await run(() =>
                rpc("answer_daily", { p_content: answer }),
              );
              if (ok) {
                setAnswer("");
                void flushNotifications();
              }
            }}
          >
            <Field label={C.daily.answer}>
              <textarea
                value={answer}
                maxLength={3000}
                required
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={C.daily.answer}
              />
            </Field>
            <Button type="submit">{C.daily.submit}</Button>
          </form>
        ) : d.daily?.status !== "completed" ? (
          <div className="answer-card">
            <Check />
            <p>{C.daily.wait}</p>
            <blockquote>{own.content}</blockquote>
          </div>
        ) : (
          <>
            <h3>{C.daily.reveal}</h3>
            <div className="answer-grid">
              {d.answers.map((a) => (
                <article className="answer-card" key={a.user_id}>
                  <b>
                    {d.profiles.find((p) => p.id === a.user_id)?.display_name ||
                      C.home.partner}
                  </b>
                  <p className="pre-wrap">{a.content}</p>
                </article>
              ))}
            </div>
            <form
              className="reply-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await run(
                    () =>
                      rpc("daily_reply", {
                        p_session: d.daily!.id,
                        p_content: reply,
                      }),
                    C.daily.replied,
                  )
                )
                  setReply("");
              }}
            >
              <Field label={C.daily.reply}>
                <input
                  maxLength={500}
                  required
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
              </Field>
              <Button type="submit">{C.common.save}</Button>
              <Button
                secondary
                onClick={() =>
                  void run(() =>
                    rpc("daily_reply", {
                      p_session: d.daily!.id,
                      p_content: "♥",
                    }),
                  )
                }
              >
                <Heart size={18} />
                {C.daily.react}
              </Button>
            </form>
            {d.feedback.map((f) => (
              <p key={f.id}>
                <b>
                  {d.profiles.find((p) => p.id === f.user_id)?.display_name}
                </b>{" "}
                · {f.content}
              </p>
            ))}
          </>
        )}
      </section>
      <section className="section">
        <h2>{C.daily.history}</h2>
        <div className="streak-calendar">
          {d.events.map((e) => (
            <span
              key={e.id}
              title={C.streak[e.type as keyof typeof C.streak]}
              className={e.type}
            >
              {e.date.slice(5)}
            </span>
          ))}
        </div>
        <p>{C.home.repairHint}</p>
      </section>
    </>
  );
}

function MoodIcon({ index }: { index: number }) {
  const Icon = [Sun, Moon, CloudRain, Wind, Leaf, Hourglass][index];
  return <Icon size={26} />;
}
