import test from "node:test";
import assert from "node:assert/strict";
import type { PrepFormat, PrepQuestion } from "../src/prep/types.ts";
import {
  buildExamPlan,
  getPrepStats,
  hasCompleteAnswer,
  recordAttempt,
  scoreAnswer,
  selectQuestions,
} from "../src/prep/engine.ts";
import {
  defaultPrepProgress,
  loadPrepProgress,
  parsePrepBackup,
  savePrepProgress,
  serializePrepBackup,
} from "../src/prep/storage.ts";

function question(overrides: Partial<PrepQuestion> = {}): PrepQuestion {
  return {
    id: "verbal-1",
    section: "verbal",
    format: "rc-single",
    topic: "Reading comprehension",
    skill: "Evidence",
    difficulty: "Core",
    stem: "Which claim follows from the passage?",
    choices: ["First claim", "Second claim", "Third claim"],
    answers: [1],
    explanation: "The second claim follows.",
    trap: "Avoid adding an unsupported inference.",
    strategy: "Find the exact supporting sentence.",
    estimatedSeconds: 60,
    provenance: {
      kind: "original",
      author: "Wordtrail",
      verifiedOn: "2026-10-24",
    },
    ...overrides,
  };
}

test("all blanks must be supplied and correct, including blank choice zero", () => {
  const two = question({
    format: "tc2",
    blanks: [
      { choices: ["one", "two", "three"], answer: 1 },
      { choices: ["four", "five", "six"], answer: 2 },
    ],
  });
  assert.equal(hasCompleteAnswer(two, { blanks: [1, null] }), false);
  assert.equal(scoreAnswer(two, { blanks: [1, 1] }), false);
  assert.equal(scoreAnswer(two, { blanks: [1, 2] }), true);
  assert.equal(scoreAnswer(two, { blanks: [1, 2, 0] }), false);
  const three = question({
    format: "tc3",
    blanks: [
      { choices: ["one", "two"], answer: 0 },
      { choices: ["three", "four"], answer: 1 },
      { choices: ["five", "six"], answer: 0 },
    ],
  });
  assert.equal(hasCompleteAnswer(three, { blanks: [0, 1, 0] }), true);
  assert.equal(scoreAnswer(three, { blanks: [0, 1, 0] }), true);
  assert.equal(scoreAnswer(three, { blanks: [0, 1, 1] }), false);
  assert.equal(hasCompleteAnswer(three, { blanks: [0, 1] }), false);
});

test("sentence equivalence requires exactly the two correct choices", () => {
  const q = question({
    format: "se",
    choices: ["a", "b", "c", "d", "e", "f"],
    answers: [1, 4],
  });
  assert.equal(scoreAnswer(q, { selections: [4, 1] }), true);
  for (const selections of [[1], [1, 1], [1, 4, 5], [1, 3]])
    assert.equal(scoreAnswer(q, { selections }), false);
});

test("multiple-answer and sentence-selection reading items enforce exact answers", () => {
  const multi = question({
    format: "rc-multi",
    choices: ["a", "b", "c"],
    answers: [0, 2],
  });
  assert.equal(scoreAnswer(multi, { selections: [2, 0] }), true);
  assert.equal(scoreAnswer(multi, { selections: [0] }), false);
  assert.equal(scoreAnswer(multi, { selections: [0, 1, 2] }), false);
  const sentence = question({
    format: "rc-sentence",
    passage: { id: "p1", sentences: ["First.", "Second."] },
    sentenceAnswer: 0,
  });
  assert.equal(scoreAnswer(sentence, { sentence: 0 }), true);
  assert.equal(hasCompleteAnswer(sentence, { sentence: 0 }), true);
  assert.equal(scoreAnswer(sentence, { sentence: 1 }), false);
  assert.equal(hasCompleteAnswer(sentence, { sentence: 2 }), false);
  assert.equal(hasCompleteAnswer(sentence, {}), false);
  assert.equal(hasCompleteAnswer(question(), { selections: [1, 2] }), false);
});

const formats: PrepFormat[] = [
  "tc1",
  "tc2",
  "tc3",
  "se",
  "rc-single",
  "rc-multi",
  "rc-sentence",
];
const bank = Array.from({ length: 98 }, (_, i) =>
  question({
    id: `question-${i}`,
    format: formats[i % formats.length],
    topic: ["Text completion", "Sentence equivalence", "Reading comprehension"][
      i % 3
    ],
  }),
);

test("question selection is seeded, varied, filtered and unique", () => {
  const selection = selectQuestions([...bank, bank[0]], {
    section: "all",
    count: 24,
    seed: "abc",
  });
  assert.equal(selection.length, 24);
  assert.equal(new Set(selection.map((q) => q.id)).size, 24);
  assert.deepEqual(
    selection,
    selectQuestions([...bank, bank[0]], {
      section: "all",
      count: 24,
      seed: "abc",
    }),
  );
  assert.equal(new Set(selection.map((q) => q.format)).size, 7);
  assert.notDeepEqual(
    selection,
    selectQuestions(bank, { section: "all", count: 24, seed: "other" }),
  );
  const allowed = bank.slice(0, 5).map((q) => q.id);
  const restricted = selectQuestions(bank, {
    section: "verbal",
    count: 20,
    onlyIds: allowed,
    excludeIds: [allowed[0]],
  });
  assert.equal(restricted.length, 4);
  assert.ok(
    restricted.every((q) => allowed.includes(q.id) && q.id !== allowed[0]),
  );
  assert.equal(selectQuestions(bank, { section: "all", count: -1 }).length, 0);
  assert.equal(
    selectQuestions(bank, { section: "all", count: 10, onlyIds: [] }).length,
    0,
  );
  assert.ok(
    selectQuestions(bank, { section: "all", count: 8, format: "se" }).every(
      (q) => q.format === "se",
    ),
  );
});

test("selected questions sharing a passage stay together", () => {
  const passages = Array.from({ length: 9 }, (_, i) =>
    question({
      id: `p-${i}`,
      passage: { id: `passage-${i % 3}`, sentences: ["A passage."] },
    }),
  );
  const selected = selectQuestions(passages, {
    section: "all",
    count: 9,
    seed: 7,
  });
  for (const passage of ["passage-0", "passage-1", "passage-2"]) {
    const indices = selected
      .map((q, i) => (q.passage?.id === passage ? i : -1))
      .filter((i) => i >= 0);
    assert.equal(indices[indices.length - 1] - indices[0], indices.length - 1);
  }
});

test("verbal simulation has 27 unique questions in 12/18-minute and 15/23-minute sections", () => {
  const plan = buildExamPlan(bank, 5);
  assert.equal(plan.adaptive, false);
  assert.match(plan.label, /Fixed-form verbal/);
  assert.deepEqual(
    plan.sections.map((s) => s.minutes),
    [18, 23],
  );
  assert.deepEqual(
    plan.sections.map((s) => s.questionIds.length),
    [12, 15],
  );
  assert.ok(plan.sections.every((s) => s.section === "verbal"));
  const ids = plan.sections.flatMap((s) => s.questionIds);
  assert.equal(new Set(ids).size, 27);
  assert.equal(plan.totalQuestions, 27);
  assert.equal(plan.totalMinutes, 41);
  assert.deepEqual(plan, buildExamPlan(bank, 5));
  assert.throws(() => buildExamPlan(bank.slice(0, 26)), /at least 27/);
  for (const section of plan.sections) {
    const items = section.questionIds.map((id) =>
      bank.find((q) => q.id === id)!,
    );
    assert.ok(items.some((q) => q.format === "se"));
    assert.ok(items.some((q) => q.format.startsWith("tc")));
    assert.ok(items.some((q) => q.format.startsWith("rc")));
  }
});

test("latest unique answers determine accuracy; repetitions only add practice volume", () => {
  let p = defaultPrepProgress();
  const q1 = question();
  const q2 = question({ id: "verbal-2" });
  p = recordAttempt(p, q1, { selections: [0] }, "sure", 30000, "drill", 1000);
  p = recordAttempt(p, q1, { selections: [1] }, "sure", 20000, "drill", 2000);
  p = recordAttempt(p, q2, { selections: [1] }, "guess", 10000, "timed", 3000);
  const stats = getPrepStats([q1, q2, question({ id: "unseen" })], p);
  assert.equal(stats.attempted, 2);
  assert.equal(stats.accuracy, 100);
  assert.equal(stats.unseen, 1);
  assert.equal(stats.totalAttempts, 3);
  assert.equal(stats.totalSeconds, 60);
  assert.deepEqual(stats.reviewIds, ["verbal-2"]);
  assert.equal(stats.byTopic[0].attempts, 2);
  assert.equal(stats.byTopic[0].avgSeconds, 15);
  assert.equal(stats.unsure, 1);
});

test("attempt recording is immutable and preserves error-log notes and official verbal scores", () => {
  const original = defaultPrepProgress();
  original.notes["verbal-1"] = "Recheck the supporting sentence.";
  original.officialScores.push({
    date: "2026-10-24",
    verbal: 160,
    source: "POWERPREP",
  });
  const answer = { selections: [1] };
  const next = recordAttempt(
    original,
    question(),
    answer,
    "sure",
    1200,
    "exam",
    4000,
  );
  answer.selections[0] = 2;
  assert.equal(original.attempts.length, 0);
  assert.equal(next.attempts[0].answer.selections?.[0], 1);
  assert.equal(next.notes["verbal-1"], original.notes["verbal-1"]);
  assert.equal(next.officialScores[0].verbal, 160);
  assert.throws(
    () => recordAttempt(original, question(), {}, "sure", Infinity, "drill"),
    /timing/,
  );
});

test("backup validates errors, dates, score bounds, duplicate attempts and unsafe record keys", () => {
  const p = recordAttempt(
    defaultPrepProgress(),
    question(),
    { selections: [1] },
    "unsure",
    12000,
    "drill",
    1000,
  );
  p.attempts[0].errorReason = "Timing";
  p.attempts[0].note = "I rushed.";
  p.saved = ["verbal-1"];
  p.targetDate = "2027-01-01";
  p.officialScores = [
    { date: "2026-10-24", verbal: 160, source: "ETS practice" },
  ];
  assert.equal(
    parsePrepBackup(serializePrepBackup(p)).attempts[0].note,
    "I rushed.",
  );
  assert.throws(() => parsePrepBackup("{bad"), /valid JSON/);
  assert.throws(() => parsePrepBackup('{"version":2}'), /version/);
  assert.throws(
    () => serializePrepBackup({ ...p, targetDate: "2026-02-30" }),
    /target date/,
  );
  assert.throws(
    () =>
      serializePrepBackup({ ...p, attempts: [...p.attempts, p.attempts[0]] }),
    /unique/,
  );
  const malicious = JSON.stringify(p).replace(
    '"notes":{}',
    '"notes":{"__proto__":"unsafe"}',
  );
  assert.throws(() => parsePrepBackup(malicious), /identifier/);
  assert.throws(
    () =>
      serializePrepBackup({
        ...p,
        officialScores: [{ date: "2026-10-24", verbal: 180, source: "" }],
      }),
    /verbal/,
  );
  assert.equal(({} as Record<string, unknown>).unsafe, undefined);
});

test("storage gracefully handles unavailability and round-trips valid data", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  try {
    const p = recordAttempt(
      defaultPrepProgress(),
      question(),
      { selections: [1] },
      "sure",
      5000,
      "drill",
      1000,
    );
    assert.equal(savePrepProgress(p), true);
    assert.equal(loadPrepProgress().attempts.length, 1);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    assert.equal(savePrepProgress(p), false);
    assert.equal(loadPrepProgress().attempts.length, 0);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else
      delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
  }
});

test("correct unrated timed responses do not become uncertain reviews, and backups retain unrated", () => {
  const correct = question({ id: "timed-unrated-correct" });
  const missed = question({ id: "timed-unrated-missed" });
  let progress = recordAttempt(
    defaultPrepProgress(),
    correct,
    { selections: [...correct.answers!] },
    "unrated",
    40000,
    "timed",
    1000,
  );
  let stats = getPrepStats([correct, missed], progress);
  assert.deepEqual(stats.reviewIds, []);
  assert.equal(stats.unsure, 0);
  assert.equal(stats.byTopic[0].unsure, 0);
  assert.equal(stats.accuracy, 100);
  const restored = parsePrepBackup(serializePrepBackup(progress));
  assert.equal(restored.attempts[0].confidence, "unrated");
  progress = recordAttempt(
    restored,
    missed,
    {},
    "unrated",
    30000,
    "exam",
    2000,
  );
  stats = getPrepStats([correct, missed], progress);
  assert.deepEqual(stats.reviewIds, [missed.id]);
  assert.equal(stats.unsure, 0);
});
