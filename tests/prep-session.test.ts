import test from "node:test";
import assert from "node:assert/strict";
import type { PrepQuestion } from "../src/prep/types.ts";
import {
  accountRunTime,
  finishRunSection,
  loadRun,
  newRun,
  parseRun,
  saveRun,
  type PrepRun,
  type RunSection,
} from "../src/prep/session.ts";

const bank: PrepQuestion[] = Array.from({ length: 27 }, (_, i) => ({
  id: `verbal-${i}`,
  section: "verbal",
  format: "rc-single",
  topic: "Reading comprehension",
  skill: "Inference",
  difficulty: "Standard",
  stem: "Which claim follows?",
  choices: ["First claim", "Second claim"],
  answers: [0],
  explanation: "The first claim follows.",
  trap: "Avoid an unsupported inference.",
  strategy: "Locate the evidence.",
  estimatedSeconds: 70,
  provenance: {
    kind: "original",
    author: "Wordtrail",
    verifiedOn: "2026-10-24",
  },
}));
const start = 1_000_000;
const examSections: RunSection[] = [
  {
    id: "v1",
    title: "Verbal 1",
    section: "verbal",
    minutes: 18,
    questionIds: bank.slice(0, 12).map((q) => q.id),
  },
  {
    id: "v2",
    title: "Verbal 2",
    section: "verbal",
    minutes: 23,
    questionIds: bank.slice(12).map((q) => q.id),
  },
];
const drillSections: RunSection[] = [
  {
    id: "drill",
    title: "Reading practice",
    section: "verbal",
    minutes: 0,
    questionIds: bank.slice(0, 2).map((q) => q.id),
  },
];
const roundTrip = (run: PrepRun, now = start) =>
  parseRun(JSON.stringify(run), bank, now);

test("new runs copy their sections and reject empty, duplicate or incorrectly timed exam plans", () => {
  const sections = structuredClone(examSections);
  const run = newRun("Verbal simulation", "exam", sections, start);
  sections[0].questionIds[0] = "changed";
  assert.equal(run.sections[0].questionIds[0], "verbal-0");
  assert.equal(run.deadline, start + 18 * 60000);
  assert.throws(() => newRun("Empty", "drill", [], start), /valid/);
  assert.throws(
    () =>
      newRun(
        "Duplicate",
        "drill",
        [{ ...drillSections[0], questionIds: ["verbal-0", "verbal-0"] }],
        start,
      ),
    /valid/,
  );
  assert.throws(
    () =>
      newRun(
        "Invalid timing",
        "exam",
        [{ ...examSections[0], minutes: 19 }, examSections[1]],
        start,
      ),
    /valid/,
  );
  assert.throws(
    () =>
      newRun(
        "Invalid duration",
        "timed",
        [{ ...drillSections[0], minutes: NaN }],
        start,
      ),
    /valid/,
  );
});

test("an overdue section starts the next section at the original deadline", () => {
  const initial = newRun("Verbal simulation", "exam", examSections, start);
  initial.answers["verbal-0"] = { selections: [0] };
  const afterBackground = start + 25 * 60000;
  const result = finishRunSection(initial, afterBackground);
  assert.equal(result.expired, true);
  assert.equal(result.questionIds.length, 12);
  assert.equal(result.next.sectionIndex, 1);
  assert.equal(result.next.sectionStartedAt, start + 18 * 60000);
  assert.equal(result.next.deadline, start + 41 * 60000);
  assert.equal(result.next.spent["verbal-0"], 18 * 60000);
  assert.equal(result.next.finished, false);
  assert.notEqual(roundTrip(result.next, afterBackground), null);
});

test("returning after both deadlines grades each item once and leaves the run finished", () => {
  let run = newRun("Verbal simulation", "exam", examSections, start);
  const wake = start + 60 * 60000;
  const first = finishRunSection(run, wake);
  const second = finishRunSection(first.next, wake);
  run = second.next;
  assert.equal(run.finished, true);
  assert.equal(run.deadline, null);
  assert.equal(run.graded.length, 27);
  assert.equal(new Set([...first.questionIds, ...second.questionIds]).size, 27);
  assert.equal(run.spent["verbal-12"], 23 * 60000);
  assert.deepEqual(finishRunSection(run, wake).questionIds, []);
  assert.notEqual(roundTrip(run, wake), null);
});

test("manual early submission starts the next clock at submission time", () => {
  const run = newRun("Verbal simulation", "exam", examSections, start);
  const result = finishRunSection(run, start + 45_000);
  assert.equal(result.expired, false);
  assert.equal(result.next.sectionStartedAt, start + 45_000);
  assert.equal(result.next.deadline, start + 45_000 + 23 * 60000);
  assert.equal(result.next.spent["verbal-0"], 45_000);
});

test("item time stops at deadlines and excludes reading a checked drill explanation", () => {
  const timed = newRun("Timed", "timed", [examSections[0]], start);
  assert.equal(
    accountRunTime(timed, start + 30 * 60000).spent["verbal-0"],
    18 * 60000,
  );
  let drill = newRun("Reading practice", "drill", drillSections, start);
  drill = accountRunTime(drill, start + 10_000);
  drill.checked = ["verbal-0"];
  drill.graded = ["verbal-0"];
  assert.equal(accountRunTime(drill, start + 50_000).spent["verbal-0"], 10_000);
  const result = finishRunSection(drill, start + 50_000);
  assert.deepEqual(result.questionIds, ["verbal-1"]);
  assert.equal(result.next.graded.length, 2);
});

test("resume preserves incomplete answers, first-sentence selection, flags and confidence", () => {
  const q: PrepQuestion = {
    ...bank[0],
    format: "rc-sentence",
    passage: { id: "passage", sentences: ["First.", "Second."] },
    sentenceAnswer: 0,
  };
  const run = newRun("Reading practice", "drill", drillSections, start);
  run.answers[q.id] = { sentence: 0 };
  run.flags = [q.id];
  run.confidence[q.id] = "guess";
  const parsed = parseRun(JSON.stringify(run), [q, ...bank.slice(1)], start);
  assert.equal(parsed?.answers[q.id].sentence, 0);
  assert.equal(parsed?.confidence[q.id], "guess");
  assert.deepEqual(parsed?.flags, [q.id]);
  const completion: PrepQuestion = {
    ...bank[0],
    format: "tc2",
    blanks: [
      { choices: ["one", "two"], answer: 0 },
      { choices: ["three", "four"], answer: 1 },
    ],
  };
  run.answers[q.id] = { blanks: [0, null] };
  assert.deepEqual(
    parseRun(JSON.stringify(run), [completion, ...bank.slice(1)], start)
      ?.answers[q.id].blanks,
    [0, null],
  );
});

test("invalid snapshots cannot alter durations, reveal timed answers or reference unknown questions", () => {
  const valid = newRun("Verbal simulation", "exam", examSections, start);
  const mutated = (change: (run: PrepRun) => void) => {
    const run = structuredClone(valid);
    change(run);
    return roundTrip(run);
  };
  assert.equal(
    mutated((run) => {
      run.deadline! += 60000;
    }),
    null,
  );
  assert.equal(
    mutated((run) => {
      run.questionIndex = 12;
    }),
    null,
  );
  assert.equal(
    mutated((run) => {
      run.sections[0].questionIds[0] = "unknown";
    }),
    null,
  );
  assert.equal(
    mutated((run) => {
      run.sections[1].questionIds[0] = run.sections[0].questionIds[0];
    }),
    null,
  );
  assert.equal(
    mutated((run) => {
      run.checked = ["verbal-0"];
      run.graded = ["verbal-0"];
    }),
    null,
  );
  assert.equal(
    mutated((run) => {
      run.answers["verbal-0"] = { selections: [100] };
    }),
    null,
  );
  assert.equal(
    mutated((run) => {
      run.answers["verbal-0"] = { selections: [0, 0] };
    }),
    null,
  );
  assert.equal(
    mutated((run) => {
      run.flags = ["unknown"];
    }),
    null,
  );
  assert.equal(
    mutated((run) => {
      run.finished = true;
      run.deadline = null;
    }),
    null,
  );
  assert.equal(
    mutated((run) => {
      run.spent["verbal-0"] = 19 * 60000;
    }),
    null,
  );
  assert.equal(parseRun("{broken", bank, start), null);
});

test("checked drill answers must already be graded, and previous sections must be fully graded", () => {
  const drill = newRun("Reading practice", "drill", drillSections, start);
  drill.checked = ["verbal-0"];
  assert.equal(roundTrip(drill), null);
  drill.graded = ["verbal-0"];
  assert.notEqual(roundTrip(drill), null);
  const first = finishRunSection(
    newRun("Verbal simulation", "exam", examSections, start),
    start + 1000,
  ).next;
  first.graded.pop();
  assert.equal(roundTrip(first, start + 1000), null);
});

test("session storage reports blocked writes and tolerates malformed stored data", () => {
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
    const run = newRun("Reading practice", "drill", drillSections);
    assert.equal(saveRun(run), true);
    assert.equal(loadRun(bank)?.id, run.id);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    assert.equal(saveRun(run), false);
    assert.equal(loadRun(bank), null);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else
      delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
  }
});
