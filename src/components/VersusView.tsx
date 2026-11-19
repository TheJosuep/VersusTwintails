"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import {
  DEFAULT_SCORES,
  getAverageScore,
} from "@/lib/criteria";
import {
  PARTICIPANT_MAP,
  PARTICIPANTS,
  TOTAL_MATCHUPS,
  TOTAL_PARTICIPANTS,
} from "@/lib/participants";
import {
  saveMatchupVote,
  validateAndCompleteSurvey,
} from "@/lib/storage";
import type {
  CriterionKey,
  MatchupPair,
  Scores,
  VtEvaluation,
  VtMatch,
  VtUser,
} from "@/lib/types";
import { EvaluationPanel } from "./EvaluationPanel";
import { ParticipantGallery } from "./ParticipantGallery";

interface VersusViewProps {
  user: VtUser;
  evaluationsMap: Map<string, VtEvaluation>;
  matchesCount: number;
  onVoteSuccess: (result: {
    evaluations: VtEvaluation[];
    match: VtMatch;
    user: VtUser;
  }) => void;
  onUserUpdated: (user: VtUser) => void;
  onOpenResults: () => void;
}

function evalToScores(ev?: VtEvaluation): Scores {
  if (!ev) return { ...DEFAULT_SCORES };
  return {
    originality: ev.originality,
    symmetry: ev.symmetry,
    color_aspect: ev.color_aspect,
    facial_harmony: ev.facial_harmony,
    general_impact: ev.general_impact,
  };
}

function readDraft(key: string): { a?: Scores; b?: Scores } | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as { a?: Scores; b?: Scores }) : null;
  } catch {
    return null;
  }
}

export function VersusView({
  user,
  evaluationsMap,
  matchesCount,
  onVoteSuccess,
  onUserUpdated,
  onOpenResults,
}: VersusViewProps) {
  const queue = user.matchup_queue;
  const currentIndex = user.current_matchup_index;
  const pair: MatchupPair | undefined = queue[currentIndex];

  const participantA = pair ? PARTICIPANT_MAP.get(pair.a) : undefined;
  const participantB = pair ? PARTICIPANT_MAP.get(pair.b) : undefined;

  const evalA = participantA ? evaluationsMap.get(participantA.id) : undefined;
  const evalB = participantB ? evaluationsMap.get(participantB.id) : undefined;

  const draftKey = pair
    ? `vt_draft_${user.username}_${pair.pairKey}`
    : "";

  const [scoresA, setScoresA] = useState<Scores>(() =>
    evalA ? evalToScores(evalA) : { ...DEFAULT_SCORES }
  );
  const [scoresB, setScoresB] = useState<Scores>(() =>
    evalB ? evalToScores(evalB) : { ...DEFAULT_SCORES }
  );
  const [editedA, setEditedA] = useState(false);
  const [editedB, setEditedB] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duelAnimKey, setDuelAnimKey] = useState(0);

  // Sync local sliders when moving to a new matchup or recovering session
  useEffect(() => {
    if (!pair) return;
    const storedEvalA = evaluationsMap.get(pair.a);
    const storedEvalB = evaluationsMap.get(pair.b);
    const draft = readDraft(`vt_draft_${user.username}_${pair.pairKey}`);

    setScoresA(
      storedEvalA
        ? evalToScores(storedEvalA)
        : draft?.a ?? { ...DEFAULT_SCORES }
    );
    setScoresB(
      storedEvalB
        ? evalToScores(storedEvalB)
        : draft?.b ?? { ...DEFAULT_SCORES }
    );
    setEditedA(false);
    setEditedB(false);
    setErrorMsg(null);
  }, [pair, evaluationsMap, user.username]);

  const evaluatedCount = useMemo(
    () => PARTICIPANTS.filter((p) => evaluationsMap.has(p.id)).length,
    [evaluationsMap]
  );

  const progressPct = Math.min(
    100,
    Math.round((evaluatedCount / TOTAL_PARTICIPANTS) * 100)
  );

  const updateDraft = (nextA: Scores, nextB: Scores) => {
    if (!draftKey) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ a: nextA, b: nextB }));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleScoreChangeA = (key: CriterionKey, val: number) => {
    const next = { ...scoresA, [key]: val };
    setScoresA(next);
    setEditedA(true);
    updateDraft(next, scoresB);
  };

  const handleScoreChangeB = (key: CriterionKey, val: number) => {
    const next = { ...scoresB, [key]: val };
    setScoresB(next);
    setEditedB(true);
    updateDraft(scoresA, next);
  };

  const handlePickWinner = async (winnerId: string) => {
    if (!pair || !participantA || !participantB || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const evaluationsToUpsert: Array<{
        participantId: string;
        scores: Scores;
      }> = [];

      if (!evalA || editedA) {
        evaluationsToUpsert.push({
          participantId: participantA.id,
          scores: scoresA,
        });
      }
      if (!evalB || editedB) {
        evaluationsToUpsert.push({
          participantId: participantB.id,
          scores: scoresB,
        });
      }

      const nextEvaluated = new Set(evaluationsMap.keys());
      nextEvaluated.add(participantA.id);
      nextEvaluated.add(participantB.id);

      const markCompleted = nextEvaluated.size >= TOTAL_PARTICIPANTS;
      const result = await saveMatchupVote({
        user,
        pair,
        winnerId,
        evaluationsToUpsert,
        nextIndex: currentIndex + 1,
        markCompleted,
      });

      try {
        localStorage.removeItem(draftKey);
      } catch {
        // Ignore
      }

      onVoteSuccess(result);
      setDuelAnimKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "No se pudo guardar el voto."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualComplete = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const updated = await validateAndCompleteSurvey(user.id);
      onUserUpdated(updated);
      onOpenResults();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "No se pudo validar el envío."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pair || !participantA || !participantB) {
    return (
      <div className="mx-auto max-w-xl rounded-[25px] border border-white/15 bg-white/[0.04] p-8 text-center backdrop-blur-md">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-white" />
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Torneo completado
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Evaluaste a las {TOTAL_PARTICIPANTS} participantes y decidiste los{" "}
          {TOTAL_MATCHUPS} enfrentamientos.
        </p>
        <button
          type="button"
          onClick={onOpenResults}
          className="mt-6 inline-flex items-center gap-2 rounded-[25px] bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90 active:scale-95"
        >
          <span>Ver tabla de resultados</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Progress & Completion Status Bar */}
      <div className="flex flex-col gap-3 rounded-[25px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>
              Evaluación inicial:{" "}
              <strong className="text-white">
                {evaluatedCount}/{TOTAL_PARTICIPANTS}
              </strong>{" "}
              participantes
            </span>
            <span>
              Duelo #{currentIndex + 1} / {TOTAL_MATCHUPS} · {matchesCount}{" "}
              votados
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {user.is_completed ? (
          <button
            type="button"
            onClick={onOpenResults}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[25px] border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white hover:text-black active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Resultados desbloqueados · Ver tabla</span>
          </button>
        ) : evaluatedCount >= TOTAL_PARTICIPANTS ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleManualComplete}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[25px] bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-white/90 active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Confirmar envío y ver resultados</span>
          </button>
        ) : null}
      </div>

      {errorMsg ? (
        <div className="rounded-[20px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {errorMsg}
        </div>
      ) : null}

      {/* Side-by-side comparison grid on BOTH mobile (2 cols for photos) and desktop (2 unified cols) */}
      <div
        key={`${pair.pairKey}-${duelAnimKey}`}
        className="vt-slide-in-right grid grid-cols-2 gap-2.5 lg:gap-6"
      >
        <div className="lg:col-start-1 lg:row-start-1">
          <ParticipantGallery
            key={participantA.id}
            participant={participantA}
            sideLabel="A"
            isSelectedWinner={
              getAverageScore(scoresA) > getAverageScore(scoresB)
            }
          />
        </div>

        <div className="lg:col-start-2 lg:row-start-1">
          <ParticipantGallery
            key={participantB.id}
            participant={participantB}
            sideLabel="B"
            isSelectedWinner={
              getAverageScore(scoresB) > getAverageScore(scoresA)
            }
          />
        </div>

        <div className="col-span-2 lg:col-span-1 lg:col-start-1 lg:row-start-2">
          <EvaluationPanel
            key={`${pair.pairKey}-eval-a`}
            participant={participantA}
            scores={scoresA}
            alreadyEvaluated={Boolean(evalA)}
            isSubmitting={isSubmitting}
            onChangeScore={handleScoreChangeA}
            onPickWinner={() => handlePickWinner(participantA.id)}
          />
        </div>

        <div className="col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-2">
          <EvaluationPanel
            key={`${pair.pairKey}-eval-b`}
            participant={participantB}
            scores={scoresB}
            alreadyEvaluated={Boolean(evalB)}
            isSubmitting={isSubmitting}
            onChangeScore={handleScoreChangeB}
            onPickWinner={() => handlePickWinner(participantB.id)}
          />
        </div>
      </div>
    </div>
  );
}
