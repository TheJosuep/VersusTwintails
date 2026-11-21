import type { MatchupPair, ParticipantRating } from "./types";

export const SWISS_TOTAL_ROUNDS = 4;

const ROUND_LABELS: Record<number, string> = {
  1: "Evaluación inicial",
  2: "Clasificación suiza",
  3: "Semifinales suizas",
  4: "Ronda final suiza",
};

export function getRoundLabel(round: number): string {
  return ROUND_LABELS[round] ?? `Ronda ${round}`;
}

/**
 * Total matches across 4 Swiss rounds so every participant plays exactly 4 duels:
 * For N = 35: R1 = 18, R2 = 17, R3 = 18, R4 = 17 -> 70 duels total.
 */
export function getSwissTotalMatchups(n: number): number {
  return (n * SWISS_TOTAL_ROUNDS) / 2;
}

export function getRoundMatchCounts(n: number): number[] {
  const counts: number[] = [];
  let oddExtraLastRound = false;
  for (let r = 1; r <= SWISS_TOTAL_ROUNDS; r++) {
    if (n % 2 === 0) {
      counts.push(n / 2);
    } else if (!oddExtraLastRound) {
      counts.push(Math.ceil(n / 2));
      oddExtraLastRound = true;
    } else {
      counts.push(Math.floor(n / 2));
      oddExtraLastRound = false;
    }
  }
  return counts;
}

export function getRoundForIndex(index: number, n = 35): number {
  const counts = getRoundMatchCounts(n);
  let acc = 0;
  for (let i = 0; i < counts.length; i++) {
    acc += counts[i];
    if (index < acc) return i + 1;
  }
  return SWISS_TOTAL_ROUNDS;
}

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

function randomizeSideOrder(
  id1: string,
  id2: string,
  round: number
): MatchupPair {
  const [a, b] = Math.random() < 0.5 ? [id1, id2] : [id2, id1];
  return { a, b, pairKey: makePairKey(a, b), round };
}

/**
 * Computes regularized Bradley-Terry ratings on an Elo scale (base 1500)
 * using 25 MM iterations with a virtual-draw prior (1 win + 1 loss vs average 1.0).
 * Order-independent and strength-of-schedule aware.
 */
// ponytail: Client-side 25-iteration MM solver; converges in <1ms for N=35 without external stats dependencies.
export function computeBradleyTerryRatings(
  participantIds: string[],
  matches: Array<{
    participant_a_id: string;
    participant_b_id: string;
    winner_id: string;
  }>
): Map<string, ParticipantRating> {
  const wins = new Map<string, number>();
  const losses = new Map<string, number>();
  const opponents = new Map<string, Map<string, number>>();

  for (const id of participantIds) {
    wins.set(id, 0);
    losses.set(id, 0);
    opponents.set(id, new Map());
  }

  for (const m of matches) {
    const a = m.participant_a_id;
    const b = m.participant_b_id;
    if (!opponents.has(a) || !opponents.has(b) || a === b) continue;

    if (m.winner_id === a) {
      wins.set(a, (wins.get(a) ?? 0) + 1);
      losses.set(b, (losses.get(b) ?? 0) + 1);
    } else if (m.winner_id === b) {
      wins.set(b, (wins.get(b) ?? 0) + 1);
      losses.set(a, (losses.get(a) ?? 0) + 1);
    }

    const oppA = opponents.get(a)!;
    const oppB = opponents.get(b)!;
    oppA.set(b, (oppA.get(b) ?? 0) + 1);
    oppB.set(a, (oppB.get(a) ?? 0) + 1);
  }

  const strength = new Map<string, number>(
    participantIds.map((id) => [id, 1.0])
  );

  for (let iter = 0; iter < 25; iter++) {
    const nextStrength = new Map<string, number>();
    let logSum = 0;

    for (const id of participantIds) {
      const w = (wins.get(id) ?? 0) + 1;
      let denom = 2 / ((strength.get(id) ?? 1) + 1);
      const oppMap = opponents.get(id)!;
      for (const [oppId, count] of oppMap.entries()) {
        denom += count / ((strength.get(id) ?? 1) + (strength.get(oppId) ?? 1));
      }
      const p = w / denom;
      nextStrength.set(id, p);
      logSum += Math.log(p);
    }

    const geoMean = Math.exp(logSum / Math.max(1, participantIds.length));
    for (const id of participantIds) {
      strength.set(id, (nextStrength.get(id) ?? 1) / geoMean);
    }
  }

  const rawRatings = new Map<string, number>();
  for (const id of participantIds) {
    const p = strength.get(id) ?? 1;
    rawRatings.set(id, Math.round(1500 + 400 * Math.log10(p)));
  }

  const result = new Map<string, ParticipantRating>();
  for (const id of participantIds) {
    const w = wins.get(id) ?? 0;
    const l = losses.get(id) ?? 0;
    const played = w + l;
    const oppMap = opponents.get(id)!;
    let oppRatingSum = 0;
    let oppGames = 0;
    for (const [oppId, count] of oppMap.entries()) {
      oppRatingSum += (rawRatings.get(oppId) ?? 1500) * count;
      oppGames += count;
    }

    result.set(id, {
      id,
      rating: rawRatings.get(id) ?? 1500,
      wins: w,
      losses: l,
      played,
      winRate: played > 0 ? (w / played) * 100 : 0,
      buchholz: oppGames > 0 ? Math.round(oppRatingSum / oppGames) : 1500,
    });
  }

  return result;
}

/**
 * Round 1: shuffles all participants and creates ceil(N / 2) pairs (18 for N = 35)
 * so every participant is evaluated once in Round 1.
 */
export function generateRound1(participantIds: string[]): MatchupPair[] {
  const shuffled = shuffle(participantIds);
  const pairs: MatchupPair[] = [];

  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    pairs.push(randomizeSideOrder(shuffled[i], shuffled[i + 1], 1));
  }

  if (shuffled.length % 2 === 1) {
    const last = shuffled[shuffled.length - 1];
    const rivalPool = shuffled.slice(0, -1);
    const rival = rivalPool[Math.floor(Math.random() * rivalPool.length)];
    pairs.push(randomizeSideOrder(last, rival, 1));
  }

  return pairs;
}

/**
 * Pairs an even-sized sorted pool into disjoint matchups without rematches,
 * using bounded backtracking that prioritizes adjacent ratings.
 */
function pairEvenPool(
  sortedIds: string[],
  playedKeys: Set<string>,
  roundNumber: number
): MatchupPair[] {
  const n = sortedIds.length;
  const used = new Array<boolean>(n).fill(false);
  const chosen: Array<[string, string]> = [];
  let steps = 0;
  const STEP_LIMIT = 5000;

  function backtrack(firstIdx: number): boolean {
    if (steps++ > STEP_LIMIT) return false;
    while (firstIdx < n && used[firstIdx]) firstIdx++;
    if (firstIdx >= n) return true;

    used[firstIdx] = true;
    const idA = sortedIds[firstIdx];

    for (let j = firstIdx + 1; j < n; j++) {
      if (used[j]) continue;
      const idB = sortedIds[j];
      if (playedKeys.has(makePairKey(idA, idB))) continue;

      used[j] = true;
      chosen.push([idA, idB]);
      if (backtrack(firstIdx + 1)) return true;
      chosen.pop();
      used[j] = false;
    }

    used[firstIdx] = false;
    return false;
  }

  if (backtrack(0)) {
    return shuffle(
      chosen.map(([a, b]) => randomizeSideOrder(a, b, roundNumber))
    );
  }

  // Fallback greedy pairing if tight constraints exceed step limit
  const fallbackUsed = new Set<string>();
  const fallbackPairs: MatchupPair[] = [];
  for (let i = 0; i < n; i++) {
    const a = sortedIds[i];
    if (fallbackUsed.has(a)) continue;
    let partner = sortedIds.find(
      (b, idx) =>
        idx > i && !fallbackUsed.has(b) && !playedKeys.has(makePairKey(a, b))
    );
    if (!partner) {
      partner = sortedIds.find((b, idx) => idx > i && !fallbackUsed.has(b));
    }
    if (partner) {
      fallbackUsed.add(a);
      fallbackUsed.add(partner);
      fallbackPairs.push(randomizeSideOrder(a, partner, roundNumber));
    }
  }
  return shuffle(fallbackPairs);
}

/**
 * Generates the next Swiss round (2, 3, or 4) based on live Bradley-Terry ratings,
 * balancing match counts so every participant finishes with exactly 4 unique duels.
 */
export function generateNextSwissRound(
  participantIds: string[],
  playedMatches: Array<{
    pair_key: string;
    participant_a_id: string;
    participant_b_id: string;
    winner_id: string;
  }>,
  roundNumber: number
): MatchupPair[] {
  const ratings = computeBradleyTerryRatings(participantIds, playedMatches);
  const playedKeys = new Set(playedMatches.map((m) => m.pair_key));

  // Add slight jitter to identical ratings before sorting so ties break randomly.
  const jitter = new Map(participantIds.map((id) => [id, Math.random()]));
  const sorted = [...participantIds].sort((a, b) => {
    const ra = ratings.get(a)!;
    const rb = ratings.get(b)!;
    if (rb.rating !== ra.rating) return rb.rating - ra.rating;
    if (rb.wins !== ra.wins) return rb.wins - ra.wins;
    return (jitter.get(a) ?? 0) - (jitter.get(b) ?? 0);
  });

  if (sorted.length % 2 === 0) {
    return pairEvenPool(sorted, playedKeys, roundNumber);
  }

  // Odd pool (N = 35):
  // - Even rounds (2, 4): the participant who already played an extra duel rests.
  // - Odd round (3): select a median participant as extraPlayer who plays twice in R3 (resting in R4).
  if (roundNumber % 2 === 0) {
    let restingId = sorted[sorted.length - 1];
    let maxPlayed = -1;
    for (const id of sorted) {
      const p = ratings.get(id)?.played ?? 0;
      if (p > maxPlayed) {
        maxPlayed = p;
        restingId = id;
      }
    }
    const activePool = sorted.filter((id) => id !== restingId);
    return pairEvenPool(activePool, playedKeys, roundNumber);
  }

  const midIdx = Math.floor(sorted.length / 2);
  const extraPlayer = sorted[midIdx];
  const restPool = sorted.filter((id) => id !== extraPlayer);
  const mainPairs = pairEvenPool(restPool, playedKeys, roundNumber);

  const extraRating = ratings.get(extraPlayer)?.rating ?? 1500;
  const candidateRivals = [...restPool]
    .filter((id) => !playedKeys.has(makePairKey(extraPlayer, id)))
    .sort((a, b) => {
      const da = Math.abs((ratings.get(a)?.rating ?? 1500) - extraRating);
      const db = Math.abs((ratings.get(b)?.rating ?? 1500) - extraRating);
      return da - db;
    });

  const extraRival = candidateRivals[0] ?? restPool[0];
  const extraPair = randomizeSideOrder(extraPlayer, extraRival, roundNumber);

  return shuffle([...mainPairs, extraPair]);
}

/**
 * Generates catch-up matchups for users migrating from the legacy 595-pair queue,
 * prioritizing under-played participants without duplicating existing pairs.
 */
export function generateCatchupMatches(
  participantIds: string[],
  playedMatches: Array<{
    pair_key: string;
    participant_a_id: string;
    participant_b_id: string;
    winner_id: string;
  }>,
  targetTotal: number
): MatchupPair[] {
  const needed = Math.max(0, targetTotal - playedMatches.length);
  if (needed === 0) return [];

  const ratings = computeBradleyTerryRatings(participantIds, playedMatches);
  const playedKeys = new Set(playedMatches.map((m) => m.pair_key));
  const counts = new Map<string, number>(
    participantIds.map((id) => [id, ratings.get(id)?.played ?? 0])
  );
  const extraPairs: MatchupPair[] = [];

  for (let k = 0; k < needed; k++) {
    const byPlayAsc = [...participantIds].sort((a, b) => {
      const ca = counts.get(a) ?? 0;
      const cb = counts.get(b) ?? 0;
      if (ca !== cb) return ca - cb;
      return (ratings.get(b)?.rating ?? 1500) - (ratings.get(a)?.rating ?? 1500);
    });

    const a = byPlayAsc[0];
    const ratingA = ratings.get(a)?.rating ?? 1500;
    const rival = byPlayAsc
      .slice(1)
      .filter((b) => !playedKeys.has(makePairKey(a, b)))
      .sort((x, y) => {
        const cx = counts.get(x) ?? 0;
        const cy = counts.get(y) ?? 0;
        if (cx !== cy) return cx - cy;
        return (
          Math.abs((ratings.get(x)?.rating ?? 1500) - ratingA) -
          Math.abs((ratings.get(y)?.rating ?? 1500) - ratingA)
        );
      })[0];

    if (!rival) break;

    const round = getRoundForIndex(
      playedMatches.length + extraPairs.length,
      participantIds.length
    );
    const pair = randomizeSideOrder(a, rival, round);
    playedKeys.add(pair.pairKey);
    counts.set(a, (counts.get(a) ?? 0) + 1);
    counts.set(rival, (counts.get(rival) ?? 0) + 1);
    extraPairs.push(pair);
  }

  return extraPairs;
}
