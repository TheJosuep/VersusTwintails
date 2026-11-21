import type { VtEvaluation } from "./types";

export type ExclusionReason =
  | "default_five_spam"
  | "low_variance"
  | "uniform_spam"
  | "extreme_polarization";

export interface QualityFilterResult {
  trustedEvaluations: VtEvaluation[];
  trustedUserIds: Set<string>;
  excludedUsers: Map<string, ExclusionReason>;
  trustedUserCount: number;
  excludedUserCount: number;
}

export function isAllFiveEvaluation(ev: {
  originality: number;
  symmetry: number;
  color_aspect: number;
  facial_harmony: number;
  general_impact: number;
}): boolean {
  return (
    ev.originality === 5 &&
    ev.symmetry === 5 &&
    ev.color_aspect === 5 &&
    ev.facial_harmony === 5 &&
    ev.general_impact === 5
  );
}

function evalAverage(ev: VtEvaluation): number {
  return (
    (ev.originality +
      ev.symmetry +
      ev.color_aspect +
      ev.facial_harmony +
      ev.general_impact) /
    5
  );
}

/**
 * Filters out low-effort default-5 spam, flat-variance ballots, uniform-tuple favoritism,
 * and extreme 0/10 polarization before computing Community averages.
 * Does not mutate database rows or hide a user's own votes in "My results".
 */
// ponytail: Deterministic user-level outlier guard; upgrade to median/trimmed-mean per participant if user count exceeds ~500.
export function filterTrustedEvaluations(
  evaluations: VtEvaluation[]
): QualityFilterResult {
  const byUser = new Map<string, VtEvaluation[]>();
  for (const ev of evaluations) {
    const list = byUser.get(ev.user_id) ?? [];
    list.push(ev);
    byUser.set(ev.user_id, list);
  }

  const trustedEvaluations: VtEvaluation[] = [];
  const trustedUserIds = new Set<string>();
  const excludedUsers = new Map<string, ExclusionReason>();

  for (const [userId, userEvals] of byUser.entries()) {
    const n = userEvals.length;
    const allFiveCount = userEvals.filter(isAllFiveEvaluation).length;

    if (n >= 5 && allFiveCount / n >= 0.35) {
      excludedUsers.set(userId, "default_five_spam");
      continue;
    }

    if (n >= 10) {
      const avgs = userEvals.map(evalAverage);
      const mean = avgs.reduce((acc, v) => acc + v, 0) / n;
      const variance =
        avgs.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / n;
      const stdDev = Math.sqrt(variance);

      if (stdDev < 0.3) {
        excludedUsers.set(userId, "low_variance");
        continue;
      }

      const tupleCounts = new Map<string, number>();
      let maxTupleCount = 0;
      for (const ev of userEvals) {
        const key = `${ev.originality},${ev.symmetry},${ev.color_aspect},${ev.facial_harmony},${ev.general_impact}`;
        const count = (tupleCounts.get(key) ?? 0) + 1;
        tupleCounts.set(key, count);
        if (count > maxTupleCount) maxTupleCount = count;
      }

      if (maxTupleCount / n >= 0.45) {
        excludedUsers.set(userId, "uniform_spam");
        continue;
      }
    }

    if (n >= 15) {
      const avgs = userEvals.map(evalAverage);
      const extremeCount = avgs.filter((a) => a <= 1.0 || a >= 9.8).length;
      const midCount = avgs.filter((a) => a > 1.0 && a < 9.8).length;

      if (extremeCount / n >= 0.8 && midCount / n < 0.15) {
        excludedUsers.set(userId, "extreme_polarization");
        continue;
      }
    }

    // For partial users (< 5 evals), keep genuine rows and drop individual unedited 5,5,5,5,5 rows.
    const kept =
      n < 5 ? userEvals.filter((ev) => !isAllFiveEvaluation(ev)) : userEvals;

    if (kept.length > 0) {
      trustedUserIds.add(userId);
      trustedEvaluations.push(...kept);
    }
  }

  return {
    trustedEvaluations,
    trustedUserIds,
    excludedUsers,
    trustedUserCount: trustedUserIds.size,
    excludedUserCount: excludedUsers.size,
  };
}
