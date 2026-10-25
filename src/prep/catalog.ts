import type { PrepFormat } from "./types.ts";

export type PrepFamily = "all" | "tc" | "se" | "rc";
export const formatNames: Record<PrepFormat, string> = {
  tc1: "Text Completion · 1 blank",
  tc2: "Text Completion · 2 blanks",
  tc3: "Text Completion · 3 blanks",
  se: "Sentence Equivalence",
  "rc-single": "Reading Comprehension · Select One Answer Choice",
  "rc-multi": "Reading Comprehension · Select One or More Answer Choices",
  "rc-sentence": "Reading Comprehension · Select-in-Passage",
};
export const formatDetails: Record<
  PrepFormat,
  { label: string; rule: string }
> = {
  tc1: { label: "1 blank", rule: "Choose one of five options." },
  tc2: {
    label: "2 blanks",
    rule: "Choose one of three options for each blank.",
  },
  tc3: {
    label: "3 blanks",
    rule: "Choose one of three options for each blank.",
  },
  se: {
    label: "Choose Two Answer Choices",
    rule: "One blank · six options · two answers",
  },
  "rc-single": {
    label: "Select One Answer Choice",
    rule: "Five options · one answer",
  },
  "rc-multi": {
    label: "Select One or More Answer Choices",
    rule: "Three options · choose every correct answer",
  },
  "rc-sentence": {
    label: "Select-in-Passage",
    rule: "Select a sentence directly in the passage.",
  },
};
export const questionFamilies: Array<{
  id: Exclude<PrepFamily, "all">;
  title: string;
  description: string;
  formats: PrepFormat[];
  rule: string;
}> = [
  {
    id: "tc",
    title: "Text Completion",
    description: "Use the passage’s logic to fill one, two, or three blanks.",
    formats: ["tc1", "tc2", "tc3"],
    rule: "Every blank must be correct. No partial credit.",
  },
  {
    id: "se",
    title: "Sentence Equivalence",
    description:
      "Choose two answers that give the completed sentences equivalent meanings.",
    formats: ["se"],
    rule: "Both answers must be correct. No partial credit.",
  },
  {
    id: "rc",
    title: "Reading Comprehension",
    description:
      "Read a passage, then answer using its evidence and reasoning.",
    formats: ["rc-single", "rc-multi", "rc-sentence"],
    rule: "For one-or-more questions, one, two, or all three choices can be correct.",
  },
];
export const familyOf = (format: PrepFormat): Exclude<PrepFamily, "all"> =>
  format.startsWith("tc") ? "tc" : format === "se" ? "se" : "rc";
export const familyTitle = (family: PrepFamily): string =>
  questionFamilies.find((item) => item.id === family)?.title ||
  "Mixed Verbal practice";
