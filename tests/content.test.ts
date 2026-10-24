import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  practiceQuestions,
  readingPassages,
  essayPrompts,
} from "../src/data/practice.ts";
const words = JSON.parse(
  readFileSync(new URL("../src/data/vocabulary.json", import.meta.url), "utf8"),
);
const sources = JSON.parse(
  readFileSync(new URL("../src/data/sources.json", import.meta.url), "utf8"),
);
test("vocabulary preserves unique IDs, definition provenance, and honest source counts", () => {
  assert.equal(
    new Set(words.map((w: { id: string }) => w.id)).size,
    words.length,
  );
  assert.equal(words.length, 5188);
  assert.equal(
    words.filter((w: { definition: string }) => w.definition.trim()).length,
    5186,
  );
  assert.equal(sources.length, 67);
  const counts = new Map<string, number>();
  for (const word of words) {
    assert.ok(word.word && word.id && typeof word.definition === "string");
    assert.equal(
      new Set(word.sources.map((s: { id: string }) => s.id)).size,
      word.sources.length,
    );
    if (word.definition)
      assert.ok(
        word.definitionSource,
        `No definition provenance for ${word.word}`,
      );
    for (const ref of word.sources) {
      const source = sources.find((s: { id: string }) => s.id === ref.id);
      assert.ok(source, `Unknown source for ${word.word}`);
      if (ref.page && source.pages) assert.ok(ref.page <= source.pages);
      counts.set(ref.id, (counts.get(ref.id) || 0) + 1);
    }
  }
  for (const source of sources)
    assert.equal(source.wordCount, counts.get(source.id) || 0, source.title);
  assert.equal(
    sources.filter((s: { status: string }) => s.status === "unavailable")
      .length,
    3,
  );
});
test("every practice item has the promised format, valid answers, and an explanation", () => {
  const questions = [
    ...practiceQuestions,
    ...readingPassages.flatMap((p) => p.questions),
  ];
  assert.equal(questions.length, 39);
  assert.equal(new Set(questions.map((q) => q.id)).size, 39);
  for (const q of questions) {
    assert.equal(new Set(q.choices).size, q.choices.length);
    assert.ok(q.explanation.length > 50);
    assert.ok(
      q.answers.every(
        (index) =>
          Number.isInteger(index) && index >= 0 && index < q.choices.length,
      ),
    );
    if ("type" in q && q.type === "equivalence") {
      assert.equal(q.answers.length, 2);
      assert.equal(q.choices.length, 6);
    } else {
      assert.equal(q.answers.length, 1);
      assert.equal(q.choices.length, 5);
    }
  }
  assert.equal(essayPrompts.length, 5);
});
