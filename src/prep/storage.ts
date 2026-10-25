import type {
  ErrorReason,
  PrepAnswer,
  PrepAttempt,
  PrepProgress,
} from "./types.ts";

export const PREP_STORAGE_KEY = "wordtrail.prep.v1";
const BACKUP_FORMAT = "wordtrail-prep-backup";
const ERRORS: ErrorReason[] = [
  "Concept gap",
  "Misread the question",
  "Logic or evidence",
  "Timing",
  "Vocabulary",
  "Careless selection",
];
export function defaultPrepProgress(): PrepProgress {
  return {
    version: 1,
    attempts: [],
    saved: [],
    notes: Object.create(null),
    targetDate: "",
    officialScores: [],
  };
}
function fail(message: string): never {
  throw new Error(`Invalid prep backup: ${message}`);
}
function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function text(value: unknown, label: string, max = 5000): string {
  if (typeof value !== "string" || value.length > max)
    return fail(`${label} must be text of at most ${max} characters.`);
  return value;
}
function id(value: unknown, label = "identifier", max = 300): string {
  const result = text(value, label, max);
  if (
    !result.trim() ||
    ["__proto__", "prototype", "constructor"].includes(result)
  )
    return fail(`${label} is invalid.`);
  return result;
}
function number(value: unknown, label: string, max: number, min = 0): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    return fail(`${label} is outside its allowed range.`);
  return value;
}
function list(value: unknown, label: string, max = 100000): unknown[] {
  if (!Array.isArray(value) || value.length > max)
    return fail(`${label} must be a list of at most ${max} entries.`);
  return value;
}
function date(value: unknown, label: string, optional = false): string {
  const result = text(value, label, 10);
  if (optional && result === "") return result;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) return fail(`${label} is invalid.`);
  const parsed = new Date(`${result}T12:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== result
  )
    return fail(`${label} is invalid.`);
  return result;
}
function answer(value: unknown): PrepAnswer {
  const raw = object(value, "answer");
  const result: PrepAnswer = {};
  if (raw.selections !== undefined) {
    const selections = list(raw.selections, "selected choices", 100).map(
      (value) => number(value, "choice index", 1000),
    );
    if (new Set(selections).size !== selections.length)
      return fail("selected choices contain duplicates.");
    result.selections = selections;
  }
  if (raw.blanks !== undefined)
    result.blanks = list(raw.blanks, "blanks", 3).map((value) =>
      value === null ? null : number(value, "blank index", 1000),
    );
  if (raw.sentence !== undefined)
    result.sentence = number(raw.sentence, "sentence index", 1000);
  return result;
}
function validate(raw: unknown): PrepProgress {
  const root = object(raw, "progress");
  if (root.version !== 1) return fail("this version is not supported.");
  const result = defaultPrepProgress();
  const attemptIds = new Set<string>();
  result.attempts = list(root.attempts, "attempts").map((raw) => {
    const item = object(raw, "attempt");
    const attemptId = id(item.id, "attempt identifier", 500);
    if (attemptIds.has(attemptId))
      return fail("attempt identifiers must be unique.");
    attemptIds.add(attemptId);
    if (typeof item.correct !== "boolean")
      return fail("correct must be true or false.");
    if (
      typeof item.confidence !== "string" ||
      !["sure", "unsure", "guess", "unrated"].includes(item.confidence)
    )
      return fail("confidence is invalid.");
    if (
      typeof item.mode !== "string" ||
      !["drill", "timed", "exam"].includes(item.mode)
    )
      return fail("practice mode is invalid.");
    const attempt: PrepAttempt = {
      id: attemptId,
      questionId: id(item.questionId, "question identifier", 200),
      answer: answer(item.answer),
      correct: item.correct,
      elapsedMs: number(item.elapsedMs, "time spent", 604800000),
      createdAt: number(item.createdAt, "attempt date", 32503680000000),
      confidence: item.confidence as PrepAttempt["confidence"],
      mode: item.mode as PrepAttempt["mode"],
    };
    if (item.errorReason !== undefined) {
      if (!ERRORS.includes(item.errorReason as ErrorReason))
        return fail("error reason is invalid.");
      attempt.errorReason = item.errorReason as ErrorReason;
    }
    if (item.note !== undefined) attempt.note = text(item.note, "attempt note");
    return attempt;
  });
  result.saved = [
    ...new Set(
      list(root.saved, "saved questions").map((value) =>
        id(value, "saved question", 200),
      ),
    ),
  ];
  const notes = Object.entries(object(root.notes, "notes"));
  if (notes.length > 100000) return fail("too many notes.");
  for (const [key, value] of notes)
    result.notes[id(key, "note identifier", 200)] = text(value, "note");
  result.targetDate = date(root.targetDate, "target date", true);
  result.officialScores = list(
    root.officialScores,
    "official scores",
    1000,
  ).map((raw) => {
    const item = object(raw, "official score");
    return {
      date: date(item.date, "score date"),
      verbal: number(item.verbal, "verbal score", 170, 130),
      source: text(item.source, "score source", 160),
    };
  });
  return result;
}
export function parsePrepBackup(value: string): PrepProgress {
  if (typeof value !== "string" || value.length > 15000000)
    return fail("the file is too large.");
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    return fail("the file is not valid JSON.");
  }
  const root = object(raw, "file");
  if ("format" in root) {
    if (root.format !== BACKUP_FORMAT)
      return fail("this is not a Wordtrail prep backup.");
    return validate(root.progress);
  }
  return validate(root);
}
export function serializePrepBackup(progress: PrepProgress): string {
  return JSON.stringify(
    {
      format: BACKUP_FORMAT,
      exportedAt: new Date().toISOString(),
      progress: validate(progress),
    },
    null,
    2,
  );
}
export function loadPrepProgress(): PrepProgress {
  try {
    const raw = globalThis.localStorage?.getItem(PREP_STORAGE_KEY);
    return raw ? parsePrepBackup(raw) : defaultPrepProgress();
  } catch {
    return defaultPrepProgress();
  }
}
export function savePrepProgress(progress: PrepProgress): boolean {
  try {
    if (!globalThis.localStorage) return false;
    globalThis.localStorage.setItem(
      PREP_STORAGE_KEY,
      JSON.stringify(validate(progress)),
    );
    return true;
  } catch {
    return false;
  }
}
