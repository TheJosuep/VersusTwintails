import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const PARTICIPANTS_PATH = path.resolve("src/data/participants.json");
const participants = JSON.parse(fs.readFileSync(PARTICIPANTS_PATH, "utf8"));

// 1. Validate 35 participants & all downloaded images
assert.equal(participants.length, 35, `Expected 35 participants, got ${participants.length}`);

let totalImages = 0;
for (const p of participants) {
  assert.ok(p.id && p.name, "Participant must have id and name");
  assert.ok(Array.isArray(p.images) && p.images.length >= 9, `${p.name} should have images`);
  for (const rel of p.images) {
    const abs = path.resolve("public", rel.replace(/^\/+/, ""));
    assert.ok(fs.existsSync(abs), `Missing image on disk: ${abs}`);
    const stat = fs.statSync(abs);
    assert.ok(stat.size > 0, `Empty image file: ${abs}`);
    totalImages++;
  }
}
console.log(`PASS [assets]: ${participants.length} participants, ${totalImages} verified images.`);

// 2. Load real TypeScript matchmaking module and run 100 Swiss simulations + Bradley-Terry sanity check
const mmSource = fs.readFileSync(path.resolve("src/lib/matchmaking.ts"), "utf8");
const compiled = ts.transpileModule(mmSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const mod = { exports: {} };
vm.runInNewContext(compiled, {
  module: mod,
  exports: mod.exports,
  Math,
  Map,
  Set,
  Array,
});
const {
  SWISS_TOTAL_ROUNDS,
  getSwissTotalMatchups,
  generateRound1,
  generateNextSwissRound,
  computeBradleyTerryRatings,
  generateCatchupMatches,
} = mod.exports;

const ids = participants.map((p) => p.id);
const trueStrength = new Map(ids.map((id, idx) => [id, idx])); // 0 (weakest) .. 34 (strongest)
const expectedTotal = getSwissTotalMatchups(ids.length);
assert.equal(SWISS_TOTAL_ROUNDS, 4);
assert.equal(expectedTotal, 70);

let spearmanSum = 0;
let top5InTop10Hits = 0;

for (let sim = 0; sim < 100; sim++) {
  const played = [];
  const r1 = generateRound1(ids);
  assert.equal(r1.length, 18, "Round 1 must have 18 duels");

  const r1Covered = new Set();
  for (const pair of r1) {
    r1Covered.add(pair.a);
    r1Covered.add(pair.b);
    const sa = trueStrength.get(pair.a);
    const sb = trueStrength.get(pair.b);
    const pA = 1 / (1 + Math.exp(-(sa - sb) / 5));
    const winner = Math.random() < pA ? pair.a : pair.b;
    played.push({
      pair_key: pair.pairKey,
      participant_a_id: pair.a,
      participant_b_id: pair.b,
      winner_id: winner,
    });
  }
  assert.equal(r1Covered.size, 35, "Round 1 must cover all 35 participants");

  for (const [roundNum, expectedLen] of [
    [2, 17],
    [3, 18],
    [4, 17],
  ]) {
    const roundPairs = generateNextSwissRound(ids, played, roundNum);
    assert.equal(
      roundPairs.length,
      expectedLen,
      `Round ${roundNum} must have ${expectedLen} duels`
    );
    for (const pair of roundPairs) {
      assert.notEqual(pair.a, pair.b, "Self-matchup forbidden");
      const sa = trueStrength.get(pair.a);
      const sb = trueStrength.get(pair.b);
      const pA = 1 / (1 + Math.exp(-(sa - sb) / 5));
      const winner = Math.random() < pA ? pair.a : pair.b;
      played.push({
        pair_key: pair.pairKey,
        participant_a_id: pair.a,
        participant_b_id: pair.b,
        winner_id: winner,
      });
    }
  }

  assert.equal(played.length, 70, "Total matches must be 70");
  assert.equal(
    new Set(played.map((m) => m.pair_key)).size,
    70,
    "All 70 matchups must be unique (0 rematches)"
  );

  const ratings = computeBradleyTerryRatings(ids, played);
  for (const id of ids) {
    assert.equal(
      ratings.get(id).played,
      4,
      `Participant ${id} played ${ratings.get(id).played} != 4`
    );
  }

  const ranked = [...ids].sort(
    (a, b) => ratings.get(b).rating - ratings.get(a).rating
  );
  const top10 = new Set(ranked.slice(0, 10));
  for (const trueTop of ids.slice(-5)) {
    if (top10.has(trueTop)) top5InTop10Hits++;
  }

  // Spearman rank correlation between estimated rank (0..34 ascending) and trueStrength (0..34)
  const estOrder = [...ranked].reverse();
  let d2 = 0;
  for (let i = 0; i < estOrder.length; i++) {
    const d = i - trueStrength.get(estOrder[i]);
    d2 += d * d;
  }
  const n = ids.length;
  const rho = 1 - (6 * d2) / (n * (n * n - 1));
  spearmanSum += rho;
}

const avgSpearman = spearmanSum / 100;
assert.ok(
  avgSpearman >= 0.7,
  `Expected average Spearman >= 0.70, got ${avgSpearman.toFixed(3)}`
);

// Also verify legacy catchup pairing fills 38 -> 70 without duplicates
const sampleLegacy = generateRound1(ids)
  .slice(0, 18)
  .map((p) => ({
    pair_key: p.pairKey,
    participant_a_id: p.a,
    participant_b_id: p.b,
    winner_id: p.a,
  }));
const catchup = generateCatchupMatches(ids, sampleLegacy, 70);
assert.equal(catchup.length, 52, "Catchup should generate remaining 52 duels");
assert.equal(
  new Set([...sampleLegacy.map((m) => m.pair_key), ...catchup.map((m) => m.pairKey)]).size,
  70,
  "Legacy catchup must not repeat pairs"
);

console.log(
  `PASS [swiss+bt]: 100x 4-round simulations (70 unique duels, 4 per participant, avg Spearman=${avgSpearman.toFixed(3)}, top5-in-top10=${(top5InTop10Hits / 5).toFixed(1)}%).`
);

// 3. Validate live Supabase Data API connectivity & vt_* tables
const envFile = fs.readFileSync(path.resolve(".env.local"), "utf8");
const env = Object.fromEntries(
  envFile
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert.ok(url && key, "Missing Supabase env vars in .env.local");

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
};

const resParticipants = await fetch(`${url}/rest/v1/vt_participants?select=id`, { headers });
assert.equal(resParticipants.status, 200, `vt_participants HTTP ${resParticipants.status}`);
const dbParticipants = await resParticipants.json();
assert.equal(dbParticipants.length, 35, `Expected 35 rows in vt_participants, got ${dbParticipants.length}`);

for (const table of ["vt_users", "vt_evaluations", "vt_matches"]) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, { headers });
  assert.equal(res.status, 200, `${table} returned HTTP ${res.status}`);
}
console.log("PASS [supabase]: All 4 vt_* tables reachable and vt_participants has 35 rows.");
