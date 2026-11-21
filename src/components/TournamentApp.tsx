"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Lock, LogOut, Sparkles } from "lucide-react";
import {
  PARTICIPANTS,
  SWISS_ROUNDS,
  TOTAL_MATCHUPS,
  TOTAL_PARTICIPANTS,
} from "@/lib/participants";
import { loadOrCreateUser } from "@/lib/storage";
import type { VtEvaluation, VtMatch, VtUser } from "@/lib/types";
import { LightboxProvider } from "./GlobalLightbox";
import { HelpView } from "./HelpView";
import { ResultsView } from "./ResultsView";
import { VersusView } from "./VersusView";

type TabIndex = 0 | 1 | 2;

const STORAGE_USERNAME_KEY = "vt_username";

export function TournamentApp() {
  const [user, setUser] = useState<VtUser | null>(null);
  const [evaluations, setEvaluations] = useState<VtEvaluation[]>([]);
  const [matches, setMatches] = useState<VtMatch[]>([]);

  const [usernameInput, setUsernameInput] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lockNotice, setLockNotice] = useState(false);

  const [activeTab, setActiveTab] = useState<TabIndex>(0);
  const [exitingTab, setExitingTab] = useState<TabIndex | null>(null);
  const [slideDir, setSlideDir] = useState<"forward" | "backward">("forward");
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const evaluationsMap = useMemo(() => {
    const map = new Map<string, VtEvaluation>();
    for (const ev of evaluations) {
      map.set(ev.participant_id, ev);
    }
    return map;
  }, [evaluations]);

  const evaluatedCount = useMemo(
    () => PARTICIPANTS.filter((p) => evaluationsMap.has(p.id)).length,
    [evaluationsMap]
  );

  const resultsUnlocked = Boolean(
    user &&
      (user.is_completed ||
        (evaluatedCount >= TOTAL_PARTICIPANTS &&
          matches.length >= TOTAL_MATCHUPS))
  );

  const signInWithUsername = useCallback(
    async (rawName: string, silentIfMissing = false) => {
      const cleaned = rawName.trim();
      if (!cleaned) {
        if (!silentIfMissing) setAuthError("Escribe un nombre de usuario.");
        return;
      }

      setAuthLoading(true);
      setAuthError(null);
      try {
        const loaded = await loadOrCreateUser(cleaned);
        setUser(loaded.user);
        setEvaluations(loaded.evaluations);
        setMatches(loaded.matches);
        setActiveTab(0);
        setExitingTab(null);
        try {
          localStorage.setItem(STORAGE_USERNAME_KEY, loaded.user.display_name);
        } catch {
          // Ignore storage error
        }

        if (loaded.isReturning) {
          showToast(
            loaded.user.is_completed
              ? `Torneo completado recuperado (${loaded.matches.length} duelos)`
              : `Progreso recuperado · ${Math.min(loaded.matches.length, TOTAL_MATCHUPS)}/${TOTAL_MATCHUPS} duelos`
          );
        } else {
          showToast(`Sesión creada para ${loaded.user.display_name}`);
        }
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : "No se pudo iniciar sesión."
        );
      } finally {
        setAuthLoading(false);
        setBootstrapping(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    let saved = "";
    try {
      saved = localStorage.getItem(STORAGE_USERNAME_KEY) ?? "";
    } catch {
      saved = "";
    }

    if (saved) {
      setUsernameInput(saved);
      void signInWithUsername(saved, true);
    } else {
      setBootstrapping(false);
    }
  }, [signInWithUsername]);

  const switchTab = (next: TabIndex) => {
    if (next === activeTab) return;
    if (next === 1 && !resultsUnlocked) {
      setLockNotice(true);
      setTimeout(() => setLockNotice(false), 2600);
      return;
    }

    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    setSlideDir(next > activeTab ? "forward" : "backward");
    setExitingTab(activeTab);
    setActiveTab(next);
    exitTimerRef.current = setTimeout(() => setExitingTab(null), 220);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_USERNAME_KEY);
    } catch {
      // Ignore
    }
    setUser(null);
    setEvaluations([]);
    setMatches([]);
    setActiveTab(0);
    setExitingTab(null);
    setAuthError(null);
  };

  const handleVoteSuccess = (res: {
    evaluations: VtEvaluation[];
    match: VtMatch;
    user: VtUser;
  }) => {
    setUser(res.user);
    setEvaluations((prev) => {
      const next = new Map(prev.map((e) => [e.participant_id, e]));
      for (const item of res.evaluations) {
        next.set(item.participant_id, item);
      }
      return Array.from(next.values());
    });
    setMatches((prev) => {
      const next = new Map(prev.map((m) => [m.pair_key, m]));
      next.set(res.match.pair_key, res.match);
      return Array.from(next.values());
    });
  };

  const renderTabContent = (tab: TabIndex) => {
    if (!user) return null;
    if (tab === 0) {
      return (
        <VersusView
          user={user}
          evaluationsMap={evaluationsMap}
          matches={matches}
          onVoteSuccess={handleVoteSuccess}
          onUserUpdated={setUser}
          onOpenResults={() => switchTab(1)}
        />
      );
    }
    if (tab === 1) {
      return (
        <ResultsView
          userId={user.id}
          ownEvaluations={evaluations}
          ownMatches={matches}
        />
      );
    }
    return <HelpView />;
  };

  if (bootstrapping) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="rounded-[25px] border border-white/10 bg-white/[0.04] px-6 py-4 text-sm text-white/70 backdrop-blur-md">
          Cargando torneo...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10">
        <div className="w-full max-w-md rounded-[25px] border border-white/15 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Torneo Suizo · {SWISS_ROUNDS} Rondas · {TOTAL_MATCHUPS} Duelos
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Versus Twintails
          </h1>
          <p className="mt-2 text-xs text-white/60">
            Ingresa tu nombre de usuario para iniciar, autoguardar o recuperar tu progreso.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void signInWithUsername(usernameInput);
            }}
            className="mt-6 flex flex-col gap-3"
          >
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Tu nombre de usuario"
              autoFocus
              maxLength={40}
              className="w-full rounded-[25px] border border-white/15 bg-black/70 px-5 py-3.5 text-sm text-white placeholder-white/35 outline-none transition focus:border-white"
            />

            {authError ? (
              <p className="px-2 text-xs text-red-300">{authError}</p>
            ) : null}

            <button
              type="submit"
              disabled={authLoading}
              className="mt-1 rounded-[25px] bg-white px-6 py-3.5 text-sm font-bold text-black transition hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
            >
              {authLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <LightboxProvider>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-3 py-5 sm:gap-6 sm:px-6 sm:py-8">
        {/* Minimalist Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Versus Twintails
            </h1>
            <p className="text-xs text-white/55">
              {user.display_name} ·{" "}
              {user.is_completed ? "Torneo completado" : "Autoguardado activo"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {user.is_completed ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Finalizado
              </span>
            ) : null}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md transition hover:bg-white hover:text-black active:scale-95"
              title="Cambiar usuario"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cambiar</span>
            </button>
          </div>
        </header>

        {/* Recovery / Save Toast */}
        {toast ? (
          <div className="flex items-center gap-2 self-start rounded-[25px] border border-white/20 bg-white/10 px-4 py-2 text-xs text-white backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{toast}</span>
          </div>
        ) : null}

        {/* 3-Button Animated Switch */}
        <div className="flex flex-col gap-2">
          <nav
            aria-label="Secciones"
            className="relative grid grid-cols-3 rounded-[25px] border border-white/12 bg-white/[0.05] p-1 backdrop-blur-md"
          >
            {/* Sliding active background */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-1 left-1 top-1 w-[calc((100%-8px)/3)] rounded-[21px] bg-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: `translateX(${activeTab * 100}%)` }}
            />

            <button
              type="button"
              onClick={() => switchTab(0)}
              className={`relative z-10 rounded-[21px] px-2 py-2.5 text-xs font-semibold transition-colors duration-200 sm:text-sm ${
                activeTab === 0
                  ? "text-black"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Versus
            </button>

            <button
              type="button"
              onClick={() => switchTab(1)}
              aria-disabled={!resultsUnlocked}
              className={`relative z-10 flex items-center justify-center gap-1.5 rounded-[21px] px-2 py-2.5 text-xs font-semibold transition-colors duration-200 sm:text-sm ${
                activeTab === 1
                  ? "text-black"
                  : resultsUnlocked
                    ? "text-white/70 hover:text-white"
                    : "text-white/40 hover:text-white/60"
              }`}
            >
              {!resultsUnlocked ? (
                <Lock className="h-3.5 w-3.5 shrink-0" />
              ) : null}
              <span className="truncate">Tabla de resultados</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab(2)}
              className={`relative z-10 rounded-[21px] px-2 py-2.5 text-xs font-semibold transition-colors duration-200 sm:text-sm ${
                activeTab === 2
                  ? "text-black"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Ayuda
            </button>
          </nav>

          {lockNotice ? (
            <p className="text-center text-xs text-white/70">
              Completa las {SWISS_ROUNDS} rondas suizas ({matches.length}/
              {TOTAL_MATCHUPS} duelos y {evaluatedCount}/{TOTAL_PARTICIPANTS}{" "}
              evaluadas) para desbloquear la Tabla de resultados.
            </p>
          ) : null}
        </div>

        {/* Section Content with Directional Slide In / Slide Out */}
        <section className="relative flex-1 overflow-hidden">
          {exitingTab !== null ? (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 ${
                slideDir === "forward"
                  ? "vt-slide-out-left"
                  : "vt-slide-out-right"
              }`}
            >
              {renderTabContent(exitingTab)}
            </div>
          ) : null}

          <div
            key={`tab-${activeTab}`}
            className={
              exitingTab !== null
                ? slideDir === "forward"
                  ? "vt-slide-in-right"
                  : "vt-slide-in-left"
                : ""
            }
          >
            {renderTabContent(activeTab)}
          </div>
        </section>
      </main>
    </LightboxProvider>
  );
}
