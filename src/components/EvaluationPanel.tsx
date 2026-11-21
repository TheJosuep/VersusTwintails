"use client";

import { useState } from "react";
import { Check, ChevronDown, Info, Pencil, Trophy } from "lucide-react";
import { CRITERIA, getAverageScore, getRangeBand } from "@/lib/criteria";
import { getLocalizedRangeLabel } from "@/lib/i18n";
import { getParticipantDisplay } from "@/lib/participants";
import { isAllFiveEvaluation } from "@/lib/quality";
import type { CriterionKey, Participant, Scores } from "@/lib/types";
import { useI18n } from "./LanguageContext";

interface EvaluationPanelProps {
  participant: Participant;
  scores: Scores;
  alreadyEvaluated: boolean;
  isSubmitting: boolean;
  onChangeScore: (key: CriterionKey, value: number) => void;
  onPickWinner: () => void;
}

export function EvaluationPanel({
  participant,
  scores,
  alreadyEvaluated,
  isSubmitting,
  onChangeScore,
  onPickWinner,
}: EvaluationPanelProps) {
  const { locale, t } = useI18n();
  const [editing, setEditing] = useState(!alreadyEvaluated);
  const avg = getAverageScore(scores);
  const showSliders = !alreadyEvaluated || editing;
  const display = getParticipantDisplay(participant, locale);
  const allDefaultFive = isAllFiveEvaluation(scores);

  return (
    <div className="flex flex-col justify-between gap-4 rounded-[25px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md sm:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              {display.name}
            </h3>
            <p className="text-xs text-white/55">
              {alreadyEvaluated
                ? `${t.savedEvalPrefix} ${avg.toFixed(1)}/10`
                : t.evaluate5Prompt}
            </p>
          </div>

          {alreadyEvaluated ? (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 transition hover:bg-white/15 active:scale-95"
            >
              <Pencil className="h-3 w-3" />
              {editing ? t.hideScores : t.editScores}
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${
                  editing ? "rotate-180" : ""
                }`}
              />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              {avg.toFixed(1)} / 10
            </span>
          )}
        </div>

        {!showSliders ? (
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {CRITERIA.map((criterion) => (
              <div
                key={criterion.key}
                className="flex flex-col items-center rounded-[14px] border border-white/10 bg-black/50 px-1.5 py-2 text-center"
              >
                <span className="text-sm font-bold text-white">
                  {scores[criterion.key]}
                </span>
                <span className="mt-0.5 line-clamp-1 text-[10px] text-white/50">
                  {t.criteria[criterion.key].shortLabel}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 pt-1">
            {CRITERIA.map((criterion) => {
              const val = scores[criterion.key];
              const pct = (val / 10) * 100;
              const cMeta = t.criteria[criterion.key];
              return (
                <div
                  key={criterion.key}
                  className="flex flex-col gap-1.5 rounded-[18px] border border-white/10 bg-black/45 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-white/90 sm:text-sm">
                      {cMeta.label}
                    </span>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-black">
                      {val}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={val}
                    onChange={(e) =>
                      onChangeScore(criterion.key, Number(e.target.value))
                    }
                    className="vt-slider"
                    style={{
                      background: `linear-gradient(to right, #ffffff ${pct}%, rgba(255,255,255,0.16) ${pct}%)`,
                    }}
                    aria-label={`${cMeta.label} - ${display.name}`}
                  />

                  <div className="flex items-center justify-between text-[11px] text-white/55">
                    <span>{getRangeBand(val)}</span>
                    <span className="text-right text-white/80">
                      {getLocalizedRangeLabel(criterion.key, val, locale)}
                    </span>
                  </div>
                </div>
              );
            })}

            {!alreadyEvaluated && allDefaultFive ? (
              <p className="flex items-start gap-1.5 px-1 text-[11px] leading-snug text-white/50">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/45" />
                <span>{t.defaultFiveHint}</span>
              </p>
            ) : null}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={isSubmitting}
        onClick={onPickWinner}
        className="group flex w-full items-center justify-center gap-2 rounded-[25px] bg-white px-5 py-3.5 text-sm font-bold text-black transition duration-200 hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
      >
        {alreadyEvaluated ? (
          <Check className="h-4 w-4 transition-transform group-hover:scale-110" />
        ) : (
          <Trophy className="h-4 w-4 transition-transform group-hover:scale-110" />
        )}
        <span>
          {t.pickWinnerPrefix} {display.name}
        </span>
      </button>
    </div>
  );
}
