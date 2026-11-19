"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, RefreshCw, Search } from "lucide-react";
import { CRITERIA, getRangeLabel } from "@/lib/criteria";
import { PARTICIPANTS } from "@/lib/participants";
import { fetchGlobalResults, type GlobalResultsPayload } from "@/lib/storage";
import type {
  CriterionKey,
  Participant,
  Scores,
  VtEvaluation,
  VtMatch,
} from "@/lib/types";

let cachedGlobalResults: GlobalResultsPayload | null = null;

interface ResultsViewProps {
  userId: string;
}

type SortKey = "global" | "own" | "winrate";

interface ParticipantStats {
  participant: Participant;
  globalVotes: number;
  globalCriteria: Scores;
  globalAverage: number;
  globalWins: number;
  globalMatches: number;
  globalWinRate: number;
  ownScores: Scores | null;
  ownAverage: number | null;
  ownWins: number;
  ownMatches: number;
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

export function ResultsView({ userId }: ResultsViewProps) {
  const [globalEvals, setGlobalEvals] = useState<VtEvaluation[]>(
    () => cachedGlobalResults?.evaluations ?? []
  );
  const [globalMatches, setGlobalMatches] = useState<VtMatch[]>(
    () => cachedGlobalResults?.matches ?? []
  );
  const [loading, setLoading] = useState(() => !cachedGlobalResults);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("global");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGlobalResults();
      cachedGlobalResults = res;
      setGlobalEvals(res.evaluations);
      setGlobalMatches(res.matches);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los resultados."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const statsList = useMemo<ParticipantStats[]>(() => {
    const evalMap = new Map<string, VtEvaluation[]>();
    const matchMap = new Map<string, { wins: number; total: number }>();
    const ownMatchMap = new Map<string, { wins: number; total: number }>();
    const ownEvalMap = new Map<string, VtEvaluation>();

    for (const ev of globalEvals) {
      const list = evalMap.get(ev.participant_id) ?? [];
      list.push(ev);
      evalMap.set(ev.participant_id, list);
      if (ev.user_id === userId) {
        ownEvalMap.set(ev.participant_id, ev);
      }
    }

    for (const m of globalMatches) {
      for (const pid of [m.participant_a_id, m.participant_b_id]) {
        const cur = matchMap.get(pid) ?? { wins: 0, total: 0 };
        cur.total += 1;
        if (m.winner_id === pid) cur.wins += 1;
        matchMap.set(pid, cur);

        if (m.user_id === userId) {
          const ownCur = ownMatchMap.get(pid) ?? { wins: 0, total: 0 };
          ownCur.total += 1;
          if (m.winner_id === pid) ownCur.wins += 1;
          ownMatchMap.set(pid, ownCur);
        }
      }
    }

    return PARTICIPANTS.map((participant) => {
      const evals = evalMap.get(participant.id) ?? [];
      const count = evals.length;
      const globalCriteria = emptyScores();

      if (count > 0) {
        for (const c of CRITERIA) {
          const sum = evals.reduce((acc, ev) => acc + Number(ev[c.key]), 0);
          globalCriteria[c.key] = sum / count;
        }
      }

      const globalAverage =
        count > 0
          ? CRITERIA.reduce((acc, c) => acc + globalCriteria[c.key], 0) /
            CRITERIA.length
          : 0;

      const gm = matchMap.get(participant.id) ?? { wins: 0, total: 0 };
      const om = ownMatchMap.get(participant.id) ?? { wins: 0, total: 0 };
      const ownEv = ownEvalMap.get(participant.id);

      const ownScores: Scores | null = ownEv
        ? {
            originality: ownEv.originality,
            symmetry: ownEv.symmetry,
            color_aspect: ownEv.color_aspect,
            facial_harmony: ownEv.facial_harmony,
            general_impact: ownEv.general_impact,
          }
        : null;

      const ownAverage = ownScores
        ? CRITERIA.reduce((acc, c) => acc + ownScores[c.key], 0) /
          CRITERIA.length
        : null;

      return {
        participant,
        globalVotes: count,
        globalCriteria,
        globalAverage,
        globalWins: gm.wins,
        globalMatches: gm.total,
        globalWinRate: gm.total > 0 ? (gm.wins / gm.total) * 100 : 0,
        ownScores,
        ownAverage,
        ownWins: om.wins,
        ownMatches: om.total,
      };
    });
  }, [globalEvals, globalMatches, userId]);

  const sortedAndFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? statsList.filter(
          (s) =>
            s.participant.name.toLowerCase().includes(q) ||
            (s.participant.group ?? "").toLowerCase().includes(q)
        )
      : statsList;

    return [...filtered].sort((a, b) => {
      if (sortBy === "own") {
        return (b.ownAverage ?? -1) - (a.ownAverage ?? -1);
      }
      if (sortBy === "winrate") {
        return b.globalWinRate - a.globalWinRate || b.globalWins - a.globalWins;
      }
      return b.globalAverage - a.globalAverage || b.globalWinRate - a.globalWinRate;
    });
  }, [statsList, search, sortBy]);

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Minimalist Top Bar */}
      <div className="flex flex-col gap-3 rounded-[25px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Tabla de resultados
          </h2>
          <p className="text-xs text-white/55">
            Toca una participante para comparar evaluaciones generales y propias
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-[25px] border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white hover:text-black active:scale-95 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar participante o grupo..."
            className="w-full rounded-[25px] border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 backdrop-blur-md outline-none transition focus:border-white/35"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-[25px] border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md">
          {(
            [
              { key: "global", label: "Global" },
              { key: "own", label: "Mis votos" },
              { key: "winrate", label: "% Victorias" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSortBy(opt.key)}
              className={`flex-1 rounded-[20px] px-3 py-1.5 text-xs font-medium transition sm:flex-initial ${
                sortBy === opt.key
                  ? "bg-white text-black"
                  : "text-white/65 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-[25px] border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      {loading && globalEvals.length === 0 ? (
        <div className="rounded-[25px] border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-white/60">
          Cargando resultados...
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedAndFiltered.map((item, idx) => {
            const isOpen = Boolean(openIds[item.participant.id]);
            const diffAvg =
              item.ownAverage !== null
                ? item.ownAverage - item.globalAverage
                : null;

            return (
              <div
                key={item.participant.id}
                className="overflow-hidden rounded-[25px] border border-white/10 bg-white/[0.04] backdrop-blur-md transition hover:border-white/20"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.participant.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 p-3.5 text-left transition hover:bg-white/[0.03] sm:p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-6 shrink-0 text-center text-xs font-bold text-white/45">
                      #{idx + 1}
                    </span>
                    <img
                      src={item.participant.images[0]}
                      alt={item.participant.name}
                      loading="lazy"
                      className="h-12 w-12 shrink-0 rounded-[14px] border border-white/10 object-cover object-top"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
                        {item.participant.name}
                      </h3>
                      <p className="truncate text-xs text-white/55">
                        {item.participant.group ?? "Sin grupo"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <div className="hidden items-center gap-1.5 sm:flex">
                      <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/85">
                        Global {item.globalAverage.toFixed(1)}
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                        Tú {item.ownAverage !== null ? item.ownAverage.toFixed(1) : "—"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-xs text-white/70">
                        {Math.round(item.globalWinRate)}% W
                      </span>
                    </div>

                    <div className="flex flex-col items-end sm:hidden">
                      <span className="text-sm font-bold text-white">
                        {item.globalAverage.toFixed(1)}
                      </span>
                      <span className="text-[11px] text-white/55">
                        Tú {item.ownAverage !== null ? item.ownAverage.toFixed(1) : "—"}
                      </span>
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 text-white/60 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Collapsible Body: 2 columns side-by-side (General first left, Own second right) */}
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-white/10 p-3.5 sm:p-5">
                      <div className="grid grid-cols-2 gap-3 sm:gap-6">
                        {/* Column 1: General (Global) Evaluations */}
                        <div className="flex flex-col gap-3 rounded-[20px] border border-white/10 bg-black/55 p-3 sm:p-4">
                          <div className="flex flex-col gap-0.5 border-b border-white/10 pb-2.5">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                              Evaluaciones generales
                            </span>
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-xl font-bold text-white sm:text-2xl">
                                {item.globalAverage.toFixed(1)}
                              </span>
                              <span className="text-[11px] text-white/55">
                                {item.globalVotes} evals
                              </span>
                            </div>
                            <span className="text-[11px] text-white/60">
                              Versus: {item.globalWins}/{item.globalMatches} (
                              {Math.round(item.globalWinRate)}%)
                            </span>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {CRITERIA.map((c) => {
                              const val = item.globalCriteria[c.key as CriterionKey];
                              return (
                                <div key={c.key} className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs">
                                    <span className="truncate text-white/80">
                                      {c.label}
                                    </span>
                                    <span className="shrink-0 font-bold text-white">
                                      {val.toFixed(1)}
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                    <div
                                      className="h-full rounded-full bg-white/80"
                                      style={{ width: `${(val / 10) * 100}%` }}
                                    />
                                  </div>
                                  <span className="truncate text-[10px] text-white/45">
                                    {getRangeLabel(c, Math.round(val))}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Column 2: Own (Personal) Evaluations */}
                        <div className="flex flex-col gap-3 rounded-[20px] border border-white/15 bg-white/[0.04] p-3 sm:p-4">
                          <div className="flex flex-col gap-0.5 border-b border-white/10 pb-2.5">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/65">
                              Evaluaciones propias
                            </span>
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-xl font-bold text-white sm:text-2xl">
                                {item.ownAverage !== null
                                  ? item.ownAverage.toFixed(1)
                                  : "—"}
                              </span>
                              {diffAvg !== null ? (
                                <span className="rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                                  {diffAvg >= 0 ? "+" : ""}
                                  {diffAvg.toFixed(1)}
                                </span>
                              ) : null}
                            </div>
                            <span className="text-[11px] text-white/60">
                              Tus duelos: {item.ownWins}/{item.ownMatches} (
                              {item.ownMatches > 0
                                ? Math.round((item.ownWins / item.ownMatches) * 100)
                                : 0}
                              %)
                            </span>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {CRITERIA.map((c) => {
                              const ownVal = item.ownScores
                                ? item.ownScores[c.key as CriterionKey]
                                : null;
                              const globalVal =
                                item.globalCriteria[c.key as CriterionKey];
                              const diff =
                                ownVal !== null ? ownVal - globalVal : null;

                              return (
                                <div key={c.key} className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs">
                                    <span className="truncate text-white/80">
                                      {c.label}
                                    </span>
                                    <span className="shrink-0 font-bold text-white">
                                      {ownVal !== null ? ownVal : "—"}
                                      {diff !== null ? (
                                        <span className="ml-1 text-[10px] font-normal text-white/50">
                                          ({diff >= 0 ? "+" : ""}
                                          {diff.toFixed(1)})
                                        </span>
                                      ) : null}
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                    <div
                                      className="h-full rounded-full bg-white"
                                      style={{
                                        width: `${((ownVal ?? 0) / 10) * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="truncate text-[10px] text-white/50">
                                    {ownVal !== null
                                      ? getRangeLabel(c, ownVal)
                                      : "Sin evaluar"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
