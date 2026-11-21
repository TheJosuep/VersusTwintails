"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles, Swords } from "lucide-react";
import { DEFAULT_SCORES, getAverageScore } from "@/lib/criteria";
import {
  computeBradleyTerryRatings,
  generateNextSwissRound,
  getRoundForIndex,
  getRoundLabel,
} from "@/lib/matchmaking";
import {
  PARTICIPANT_MAP,
  PARTICIPANTS,
  SWISS_ROUNDS,
  TOTAL_MATCHUPS,
  TOTAL_PARTICIPANTS,
} from "@/lib/participants";
import { saveMatchupVote, validateAndCompleteSurvey } from "@/lib/storage";
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
  matches: VtMatch[];
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
  matches,
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
  const [roundNotice, setRoundNotice] = useState<string | null>(null);
  const [duelAnimKey, setDuelAnimKey] = useState(0);

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

  useEffect(() => {
    if (!roundNotice) return;
    const t = setTimeout(() => setRoundNotice(null), 4000);
    return () => clearTimeout(t);
  }, [roundNotice]);

  const evaluatedCount = useMemo(
    () => PARTICIPANTS.filter((p) => evaluationsMap.has(p.id)).length,
    [evaluationsMap]
  );

  const currentRound = pair?.round ?? getRoundForIndex(currentIndex, TOTAL_PARTICIPANTS);
  const progressPct = Math.min(
    100,
    Math.round((Math.min(matches.length, TOTAL_MATCHUPS) / TOTAL_MATCHUPS) * 100)
  );

  const topThreePreview = useMemo(() => {
    if (pair) return [];
    const ratings = computeBradleyTerryRatings(
      PARTICIPANTS.map((p) => p.id),
      matches
    );
    return [...PARTICIPANTS]
      .map((p) => ({ participant: p, stats: ratings.get(p.id)! }))
      .sort(
        (a, b) =>
          b.stats.rating - a.stats.rating || b.stats.wins - a.stats.wins
      )
      .slice(0, 3);
  }, [pair, matches]);

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

      const matchMap = new Map(matches.map((m) => [m.pair_key, m]));
      matchMap.set(pair.pairKey, {
        user_id: user.id,
        pair_key: pair.pairKey,
        participant_a_id: pair.a,
        participant_b_id: pair.b,
        winner_id: winnerId,
      });
      const nextMatches = Array.from(matchMap.values());

      const nextIndex = currentIndex + 1;
      let updatedQueue: MatchupPair[] | undefined;

      if (nextIndex >= queue.length && nextIndex < TOTAL_MATCHUPS) {
        const nextRound = getRoundForIndex(nextIndex, TOTAL_PARTICIPANTS);
        const nextRoundPairs = generateNextSwissRound(
          PARTICIPANTS.map((p) => p.id),
          nextMatches,
          nextRound
        );
        updatedQueue = [...queue, ...nextRoundPairs];
        setRoundNotice(
          `Ronda ${nextRound}/${SWISS_ROUNDS} generada · ${getRoundLabel(nextRound)}`
        );
      }

      const nextEvaluated = new Set(evaluationsMap.keys());
      nextEvaluated.add(participantA.id);
      nextEvaluated.add(participantB.id);

      const markCompleted =
        nextEvaluated.size >= TOTAL_PARTICIPANTS &&
        nextMatches.length >= TOTAL_MATCHUPS;

      const result = await saveMatchupVote({
        user,
        pair,
        winnerId,
        evaluationsToUpsert,
        nextIndex,
        updatedQueue,
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
      <div className="mx-auto flex max-w-2xl flex-col gap-5 rounded-[25px] border border-white/15 bg-white/[0.04] p-6 text-center backdrop-blur-md sm:p-8">
        <div>
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-white" />
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Torneo Suizo completado
          </h2>
          <p className="mt-2 text-xs text-white/60 sm:text-sm">
            Evaluaste a las {TOTAL_PARTICIPANTS} participantes y completaste tus{" "}
            {matches.length} duelos.
          </p>
        </div>

        {topThreePreview.length > 0 ? (
          <div className="grid grid-cols-3 gap-2.5 text-left sm:gap-4">
            {topThreePreview.map((entry, idx) => (
              <div
                key={entry.participant.id}
                className="flex flex-col gap-2 rounded-[20px] border border-white/12 bg-black/55 p-2.5 sm:p-3"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-zinc-950">
                  <img
                    src={entry.participant.images[0]}
                    alt={entry.participant.name}
                    className="h-full w-full object-cover object-top"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-black">
                    #{idx + 1}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white sm:text-sm">
                    {entry.participant.name}
                  </p>
                  <p className="text-[11px] text-white/55">
                    Elo {entry.stats.rating} · {entry.stats.wins}-{entry.stats.losses}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onOpenResults}
          className="mx-auto inline-flex items-center gap-2 rounded-[25px] bg-white px-6 py-3.5 text-sm font-bold text-black transition hover:bg-white/90 active:scale-95"
        >
          <span>Explorar tabla de resultados</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Swiss Round & Progress Bar */}
      <div className="flex flex-col gap-3 rounded-[25px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/70">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white">
              <Swords className="h-3.5 w-3.5 text-white/75" />
              Ronda {currentRound}/{SWISS_ROUNDS} · {getRoundLabel(currentRound)}
            </span>
            <div className="flex items-center gap-2.5 text-white/65">
              {evaluatedCount < TOTAL_PARTICIPANTS ? (
                <span>
                  Evaluadas:{" "}
                  <strong className="text-white">
                    {evaluatedCount}/{TOTAL_PARTICIPANTS}
                  </strong>
                </span>
              ) : null}
              <span>
                Duelo{" "}
                <strong className="text-white">
                  {Math.min(currentIndex + 1, TOTAL_MATCHUPS)}
                </strong>{" "}
                / {TOTAL_MATCHUPS}
              </span>
            </div>
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
        ) : evaluatedCount >= TOTAL_PARTICIPANTS &&
          matches.length >= TOTAL_MATCHUPS ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleManualComplete}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[25px] bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-white/90 active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Finalizar y ver resultados</span>
          </button>
        ) : null}
      </div>

      {roundNotice ? (
        <div className="flex items-center gap-2 self-start rounded-[25px] border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>{roundNotice}</span>
        </div>
      ) : null}

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
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <ParticipantGallery
            key={participantA.id}
            participant={participantA}
            sideLabel="A"
            isSelectedWinner={
              getAverageScore(scoresA) > getAverageScore(scoresB)
            }
          />
        </div>

        <div className="min-w-0 lg:col-start-2 lg:row-start-1">
          <ParticipantGallery
            key={participantB.id}
            participant={participantB}
            sideLabel="B"
            isSelectedWinner={
              getAverageScore(scoresB) > getAverageScore(scoresA)
            }
          />
        </div>

        <div className="col-span-2 min-w-0 lg:col-span-1 lg:col-start-1 lg:row-start-2">
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
