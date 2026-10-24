import test from "node:test";
import assert from "node:assert/strict";
import { commitGradeBatch } from "../src/prep/grading.ts";
import { defaultPrepProgress } from "../src/prep/storage.ts";
import type { PrepGrade, PrepQuestion } from "../src/prep/types.ts";

const question: PrepQuestion = {
  id: "verbal-1",
  section: "verbal",
  format: "rc-single",
  topic: "Reading",
  skill: "Evidence",
  difficulty: "Standard",
  stem: "Which claim follows?",
  choices: ["Claim one", "Claim two"],
  answers: [1],
  explanation: "The second claim follows.",
  trap: "Avoid adding an assumption.",
  strategy: "Locate the evidence.",
  estimatedSeconds: 60,
  provenance: {
    kind: "original",
    author: "Wordtrail",
    verifiedOn: "2026-10-24",
  },
};
const batch: PrepGrade[] = [
  {
    id: "run:verbal-1",
    question,
    answer: { selections: [0] },
    confidence: "sure",
    elapsedMs: 15000,
    mode: "timed",
  },
  {
    id: "run:verbal-2",
    question: { ...question, id: "verbal-2" },
    answer: { selections: [1] },
    confidence: "unsure",
    elapsedMs: 23000,
    mode: "timed",
  },
];

test("a section grades all questions before one persistence call", () => {
  const original = defaultPrepProgress();
  let writes = 0;
  const next = commitGradeBatch(
    original,
    batch,
    (candidate) => {
      writes += 1;
      assert.equal(candidate.attempts.length, 2);
      assert.deepEqual(
        candidate.attempts.map((attempt) => attempt.correct),
        [false, true],
      );
      assert.equal(original.attempts.length, 0);
      return true;
    },
    1000,
  );
  assert.equal(writes, 1);
  assert.equal(next.attempts.length, 2);
  assert.equal(original.attempts.length, 0);
});

test("failed persistence publishes none of a batch; an edited retry uses the new answers", () => {
  const original = defaultPrepProgress();
  let published = original;
  let writes = 0;
  assert.throws(() => {
    published = commitGradeBatch(
      published,
      batch,
      () => {
        writes += 1;
        return false;
      },
      1000,
    );
  }, /could not be saved/);
  assert.equal(published, original);
  assert.equal(published.attempts.length, 0);
  assert.equal(writes, 1);
  const corrected = [{ ...batch[0], answer: { selections: [1] } }, batch[1]];
  published = commitGradeBatch(
    published,
    corrected,
    () => {
      writes += 1;
      return true;
    },
    2000,
  );
  assert.equal(writes, 2);
  assert.deepEqual(
    published.attempts.map((attempt) => attempt.correct),
    [true, true],
  );
});

test("invalid later items cause zero writes and leave prior progress unchanged", () => {
  const original = defaultPrepProgress();
  let writes = 0;
  const invalid = [batch[0], { ...batch[1], elapsedMs: Infinity }];
  assert.throws(
    () =>
      commitGradeBatch(original, invalid, () => {
        writes += 1;
        return true;
      }),
    /timing/,
  );
  assert.equal(writes, 0);
  assert.equal(original.attempts.length, 0);
});

test("retries and duplicate IDs preserve recorded attempts without adding another reward", () => {
  const first = commitGradeBatch(
    defaultPrepProgress(),
    batch,
    () => true,
    1000,
  );
  let writes = 0;
  const second = commitGradeBatch(
    first,
    [...batch, batch[0]],
    () => {
      writes += 1;
      return true;
    },
    2000,
  );
  assert.equal(second, first);
  assert.equal(second.attempts.length, 2);
  assert.equal(writes, 1);
  assert.equal(second.attempts[0].createdAt, 1000);
  assert.throws(
    () =>
      commitGradeBatch(
        first,
        [{ ...batch[0], question: batch[1].question }],
        () => true,
      ),
    /another question/,
  );
});
