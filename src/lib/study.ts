export interface Word {
  id: string;
  word: string;
  definition: string;
  pos?: string;
  example?: string;
  mnemonic?: string;
  sources: Array<{ id: string; title: string; page?: number }>;
  tags?: string[];
  definitionSource?: { id: string; title?: string; page?: number };
  definitionNote?: string;
  alternateDefinitions?: Array<{
    definition: string;
    pos?: string;
    source: { id: string; page?: number };
  }>;
}

export interface WordProgress {
  due: number;
  interval: number;
  ease: number;
  reviews: number;
  lapses: number;
  /** Consecutive successful review days, not the number of button presses. */
  streak: number;
  lastReviewed: number;
}

export interface Progress {
  version: 1;
  words: Record<string, WordProgress>;
  activity: Record<string, { reviews: number; correct: number; xp: number }>;
  bookmarks: string[];
  settings: {
    dailyGoal: number;
    sessionSize: number;
    sound: boolean;
    examDate: string;
  };
  notes: Record<string, string>;
}

export type Rating = "again" | "hard" | "good" | "easy";
export type SessionMode = "learn" | "review" | "weak" | "bookmarked";
export interface QuizChoice {
  id: string;
  text: string;
  correct: boolean;
}
export interface Stats {
  learned: number;
  mastered: number;
  due: number;
  accuracy: number;
  streak: number;
  totalReviews: number;
  xp: number;
  todayReviews: number;
}

const DAY = 86_400_000;
const MINUTE = 60_000;
const own = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key);
const safeKey = (key: string) =>
  !!key && !["__proto__", "constructor", "prototype"].includes(key);
const studied = (progress: Progress, id: string) =>
  own(progress.words, id) ? progress.words[id] : undefined;

export function defaultProgress(): Progress {
  return {
    version: 1,
    words: Object.create(null),
    activity: Object.create(null),
    bookmarks: [],
    settings: { dailyGoal: 20, sessionSize: 10, sound: true, examDate: "" },
    notes: Object.create(null),
  };
}

/** Calendar date on the learner's device; never the UTC date. */
export function localDay(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function rateWord(
  progress: Progress,
  id: string,
  rating: Rating,
  now: number = Date.now(),
): Progress {
  if (!safeKey(id)) throw new Error("This word has an invalid identifier.");
  if (!["again", "hard", "good", "easy"].includes(rating))
    throw new Error("Choose a valid review rating.");
  if (!Number.isFinite(now) || now < 0)
    throw new Error("The review date is invalid.");
  const previous = studied(progress, id);
  const sameDay =
    !!previous && localDay(previous.lastReviewed) === localDay(now);
  const wasSuccessfulToday = sameDay && previous.streak > 0;
  const earlyRecall = !!previous && previous.streak > 0 && previous.due > now;
  let interval = previous?.interval ?? 0;
  let ease = previous?.ease ?? 2.5;
  let streak = previous?.streak ?? 0;
  let due: number;

  if (rating === "again") {
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
    streak = 0;
    due = now + MINUTE;
  } else {
    if (!wasSuccessfulToday && !earlyRecall) streak += 1;
    if (rating === "hard") {
      // A difficult recall remains close. It never expands the review interval.
      interval =
        previous && interval >= 1
          ? Math.max(1, Math.min(interval, 3))
          : 10 / 1440;
      if (!sameDay) ease = Math.max(1.3, ease - 0.15);
    } else if ((!wasSuccessfulToday && !earlyRecall) || interval < 1) {
      if (interval < 1) interval = rating === "easy" ? 3 : 1;
      else
        interval = Math.min(
          365,
          Math.max(
            interval + 1,
            Math.round(interval * ease * (rating === "easy" ? 1.3 : 1)),
          ),
        );
      if (rating === "easy") ease = Math.min(3.2, ease + 0.1);
    }
    // Repeating a remembered word on the same calendar day cannot grow its interval.
    due = now + Math.max(10 * MINUTE, interval * DAY);
    // Optional practice before a scheduled review must not move that review away.
    if (earlyRecall && previous.interval >= 1)
      due = Math.min(previous.due, due);
  }

  const record: WordProgress = {
    due,
    interval,
    ease,
    reviews: (previous?.reviews ?? 0) + 1,
    lapses: (previous?.lapses ?? 0) + (rating === "again" ? 1 : 0),
    streak,
    lastReviewed: now,
  };
  const day = localDay(now);
  const activity = own(progress.activity, day)
    ? progress.activity[day]
    : { reviews: 0, correct: 0, xp: 0 };
  const xp = { again: 2, hard: 6, good: 10, easy: 12 }[rating];
  return {
    ...progress,
    words: { ...progress.words, [id]: record },
    activity: {
      ...progress.activity,
      [day]: {
        reviews: activity.reviews + 1,
        correct: activity.correct + (rating === "again" ? 0 : 1),
        xp: activity.xp + xp,
      },
    },
  };
}

export function getDueWords(
  words: Word[],
  progress: Progress,
  now: number = Date.now(),
): Word[] {
  return words
    .filter((word) => {
      const record = studied(progress, word.id);
      return word.definition.trim() && record && record.due <= now;
    })
    .sort(
      (a, b) => studied(progress, a.id)!.due - studied(progress, b.id)!.due,
    );
}

export function buildSession(
  words: Word[],
  progress: Progress,
  options: { mode: SessionMode; limit: number },
  now: number = Date.now(),
): Word[] {
  const limit = Number.isFinite(options.limit)
    ? Math.max(0, Math.min(100, Math.floor(options.limit)))
    : 10;
  const seen = new Set<string>();
  const eligible = words.filter((word) => {
    if (!word.definition.trim() || seen.has(word.id)) return false;
    seen.add(word.id);
    return true;
  });
  let candidates: Word[];
  if (options.mode === "review")
    candidates = getDueWords(eligible, progress, now);
  else if (options.mode === "learn") {
    candidates = eligible
      .filter((word) => !studied(progress, word.id))
      .sort(
        (a, b) =>
          b.sources.length - a.sources.length || a.word.localeCompare(b.word),
      );
  } else if (options.mode === "weak") {
    candidates = eligible
      .filter((word) => (studied(progress, word.id)?.lapses ?? 0) > 0)
      .sort((a, b) => {
        const pa = studied(progress, a.id)!;
        const pb = studied(progress, b.id)!;
        return (
          pa.streak - pb.streak ||
          pb.lapses / pb.reviews - pa.lapses / pa.reviews ||
          pa.due - pb.due
        );
      });
  } else if (options.mode === "bookmarked") {
    const bookmarks = new Set(progress.bookmarks);
    candidates = eligible.filter((word) => bookmarks.has(word.id));
  } else return [];
  return candidates.slice(0, limit);
}

function studyStreak(progress: Progress, now: number): number {
  // setDate handles 23-/25-hour DST days; subtracting 86,400,000 does not.
  const date = new Date(now);
  date.setHours(12, 0, 0, 0);
  const hasActivity = () =>
    (progress.activity[localDay(date.getTime())]?.reviews ?? 0) > 0;
  if (!hasActivity()) date.setDate(date.getDate() - 1);
  let streak = 0;
  while (hasActivity() && streak < 36600) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

export function getStats(
  words: Word[],
  progress: Progress,
  now: number = Date.now(),
): Stats {
  const ids = new Set(words.map((word) => word.id));
  const records = Object.entries(progress.words)
    .filter(([id]) => ids.has(id))
    .map(([, value]) => value);
  const activity = Object.values(progress.activity);
  const totalReviews = activity.reduce((sum, day) => sum + day.reviews, 0);
  const correct = activity.reduce((sum, day) => sum + day.correct, 0);
  return {
    learned: records.filter((record) => record.reviews > 0).length,
    mastered: records.filter(
      (record) => record.streak >= 4 && record.interval >= 14,
    ).length,
    due: getDueWords(words, progress, now).length,
    accuracy: totalReviews ? Math.round((correct / totalReviews) * 100) : 0,
    streak: studyStreak(progress, now),
    totalReviews,
    xp: activity.reduce((sum, day) => sum + day.xp, 0),
    todayReviews: progress.activity[localDay(now)]?.reviews ?? 0,
  };
}

function randomGenerator(seed?: number | string): () => number {
  if (seed === undefined) return Math.random;
  let state = 2166136261;
  for (const char of String(seed))
    state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: T[], random: () => number): T[] {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const chosen = Math.floor(random() * (index + 1));
    [values[index], values[chosen]] = [values[chosen], values[index]];
  }
  return values;
}

const definitionKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Does not invent distractors: a tiny/custom deck may return fewer than four choices. */
export function quizChoices(
  word: Word,
  words: Word[],
  seed?: number | string,
): QuizChoice[] {
  if (!word.definition.trim()) return [];
  const random = randomGenerator(seed);
  const keys = new Set([definitionKey(word.definition)]);
  const choices: QuizChoice[] = [
    { id: word.id, text: word.definition, correct: true },
  ];
  const candidates = shuffle(
    words.filter(
      (candidate) =>
        candidate.id !== word.id &&
        candidate.word.toLowerCase() !== word.word.toLowerCase(),
    ),
    random,
  );
  for (const candidate of candidates) {
    const key = definitionKey(candidate.definition);
    if (!key || keys.has(key)) continue;
    keys.add(key);
    choices.push({
      id: candidate.id,
      text: candidate.definition,
      correct: false,
    });
    if (choices.length === 4) break;
  }
  return shuffle(choices, random);
}
