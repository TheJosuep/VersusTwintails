import rawParticipants from "@/data/participants.json";
import { getSwissTotalMatchups, SWISS_TOTAL_ROUNDS } from "./matchmaking";
import type { Participant } from "./types";

export const PARTICIPANTS: Participant[] = rawParticipants as Participant[];

export const PARTICIPANT_MAP = new Map<string, Participant>(
  PARTICIPANTS.map((p) => [p.id, p])
);

export const TOTAL_PARTICIPANTS = PARTICIPANTS.length;
export const SWISS_ROUNDS = SWISS_TOTAL_ROUNDS;
export const TOTAL_MATCHUPS = getSwissTotalMatchups(TOTAL_PARTICIPANTS);
