"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AccountCard } from "@/components/AccountCard";
import { AssistantSettings } from "@/components/AssistantSettings";
import { ChatIcon, GlobeIcon, PhoneIcon, SpeakerIcon, TextSizeIcon } from "@/components/icons";
import { CARD, Section } from "@/components/profile/ui";
import { UsageCard } from "@/components/profile/UsageCard";
import { SkillsCard } from "@/components/SkillsCard";
import { FamilyLink } from "../family/FamilyLink";
import { updateProfile, useProfile, type FontSize } from "@/lib/profile";
import type { Lang } from "@/prompts/elderwise";
import { TEXT } from "../copy";
import { EditDetails, editLabel, type EditWhat } from "./EditDetails";

const FONT_ORDER: FontSize[] = ["normal", "large", "xlarge"];
// The "Aa" sample on each text-size button, drawn at the size it stands for.
const SAMPLE_PX: Record<FontSize, number> = { normal: 19, large: 24, xlarge: 30 };

const COPY: Record<Lang, {
  reading: string;
  preview: string;
  message: string;
}> = {
  en: {
    reading: "Reading & listening",
    preview: "This is how your text will look.",
    message: "Message",
  },
  de: {
    reading: "Lesen & Hören",
    preview: "So groß sieht Ihr Text aus.",
    message: "Nachricht",
  },
};

const PencilIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e6e1d6] bg-white text-moss active:bg-paper"
    >
      <PencilIcon className="h-5 w-5" />
    </button>
  );
}


// One setting as a row: line icon left, label, current value right in the accent colour.
function Row({ icon, label, value, onClick }: { icon: ReactNode; label: string; value: string; onClick: () => void }) {
  return (
    // flex-wrap: with very large text the value moves to its own line instead of running off the screen.
    <button onClick={onClick} className={`${CARD} flex min-h-16 w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-left active:bg-paper`}>
      <span className="shrink-0 text-moss">{icon}</span>
      <span className="min-w-0 flex-[1_1_auto] break-words text-lg font-bold text-ink">{label}</span>
      <span className="ml-auto text-lg font-bold text-moss">{value}</span>
    </button>
  );
}

// Profile tab: who you are, your assistant, your trusted person, reading settings and your account.
export default function ProfilePage() {
  const profile = useProfile();
  const t = TEXT[profile.lang];
  const c = COPY[profile.lang];
  const [editing, setEditing] = useState<EditWhat>(null);
  const relation = t.relations[profile.trusted.relation] ?? profile.trusted.relation;
  const phone = profile.trusted.phone.replace(/\s/g, "");


  return (
    <main lang={profile.lang} className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pb-44 pt-8 min-[360px]:px-5">
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div aria-hidden className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-moss font-serif text-4xl font-medium text-white shadow-[0_8px_20px_rgba(63,90,58,0.3)]">
            {profile.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="break-words font-serif text-display font-medium leading-tight text-ink">{profile.name}</h1>
          </div>
          <EditButton onClick={() => setEditing("me")} label={`${editLabel(profile.lang)}: ${profile.name}`} />
        </div>
        <UsageCard lang={profile.lang} />
      </header>

      <SkillsCard lang={profile.lang} />

      <AssistantSettings />

      <Section title={t.trustedTitle}>
        <div className={`${CARD} flex flex-col gap-4 p-5`}>
          <div className="flex items-center gap-4">
            <div aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-learn-bg font-serif text-2xl font-medium text-moss">
              {profile.trusted.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-xl font-bold text-ink">{profile.trusted.name}</p>
              <p className="break-words text-lg text-muted">{relation}</p>
            </div>
            <EditButton onClick={() => setEditing("trusted")} label={`${editLabel(profile.lang)}: ${profile.trusted.name}`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${phone}`}
              className="flex min-h-14 flex-[1_1_6.5rem] items-center justify-center gap-2 rounded-full bg-moss px-5 text-lg font-bold text-white"
            >
              <PhoneIcon className="h-6 w-6 shrink-0" />
              {t.call}
            </a>
            <a
              href={`sms:${phone}`}
              className="flex min-h-14 flex-[1_1_6.5rem] items-center justify-center gap-2 rounded-full border border-[#e6e1d6] bg-paper px-5 text-lg font-bold text-moss"
            >
              <ChatIcon className="h-6 w-6 shrink-0" />
              {c.message}
            </a>
          </div>
        </div>
        <FamilyLink />
      </Section>

      <EditDetails what={editing} relationLabel={relation} onClose={() => setEditing(null)} />

      <Section title={c.reading}>
        <div className={`${CARD} flex flex-col gap-4 p-5`}>
          <div className="flex items-center gap-4">
            <TextSizeIcon className="h-7 w-7 shrink-0 text-moss" />
            <p className="flex-1 text-lg font-bold text-ink">{t.fontSize}</p>
          </div>
          <div role="radiogroup" aria-label={t.fontSize} className="grid grid-cols-3 gap-2">
            {FONT_ORDER.map((size) => {
              const selected = size === profile.fontSize;
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => updateProfile({ fontSize: size })}
                  className={`flex min-h-20 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 py-2 ${
                    selected ? "border-moss bg-learn-bg text-moss" : "border-[#e6e1d6] bg-paper/60 text-ink"
                  }`}
                >
                  <span aria-hidden className="font-serif font-medium leading-none" style={{ fontSize: SAMPLE_PX[size] }}>
                    Aa
                  </span>
                  <span className={`break-words text-base leading-tight ${selected ? "font-bold" : ""}`}>{t.fontSizes[size]}</span>
                </button>
              );
            })}
          </div>
          <p className="rounded-2xl bg-paper/60 px-4 py-3 text-lg leading-snug text-ink">{c.preview}</p>
        </div>

        <div className={`${CARD} px-5 py-4`}>
          <div className="flex items-center gap-4">
            <SpeakerIcon className="h-7 w-7 shrink-0 text-moss" />
            <label htmlFor="rate" className="flex-1 text-lg font-bold text-ink">
              {t.speechRate}
            </label>
          </div>
          <input
            id="rate"
            type="range"
            min={0.6}
            max={1.2}
            step={0.05}
            value={profile.speechRate}
            // Screen readers say "Slow / Normal / Fast" instead of "0.9".
            aria-valuetext={profile.speechRate < 0.8 ? t.slow : profile.speechRate > 1 ? t.fast : t.fontSizes.normal}
            onChange={(e) => updateProfile({ speechRate: Number(e.target.value) })}
            className="rate-slider mt-3 w-full"
          />
          <div className="flex justify-between text-base font-bold text-muted">
            <span>{t.slow}</span>
            <span>{t.fast}</span>
          </div>
        </div>

        <Row
          icon={<GlobeIcon className="h-7 w-7" />}
          label={t.language}
          value={profile.lang === "en" ? "English" : "Deutsch"}
          onClick={() => updateProfile({ lang: profile.lang === "en" ? "de" : "en" })}
        />
      </Section>

      <AccountCard />
    </main>
  );
}
