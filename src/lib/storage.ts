import { defaultProgress, type Progress, type WordProgress } from "./study.ts";

export const STORAGE_KEY = "wordtrail.progress.v1";
export const BACKUP_FORMAT = "wordtrail-backup";
const MAX_BACKUP_BYTES = 10_000_000;
const MAX_ENTRIES = 100_000;
const MAX_TIME = 32_503_680_000_000;

function invalid(message: string): never {
  throw new Error(`Invalid backup: ${message}`);
}
function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function number(
  value: unknown,
  label: string,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  integer = false,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  ) {
    return invalid(`${label} is outside its allowed range.`);
  }
  return value;
}
function string(value: unknown, label: string, limit = 2000): string {
  if (typeof value !== "string" || value.length > limit)
    return invalid(`${label} must be text of at most ${limit} characters.`);
  return value;
}
function key(value: unknown): string {
  const result = string(value, "word identifier", 200);
  if (!result || ["__proto__", "constructor", "prototype"].includes(result))
    return invalid("unsafe word identifier.");
  return result;
}
function dateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
function entries(
  value: unknown,
  label: string,
  max = MAX_ENTRIES,
): Array<[string, unknown]> {
  const result = Object.entries(object(value, label));
  if (result.length > max)
    return invalid(`${label} contains too many entries.`);
  return result;
}

/** Strictly validate then reconstruct allowlisted fields; never merge untrusted JSON. */
function validateProgress(value: unknown): Progress {
  const root = object(value, "progress");
  if (root.version !== 1) return invalid("this version is not supported.");
  const progress = defaultProgress();
  for (const [id, raw] of entries(root.words, "words")) {
    key(id);
    const record = object(raw, "word progress");
    const word: WordProgress = {
      due: number(record.due, "review date", 0, MAX_TIME),
      interval: number(record.interval, "review interval", 0, 3650),
      ease: number(record.ease, "ease", 1.3, 3.2),
      reviews: number(record.reviews, "review count", 0, 10_000_000, true),
      lapses: number(record.lapses, "lapse count", 0, 10_000_000, true),
      streak: number(record.streak, "recall streak", 0, 10_000_000, true),
      lastReviewed: number(
        record.lastReviewed,
        "last review date",
        0,
        MAX_TIME,
      ),
    };
    if (word.lapses > word.reviews || word.streak > word.reviews)
      return invalid("word review counts are inconsistent.");
    progress.words[id] = word;
  }
  for (const [day, raw] of entries(root.activity, "activity", 36600)) {
    if (!dateKey(day))
      return invalid("activity contains an invalid calendar date.");
    const item = object(raw, "daily activity");
    const reviews = number(item.reviews, "daily reviews", 0, 1_000_000, true);
    const correct = number(
      item.correct,
      "daily correct answers",
      0,
      reviews,
      true,
    );
    const xp = number(item.xp, "daily XP", 0, reviews * 12, true);
    progress.activity[day] = { reviews, correct, xp };
  }
  if (!Array.isArray(root.bookmarks) || root.bookmarks.length > MAX_ENTRIES)
    return invalid("bookmarks must be a list.");
  progress.bookmarks = [...new Set(root.bookmarks.map(key))];
  const settings = object(root.settings, "settings");
  if (typeof settings.sound !== "boolean")
    return invalid("sound must be on or off.");
  const examDate = string(settings.examDate, "exam date", 10);
  if (examDate && !dateKey(examDate))
    return invalid("the exam date is invalid.");
  progress.settings = {
    dailyGoal: number(settings.dailyGoal, "daily goal", 1, 500, true),
    sessionSize: number(settings.sessionSize, "session size", 1, 100, true),
    sound: settings.sound,
    examDate,
  };
  for (const [id, note] of entries(root.notes, "notes"))
    progress.notes[key(id)] = string(note, "note", 5000);
  return progress;
}

export function parseBackup(text: string): Progress {
  if (typeof text !== "string" || text.length > MAX_BACKUP_BYTES)
    return invalid("the file is too large.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return invalid("the file is not valid JSON.");
  }
  const root = object(raw, "file");
  if ("format" in root) {
    if (root.format !== BACKUP_FORMAT)
      return invalid("this is not a Wordtrail backup.");
    return validateProgress(root.progress);
  }
  return validateProgress(root);
}

export function serializeBackup(progress: Progress): string {
  const clean = validateProgress(progress);
  return JSON.stringify(
    {
      format: BACKUP_FORMAT,
      exportedAt: new Date().toISOString(),
      progress: clean,
    },
    null,
    2,
  );
}

/** Initial read is resilient to Safari private mode, disabled storage, and malformed data. */
export function loadProgress(): Progress {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw ? parseBackup(raw) : defaultProgress();
  } catch {
    return defaultProgress();
  }
}

/** The UI must show a storage warning when false is returned. */
export function saveProgress(progress: Progress): boolean {
  try {
    if (!globalThis.localStorage) return false;
    const clean = validateProgress(progress);
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    return true;
  } catch {
    return false;
  }
}
