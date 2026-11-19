import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

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

// 2. Validate matchmaking algorithm (first 18 pairs cover all 35, total = 595 unique pairs)
function makePairKey(a, b) {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}
function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function generateQueue(ids) {
  const s = shuffle(ids);
  const opening = [];
  const used = new Set();
  for (let i = 0; i + 1 < s.length; i += 2) {
    const k = makePairKey(s[i], s[i + 1]);
    used.add(k);
    opening.push({ a: s[i], b: s[i + 1], pairKey: k });
  }
  if (s.length % 2 === 1) {
    const last = s[s.length - 1];
    const rival = s[0];
    const k = makePairKey(last, rival);
    used.add(k);
    opening.push({ a: last, b: rival, pairKey: k });
  }
  const rest = [];
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j < s.length; j++) {
      const k = makePairKey(s[i], s[j]);
      if (!used.has(k)) rest.push({ a: s[i], b: s[j], pairKey: k });
    }
  }
  return [...opening, ...shuffle(rest)];
}

const ids = participants.map((p) => p.id);
const queue = generateQueue(ids);
assert.equal(queue.length, 595, `Expected 595 pairs, got ${queue.length}`);
assert.equal(new Set(queue.map((m) => m.pairKey)).size, 595, "Pairs must all be unique");
for (const m of queue) {
  assert.notEqual(m.a, m.b, "Self-matchup is forbidden");
}
const coveredInFirst18 = new Set();
for (const m of queue.slice(0, 18)) {
  coveredInFirst18.add(m.a);
  coveredInFirst18.add(m.b);
}
assert.equal(
  coveredInFirst18.size,
  35,
  `First 18 matchups must cover all 35 participants, covered ${coveredInFirst18.size}`
);
console.log("PASS [matchmaking]: 18-duel initial coverage + 595 unique round-robin pairs.");

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
