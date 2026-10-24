import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSession,
  defaultProgress,
  getDueWords,
  getStats,
  localDay,
  quizChoices,
  rateWord,
  type Word,
} from "../src/lib/study.ts";
import {
  loadProgress,
  parseBackup,
  saveProgress,
  serializeBackup,
  STORAGE_KEY,
} from "../src/lib/storage.ts";

const words: Word[] = [
  {
    id: "abate",
    word: "abate",
    definition: "become less intense",
    sources: [{ id: "a", title: "A" }],
  },
  {
    id: "candid",
    word: "candid",
    definition: "honest and direct",
    sources: [{ id: "a", title: "A" }],
  },
  {
    id: "lucid",
    word: "lucid",
    definition: "clear and easy to understand",
    sources: [{ id: "a", title: "A" }],
  },
  {
    id: "tenacious",
    word: "tenacious",
    definition: "persistent and determined",
    sources: [{ id: "a", title: "A" }],
  },
  {
    id: "forthright",
    word: "forthright",
    definition: "Honest and direct.",
    sources: [{ id: "a", title: "A" }],
  },
  { id: "unknown", word: "unknown", definition: "", sources: [] },
];
const now = new Date(2026, 9, 24, 12).getTime();
const day = 86400000;

test("new words are not due; failed recall comes back after one minute", () => {
  const fresh = defaultProgress();
  assert.equal(getDueWords(words, fresh, now).length, 0);
  const next = rateWord(fresh, "abate", "again", now);
  assert.equal(getDueWords(words, next, now + 59999).length, 0);
  assert.equal(getDueWords(words, next, now + 60000)[0].id, "abate");
  assert.equal(next.words.abate.lapses, 1);
  assert.equal(
    fresh.words.abate,
    undefined,
    "review must not mutate the original progress",
  );
});

test("same-day practice cannot inflate intervals or mastery", () => {
  let progress = rateWord(defaultProgress(), "abate", "easy", now);
  for (let index = 0; index < 20; index += 1)
    progress = rateWord(progress, "abate", "easy", now + 1000 * index);
  assert.equal(progress.words.abate.interval, 3);
  assert.equal(progress.words.abate.streak, 1);
  assert.equal(getStats(words, progress, now).mastered, 0);
});

test("early practice on another day does not postpone or inflate the scheduled review", () => {
  let progress = rateWord(defaultProgress(), "abate", "easy", now);
  const scheduled = progress.words.abate.due;
  progress = rateWord(progress, "abate", "easy", now + day);
  assert.equal(progress.words.abate.due, scheduled);
  assert.equal(progress.words.abate.interval, 3);
  assert.equal(progress.words.abate.streak, 1);
  progress = rateWord(progress, "abate", "good", scheduled);
  assert.ok(progress.words.abate.interval > 3);
  assert.equal(progress.words.abate.streak, 2);
});

test("spaced success reaches mastery and a lapse resets it", () => {
  let progress = defaultProgress();
  let current = now;
  for (let index = 0; index < 4; index += 1) {
    progress = rateWord(progress, "abate", "good", current);
    current = progress.words.abate.due;
  }
  assert.equal(progress.words.abate.streak, 4);
  assert.ok(progress.words.abate.interval >= 14);
  assert.equal(getStats(words, progress, current).mastered, 1);
  progress = rateWord(progress, "abate", "again", current);
  assert.equal(progress.words.abate.streak, 0);
  assert.equal(getStats(words, progress, current).mastered, 0);
});

test("session modes respect due dates, new words, bookmarks and missing definitions", () => {
  let progress = rateWord(defaultProgress(), "abate", "again", now);
  progress = rateWord(progress, "candid", "good", now);
  progress.bookmarks = ["lucid", "unknown"];
  assert.deepEqual(
    buildSession(
      words,
      progress,
      { mode: "review", limit: 10 },
      now + 60000,
    ).map((w) => w.id),
    ["abate"],
  );
  assert.deepEqual(
    buildSession(words, progress, { mode: "weak", limit: 10 }, now).map(
      (w) => w.id,
    ),
    ["abate"],
  );
  assert.deepEqual(
    buildSession(words, progress, { mode: "bookmarked", limit: 10 }, now).map(
      (w) => w.id,
    ),
    ["lucid"],
  );
  const newWords = buildSession(
    words,
    progress,
    { mode: "learn", limit: 10 },
    now,
  ).map((w) => w.id);
  assert.deepEqual(
    new Set(newWords),
    new Set(["lucid", "tenacious", "forthright"]),
  );
  assert.equal(
    buildSession(words, progress, { mode: "learn", limit: -1 }, now).length,
    0,
  );
});

test("statistics count real activity and preserve yesterday streak before today study", () => {
  let progress = rateWord(defaultProgress(), "abate", "good", now - 2 * day);
  progress = rateWord(progress, "candid", "again", now - day);
  const stats = getStats(words, progress, now);
  assert.equal(stats.streak, 2);
  assert.equal(stats.todayReviews, 0);
  assert.equal(stats.accuracy, 50);
  assert.equal(stats.xp, 12);
  assert.equal(getStats(words, progress, now + day).streak, 0);
});

test("streak uses calendar days across daylight-saving transitions", () => {
  const previousTZ = process.env.TZ;
  process.env.TZ = "America/New_York";
  try {
    const march7 = new Date(2026, 2, 7, 23, 30).getTime();
    const march8 = new Date(2026, 2, 8, 23, 30).getTime();
    const march9 = new Date(2026, 2, 9, 0, 30).getTime();
    let progress = rateWord(defaultProgress(), "abate", "good", march7);
    progress = rateWord(progress, "candid", "good", march8);
    assert.equal(localDay(march7), "2026-03-07");
    assert.equal(getStats(words, progress, march9).streak, 2);
  } finally {
    if (previousTZ === undefined) delete process.env.TZ;
    else process.env.TZ = previousTZ;
  }
});

test("quiz choices have one correct answer and distinct definitions", () => {
  const choices = quizChoices(words[1], words, 42);
  assert.equal(choices.length, 4);
  assert.equal(choices.filter((choice) => choice.correct).length, 1);
  assert.equal(choices.find((choice) => choice.correct)?.id, "candid");
  assert.ok(!choices.some((choice) => choice.id === "forthright"));
  assert.deepEqual(choices, quizChoices(words[1], words, 42));
  assert.equal(quizChoices(words[5], words, 42).length, 0);
  assert.equal(quizChoices(words[0], [words[0]], 42).length, 1);
});

test("backup round trip preserves study history, bookmarks and personal notes", () => {
  const progress = rateWord(defaultProgress(), "abate", "good", now);
  progress.bookmarks = ["abate"];
  progress.notes.abate = "The storm abated.";
  progress.settings.examDate = "2027-01-15";
  const restored = parseBackup(serializeBackup(progress));
  assert.equal(restored.words.abate.due, progress.words.abate.due);
  assert.equal(restored.notes.abate, "The storm abated.");
  assert.deepEqual(restored.bookmarks, ["abate"]);
  assert.equal(restored.settings.examDate, "2027-01-15");
});

test("backups reject malformed data, impossible dates, nonfinite numbers and unsafe keys", () => {
  assert.throws(() => parseBackup("{oops"), /valid JSON/);
  assert.throws(() => parseBackup('{"version":2}'), /version/);
  const progress = defaultProgress();
  progress.settings.examDate = "2026-02-30";
  assert.throws(() => parseBackup(JSON.stringify(progress)), /exam date/);
  progress.settings.examDate = "";
  progress.settings.dailyGoal = Infinity;
  assert.throws(() => serializeBackup(progress), /daily goal/);
  const malicious = JSON.stringify(defaultProgress()).replace(
    '"words":{}',
    '"words":{"__proto__":{"polluted":true}}',
  );
  assert.throws(() => parseBackup(malicious), /unsafe/);
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});

test("storage survives blocked writes and malformed persisted state", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (id: string) => data.get(id) ?? null,
      setItem: (id: string, value: string) => data.set(id, value),
    },
  });
  try {
    assert.equal(
      saveProgress(rateWord(defaultProgress(), "abate", "good", now)),
      true,
    );
    assert.equal(loadProgress().words.abate.reviews, 1);
    data.set(STORAGE_KEY, "{broken");
    assert.deepEqual(loadProgress().bookmarks, []);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("blocked");
      },
    });
    assert.equal(saveProgress(defaultProgress()), false);
    assert.equal(loadProgress().version, 1);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else
      delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
  }
});
