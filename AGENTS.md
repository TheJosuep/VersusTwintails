# AGENTS.md — Versus Twintails

## Arquitectura del Proyecto
- **Stack:** Next.js 15 (App Router, TypeScript), React 19, Tailwind CSS v4, Swiper.js (`swiper`), Lucide Icons, Supabase JS (`@supabase/supabase-js`).
- **Estilo:** Mobile-first oscuro (`#000000` fondo, `#ffffff` acentos), bordes `rounded-[25px]`, `backdrop-blur`, títulos grandes y subtítulos pequeños.
- **Lógica del Torneo (Opción B):**
  - 35 participantes y 347 imágenes descargadas desde Google Drive en `public/participants/<id>/` y catalogadas en `src/data/participants.json`.
  - Cola de emparejamientos (`src/lib/matchmaking.ts`): genera los $\binom{35}{2} = 595$ pares únicos todos-contra-todos. Los primeros **18 duelos** cubren a las 35 participantes al menos una vez para evaluarlas una sola vez en los 5 criterios (`0–10` en `src/lib/criteria.ts`, sin "Resultado final"). Los duelos siguientes muestran las evaluaciones guardadas en formato compacto editable para elegir ganadora rápidamente.
  - Al evaluar a las 35 participantes (`is_completed = true`), se desbloquea la pestaña **Tabla de resultados** (`src/components/ResultsView.tsx`), que usa collapsibles por participante con comparación en 2 columnas: **Evaluaciones generales** (izquierda) vs. **Evaluaciones propias** (derecha).
  - Todos los carruseles y el modal de zoom (`src/components/ParticipantGallery.tsx`, `src/components/ImageZoomModal.tsx`) utilizan **Swiper.js** (`Thumbs`, `FreeMode`, `Zoom`, `Navigation`, `Pagination`).

## Base de Datos (Supabase `bxgcherndynauzqnyrdg`)
Tablas independientes prefijadas con `vt_` (no tocar las tablas financieras existentes del proyecto):
- `public.vt_participants`: catálogo de las 35 participantes (`id`, `name`, `group_name`, `folder_name`, `images`). Solo lectura para `anon`/`authenticated`.
- `public.vt_users`: usuarios por nombre simple (`username` único normalizado, `display_name`, `matchup_queue`, `current_matchup_index`, `is_completed`, `completed_at`).
- `public.vt_evaluations`: evaluación única por `(user_id, participant_id)` con los 5 criterios (`originality`, `symmetry`, `color_aspect`, `facial_harmony`, `general_impact`, `0–10`).
- `public.vt_matches`: historial de duelos `(user_id, pair_key)` con `participant_a_id`, `participant_b_id` y `winner_id`.

## Scripts y Verificación
- `npm run sync:drive` (`scripts/sync-drive-images.mjs`): lista y descarga imágenes desde Drive (`14ztsw_4GTMGKbfY73J0JZi4ERm8kOCEK`) hacia `public/participants/` y regenera `src/data/participants.json`.
- `npm run check` (`scripts/self-check.mjs`): valida integridad de 35 participantes, 347 imágenes, algoritmo de 595 duelos y conectividad con las 4 tablas `vt_*` en Supabase.
- `npm run build`: compilación de producción Next.js y chequeo de tipos.
