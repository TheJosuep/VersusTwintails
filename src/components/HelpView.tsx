"use client";

import { CRITERIA } from "@/lib/criteria";
import { formatText } from "@/lib/i18n";
import { SWISS_ROUNDS, TOTAL_MATCHUPS } from "@/lib/participants";
import { useI18n } from "./LanguageContext";

export function HelpView() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[25px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md sm:p-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {t.helpTitle}
        </h2>
        <p className="mt-1 text-xs text-white/55">
          {formatText(t.helpSubtitle, {
            rounds: SWISS_ROUNDS,
            duels: TOTAL_MATCHUPS,
          })}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {t.helpSteps.map((item) => (
            <div
              key={item.step}
              className="rounded-[20px] border border-white/10 bg-black/50 p-4"
            >
              <span className="text-xs font-bold text-white/40">
                {item.step}
              </span>
              <h3 className="mt-1 text-base font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-white/65">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[25px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md sm:p-6">
        <h3 className="text-xl font-bold tracking-tight text-white">
          {t.helpScaleTitle}
        </h3>
        <p className="mt-1 text-xs text-white/55">{t.helpScaleSubtitle}</p>

        <div className="mt-4 flex flex-col gap-3">
          {CRITERIA.map((c) => {
            const cMeta = t.criteria[c.key];
            return (
              <div
                key={c.key}
                className="rounded-[20px] border border-white/10 bg-black/50 p-4"
              >
                <h4 className="text-sm font-semibold text-white">
                  {cMeta.label}
                </h4>
                <div className="mt-2.5 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2">
                    <span className="font-bold text-white/55">0–3 · </span>
                    <span className="text-white/80">{cMeta.ranges.low}</span>
                  </div>
                  <div className="rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2">
                    <span className="font-bold text-white/70">4–7 · </span>
                    <span className="text-white/85">{cMeta.ranges.mid}</span>
                  </div>
                  <div className="rounded-[12px] border border-white/15 bg-white/[0.07] px-3 py-2">
                    <span className="font-bold text-white">8–10 · </span>
                    <span className="text-white">{cMeta.ranges.high}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
