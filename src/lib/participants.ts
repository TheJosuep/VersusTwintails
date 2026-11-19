import rawParticipants from "@/data/participants.json";
import type { Participant } from "./types";

export const PARTICIPANTS: Participant[] = rawParticipants as Participant[];

export const PARTICIPANT_MAP = new Map<string, Participant>(
  PARTICIPANTS.map((p) => [p.id, p])
);

export const TOTAL_PARTICIPANTS = PARTICIPANTS.length;
export const TOTAL_MATCHUPS = (TOTAL_PARTICIPANTS * (TOTAL_PARTICIPANTS - 1)) / 2;
