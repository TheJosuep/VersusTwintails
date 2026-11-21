import rawParticipants from "@/data/participants.json";
import type { Locale } from "./i18n";
import { getSwissTotalMatchups, SWISS_TOTAL_ROUNDS } from "./matchmaking";
import type { Participant } from "./types";

export const PARTICIPANTS: Participant[] = rawParticipants as Participant[];

export const PARTICIPANT_MAP = new Map<string, Participant>(
  PARTICIPANTS.map((p) => [p.id, p])
);

export const TOTAL_PARTICIPANTS = PARTICIPANTS.length;
export const SWISS_ROUNDS = SWISS_TOTAL_ROUNDS;
export const TOTAL_MATCHUPS = getSwissTotalMatchups(TOTAL_PARTICIPANTS);

export function getParticipantDisplay(
  participant: Participant,
  locale: Locale
): { name: string; group: string | null } {
  if (locale === "ja") {
    return {
      name: participant.nameJa ?? participant.name,
      group:
        participant.groupJa !== undefined
          ? participant.groupJa
          : participant.group,
    };
  }
  if (locale === "en" && participant.group === "≠ME, graduada") {
    return {
      name: participant.name,
      group: "≠ME, graduated",
    };
  }
  return {
    name: participant.name,
    group: participant.group,
  };
}
