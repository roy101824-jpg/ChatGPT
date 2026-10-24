import { recordAttempt } from "./engine.ts";
import type { PrepGrade, PrepProgress } from "./types.ts";

/** Build the whole batch without changing current, then perform one durable write.
 * Callers publish the returned state only after this function succeeds. */
export function commitGradeBatch(
  current: PrepProgress,
  grades: PrepGrade[],
  persist: (progress: PrepProgress) => boolean,
  now = Date.now(),
): PrepProgress {
  if (!Array.isArray(grades) || grades.length > 60)
    throw new Error("The grading batch is invalid.");
  const seen = new Map(
    current.attempts.map((attempt) => [attempt.id, attempt.questionId]),
  );
  let next = current;
  for (const item of grades) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !item.id ||
      item.id.length > 500
    )
      throw new Error(
        "The grading batch contains an invalid attempt identifier.",
      );
    if (seen.has(item.id)) {
      if (seen.get(item.id) !== item.question.id)
        throw new Error(
          "This attempt identifier already belongs to another question.",
        );
      continue;
    }
    next = recordAttempt(
      next,
      item.question,
      item.answer,
      item.confidence,
      item.elapsedMs,
      item.mode,
      now,
    );
    next.attempts[next.attempts.length - 1].id = item.id;
    seen.set(item.id, item.question.id);
  }
  if (!persist(next))
    throw new Error(
      "Your results could not be saved. Keep this session open, make browser storage available, then try again.",
    );
  return next;
}
