import type { MatchupPair } from "./types";

export function makePairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}__${idB}` : `${idB}__${idA}`;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates all unique round-robin matchups (C(n, 2) = 595 for n = 35).
 * The first ceil(n / 2) = 18 matchups cover every single participant at least once
 * so the user evaluates all 35 participants in the minimum number of duels.
 */
export function generateMatchupQueue(participantIds: string[]): MatchupPair[] {
  const shuffledIds = shuffle(participantIds);
  const openingPairs: MatchupPair[] = [];
  const usedKeys = new Set<string>();

  for (let i = 0; i + 1 < shuffledIds.length; i += 2) {
    const a = shuffledIds[i];
    const b = shuffledIds[i + 1];
    const pairKey = makePairKey(a, b);
    usedKeys.add(pairKey);
    openingPairs.push({ a, b, pairKey });
  }

  // When n is odd (35), pair the 35th participant against a random already-seen rival.
  if (shuffledIds.length % 2 === 1) {
    const last = shuffledIds[shuffledIds.length - 1];
    const rivalPool = shuffledIds.slice(0, -1);
    const rival = rivalPool[Math.floor(Math.random() * rivalPool.length)];
    const [a, b] = Math.random() < 0.5 ? [last, rival] : [rival, last];
    const pairKey = makePairKey(a, b);
    usedKeys.add(pairKey);
    openingPairs.push({ a, b, pairKey });
  }

  const remainingPairs: MatchupPair[] = [];
  for (let i = 0; i < shuffledIds.length; i++) {
    for (let j = i + 1; j < shuffledIds.length; j++) {
      const id1 = shuffledIds[i];
      const id2 = shuffledIds[j];
      const pairKey = makePairKey(id1, id2);
      if (usedKeys.has(pairKey)) continue;
      const [a, b] = Math.random() < 0.5 ? [id1, id2] : [id2, id1];
      remainingPairs.push({ a, b, pairKey });
    }
  }

  return [...openingPairs, ...shuffle(remainingPairs)];
}
