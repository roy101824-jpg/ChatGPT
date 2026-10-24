import test from "node:test";
import assert from "node:assert/strict";
import { prepBank } from "../src/prep/bank.ts";
import { verbalQuestions } from "../src/data/prep/verbal.ts";
import { verbalGuides } from "../src/data/prep/verbal-guides.ts";
import { examBlueprint, resourceLinks } from "../src/data/prep/resources.ts";
import { buildExamPlan, scoreAnswer } from "../src/prep/engine.ts";
import type { PrepAnswer } from "../src/prep/types.ts";
test("entire verbal bank has valid keys, consistent passages and every required format", () => {
  assert.equal(prepBank.length, 99);
  assert.equal(verbalQuestions.length, 60);
  assert.equal(new Set(prepBank.map((q) => q.id)).size, 99);
  const passages = new Map<string, string>();
  const seen = new Set<string>();
  for (const q of prepBank) {
    assert.equal(q.section, "verbal");
    seen.add(q.format);
    assert.ok(q.explanation.length > 70);
    assert.ok(q.trap.length > 10);
    assert.ok(q.strategy.length > 15);
    assert.ok(q.estimatedSeconds > 0);
    assert.equal(q.provenance.kind, "original");
    let answer: PrepAnswer = {};
    if (q.blanks) {
      assert.equal(q.blanks.length, Number(q.format.slice(-1)));
      q.blanks.forEach((b) => {
        assert.equal(b.choices.length, q.format === "tc1" ? 5 : 3);
        assert.ok(
          Number.isInteger(b.answer) &&
            b.answer >= 0 &&
            b.answer < b.choices.length,
        );
        assert.equal(new Set(b.choices).size, b.choices.length);
      });
      answer = { blanks: q.blanks.map((b) => b.answer) };
    } else if (q.format === "rc-sentence") {
      assert.ok(q.passage);
      assert.ok(
        q.sentenceAnswer !== undefined &&
          q.sentenceAnswer >= 0 &&
          q.sentenceAnswer < q.passage.sentences.length,
      );
      answer = { sentence: q.sentenceAnswer };
    } else {
      assert.ok(q.choices && q.answers);
      assert.equal(
        q.choices.length,
        q.format === "se" ? 6 : q.format === "rc-multi" ? 3 : 5,
      );
      assert.ok(
        q.answers.every(
          (a) => Number.isInteger(a) && a >= 0 && a < q.choices!.length,
        ),
      );
      assert.equal(new Set(q.answers).size, q.answers.length);
      if (q.format === "se") assert.equal(q.answers.length, 2);
      if (q.format === "rc-single") assert.equal(q.answers.length, 1);
      answer = { selections: q.answers };
    }
    assert.ok(scoreAnswer(q, answer), q.id);
    assert.equal(scoreAnswer(q, {}), false, q.id);
    if (q.passage) {
      assert.ok(q.passage.sentences.every((s) => s.trim().length > 15));
      const text = q.passage.sentences.join(" ");
      assert.equal(
        passages.get(q.passage.id) || text,
        text,
        "Shared passage must be stable",
      );
      passages.set(q.passage.id, text);
    }
  }
  assert.deepEqual(
    [...seen].sort(),
    ["rc-multi", "rc-sentence", "rc-single", "se", "tc1", "tc2", "tc3"].sort(),
  );
});
test("multi-blank and equivalence answer locations do not create a simple cyclic shortcut", () => {
  for (const f of ["tc2", "tc3"]) {
    const items = verbalQuestions.filter((q) => q.format === f);
    for (const first of [0, 1, 2]) {
      const matches = items.filter((q) => q.blanks![0].answer === first);
      assert.ok(matches.length >= 2);
      assert.ok(new Set(matches.map((q) => q.blanks![1].answer)).size >= 2);
      if (f === "tc3")
        assert.ok(new Set(matches.map((q) => q.blanks![2].answer)).size >= 2);
    }
  }
  const pairs = verbalQuestions
    .filter((q) => q.format === "se")
    .map((q) => q.answers!.slice().sort().join(","));
  assert.ok(new Set(pairs).size >= 6);
});
test("current blueprint and generated simulations remain verbal-only and all sections are feasible", () => {
  assert.equal(examBlueprint.totalQuestions, 27);
  assert.equal(examBlueprint.totalMinutes, 41);
  assert.equal(verbalGuides.length, 12);
  assert.ok(
    resourceLinks.every((r) => new URL(r.url).hostname.endsWith("ets.org")),
  );
  for (let seed = 1; seed < 30; seed++) {
    const plan = buildExamPlan(prepBank, seed);
    assert.equal(plan.totalQuestions, 27);
    assert.equal(plan.totalMinutes, 41);
    const ids = plan.sections.flatMap((s) => s.questionIds);
    assert.equal(new Set(ids).size, 27);
    assert.ok(plan.sections.every((s) => s.section === "verbal"));
    assert.deepEqual(
      plan.sections.map((s) => [s.questionIds.length, s.minutes]),
      [
        [12, 18],
        [15, 23],
      ],
    );
  }
});
