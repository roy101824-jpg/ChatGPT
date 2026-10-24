import type { PrepAnswer, PrepQuestion } from "./types.ts";

export interface RunSection {
  id: string;
  title: string;
  section: "verbal";
  minutes: number;
  questionIds: string[];
}
export interface PrepRun {
  version: 1;
  id: string;
  title: string;
  mode: "drill" | "timed" | "exam";
  sections: RunSection[];
  sectionIndex: number;
  questionIndex: number;
  answers: Record<string, PrepAnswer>;
  confidence: Record<string, "sure" | "unsure" | "guess">;
  flags: string[];
  checked: string[];
  graded: string[];
  spent: Record<string, number>;
  itemStartedAt: number;
  sectionStartedAt: number;
  deadline: number | null;
  finished: boolean;
}
export const RUN_KEY = "wordtrail.prep-session.v1";
const MAX_ITEM_MS = 604800000;
const safeId = (value: unknown, max = 200): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= max &&
  !["__proto__", "prototype", "constructor"].includes(value);
const finiteTime = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  Number.isInteger(value) &&
  value >= 0;
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function validSections(
  value: unknown,
  mode: PrepRun["mode"],
): value is RunSection[] {
  if (!Array.isArray(value) || value.length !== (mode === "exam" ? 2 : 1))
    return false;
  const sectionIds = new Set<string>();
  const questionIds = new Set<string>();
  for (const section of value) {
    if (
      !object(section) ||
      !safeId(section.id, 80) ||
      sectionIds.has(section.id) ||
      typeof section.title !== "string" ||
      section.title.length > 300 ||
      section.section !== "verbal"
    )
      return false;
    if (
      typeof section.minutes !== "number" ||
      !Number.isInteger(section.minutes) ||
      section.minutes < (mode === "drill" ? 0 : 1) ||
      section.minutes > 60 ||
      (mode === "drill" && section.minutes !== 0)
    )
      return false;
    if (
      !Array.isArray(section.questionIds) ||
      !section.questionIds.length ||
      section.questionIds.length > 60
    )
      return false;
    for (const id of section.questionIds) {
      if (!safeId(id) || questionIds.has(id)) return false;
      questionIds.add(id);
    }
    sectionIds.add(section.id);
  }
  if (
    mode === "exam" &&
    (value[0].minutes !== 18 ||
      value[0].questionIds.length !== 12 ||
      value[1].minutes !== 23 ||
      value[1].questionIds.length !== 15)
  )
    return false;
  return true;
}

export function newRun(
  title: string,
  mode: PrepRun["mode"],
  sections: RunSection[],
  now = Date.now(),
): PrepRun {
  if (
    typeof title !== "string" ||
    title.length > 300 ||
    !["drill", "timed", "exam"].includes(mode) ||
    !validSections(sections, mode) ||
    !finiteTime(now)
  )
    throw new Error("Choose a valid verbal practice session.");
  return {
    version: 1,
    id: `run-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    mode,
    sections: sections.map((section) => ({
      ...section,
      questionIds: [...section.questionIds],
    })),
    sectionIndex: 0,
    questionIndex: 0,
    answers: Object.create(null),
    confidence: Object.create(null),
    flags: [],
    checked: [],
    graded: [],
    spent: Object.create(null),
    itemStartedAt: now,
    sectionStartedAt: now,
    deadline: mode === "drill" ? null : now + sections[0].minutes * 60000,
    finished: false,
  };
}

/** Account only through the deadline, and stop a drill item's clock after its answer is checked. */
export function accountRunTime(run: PrepRun, time = Date.now()): PrepRun {
  if (run.finished || !finiteTime(time)) return run;
  const stamp = Math.max(
    run.itemStartedAt,
    Math.min(time, run.deadline ?? time),
  );
  const id = run.sections[run.sectionIndex].questionIds[run.questionIndex];
  const elapsed =
    run.mode === "drill" && run.checked.includes(id)
      ? 0
      : stamp - run.itemStartedAt;
  return {
    ...run,
    spent: {
      ...run.spent,
      [id]: Math.min(MAX_ITEM_MS, (run.spent[id] || 0) + elapsed),
    },
    itemStartedAt: stamp,
  };
}

/** Pure transition: callers persist each returned question's grade before committing next. */
export function finishRunSection(
  run: PrepRun,
  time = Date.now(),
): { next: PrepRun; questionIds: string[]; expired: boolean } {
  if (run.finished) return { next: run, questionIds: [], expired: false };
  if (!finiteTime(time))
    throw new Error("The section submission time is invalid.");
  const expired = run.deadline !== null && time >= run.deadline;
  const stamp = expired ? run.deadline! : Math.max(run.itemStartedAt, time);
  const current = accountRunTime(run, stamp);
  const questionIds = current.sections[current.sectionIndex].questionIds.filter(
    (id) => !current.graded.includes(id),
  );
  const last = current.sectionIndex === current.sections.length - 1;
  const sectionIndex = last ? current.sectionIndex : current.sectionIndex + 1;
  return {
    questionIds,
    expired,
    next: {
      ...current,
      graded: [...current.graded, ...questionIds],
      sectionIndex,
      questionIndex: last ? current.questionIndex : 0,
      finished: last,
      deadline:
        last || current.mode === "drill"
          ? null
          : stamp + current.sections[sectionIndex].minutes * 60000,
      sectionStartedAt: last ? current.sectionStartedAt : stamp,
      itemStartedAt: stamp,
    },
  };
}

export function saveRun(run: PrepRun): boolean {
  try {
    globalThis.localStorage.setItem(RUN_KEY, JSON.stringify(run));
    return true;
  } catch {
    return false;
  }
}
export function clearRun(): void {
  try {
    globalThis.localStorage.removeItem(RUN_KEY);
  } catch {
    /* Storage can be unavailable. */
  }
}

function cleanAnswer(
  value: unknown,
  question: PrepQuestion,
): PrepAnswer | null {
  if (!object(value)) return null;
  const answer: PrepAnswer = {};
  const isCompletion =
    question.format === "tc1" ||
    question.format === "tc2" ||
    question.format === "tc3";
  const allowed = isCompletion
    ? "blanks"
    : question.format === "rc-sentence"
      ? "sentence"
      : "selections";
  if (Object.keys(value).some((key) => key !== allowed)) return null;
  if (value.selections !== undefined) {
    const choices = question.choices?.length ?? 0;
    const selected = value.selections;
    if (
      !Array.isArray(selected) ||
      selected.length > choices ||
      selected.some(
        (index) => !Number.isInteger(index) || index < 0 || index >= choices,
      ) ||
      new Set(selected).size !== selected.length
    )
      return null;
    if (
      (question.format === "se" && selected.length > 2) ||
      (question.format === "rc-single" && selected.length > 1)
    )
      return null;
    answer.selections = [...selected];
  }
  if (value.blanks !== undefined) {
    if (
      !Array.isArray(value.blanks) ||
      value.blanks.length > (question.blanks?.length ?? 0)
    )
      return null;
    if (
      value.blanks.some(
        (index, i) =>
          index !== null &&
          (!Number.isInteger(index) ||
            index < 0 ||
            index >= question.blanks![i].choices.length),
      )
    )
      return null;
    answer.blanks = [...value.blanks];
  }
  if (value.sentence !== undefined) {
    if (
      !Number.isInteger(value.sentence) ||
      Number(value.sentence) < 0 ||
      Number(value.sentence) >= (question.passage?.sentences.length ?? 0)
    )
      return null;
    answer.sentence = value.sentence as number;
  }
  return answer;
}

/** Invalid snapshots are rejected rather than silently changing submitted answers or timers. */
export function parseRun(
  raw: string,
  bank: PrepQuestion[],
  now = Date.now(),
): PrepRun | null {
  try {
    if (typeof raw !== "string" || raw.length > 1_000_000) return null;
    const p: unknown = JSON.parse(raw);
    if (
      !object(p) ||
      p.version !== 1 ||
      !safeId(p.id, 100) ||
      typeof p.title !== "string" ||
      p.title.length > 300 ||
      typeof p.mode !== "string" ||
      !["drill", "timed", "exam"].includes(p.mode)
    )
      return null;
    const mode = p.mode as PrepRun["mode"];
    if (!validSections(p.sections, mode)) return null;
    const sections = p.sections.map((section) => ({
      id: section.id,
      title: section.title,
      section: section.section,
      minutes: section.minutes,
      questionIds: [...section.questionIds],
    }));
    const known = new Map(
      bank
        .filter((question) => question.section === "verbal")
        .map((question) => [question.id, question]),
    );
    const ids = new Set(sections.flatMap((section) => section.questionIds));
    if ([...ids].some((id) => !known.has(id))) return null;
    if (
      !Number.isInteger(p.sectionIndex) ||
      Number(p.sectionIndex) < 0 ||
      Number(p.sectionIndex) >= sections.length ||
      !Number.isInteger(p.questionIndex) ||
      Number(p.questionIndex) < 0 ||
      typeof p.finished !== "boolean"
    )
      return null;
    const sectionIndex = p.sectionIndex as number;
    const questionIndex = p.questionIndex as number;
    if (questionIndex >= sections[sectionIndex].questionIds.length) return null;
    if (
      !finiteTime(p.sectionStartedAt) ||
      !finiteTime(p.itemStartedAt) ||
      p.sectionStartedAt > now + 60000 ||
      p.itemStartedAt > now + 60000 ||
      p.itemStartedAt < p.sectionStartedAt
    )
      return null;
    if (mode === "drill" || p.finished) {
      if (p.deadline !== null) return null;
    } else if (
      !finiteTime(p.deadline) ||
      p.deadline !==
        p.sectionStartedAt + sections[sectionIndex].minutes * 60000 ||
      p.itemStartedAt > p.deadline
    )
      return null;
    if (p.finished && sectionIndex !== sections.length - 1) return null;
    const out = newRun(p.title, mode, sections, Math.floor(now));
    Object.assign(out, {
      id: p.id,
      sectionIndex,
      questionIndex,
      itemStartedAt: p.itemStartedAt,
      sectionStartedAt: p.sectionStartedAt,
      deadline: p.deadline,
      finished: p.finished,
    });
    for (const field of ["flags", "checked", "graded"] as const) {
      const list = p[field];
      if (
        !Array.isArray(list) ||
        list.length > ids.size ||
        list.some((id) => typeof id !== "string" || !ids.has(id)) ||
        new Set(list).size !== list.length
      )
        return null;
      out[field] = [...list];
    }
    if (
      (mode !== "drill" && out.checked.length) ||
      out.checked.some((id) => !out.graded.includes(id))
    )
      return null;
    const previousIds = sections
      .slice(0, sectionIndex)
      .flatMap((section) => section.questionIds);
    const futureIds = new Set(
      sections
        .slice(sectionIndex + 1)
        .flatMap((section) => section.questionIds),
    );
    if (
      previousIds.some((id) => !out.graded.includes(id)) ||
      out.graded.some((id) => futureIds.has(id))
    )
      return null;
    if (p.finished && out.graded.length !== ids.size) return null;
    if (
      !p.finished &&
      mode !== "drill" &&
      sections[sectionIndex].questionIds.some((id) => out.graded.includes(id))
    )
      return null;
    if (
      mode === "drill" &&
      !p.finished &&
      out.graded.some((id) => !out.checked.includes(id))
    )
      return null;
    for (const field of ["answers", "confidence", "spent"] as const)
      if (
        !object(p[field]) ||
        Object.keys(p[field]).some((id) => !ids.has(id) || !safeId(id))
      )
        return null;
    for (const id of ids) {
      if (Object.prototype.hasOwnProperty.call(p.answers, id)) {
        const answer = cleanAnswer(
          (p.answers as Record<string, unknown>)[id],
          known.get(id)!,
        );
        if (!answer) return null;
        out.answers[id] = answer;
      }
      const confidence = (p.confidence as Record<string, unknown>)[id];
      if (confidence !== undefined) {
        if (
          typeof confidence !== "string" ||
          !["sure", "unsure", "guess"].includes(confidence)
        )
          return null;
        out.confidence[id] = confidence as "sure" | "unsure" | "guess";
      }
      const spent = (p.spent as Record<string, unknown>)[id];
      if (spent !== undefined) {
        if (!finiteTime(spent) || spent > MAX_ITEM_MS) return null;
        out.spent[id] = spent;
      }
    }
    if (
      mode !== "drill" &&
      sections.some(
        (section) =>
          section.questionIds.reduce(
            (sum, id) => sum + (out.spent[id] || 0),
            0,
          ) >
          section.minutes * 60000,
      )
    )
      return null;
    return out;
  } catch {
    return null;
  }
}
export function loadRun(bank: PrepQuestion[]): PrepRun | null {
  try {
    const raw = globalThis.localStorage.getItem(RUN_KEY);
    return raw ? parseRun(raw, bank) : null;
  } catch {
    return null;
  }
}
