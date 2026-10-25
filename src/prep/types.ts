export type PrepFormat =
  "tc1" | "tc2" | "tc3" | "se" | "rc-single" | "rc-multi" | "rc-sentence";
export type PrepDifficulty = "Core" | "Standard" | "Advanced";
export interface PrepPassage {
  id: string;
  title?: string;
  sentences: string[];
}
export interface PrepQuestion {
  id: string;
  section: "verbal";
  format: PrepFormat;
  topic: string;
  skill: string;
  difficulty: PrepDifficulty;
  stem: string;
  choices?: string[];
  answers?: number[];
  blanks?: Array<{ choices: string[]; answer: number }>;
  passage?: PrepPassage;
  sentenceAnswer?: number;
  explanation: string;
  trap: string;
  strategy: string;
  estimatedSeconds: number;
  provenance: { kind: "original"; author: "Wordtrail"; verifiedOn: string };
}
export interface PrepAnswer {
  selections?: number[];
  blanks?: Array<number | null>;
  sentence?: number;
}
export type ErrorReason =
  | "Concept gap"
  | "Misread the question"
  | "Logic or evidence"
  | "Timing"
  | "Vocabulary"
  | "Careless selection";
export interface PrepAttempt {
  id: string;
  questionId: string;
  answer: PrepAnswer;
  correct: boolean;
  elapsedMs: number;
  confidence: "sure" | "unsure" | "guess" | "unrated";
  createdAt: number;
  mode: "drill" | "timed" | "exam";
  errorReason?: ErrorReason;
  note?: string;
}
export interface PrepProgress {
  version: 1;
  attempts: PrepAttempt[];
  saved: string[];
  notes: Record<string, string>;
  targetDate: string;
  officialScores: Array<{ date: string; verbal: number; source: string }>;
}
export interface PrepGrade {
  id: string;
  question: PrepQuestion;
  answer: PrepAnswer;
  confidence: PrepAttempt["confidence"];
  elapsedMs: number;
  mode: PrepAttempt["mode"];
}
