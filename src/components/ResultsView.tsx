"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronDown,
  Info,
  Maximize,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { CRITERIA } from "@/lib/criteria";
import { formatText, getLocalizedRangeLabel } from "@/lib/i18n";
import { computeBradleyTerryRatings } from "@/lib/matchmaking";
import {
  getParticipantDisplay,
  PARTICIPANT_MAP,
  PARTICIPANTS,
} from "@/lib/participants";
import { filterTrustedEvaluations } from "@/lib/quality";
import { fetchGlobalResults, type GlobalResultsPayload } from "@/lib/storage";
import type {
  CriterionKey,
  Participant,
  ParticipantRating,
  Scores,
  VtEvaluation,
  VtMatch,
} from "@/lib/types";
import {
  shouldOpenLightboxOnImageTap,
  useLightbox,
} from "./GlobalLightbox";
import { useI18n } from "./LanguageContext";

let cachedGlobalResults: GlobalResultsPayload | null = null;

interface ResultsViewProps {
  userId: string;
  ownEvaluations: VtEvaluation[];
  ownMatches: VtMatch[];
}

type ScopeMode = "own" | "community";
type RankMode = "versus" | "score";
type ScoreSortKey = "average" | CriterionKey;

interface DuelOutcome {
  opponent: Participant;
  won: boolean;
}

interface BuiltRanking {
  versusRank: Map<string, number>;
  scoreRank: Map<string, number>;
  rows: Array<{
    participant: Participant;
    rating: ParticipantRating;
    criteria: Scores;
    average: number;
    evalCount: number;
    duelHistory: DuelOutcome[];
  }>;
}

function emptyScores(): Scores {
  return {
    originality: 0,
    symmetry: 0,
    color_aspect: 0,
    facial_harmony: 0,
    general_impact: 0,
  };
}

function buildRanking(
  evaluations: VtEvaluation[],
  matches: VtMatch[],
  includeHistory: boolean
): BuiltRanking {
  const ids = PARTICIPANTS.map((p) => p.id);
  const ratingsMap = computeBradleyTerryRatings(ids, matches);

  const evalsByParticipant = new Map<string, VtEvaluation[]>();
  for (const ev of evaluations) {
    const arr = evalsByParticipant.get(ev.participant_id) ?? [];
    arr.push(ev);
    evalsByParticipant.set(ev.participant_id, arr);
  }

  const historyByParticipant = new Map<string, DuelOutcome[]>();
  if (includeHistory) {
    for (const id of ids) historyByParticipant.set(id, []);
    for (const m of matches) {
      const pA = PARTICIPANT_MAP.get(m.participant_a_id);
      const pB = PARTICIPANT_MAP.get(m.participant_b_id);
      if (!pA || !pB) continue;
      historyByParticipant.get(pA.id)?.push({
        opponent: pB,
        won: m.winner_id === pA.id,
      });
      historyByParticipant.get(pB.id)?.push({
        opponent: pA,
        won: m.winner_id === pB.id,
      });
    }
  }

  const rows = PARTICIPANTS.map((participant) => {
    const evs = evalsByParticipant.get(participant.id) ?? [];
    const evalCount = evs.length;
    const criteria = emptyScores();

    if (evalCount > 0) {
      for (const c of CRITERIA) {
        const sum = evs.reduce((acc, ev) => acc + Number(ev[c.key]), 0);
        criteria[c.key] = sum / evalCount;
      }
    }

    const average =
      evalCount > 0
        ? CRITERIA.reduce((acc, c) => acc + criteria[c.key], 0) / CRITERIA.length
        : 0;

    return {
      participant,
      rating: ratingsMap.get(participant.id)!,
      criteria,
      average,
      evalCount,
      duelHistory: historyByParticipant.get(participant.id) ?? [],
    };
  });

  const byVersus = [...rows].sort(
    (a, b) =>
      b.rating.rating - a.rating.rating ||
      b.rating.wins - a.rating.wins ||
      b.rating.buchholz - a.rating.buchholz ||
      b.average - a.average
  );
  const byScore = [...rows].sort(
    (a, b) => b.average - a.average || b.rating.rating - a.rating.rating
  );

  return {
    versusRank: new Map(byVersus.map((r, i) => [r.participant.id, i + 1])),
    scoreRank: new Map(byScore.map((r, i) => [r.participant.id, i + 1])),
    rows,
  };
}

export function ResultsView({
  userId,
  ownEvaluations,
  ownMatches,
}: ResultsViewProps) {
  const { locale, t } = useI18n();
  const { openLightbox } = useLightbox();
  const [scope, setScope] = useState<ScopeMode>("own");
  const [rankMode, setRankMode] = useState<RankMode>("versus");
  const [scoreKey, setScoreKey] = useState<ScoreSortKey>("average");
  const [sortDesc, setSortDesc] = useState(true);
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const [communityData, setCommunityData] =
    useState<GlobalResultsPayload | null>(() => cachedGlobalResults);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);

  const loadCommunity = async () => {
    setLoadingCommunity(true);
    setCommunityError(null);
    try {
      const res = await fetchGlobalResults();
      cachedGlobalResults = res;
      setCommunityData(res);
    } catch (err) {
      setCommunityError(
        err instanceof Error ? err.message : t.loadingCommunity
      );
    } finally {
      setLoadingCommunity(false);
    }
  };

  useEffect(() => {
    if (scope === "community" && !communityData) {
      void loadCommunity();
    }
  }, [scope, communityData]);

  const ownQuality = useMemo(
    () => filterTrustedEvaluations(ownEvaluations),
    [ownEvaluations]
  );
  const ownExclusionReason = ownQuality.excludedUsers.get(userId);

  const communityQuality = useMemo(
    () =>
      communityData ? filterTrustedEvaluations(communityData.evaluations) : null,
    [communityData]
  );

  const ownRanking = useMemo(
    () => buildRanking(ownEvaluations, ownMatches, true),
    [ownEvaluations, ownMatches]
  );

  const communityRanking = useMemo(
    () =>
      communityData && communityQuality
        ? buildRanking(
            communityQuality.trustedEvaluations,
            communityData.matches,
            false
          )
        : null,
    [communityData, communityQuality]
  );

  const activeRanking =
    scope === "own" ? ownRanking : (communityRanking ?? ownRanking);

  const getScoreValue = (row: BuiltRanking["rows"][number]) =>
    scoreKey === "average" ? row.average : row.criteria[scoreKey];

  const podiumRows = useMemo(() => {
    return [...activeRanking.rows]
      .sort((a, b) => {
        if (rankMode === "versus") {
          return (
            b.rating.rating - a.rating.rating ||
            b.rating.wins - a.rating.wins ||
            b.rating.buchholz - a.rating.buchholz
          );
        }
        return (
          getScoreValue(b) - getScoreValue(a) ||
          b.rating.rating - a.rating.rating
        );
      })
      .slice(0, 3);
  }, [activeRanking, rankMode, scoreKey]);

  const displayedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? activeRanking.rows.filter(({ participant: p }) => {
          return (
            p.name.toLowerCase().includes(q) ||
            (p.nameJa ?? "").toLowerCase().includes(q) ||
            (p.group ?? "").toLowerCase().includes(q) ||
            (p.groupJa ?? "").toLowerCase().includes(q)
          );
        })
      : activeRanking.rows;

    const dir = sortDesc ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (rankMode === "versus") {
        const diff =
          b.rating.rating - a.rating.rating ||
          b.rating.wins - a.rating.wins ||
          b.rating.buchholz - a.rating.buchholz;
        return diff * dir;
      }
      const diff =
        getScoreValue(b) - getScoreValue(a) || b.rating.rating - a.rating.rating;
      return diff * dir;
    });
  }, [activeRanking, search, rankMode, scoreKey, sortDesc]);

  const openParticipantPhotos = (p: Participant) => {
    const display = getParticipantDisplay(p, locale);
    openLightbox({
      images: p.images,
      initialIndex: 0,
      title: display.name,
      subtitle: display.group,
    });
  };

  const handleAvatarTap = (p: Participant) => {
    if (shouldOpenLightboxOnImageTap()) {
      openParticipantPhotos(p);
    }
  };

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scoreLabel =
    scoreKey === "average"
      ? t.sortAverageGeneral
      : t.criteria[scoreKey].label;

  return (
    <div className="flex flex-col gap-5">
      {/* Header + Scope Switch */}
      <div className="flex flex-col gap-4 rounded-[25px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {t.resultsTitle}
            </h2>
            <p className="text-xs text-white/55">
              {scope === "own"
                ? formatText(t.resultsOwnSubtitle, {
                    matches: ownMatches.length,
                    evals: ownEvaluations.length,
                  })
                : communityData && communityQuality
                  ? formatText(t.resultsCommunitySubtitle, {
                      users: communityData.users.length,
                      matches: communityData.matches.length,
                      trusted: communityQuality.trustedUserCount,
                      excluded: communityQuality.excludedUserCount,
                    })
                  : t.resultsCommunityLoading}
            </p>
          </div>

          {scope === "community" ? (
            <button
              type="button"
              onClick={() => void loadCommunity()}
              disabled={loadingCommunity}
              className="inline-flex items-center gap-1.5 rounded-[25px] border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white hover:text-black active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loadingCommunity ? "animate-spin" : ""}`}
              />
              <span>{t.refresh}</span>
            </button>
          ) : null}
        </div>

        {/* Scope & Mode Switchers */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="grid grid-cols-2 rounded-[22px] border border-white/10 bg-black/55 p-1">
            <button
              type="button"
              onClick={() => setScope("own")}
              className={`flex items-center justify-center gap-1.5 rounded-[18px] px-3 py-2 text-xs font-semibold transition ${
                scope === "own"
                  ? "bg-white text-black"
                  : "text-white/65 hover:text-white"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>{t.scopeOwn}</span>
            </button>
            <button
              type="button"
              onClick={() => setScope("community")}
              className={`flex items-center justify-center gap-1.5 rounded-[18px] px-3 py-2 text-xs font-semibold transition ${
                scope === "community"
                  ? "bg-white text-black"
                  : "text-white/65 hover:text-white"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>{t.scopeCommunity}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 rounded-[22px] border border-white/10 bg-black/55 p-1">
            <button
              type="button"
              onClick={() => setRankMode("versus")}
              className={`flex items-center justify-center gap-1.5 rounded-[18px] px-3 py-2 text-xs font-semibold transition ${
                rankMode === "versus"
                  ? "bg-white text-black"
                  : "text-white/65 hover:text-white"
              }`}
            >
              <Swords className="h-3.5 w-3.5" />
              <span>{t.modeVersus}</span>
            </button>
            <button
              type="button"
              onClick={() => setRankMode("score")}
              className={`flex items-center justify-center gap-1.5 rounded-[18px] px-3 py-2 text-xs font-semibold transition ${
                rankMode === "score"
                  ? "bg-white text-black"
                  : "text-white/65 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{t.modeScore}</span>
            </button>
          </div>
        </div>

        {/* Criterion Sub-filter when sorting by Score */}
        {rankMode === "score" ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: "average", label: t.sortAverageGeneral },
                ...CRITERIA.map((c) => ({
                  key: c.key as ScoreSortKey,
                  label: t.criteria[c.key].shortLabel,
                })),
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setScoreKey(opt.key)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                  scoreKey === opt.key
                    ? "border-white bg-white text-black"
                    : "border-white/12 bg-black/45 text-white/70 hover:border-white/30 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Subtle own-ballot exclusion notice when viewing own results */}
        {scope === "own" && ownExclusionReason ? (
          <div className="flex items-start gap-2 rounded-[16px] border border-white/15 bg-black/45 px-3.5 py-2.5 text-[11px] leading-snug text-white/70">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/60" />
            <span>{t.excludedOwnBanner[ownExclusionReason]}</span>
          </div>
        ) : null}
      </div>

      {/* Search + Order Direction */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-[25px] border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 backdrop-blur-md outline-none transition focus:border-white/35"
          />
        </div>

        <button
          type="button"
          onClick={() => setSortDesc((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-[25px] border border-white/12 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white backdrop-blur-md transition hover:border-white/35 active:scale-95"
        >
          {sortDesc ? (
            <ArrowDownWideNarrow className="h-4 w-4" />
          ) : (
            <ArrowUpNarrowWide className="h-4 w-4" />
          )}
          <span>{sortDesc ? t.sortDesc : t.sortAsc}</span>
        </button>
      </div>

      {communityError && scope === "community" ? (
        <div className="rounded-[25px] border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-200">
          {communityError}
        </div>
      ) : null}

      {scope === "community" && loadingCommunity && !communityData ? (
        <div className="rounded-[25px] border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-white/60">
          {t.loadingCommunity}
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {!search.trim() && podiumRows.length === 3 ? (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              {podiumRows.map((row, idx) => {
                const display = getParticipantDisplay(row.participant, locale);
                return (
                  <div
                    key={`${scope}-${rankMode}-${row.participant.id}`}
                    className={`flex flex-col gap-2 rounded-[25px] border p-2.5 backdrop-blur-md sm:p-3.5 ${
                      idx === 0
                        ? "border-white/45 bg-white/[0.08]"
                        : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-zinc-950">
                      <img
                        src={row.participant.images[0]}
                        alt={display.name}
                        loading="lazy"
                        onClick={() => handleAvatarTap(row.participant)}
                        className="h-full w-full cursor-pointer object-cover object-top sm:cursor-default"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-black">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => openParticipantPhotos(row.participant)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white backdrop-blur-md transition hover:bg-white hover:text-black active:scale-95"
                        aria-label={`${t.fullscreenAriaPrefix} ${display.name}`}
                        title={t.fullscreenTitle}
                      >
                        <Maximize className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="min-w-0 px-0.5">
                      <h3 className="truncate text-xs font-bold text-white sm:text-base">
                        {display.name}
                      </h3>
                      <p className="truncate text-[10px] text-white/50 sm:text-xs">
                        {display.group ?? t.noGroup}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-white/90 sm:text-xs">
                        {rankMode === "versus"
                          ? `Elo ${row.rating.rating} · ${row.rating.wins}-${row.rating.losses}`
                          : `${scoreLabel}: ${getScoreValue(row).toFixed(1)}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Collapsible List */}
          <div className="flex flex-col gap-3">
            {displayedRows.map((row) => {
              const id = row.participant.id;
              const display = getParticipantDisplay(row.participant, locale);
              const isOpen = Boolean(openIds[id]);
              const vRank = activeRanking.versusRank.get(id) ?? 0;
              const sRank = activeRanking.scoreRank.get(id) ?? 0;
              const primaryRank = rankMode === "versus" ? vRank : sRank;

              const ownRefVersusRank = ownRanking.versusRank.get(id);
              const ownRefScoreRank = ownRanking.scoreRank.get(id);
              const ownRow = ownRanking.rows.find(
                (r) => r.participant.id === id
              );

              return (
                <div
                  key={`${scope}-${id}`}
                  className="overflow-hidden rounded-[25px] border border-white/10 bg-white/[0.04] backdrop-blur-md transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between gap-2 p-3 sm:p-4">
                    <button
                      type="button"
                      onClick={() => toggleItem(id)}
                      aria-expanded={isOpen}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="w-7 shrink-0 text-center text-xs font-bold text-white/50">
                        #{primaryRank}
                      </span>

                      <img
                        src={row.participant.images[0]}
                        alt={display.name}
                        loading="lazy"
                        onClick={(e) => {
                          if (shouldOpenLightboxOnImageTap()) {
                            e.stopPropagation();
                            openParticipantPhotos(row.participant);
                          }
                        }}
                        className="h-12 w-12 shrink-0 cursor-pointer rounded-[14px] border border-white/10 object-cover object-top sm:cursor-default"
                      />

                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
                          {display.name}
                        </h3>
                        <p className="truncate text-xs text-white/55">
                          {display.group ?? t.noGroup}
                        </p>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-2">
                      {rankMode === "versus" ? (
                        <button
                          type="button"
                          onClick={() => toggleItem(id)}
                          className="flex items-center gap-1.5 text-right"
                        >
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-black">
                            Elo {row.rating.rating}
                          </span>
                          <span className="hidden rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-xs text-white/80 sm:inline-block">
                            {row.rating.wins}W-{row.rating.losses}L (
                            {Math.round(row.rating.winRate)}%)
                          </span>
                          <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/55 md:inline-block">
                            {t.noteShortPrefix} {row.average.toFixed(1)}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleItem(id)}
                          className="flex items-center gap-1.5 text-right"
                        >
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-black">
                            {getScoreValue(row).toFixed(1)} / 10
                          </span>
                          <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/55 sm:inline-block">
                            Elo {row.rating.rating}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openParticipantPhotos(row.participant)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition hover:bg-white hover:text-black active:scale-95"
                        aria-label={`${t.fullscreenAriaPrefix} ${display.name}`}
                        title={t.fullscreenTitle}
                      >
                        <Maximize className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleItem(id)}
                        aria-label={display.name}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:text-white"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-300 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Detail */}
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-3 border-t border-white/10 p-3.5 sm:p-5">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
                          {/* Block 1: Versus Performance */}
                          <div className="flex flex-col gap-3 rounded-[20px] border border-white/10 bg-black/55 p-3.5 sm:p-4">
                            <div className="flex items-baseline justify-between border-b border-white/10 pb-2.5">
                              <div>
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                                  {scope === "own"
                                    ? t.podiumYourVersus
                                    : t.podiumCommunityVersus}
                                </span>
                                <div className="mt-0.5 flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-white">
                                    Elo {row.rating.rating}
                                  </span>
                                  <span className="text-xs text-white/55">
                                    {t.rankLabel} #{vRank}
                                  </span>
                                </div>
                              </div>
                              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/85">
                                {row.rating.wins}W - {row.rating.losses}L
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-2">
                                <span className="block text-sm font-bold text-white">
                                  {Math.round(row.rating.winRate)}%
                                </span>
                                <span className="text-[10px] text-white/50">
                                  {t.victoriesLabel}
                                </span>
                              </div>
                              <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-2">
                                <span className="block text-sm font-bold text-white">
                                  {row.rating.played}
                                </span>
                                <span className="text-[10px] text-white/50">
                                  {t.duelsLabel}
                                </span>
                              </div>
                              <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-2">
                                <span className="block text-sm font-bold text-white">
                                  {row.rating.buchholz}
                                </span>
                                <span className="text-[10px] text-white/50">
                                  {t.opponentStrengthLabel}
                                </span>
                              </div>
                            </div>

                            {scope === "own" && row.duelHistory.length > 0 ? (
                              <div className="flex flex-col gap-1.5 pt-1">
                                <span className="text-[11px] font-medium text-white/55">
                                  {t.duelHistoryLabel}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {row.duelHistory.map((d, i) => {
                                    const oppName = getParticipantDisplay(
                                      d.opponent,
                                      locale
                                    ).name;
                                    return (
                                      <span
                                        key={`${d.opponent.id}-${i}`}
                                        className={`rounded-full border px-2.5 py-1 text-[11px] ${
                                          d.won
                                            ? "border-white/30 bg-white/12 text-white"
                                            : "border-white/10 bg-black/60 text-white/50"
                                        }`}
                                      >
                                        {d.won
                                          ? `${t.wonVsPrefix} `
                                          : `${t.lostVsPrefix} `}
                                        {oppName}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}
                          </div>

                          {/* Block 2: Criteria Score Performance */}
                          <div className="flex flex-col gap-3 rounded-[20px] border border-white/10 bg-black/55 p-3.5 sm:p-4">
                            <div className="flex items-baseline justify-between border-b border-white/10 pb-2.5">
                              <div>
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                                  {scope === "own"
                                    ? t.podiumYourScore
                                    : t.podiumCommunityScore}
                                </span>
                                <div className="mt-0.5 flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-white">
                                    {row.evalCount > 0
                                      ? row.average.toFixed(1)
                                      : "—"}
                                  </span>
                                  <span className="text-xs text-white/55">
                                    {t.rankLabel} #{sRank}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs text-white/55">
                                {scope === "own"
                                  ? row.evalCount > 0
                                    ? t.evaluatedChip
                                    : t.notEvaluatedChip
                                  : `${row.evalCount} ${t.evalsCountSuffix}`}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2.5">
                              {CRITERIA.map((c) => {
                                const val = row.criteria[c.key];
                                const cMeta = t.criteria[c.key];
                                return (
                                  <div
                                    key={c.key}
                                    className="flex flex-col gap-1"
                                  >
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                      <span className="truncate text-white/80">
                                        {cMeta.label}
                                      </span>
                                      <span className="shrink-0 font-bold text-white">
                                        {row.evalCount > 0
                                          ? scope === "own"
                                            ? val
                                            : val.toFixed(1)
                                          : "—"}
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                      <div
                                        className="h-full rounded-full bg-white"
                                        style={{ width: `${(val / 10) * 100}%` }}
                                      />
                                    </div>
                                    <span className="truncate text-[10px] text-white/45">
                                      {row.evalCount > 0
                                        ? getLocalizedRangeLabel(
                                            c.key,
                                            Math.round(val),
                                            locale
                                          )
                                        : t.noDataLabel}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {scope === "community" && ownRow ? (
                          <p className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[11px] text-white/65">
                            {t.personalRefPrefix} #{ownRefVersusRank}{" "}
                            {t.personalRefInVersus} (Elo{" "}
                            {ownRow.rating.rating} · {ownRow.rating.wins}W-
                            {ownRow.rating.losses}L) · #{ownRefScoreRank}{" "}
                            {t.personalRefInScore} (
                            {ownRow.evalCount > 0
                              ? `${ownRow.average.toFixed(1)}/10`
                              : "—"}
                            )
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
