"use client";

import { CRITERIA } from "@/lib/criteria";
import { TOTAL_MATCHUPS, TOTAL_PARTICIPANTS } from "@/lib/participants";

export function HelpView() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[25px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md sm:p-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Cómo funciona
        </h2>
        <p className="mt-1 text-xs text-white/55">
          Guía rápida del torneo todos contra todos
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              step: "01",
              title: "Usuario y autoguardado",
              desc: "Tu progreso se guarda en la nube con tu nombre de usuario. Puedes salir y retomarlo después.",
            },
            {
              step: "02",
              title: "Compara con zoom",
              desc: "Desliza entre las fotos o usa las miniaturas inferiores. Toca cualquier imagen para abrir el zoom.",
            },
            {
              step: "03",
              title: "Evalúa una vez y elige ganadora",
              desc: `Califica del 0 al 10 a las ${TOTAL_PARTICIPANTS} participantes la primera vez que aparecen. En duelos siguientes solo eliges a la ganadora.`,
            },
            {
              step: "04",
              title: "Desbloquea resultados",
              desc: `Al completar las ${TOTAL_PARTICIPANTS} evaluaciones se desbloquea la Tabla de resultados y puedes seguir jugando los ${TOTAL_MATCHUPS} duelos.`,
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
