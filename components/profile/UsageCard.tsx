"use client";

import { useSyncExternalStore } from "react";
import { useAnswers, type Entry } from "@/lib/answers";
import type { AnswerType, Lang } from "@/prompts/elderwise";

// Profile tab: a calm "this week" view of the answer history (lib/answers.ts keeps the last 30):
// questions per day as bars, the day streak, and the three most used kinds of answer.

const COPY: Record<Lang, {
  title: string;
  questions: (n: number) => string;
  streak: (n: number) => string;
  empty: string;
  locale: string;
  types: Record<AnswerType, string>;
}> = {
  en: {
    title: "This week",
    questions: (n) => (n === 1 ? "1 question" : `${n} questions`),
    streak: (n) => (n === 1 ? "1-day streak" : `${n}-day streak`),
    empty: "Ask Grace something and your week shows up here.",
    locale: "en-GB",
    types: { warning: "Scam checks", explain: "Explanations", steps: "Steps", reminder: "Reminders", info: "Answers", place: "Places", link: "Links" },
  },
  de: {
    title: "Diese Woche",
    questions: (n) => (n === 1 ? "1 Frage" : `${n} Fragen`),
    streak: (n) => (n === 1 ? "1 Tag in Folge" : `${n} Tage in Folge`),
    empty: "Fragen Sie Grace etwas, dann sehen Sie hier Ihre Woche.",
    locale: "de-DE",
    types: { warning: "Betrugs-Checks", explain: "Erklärungen", steps: "Anleitungen", reminder: "Erinnerungen", info: "Antworten", place: "Orte", link: "Links" },
  },
};

const DAY = 24 * 60 * 60 * 1000;
const dayKey = (t: number) => new Date(t).toDateString();

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Midnight today in the browser; null while rendering on the server, where "today" is unknown.
const noop = () => () => {};
const useToday = () => useSyncExternalStore(noop, startOfToday, () => null);

// Last 7 days, oldest first, with the number of questions asked on each.
function week(entries: Entry[], today: number) {
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(dayKey(e.at), (counts.get(dayKey(e.at)) ?? 0) + 1);
  return Array.from({ length: 7 }, (_, i) => {
    // Noon avoids landing on the wrong day when the clocks change.
    const t = today - (6 - i) * DAY + DAY / 2;
    return { t, count: counts.get(dayKey(t)) ?? 0 };
  });
}

// Days in a row with at least one question, counting back from today (or yesterday, so the
// streak does not drop to 0 in the morning before the first question).
function streak(entries: Entry[], today: number) {
  const days = new Set(entries.map((e) => dayKey(e.at)));
  let t = today + DAY / 2;
  if (!days.has(dayKey(t))) t -= DAY;
  let n = 0;
  while (days.has(dayKey(t))) {
    n++;
    t -= DAY;
  }
  return n;
}

export function UsageCard({ lang }: { lang: Lang }) {
  const entries = useAnswers();
  const c = COPY[lang];
  const today = useToday();
  if (today === null) return null;
  const days = week(entries, today);
  const total = days.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...days.map((d) => d.count));
  const run = streak(entries, today);
  const from = today - 6 * DAY;
  const counts = new Map<AnswerType, number>();
  for (const e of entries) if (e.at >= from) counts.set(e.answer.type, (counts.get(e.answer.type) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <section aria-labelledby="usage-title" className="glass flex flex-col gap-4 rounded-[24px] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="usage-title" className="font-serif text-2xl font-medium text-ink">
          {c.title}
        </h2>
        <p className="text-lg font-bold text-moss">{c.questions(total)}</p>
      </div>

      <div className="flex h-28 items-end gap-1.5" role="img" aria-label={days.map((d) => `${new Date(d.t).toLocaleDateString(c.locale, { weekday: "long" })}: ${d.count}`).join(", ")}>
        {days.map((d, i) => {
          const isToday = i === 6;
          return (
            <div key={d.t} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
              <div
                className={`w-full max-w-9 rounded-lg ${d.count ? (isToday ? "bg-moss" : "bg-moss/45") : "bg-line"}`}
                style={{ height: d.count ? `${Math.max(14, (d.count / max) * 72)}px` : "6px" }}
              />
              <span aria-hidden className={`text-[17px] leading-none ${isToday ? "font-bold text-ink" : "text-muted"}`}>
                {new Date(d.t).toLocaleDateString(c.locale, { weekday: "narrow" })}
              </span>
            </div>
          );
        })}
      </div>

      {total === 0 ? (
        <p className="text-lg leading-snug text-muted">{c.empty}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {run > 0 && (
            <span className="flex min-h-10 items-center gap-1.5 rounded-full bg-moss px-4 text-[17px] font-bold text-white">
              {c.streak(run)}
            </span>
          )}
          {top.map(([type, n]) => (
            <span key={type} className="flex min-h-10 items-center gap-2 rounded-full border border-[#e6e1d6] bg-white px-4 text-[17px] text-ink">
              {c.types[type]}
              <span className="font-bold text-moss">{n}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
