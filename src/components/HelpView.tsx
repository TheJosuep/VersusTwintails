"use client";

import { CRITERIA } from "@/lib/criteria";
import {
  SWISS_ROUNDS,
  TOTAL_MATCHUPS,
  TOTAL_PARTICIPANTS,
} from "@/lib/participants";

export function HelpView() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[25px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md sm:p-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Cómo funciona
        </h2>
        <p className="mt-1 text-xs text-white/55">
          Torneo Suizo de {SWISS_ROUNDS} rondas · {TOTAL_MATCHUPS} duelos totales
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              step: "01",
              title: "Rondas suizas en 70 duelos",
              desc: `En lugar de 595 duelos, el formato Suizo enfrenta a las ${TOTAL_PARTICIPANTS} participantes en ${SWISS_ROUNDS} rondas (${TOTAL_MATCHUPS} duelos) emparejando rivales de nivel similar.`,
            },
            {
              step: "02",
              title: "Pantalla de luz global",
              desc: "En móvil toca la imagen para abrir la pantalla de luz con zoom; en escritorio pulsa el ícono [ ] de pantalla completa.",
            },
            {
              step: "03",
              title: "Evalúa una vez y elige ganadora",
              desc: `Califica del 0 al 10 en Ronda 1 (18 duelos). En las rondas 2–4 solo eliges a la ganadora para calcular el Rating Elo (Bradley-Terry).`,
            },
            {
              step: "04",
              title: "Resultados separados",
              desc: "Al terminar los 70 duelos puedes alternar entre Mis resultados y Comunidad, y ordenar por Versus (Elo) o por Puntuación (0–10).",
            },
          ].map((item) => (
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
          Escala de evaluación (0 a 10)
        </h3>
        <p className="mt-1 text-xs text-white/55">
          Referencia para los 5 criterios
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {CRITERIA.map((c) => (
            <div
              key={c.key}
              className="rounded-[20px] border border-white/10 bg-black/50 p-4"
            >
              <h4 className="text-sm font-semibold text-white">{c.label}</h4>
              <div className="mt-2.5 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="font-bold text-white/55">0–3 · </span>
                  <span className="text-white/80">{c.ranges.low}</span>
                </div>
                <div className="rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="font-bold text-white/70">4–7 · </span>
                  <span className="text-white/85">{c.ranges.mid}</span>
                </div>
                <div className="rounded-[12px] border border-white/15 bg-white/[0.07] px-3 py-2">
                  <span className="font-bold text-white">8–10 · </span>
                  <span className="text-white">{c.ranges.high}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
