import { generateMatchupQueue } from "./matchmaking";
import { PARTICIPANTS } from "./participants";
import { supabase } from "./supabase";
import type {
  MatchupPair,
  Scores,
  VtEvaluation,
  VtMatch,
  VtUser,
} from "./types";

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface LoadedSession {
  user: VtUser;
  evaluations: VtEvaluation[];
  matches: VtMatch[];
  isReturning: boolean;
}

// ponytail: Simple username-based recovery without passwords; upgrade path is Supabase Auth if multi-device privacy is needed.
export async function loadOrCreateUser(
  rawDisplayName: string
): Promise<LoadedSession> {
  const displayName = rawDisplayName.trim().replace(/\s+/g, " ");
  const username = normalizeUsername(displayName);
  if (!username) {
    throw new Error("Ingresa un nombre de usuario válido.");
  }

  const { data: existing, error: selectError } = await supabase
    .from("vt_users")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (selectError) {
    throw new Error(`No se pudo consultar el usuario: ${selectError.message}`);
  }

  if (existing) {
    const user = existing as VtUser;
    const [evalRes, matchRes] = await Promise.all([
      supabase.from("vt_evaluations").select("*").eq("user_id", user.id),
      supabase.from("vt_matches").select("*").eq("user_id", user.id),
    ]);

    if (evalRes.error) {
      throw new Error(
        `No se pudieron recuperar tus evaluaciones: ${evalRes.error.message}`
      );
    }
    if (matchRes.error) {
      throw new Error(
        `No se pudieron recuperar tus duelos: ${matchRes.error.message}`
      );
    }

    if (!Array.isArray(user.matchup_queue) || user.matchup_queue.length === 0) {
      const queue = generateMatchupQueue(PARTICIPANTS.map((p) => p.id));
      const { data: updated } = await supabase
        .from("vt_users")
        .update({ matchup_queue: queue, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select("*")
        .single();
      if (updated) {
        return {
          user: updated as VtUser,
          evaluations: (evalRes.data ?? []) as VtEvaluation[],
          matches: (matchRes.data ?? []) as VtMatch[],
          isReturning: true,
        };
      }
    }

    return {
      user,
      evaluations: (evalRes.data ?? []) as VtEvaluation[],
      matches: (matchRes.data ?? []) as VtMatch[],
      isReturning: true,
    };
  }

  const queue = generateMatchupQueue(PARTICIPANTS.map((p) => p.id));
  const { data: created, error: insertError } = await supabase
    .from("vt_users")
    .insert({
      username,
      display_name: displayName,
      matchup_queue: queue,
      current_matchup_index: 0,
      is_completed: false,
    })
    .select("*")
    .single();

  if (insertError || !created) {
    throw new Error(
      `No se pudo crear el usuario: ${insertError?.message ?? "Error desconocido"}`
    );
  }

  return {
    user: created as VtUser,
    evaluations: [],
    matches: [],
    isReturning: false,
  };
}

export interface SaveVotePayload {
  user: VtUser;
  pair: MatchupPair;
  winnerId: string;
  evaluationsToUpsert: Array<{ participantId: string; scores: Scores }>;
  nextIndex: number;
  markCompleted: boolean;
}

export async function saveMatchupVote(payload: SaveVotePayload): Promise<{
  evaluations: VtEvaluation[];
  match: VtMatch;
  user: VtUser;
}> {
  const now = new Date().toISOString();
  const {
    user,
    pair,
    winnerId,
    evaluationsToUpsert,
    nextIndex,
    markCompleted,
  } = payload;

  const evalPromise =
    evaluationsToUpsert.length > 0
      ? supabase
          .from("vt_evaluations")
          .upsert(
            evaluationsToUpsert.map((item) => ({
              user_id: user.id,
              participant_id: item.participantId,
              originality: item.scores.originality,
              symmetry: item.scores.symmetry,
              color_aspect: item.scores.color_aspect,
              facial_harmony: item.scores.facial_harmony,
              general_impact: item.scores.general_impact,
              updated_at: now,
            })),
            { onConflict: "user_id,participant_id" }
          )
          .select("*")
      : Promise.resolve({ data: [] as VtEvaluation[], error: null });

  const matchPromise = supabase
    .from("vt_matches")
    .upsert(
      {
        user_id: user.id,
        pair_key: pair.pairKey,
        participant_a_id: pair.a,
        participant_b_id: pair.b,
        winner_id: winnerId,
      },
      { onConflict: "user_id,pair_key" }
    )
    .select("*")
    .single();

  const userUpdate: Record<string, unknown> = {
    current_matchup_index: nextIndex,
    updated_at: now,
  };
  if (markCompleted && !user.is_completed) {
    userUpdate.is_completed = true;
    userUpdate.completed_at = now;
  }

  const userPromise = supabase
    .from("vt_users")
    .update(userUpdate)
    .eq("id", user.id)
    .select("*")
    .single();

  const [evalRes, matchRes, userRes] = await Promise.all([
    evalPromise,
    matchPromise,
    userPromise,
  ]);

  if (evalRes.error) {
    throw new Error(`Error al guardar evaluaciones: ${evalRes.error.message}`);
  }
  if (matchRes.error || !matchRes.data) {
    throw new Error(
      `Error al guardar el duelo: ${matchRes.error?.message ?? "Sin datos"}`
    );
  }
  if (userRes.error || !userRes.data) {
    throw new Error(
      `Error al actualizar progreso: ${userRes.error?.message ?? "Sin datos"}`
    );
  }

  return {
    evaluations: (evalRes.data ?? []) as VtEvaluation[],
    match: matchRes.data as VtMatch,
    user: userRes.data as VtUser,
  };
}

export async function validateAndCompleteSurvey(
  userId: string
): Promise<VtUser> {
  const { data: evalRows, error: evalErr } = await supabase
    .from("vt_evaluations")
    .select("participant_id")
    .eq("user_id", userId);

  if (evalErr) {
    throw new Error(`Error al validar envío: ${evalErr.message}`);
  }

  const evaluatedIds = new Set(
    (evalRows ?? []).map((r) => r.participant_id as string)
  );
  const missingCount = PARTICIPANTS.filter((p) => !evaluatedIds.has(p.id)).length;
  if (missingCount > 0) {
    throw new Error(
      `Faltan ${missingCount} participantes por evaluar antes de finalizar.`
    );
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateErr } = await supabase
    .from("vt_users")
    .update({
      is_completed: true,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (updateErr || !updated) {
    throw new Error(
      `No se pudo finalizar el envío: ${updateErr?.message ?? "Sin datos"}`
    );
  }

  return updated as VtUser;
}

export interface GlobalResultsPayload {
  evaluations: VtEvaluation[];
  matches: VtMatch[];
}

// ponytail: Client-side aggregation across all rows; upgrade to a Postgres SQL view/RPC once submissions exceed ~5,000 rows.
export async function fetchGlobalResults(): Promise<GlobalResultsPayload> {
  const [evalRes, matchRes] = await Promise.all([
    supabase
      .from("vt_evaluations")
      .select(
        "user_id,participant_id,originality,symmetry,color_aspect,facial_harmony,general_impact"
      ),
    supabase
      .from("vt_matches")
      .select("user_id,participant_a_id,participant_b_id,winner_id"),
  ]);

  if (evalRes.error) {
    throw new Error(
      `Error al cargar evaluaciones globales: ${evalRes.error.message}`
    );
  }
  if (matchRes.error) {
    throw new Error(`Error al cargar duelos globales: ${matchRes.error.message}`);
  }

  return {
    evaluations: (evalRes.data ?? []) as VtEvaluation[],
    matches: (matchRes.data ?? []) as VtMatch[],
  };
}
