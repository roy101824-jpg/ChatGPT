export type ResourceKind =
  "Official practice" | "Format & scoring" | "Strategy";
export type ResourceAccess = "Free" | "Free account" | "Paid options";
export interface PrepResource {
  id: string;
  title: string;
  url: string;
  provider: string;
  kind: ResourceKind;
  access: ResourceAccess;
  description: string;
  howToUse: string;
  verifiedOn: string;
}
export interface BlueprintSection {
  id: "v1" | "v2";
  title: string;
  questions: number;
  minutes: number;
}
export interface TargetScoreStep {
  id: string;
  title: string;
  description: string;
  action: "diagnostic" | "review" | "timed" | "official" | "advanced";
}

const VERIFIED = "2026-10-24";
const ETS = "https://www.ets.org/gre/test-takers/general-test";
const links = {
  structure: `${ETS}/prepare/test-structure.html`,
  scoring: `${ETS}/scores/understand-scores.html`,
  powerprep: `${ETS}/prepare/powerprep.html`,
  verbal: `${ETS}/prepare/content/verbal-reasoning.html`,
  guessing: "https://www.ets.org/pdfs/gre/getting-into-business-school.pdf",
};

/** Current ETS specification, checked on VERIFIED; not a prediction of a future revision. */
export const examBlueprint = {
  verifiedOn: VERIFIED,
  targetYear: 2027,
  totalMinutes: 41,
  totalQuestions: 27,
  structure: [
    { id: "v1", title: "Verbal · first section", questions: 12, minutes: 18 },
    { id: "v2", title: "Verbal · second section", questions: 15, minutes: 23 },
  ] satisfies BlueprintSection[],
  notice:
    "Prepared for a 2027 goal using the ETS format verified on 24 October 2026. No separate 2027 format announcement was found in the official pages checked. Recheck ETS before booking and before test day.",
  orderNote:
    "This simulation rehearses only the two Verbal sections. In the actual GRE, other measures occur too, and the Verbal sections need not be consecutive.",
  scoreNote:
    "170 Verbal is an aspiration, not a promised result. Original Wordtrail practice is not calibrated to ETS scores and does not reproduce official adaptive routing.",
  links: [
    { id: "structure", title: "ETS test structure", url: links.structure },
    { id: "scoring", title: "ETS scoring explained", url: links.scoring },
    {
      id: "official-practice",
      title: "Official POWERPREP",
      url: links.powerprep,
    },
  ],
};

export const resourceLinks: PrepResource[] = [
  {
    id: "ets-structure",
    title: "The current GRE format",
    url: links.structure,
    provider: "ETS",
    kind: "Format & scoring",
    access: "Free",
    verifiedOn: VERIFIED,
    description:
      "The official section lengths, timing and navigation features.",
    howToUse:
      "Check this before selecting a Verbal practice schedule, especially when using an older book.",
  },
  {
    id: "ets-scores",
    title: "How GRE scores work",
    url: links.scoring,
    provider: "ETS",
    kind: "Format & scoring",
    access: "Free",
    verifiedOn: VERIFIED,
    description:
      "ETS explains section adaptation and the conversion from correct answers to reported scores.",
    howToUse:
      "Keep app accuracy separate from a scaled-score forecast. Record scores from fresh official timed tests as external benchmarks.",
  },
  {
    id: "ets-powerprep",
    title: "Free official POWERPREP practice",
    url: links.powerprep,
    provider: "ETS",
    kind: "Official practice",
    access: "Free account",
    verifiedOn: VERIFIED,
    description:
      "The current page lists POWERPREP 1 as untimed, without a Verbal score, and POWERPREP 2 as timed.",
    howToUse:
      "Use the untimed option to learn the interface. Save an unseen timed test for a realistic benchmark; prior exposure changes its value.",
  },
  {
    id: "ets-powerprep-plus",
    title: "POWERPREP PLUS options",
    url: links.powerprep,
    provider: "ETS",
    kind: "Official practice",
    access: "Paid options",
    verifiedOn: VERIFIED,
    description:
      "Additional official timed practice with explanations and score feedback is sold separately.",
    howToUse:
      "Optional: use fresh official tests when you need more evidence about readiness. Check current availability and price on ETS.",
  },
  {
    id: "ets-mini-quiz",
    title: "Official GRE mini quiz",
    url: "https://www.ets.org/gre/gre-mini-quiz.html",
    provider: "ETS",
    kind: "Official practice",
    access: "Free",
    verifiedOn: VERIFIED,
    description: "A brief introduction to official GRE question styles.",
    howToUse:
      "Explore the interface and reasoning demands. A short quiz is not a full-length diagnostic or score estimate.",
  },
  {
    id: "ets-verbal",
    title: "Verbal question types and reasoning",
    url: links.verbal,
    provider: "ETS",
    kind: "Strategy",
    access: "Free",
    verifiedOn: VERIFIED,
    description:
      "ETS guidance for reading comprehension, text completion and sentence equivalence.",
    howToUse:
      "Check why an answer is required by the sentence or passage. Practice single-answer, multiple-answer and sentence-selection reading formats.",
  },
];

export const formatRules = [
  {
    id: "adaptive",
    title: "Adaptation happens between sections",
    description:
      "Your first Verbal section informs the second Verbal section. App drills do not reproduce ETS routing or score equating.",
    sourceUrl: links.scoring,
  },
  {
    id: "navigation",
    title: "Use the whole section",
    description:
      "You can revisit and change answers within the current section. Mark a time-consuming item and return before that section ends.",
    sourceUrl: links.structure,
  },
  {
    id: "guess",
    title: "Leave an answer, not a blank",
    description:
      "There is no deduction for a wrong answer. When time is short, eliminate what you can and answer every remaining question.",
    sourceUrl: links.guessing,
  },
  {
    id: "reading",
    title: "Reading is a major part of Verbal",
    description:
      "ETS describes passage-based questions as about half of Verbal. That is not a fixed count for each section. Reading includes one-answer, multiple-answer and select-in-passage tasks.",
    sourceUrl: links.verbal,
  },
  {
    id: "complete",
    title: "Complete the full response",
    description:
      "Sentence equivalence requires two answers. Multiple-answer and multi-blank items require every correct selection; partial selections do not earn partial credit.",
    sourceUrl: links.verbal,
  },
];

/** Wordtrail's suggested preparation sequence, not an ETS prescription or score guarantee. */
export const targetScorePlan: TargetScoreStep[] = [
  {
    id: "baseline",
    title: "Start with an honest baseline",
    action: "diagnostic",
    description:
      "Try unfamiliar Verbal questions. Separate knowledge gaps, reasoning mistakes, misreading and time pressure before deciding what to study.",
  },
  {
    id: "foundation",
    title: "Make the foundations dependable",
    action: "review",
    description:
      "Pair vocabulary review with sentence logic and evidence-based reading. Learn how contrasts, continuations and passage structure constrain the answer.",
  },
  {
    id: "repair",
    title: "Learn from the near misses",
    action: "review",
    description:
      "Review correct guesses as well as wrong answers. Explain the decisive clue, the tempting alternative and one change to your method; return later without notes.",
  },
  {
    id: "transfer",
    title: "Handle a new version of the idea",
    action: "advanced",
    description:
      "Solve unfamiliar variations without relying on a remembered answer. Distinguish support from mere plausibility, even when a tempting answer uses familiar passage wording.",
  },
  {
    id: "pace",
    title: "Practice decisions under a clock",
    action: "timed",
    description:
      "Move from accurate untimed work to current-length sections. Track time lost, mark and return deliberately, and finish with an answer to every question.",
  },
  {
    id: "benchmark",
    title: "Check against fresh official practice",
    action: "official",
    description:
      "Use an unseen timed POWERPREP option under its stated conditions. Record the official result separately from Wordtrail practice accuracy and review every uncertainty.",
  },
  {
    id: "refine",
    title: "Aim high, adjust from evidence",
    action: "advanced",
    description:
      "Pursue 170 Verbal through repeatable performance across fresh work. Choose the next lesson from recurring weaknesses, not a promise that a certain app percentage guarantees a score.",
  },
];
