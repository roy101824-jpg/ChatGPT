import { familyOf, formatNames, type PrepFamily } from "./catalog.ts";
import type { PrepFormat, PrepQuestion } from "./types.ts";
export type PrepView = "train" | "timed" | "review" | "guides" | "resources";
export interface PrepPreferences {
  view: PrepView;
  family: PrepFamily;
  format: PrepFormat | "all";
  difficulty: string;
  topic: string;
  count: number;
  fresh: boolean;
}
const key = "wordtrail.prep-preferences.v1";
export function readPreferences(
  bank: PrepQuestion[],
  initialFormat?: PrepFormat,
): PrepPreferences {
  const next: PrepPreferences = {
    view: "train",
    family: "all",
    format: "all",
    difficulty: "all",
    topic: "all",
    count: 10,
    fresh: true,
  };
  try {
    const stored = JSON.parse(sessionStorage.getItem(key) || "null");
    if (stored && typeof stored === "object") {
      if (
        ["train", "timed", "review", "guides", "resources"].includes(
          stored.view,
        )
      )
        next.view = stored.view;
      if (["all", "tc", "se", "rc"].includes(stored.family))
        next.family = stored.family;
      if (stored.format === "all" || Object.hasOwn(formatNames, stored.format))
        next.format = stored.format;
      if (next.format !== "all") next.family = familyOf(next.format);
      if (["all", "Core", "Standard", "Advanced"].includes(stored.difficulty))
        next.difficulty = stored.difficulty;
      if (stored.topic === "all" || bank.some((q) => q.topic === stored.topic))
        next.topic = stored.topic;
      if ([5, 10, 15, 20].includes(stored.count)) next.count = stored.count;
      if (typeof stored.fresh === "boolean") next.fresh = stored.fresh;
    }
  } catch {
    /* Session preferences are optional; learning progress is stored separately. */
  }
  if (initialFormat)
    Object.assign(next, {
      view: "train",
      family: familyOf(initialFormat),
      format: initialFormat,
      topic: "all",
      difficulty: "all",
    });
  return next;
}
export function rememberPreferences(value: PrepPreferences) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Optional convenience. */
  }
}
