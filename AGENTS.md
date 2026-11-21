# AGENTS.md — Versus Twintails

## Arquitectura del Proyecto
- **Stack:** Next.js 15 (App Router, TypeScript), React 19, Tailwind CSS v4, Swiper.js (`swiper`), Lucide Icons, Supabase JS (`@supabase/supabase-js`).
- **Estilo:** Mobile-first oscuro (`#000000` fondo, `#ffffff` acentos), bordes `rounded-[25px]`, `backdrop-blur`, títulos grandes y subtítulos pequeños.
- **Lógica del Torneo — Sistema Suizo de 4 Rondas (70 duelos) + Rating Bradley-Terry:**
  - 35 participantes y 347 imágenes descargadas desde Google Drive en `public/participants/<id>/` y catalogadas en `src/data/participants.json`.
  - **Emparejamiento Suizo (`src/lib/matchmaking.ts`):**
    - **Ronda 1 (18 duelos):** cubre a las 35 participantes una sola vez para evaluar sus 5 criterios (`0–10` en `src/lib/criteria.ts`, sin "Resultado final").
    - **Rondas 2, 3 y 4 (17 + 18 + 17 = 52 duelos):** se generan dinámicamente al finalizar cada ronda usando el rating Bradley-Terry actual (`computeBradleyTerryRatings`, escala Elo base 1500), emparejando rivales de nivel similar sin revanchas mediante backtracking (`pairEvenPool`). Al completar los **70 duelos**, cada una de las 35 participantes disputó exactamente **4 duelos únicos**.
    - Los usuarios heredados del sistema anterior de 595 duelos se migran automáticamente en `src/lib/storage.ts` sin perder votos ni evaluaciones previas.
  - **Tabla de Resultados Separada (`src/components/ResultsView.tsx`):**
    - Desbloqueable al completar los 70 duelos y las 35 evaluaciones (`is_completed = true`).
    - Permite alternar de forma separada el **Alcance** (`Mis resultados` vs `Comunidad`), el **Tipo de Ranking** (`Por Versus` por Elo/Buchholz vs `Por Puntuación` por promedio o cualquiera de los 5 criterios individuales), la dirección (`Mayor a menor` / `Menor a mayor`) y un podio Top 3 + collapsibles por participante con historial exacto de duelos.
  - **Pantalla de Luz Global (`src/components/GlobalLightbox.tsx`):**
    - Portal global sobre `document.body` (`z-[9999]`) con **Swiper.js** (`Zoom`, `Navigation`, `Pagination`, `Thumbs`, `FreeMode`, `Keyboard`).
    - **Móvil (`< 1024px`):** tocar directamente la imagen principal o el ícono `[ ]` abre la pantalla de luz.
    - **Escritorio (`>= 1024px`):** hacer clic sobre la imagen principal no abre la pantalla de luz; solo se abre mediante el botón `[ ]` (`Maximize`).

## Base de Datos (Supabase `bxgcherndynauzqnyrdg`)
Tablas independientes prefijadas con `vt_` (no tocar las tablas financieras existentes del proyecto):
- `public.vt_participants`: catálogo de las 35 participantes (`id`, `name`, `group_name`, `folder_name`, `images`). Solo lectura para `anon`/`authenticated`.
- `public.vt_users`: usuarios por nombre simple (`username` único normalizado, `display_name`, `matchup_queue`, `current_matchup_index`, `is_completed`, `completed_at`).
- `public.vt_evaluations`: evaluación única por `(user_id, participant_id)` con los 5 criterios (`originality`, `symmetry`, `color_aspect`, `facial_harmony`, `general_impact`, `0–10`).
- `public.vt_matches`: historial de duelos `(user_id, pair_key)` con `participant_a_id`, `participant_b_id` y `winner_id`.

## Scripts y Verificación
- `npm run sync:drive` (`scripts/sync-drive-images.mjs`): lista y descarga imágenes desde Drive (`14ztsw_4GTMGKbfY73J0JZi4ERm8kOCEK`) hacia `public/participants/` y regenera `src/data/participants.json`.
- `npm run check` (`scripts/self-check.mjs`): valida integridad de 35 participantes, 347 imágenes, 100 simulaciones completas del algoritmo Suizo de 4 rondas (70 duelos, 0 revanchas, 4 duelos por participante, correlación Bradley-Terry) y conectividad con las 4 tablas `vt_*` en Supabase.
- `npm run build`: compilación de producción Next.js y chequeo de tipos.
