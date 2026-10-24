import type { PrepQuestion } from "./types";
import { practiceQuestions, readingPassages } from "../data/practice.ts";
import { verbalQuestions } from "../data/prep/verbal.ts";
const provenance = {
  kind: "original" as const,
  author: "Wordtrail" as const,
  verifiedOn: "2026-10-24",
};
const legacy: PrepQuestion[] = [
  ...practiceQuestions.map((q) => ({
    id: "original-" + q.id,
    section: "verbal" as const,
    format: q.type === "context" ? ("tc1" as const) : ("se" as const),
    topic: q.type === "context" ? "Text completion" : "Sentence equivalence",
    skill: q.skill,
    difficulty:
      q.difficulty === "Foundation" ? ("Core" as const) : ("Standard" as const),
    stem: q.prompt,
    ...(q.type === "context"
      ? { blanks: [{ choices: q.choices, answer: q.answers[0] }] }
      : { choices: q.choices, answers: q.answers }),
    explanation: q.explanation,
    trap: "Choose from the evidence in this sentence, not just from a familiar definition.",
    strategy: "Predict the meaning before comparing the answer choices.",
    estimatedSeconds: 75,
    provenance,
  })),
  ...readingPassages.flatMap((p) =>
    p.questions.map((q) => ({
      id: "original-" + q.id,
      section: "verbal" as const,
      format: "rc-single" as const,
      topic: "Reading comprehension",
      skill: q.skill,
      difficulty:
        q.difficulty === "Foundation"
          ? ("Core" as const)
          : ("Standard" as const),
      stem: q.prompt,
      choices: q.choices,
      answers: q.answers,
      passage: { id: "original-" + p.id, sentences: [p.passage] },
      explanation: q.explanation,
      trap: "An answer can be plausible in the real world and still be unsupported by this passage.",
      strategy:
        "Locate the claim, its evidence, and the precise scope of the question.",
      estimatedSeconds: 100,
      provenance,
    })),
  ),
];
export const prepBank: PrepQuestion[] = [...verbalQuestions, ...legacy];
export const prepById = new Map(prepBank.map((q) => [q.id, q]));
