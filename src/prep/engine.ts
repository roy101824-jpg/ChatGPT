import type {
  PrepAnswer,
  PrepAttempt,
  PrepDifficulty,
  PrepFormat,
  PrepProgress,
  PrepQuestion,
} from "./types.ts";

const FORMATS: Record<PrepFormat, string> = {
  tc1: "Text completion · 1 blank",
  tc2: "Text completion · 2 blanks",
  tc3: "Text completion · 3 blanks",
  se: "Sentence equivalence",
  "rc-single": "Reading · one answer",
  "rc-multi": "Reading · multiple answers",
  "rc-sentence": "Reading · select a sentence",
};
export const formatLabel = (format: PrepFormat): string =>
  Object.prototype.hasOwnProperty.call(FORMATS, format)
    ? FORMATS[format]
    : "Practice question";

const validIndex = (value: unknown, length: number) =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value < length;
function validSelections(
  answer: PrepAnswer,
  count: number,
): answer is PrepAnswer & { selections: number[] } {
  return (
    Array.isArray(answer.selections) &&
    answer.selections.length > 0 &&
    answer.selections.every((index) => validIndex(index, count)) &&
    new Set(answer.selections).size === answer.selections.length
  );
}

export function hasCompleteAnswer(
  question: PrepQuestion,
  answer: PrepAnswer,
): boolean {
  if (
    question.section !== "verbal" ||
    !Object.prototype.hasOwnProperty.call(FORMATS, question.format)
  )
    return false;
  if (!answer || typeof answer !== "object" || Array.isArray(answer))
    return false;
  if (question.format === "rc-sentence")
    return validIndex(answer.sentence, question.passage?.sentences.length ?? 0);
  if (
    question.format === "tc1" ||
    question.format === "tc2" ||
    question.format === "tc3"
  ) {
    const count = Number(question.format.slice(2));
    return (
      question.blanks?.length === count &&
      Array.isArray(answer.blanks) &&
      answer.blanks.length === count &&
      answer.blanks.every((selected, i) =>
        validIndex(selected, question.blanks![i].choices.length),
      )
    );
  }
  const count = question.choices?.length ?? 0;
  if (!validSelections(answer, count)) return false;
  if (question.format === "se") return answer.selections.length === 2;
  if (question.format === "rc-multi") return true;
  return answer.selections.length === 1;
}

/** GRE-style all-or-nothing scoring; no partial credit or inferred scaled score. */
export function scoreAnswer(
  question: PrepQuestion,
  answer: PrepAnswer,
): boolean {
  if (!hasCompleteAnswer(question, answer)) return false;
  if (question.format === "rc-sentence")
    return answer.sentence === question.sentenceAnswer;
  if (question.format.startsWith("tc"))
    return question.blanks!.every(
      (blank, i) => answer.blanks![i] === blank.answer,
    );
  const expected = question.answers;
  if (!expected?.length || new Set(expected).size !== expected.length)
    return false;
  return (
    answer.selections!.length === expected.length &&
    expected.every((index) => answer.selections!.includes(index))
  );
}

function rng(seed: string | number): () => number {
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
function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const other = Math.floor(random() * (i + 1));
    [items[i], items[other]] = [items[other], items[i]];
  }
  return items;
}
function uniqueBank(bank: PrepQuestion[]): PrepQuestion[] {
  return [
    ...new Map(
      bank
        .filter(
          (question) =>
            question.section === "verbal" &&
            Object.prototype.hasOwnProperty.call(FORMATS, question.format),
        )
        .map((question) => [question.id, question]),
    ).values(),
  ];
}
function stimulusKey(question: PrepQuestion): string {
  if (question.passage) return `passage:${question.passage.id}`;
  return `question:${question.id}`;
}
function groupStimuli(questions: PrepQuestion[]): PrepQuestion[] {
  const groups = new Map<string, PrepQuestion[]>();
  for (const question of questions) {
    const key = stimulusKey(question);
    const group = groups.get(key) ?? [];
    group.push(question);
    groups.set(key, group);
  }
  return [...groups.values()].flat();
}
export interface QuestionSelection {
  section: "verbal" | "all";
  format?: PrepFormat | "all";
  difficulty?: PrepDifficulty | "all";
  topic?: string;
  count: number;
  excludeIds?: string[];
  onlyIds?: string[];
  seed?: string | number;
}

/** Round-robin format/topic buckets produce variety; a seed makes a selection reproducible. */
export function selectQuestions(
  bank: PrepQuestion[],
  options: QuestionSelection,
): PrepQuestion[] {
  const count = Number.isFinite(options.count)
    ? Math.max(0, Math.min(2000, Math.floor(options.count)))
    : 0;
  if (!count) return [];
  const excluded = new Set(options.excludeIds ?? []);
  const allowed =
    options.onlyIds === undefined ? null : new Set(options.onlyIds);
  const random = rng(options.seed ?? 0);
  const eligible = uniqueBank(bank).filter(
    (question) =>
      (options.section === "all" || question.section === options.section) &&
      (!options.format ||
        options.format === "all" ||
        question.format === options.format) &&
      (!options.difficulty ||
        options.difficulty === "all" ||
        question.difficulty === options.difficulty) &&
      (!options.topic ||
        options.topic === "all" ||
        question.topic === options.topic) &&
      !excluded.has(question.id) &&
      (!allowed || allowed.has(question.id)),
  );
  const buckets = new Map<string, PrepQuestion[]>();
  for (const question of shuffle(eligible, random)) {
    const key = `${question.section}:${question.format}:${question.topic}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(question);
    buckets.set(key, bucket);
  }
  const groups = shuffle([...buckets.values()], random);
  const selected: PrepQuestion[] = [];
  while (selected.length < count && groups.some((group) => group.length)) {
    for (const group of groups) {
      const question = group.pop();
      if (question) selected.push(question);
      if (selected.length === count) break;
    }
  }
  return groupStimuli(selected);
}

export interface ExamSection {
  id: string;
  title: string;
  section: "verbal";
  minutes: number;
  questionIds: string[];
}
export interface ExamPlan {
  label: string;
  adaptive: false;
  sections: ExamSection[];
  totalQuestions: number;
  totalMinutes: number;
}
export function buildExamPlan(
  bank: PrepQuestion[],
  seed: string | number = 0,
): ExamPlan {
  if (
    uniqueBank(bank).filter((question) => question.section === "verbal")
      .length < 27
  )
    throw new Error(
      "A full verbal timing simulation needs at least 27 distinct verbal questions.",
    );
  const used = new Set<string>();
  // Training proportions provide vocabulary and passage work in each section;
  // they are not a claim about any particular official test form.
  const sectionQuestions = (
    count: number,
    sectionSeed: string,
  ): PrepQuestion[] => {
    const selected: PrepQuestion[] = [];
    const take = (formats: PrepFormat[], amount: number, suffix: string) => {
      const pool = bank.filter((question) => formats.includes(question.format));
      const picked = selectQuestions(pool, {
        section: "verbal",
        count: amount,
        excludeIds: [...used],
        seed: `${sectionSeed}:${suffix}`,
      });
      for (const question of picked) {
        selected.push(question);
        used.add(question.id);
      }
    };
    take(["tc1", "tc2", "tc3"], count === 12 ? 4 : 5, "completion");
    take(["se"], count === 12 ? 2 : 3, "equivalence");
    take(
      ["rc-single", "rc-multi", "rc-sentence"],
      count === 12 ? 6 : 7,
      "reading",
    );
    if (selected.length < count) {
      const extra = selectQuestions(bank, {
        section: "verbal",
        count: count - selected.length,
        excludeIds: [...used],
        seed: `${sectionSeed}:remaining`,
      });
      for (const question of extra) {
        selected.push(question);
        used.add(question.id);
      }
    }
    return groupStimuli(selected);
  };
  const first = sectionQuestions(12, `${seed}:v1`);
  const second = sectionQuestions(15, `${seed}:v2`);
  return {
    label: "Fixed-form verbal timing simulation",
    adaptive: false,
    totalQuestions: 27,
    totalMinutes: 41,
    sections: [
      {
        id: "v1",
        title: "Verbal · section 1",
        section: "verbal",
        minutes: 18,
        questionIds: first.map((question) => question.id),
      },
      {
        id: "v2",
        title: "Verbal · section 2",
        section: "verbal",
        minutes: 23,
        questionIds: second.map((question) => question.id),
      },
    ],
  };
}

export interface TopicStats {
  topic: string;
  section: "verbal";
  attempts: number;
  correct: number;
  accuracy: number;
  avgSeconds: number;
  unsure: number;
}
export interface PrepStats {
  attempted: number;
  correct: number;
  accuracy: number;
  unseen: number;
  reviewIds: string[];
  byTopic: TopicStats[];
  totalAttempts: number;
  totalSeconds: number;
  unsure: number;
}
export function getPrepStats(
  bank: PrepQuestion[],
  progress: PrepProgress,
): PrepStats {
  const questions = new Map(
    uniqueBank(bank).map((question) => [question.id, question]),
  );
  const validAttempts = progress.attempts.filter((attempt) =>
    questions.has(attempt.questionId),
  );
  const latest = new Map<string, PrepAttempt>();
  for (const attempt of validAttempts) {
    const previous = latest.get(attempt.questionId);
    if (!previous || previous.createdAt <= attempt.createdAt)
      latest.set(attempt.questionId, attempt);
  }
  const topics = new Map<string, { topic: TopicStats; seconds: number }>();
  for (const question of questions.values()) {
    const key = `${question.section}:${question.topic}`;
    if (!topics.has(key))
      topics.set(key, {
        topic: {
          topic: question.topic,
          section: question.section,
          attempts: 0,
          correct: 0,
          accuracy: 0,
          avgSeconds: 0,
          unsure: 0,
        },
        seconds: 0,
      });
  }
  const latestAttempts = [...latest.values()];
  for (const attempt of latestAttempts) {
    const question = questions.get(attempt.questionId)!;
    const item = topics.get(`${question.section}:${question.topic}`)!;
    item.topic.attempts += 1;
    item.topic.correct += Number(attempt.correct);
    item.topic.unsure += Number(attempt.confidence !== "sure");
    item.seconds += attempt.elapsedMs / 1000;
  }
  const byTopic = [...topics.values()]
    .map(({ topic, seconds }) => ({
      ...topic,
      accuracy: topic.attempts
        ? Math.round((topic.correct / topic.attempts) * 100)
        : 0,
      avgSeconds: topic.attempts ? Math.round(seconds / topic.attempts) : 0,
    }))
    .sort(
      (a, b) =>
        a.section.localeCompare(b.section) || a.topic.localeCompare(b.topic),
    );
  const correct = latestAttempts.filter((attempt) => attempt.correct).length;
  return {
    attempted: latest.size,
    correct,
    accuracy: latest.size ? Math.round((correct / latest.size) * 100) : 0,
    unseen: questions.size - latest.size,
    reviewIds: latestAttempts
      .filter((attempt) => !attempt.correct || attempt.confidence !== "sure")
      .sort(
        (a, b) =>
          Number(a.correct) - Number(b.correct) || a.createdAt - b.createdAt,
      )
      .map((attempt) => attempt.questionId),
    byTopic,
    totalAttempts: validAttempts.length,
    totalSeconds: Math.round(
      validAttempts.reduce((sum, attempt) => sum + attempt.elapsedMs, 0) / 1000,
    ),
    unsure: latestAttempts.filter((attempt) => attempt.confidence !== "sure")
      .length,
  };
}

function cloneAnswer(answer: PrepAnswer): PrepAnswer {
  const result: PrepAnswer = {};
  if (!answer || typeof answer !== "object" || Array.isArray(answer))
    throw new Error("The answer must be an object.");
  if (answer.selections !== undefined) {
    if (
      !Array.isArray(answer.selections) ||
      answer.selections.length > 100 ||
      answer.selections.some((value) => !validIndex(value, 1001)) ||
      new Set(answer.selections).size !== answer.selections.length
    )
      throw new Error("The selected choices are invalid.");
    result.selections = [...answer.selections];
  }
  if (answer.blanks !== undefined) {
    if (
      !Array.isArray(answer.blanks) ||
      answer.blanks.length > 3 ||
      answer.blanks.some((value) => value !== null && !validIndex(value, 1001))
    )
      throw new Error("The blank selections are invalid.");
    result.blanks = [...answer.blanks];
  }
  if (answer.sentence !== undefined) {
    if (!validIndex(answer.sentence, 1001))
      throw new Error("The selected sentence is invalid.");
    result.sentence = answer.sentence;
  }
  return result;
}

export function recordAttempt(
  progress: PrepProgress,
  question: PrepQuestion,
  answer: PrepAnswer,
  confidence: PrepAttempt["confidence"],
  elapsedMs: number,
  mode: PrepAttempt["mode"],
  now: number = Date.now(),
): PrepProgress {
  if (
    question.section !== "verbal" ||
    !Object.prototype.hasOwnProperty.call(FORMATS, question.format)
  )
    throw new Error("Choose a supported verbal practice question.");
  if (
    !["sure", "unsure", "guess"].includes(confidence) ||
    !["drill", "timed", "exam"].includes(mode)
  )
    throw new Error("The practice attempt has an invalid mode or confidence.");
  if (
    !Number.isFinite(elapsedMs) ||
    elapsedMs < 0 ||
    elapsedMs > 604800000 ||
    !Number.isFinite(now) ||
    now < 0 ||
    now > 32503680000000
  )
    throw new Error("The practice timing is invalid.");
  if (progress.attempts.length >= 100000)
    throw new Error(
      "Your practice history is full. Export a backup before starting a new history.",
    );
  const cleanAnswer = cloneAnswer(answer);
  const attempt: PrepAttempt = {
    id: `${Math.floor(now).toString(36)}:${question.id}:${progress.attempts.length}`,
    questionId: question.id,
    answer: cleanAnswer,
    correct: scoreAnswer(question, cleanAnswer),
    confidence,
    elapsedMs: Math.round(elapsedMs),
    mode,
    createdAt: Math.round(now),
  };
  return { ...progress, attempts: [...progress.attempts, attempt] };
}
