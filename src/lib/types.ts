export interface Participant {
  id: string;
  name: string;
  group: string | null;
  folderName: string;
  images: string[];
}

export type CriterionKey =
  | "originality"
  | "symmetry"
  | "color_aspect"
  | "facial_harmony"
  | "general_impact";

export type Scores = Record<CriterionKey, number>;

export interface MatchupPair {
  a: string;
  b: string;
  pairKey: string;
}

export interface VtUser {
  id: string;
  username: string;
  display_name: string;
  matchup_queue: MatchupPair[];
  current_matchup_index: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface VtEvaluation {
  id?: string;
  user_id: string;
  participant_id: string;
  originality: number;
  symmetry: number;
  color_aspect: number;
  facial_harmony: number;
  general_impact: number;
  updated_at?: string;
}

export interface VtMatch {
  id?: string;
  user_id: string;
  pair_key: string;
  participant_a_id: string;
  participant_b_id: string;
  winner_id: string;
  created_at?: string;
}
