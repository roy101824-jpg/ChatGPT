import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";

export interface Question {
  id: string;
  type?: string;
  prompt: string;
  choices: string[];
  answers: number[];
  explanation: string;
  skill: string;
  difficulty: string;
  passage?: string;
}
const PRACTICE_KEY = "wordtrail.activePractice";
export interface PracticeSnapshot {
  version: 1;
  questionIds: string[];
  title: string;
  index: number;
  selected: number[];
  checked: boolean;
  score: number;
}

/** Resolve IDs against the current question bank before resuming. */
export function readActivePractice(): PracticeSnapshot | null {
  try {
    const raw = localStorage.getItem(PRACTICE_KEY);
    if (!raw || raw.length > 25000) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const p = value as Partial<PracticeSnapshot>;
    if (
      p.version !== 1 ||
      !Array.isArray(p.questionIds) ||
      !p.questionIds.length ||
      p.questionIds.length > 100 ||
      p.questionIds.some(
        (id) => typeof id !== "string" || !id || id.length > 100,
      ) ||
      new Set(p.questionIds).size !== p.questionIds.length ||
      typeof p.title !== "string" ||
      !p.title ||
      p.title.length > 200 ||
      !Number.isInteger(p.index) ||
      p.index! < 0 ||
      p.index! >= p.questionIds.length ||
      !Array.isArray(p.selected) ||
      p.selected.length > 6 ||
      p.selected.some((n) => !Number.isInteger(n) || n < 0 || n > 20) ||
      new Set(p.selected).size !== p.selected.length ||
      typeof p.checked !== "boolean" ||
      !Number.isInteger(p.score) ||
      p.score! < 0 ||
      p.score! > p.index!
    )
      return null;
    return {
      version: 1,
      questionIds: [...p.questionIds],
      title: p.title,
      index: p.index!,
      selected: [...p.selected],
      checked: p.checked,
      score: p.score!,
    };
  } catch {
    return null;
  }
}
export function clearActivePractice(): void {
  try {
    localStorage.removeItem(PRACTICE_KEY);
  } catch {
    /* Storage may be unavailable. */
  }
}
interface SessionState {
  index: number;
  selected: number[];
  checked: boolean;
  score: number;
}
function restore(questions: Question[], title: string): SessionState {
  const saved = readActivePractice();
  if (
    saved &&
    saved.title === title &&
    saved.questionIds.length === questions.length &&
    saved.questionIds.every((id, i) => id === questions[i].id)
  ) {
    const question = questions[saved.index];
    if (
      question &&
      saved.selected.length <= question.answers.length &&
      saved.selected.every((n) => n < question.choices.length) &&
      (!saved.checked || saved.selected.length === question.answers.length)
    ) {
      return {
        index: saved.index,
        selected: saved.selected,
        checked: saved.checked,
        score: saved.score,
      };
    }
  }
  return { index: 0, selected: [], checked: false, score: 0 };
}

export default function PracticeSession({
  questions,
  title,
  onClose,
  onFinish,
}: {
  questions: Question[];
  title: string;
  onClose: () => void;
  onFinish: (correct: number, total: number) => void;
}) {
  const [state, setState] = useState<SessionState>(() =>
    restore(questions, title),
  );
  // Synchronous state guards protect against a second click before React paints.
  const stateRef = useRef(state);
  const [saved, setSaved] = useState(true);
  const container = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const { index, selected, checked, score } = state;
  const question = questions[index];
  const finished = index >= questions.length;
  const isCorrect =
    !!question &&
    selected.length === question.answers.length &&
    question.answers.every((a) => selected.includes(a));
  const persist = (next: SessionState) => {
    if (next.index >= questions.length) {
      clearActivePractice();
      return;
    }
    try {
      const snapshot: PracticeSnapshot = {
        version: 1,
        questionIds: questions.map((q) => q.id),
        title,
        ...next,
      };
      localStorage.setItem(PRACTICE_KEY, JSON.stringify(snapshot));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };
  const commit = (next: SessionState) => {
    stateRef.current = next;
    persist(next);
    setState(next);
  };
  const close = () => {
    clearActivePractice();
    closeRef.current();
  };
  useEffect(() => {
    persist(stateRef.current);
  }, []);
  useEffect(() => {
    container.current?.querySelector<HTMLElement>("h1")?.focus();
  }, [index]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearActivePractice();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const controls = container.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement?.tagName === "H1")
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, []);
  const choose = (choice: number) => {
    const current = stateRef.current;
    if (!question || current.index !== index || current.checked) return;
    const count = question.answers.length;
    const selected =
      count === 1
        ? [choice]
        : current.selected.includes(choice)
          ? current.selected.filter((n) => n !== choice)
          : current.selected.length < count
            ? [...current.selected, choice]
            : [...current.selected.slice(1), choice];
    commit({ ...current, selected });
  };
  const check = () => {
    const current = stateRef.current;
    if (
      !question ||
      current.index !== index ||
      current.checked ||
      current.selected.length !== question.answers.length
    )
      return;
    commit({ ...current, checked: true });
  };
  const next = () => {
    const current = stateRef.current;
    if (!question || current.index !== index || !current.checked) return;
    const correct =
      current.selected.length === question.answers.length &&
      question.answers.every((a) => current.selected.includes(a));
    const updated = {
      index: current.index + 1,
      selected: [],
      checked: false,
      score: current.score + (correct ? 1 : 0),
    };
    commit(updated);
    if (updated.index === questions.length)
      onFinish(updated.score, questions.length);
  };
  return (
    <div
      ref={container}
      className="session"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="session-top">
        <button
          className="icon-button"
          aria-label="End practice"
          onClick={close}
        >
          <X size={23} />
        </button>
        <span>{title}</span>
        <span className="session-count">
          {Math.min(index + 1, questions.length)} / {questions.length}
        </span>
      </div>
      <div className="session-progress">
        <span
          style={{
            width: `${questions.length ? (index / questions.length) * 100 : 0}%`,
          }}
        />
      </div>
      <div className="session-body">
        {!saved && (
          <p className="info-box" role="status">
            This session could not be saved. Keep this page open to finish your
            practice.
          </p>
        )}
        {finished ? (
          <div className="finish">
            <div className="finish-icon">
              <Sparkles size={38} />
            </div>
            <h1 tabIndex={-1}>Practice with purpose.</h1>
            <p>
              You answered {score} of {questions.length} correctly. Look for the
              logic first; let the words follow.
            </p>
            <div className="score-circle">
              {questions.length
                ? Math.round((score / questions.length) * 100)
                : 0}
              <small>%</small>
            </div>
            <button className="button primary" onClick={close}>
              Back to practice <ArrowRight size={18} />
            </button>
            <p className="small muted">
              Original practice. This is not a GRE score prediction.
            </p>
          </div>
        ) : (
          <>
            <div className="session-label">
              <span className="pill mint">{question.skill}</span>
              <span className="small muted">{question.difficulty}</span>
            </div>
            {question.passage && (
              <div className="reading-passage">
                <span className="eyebrow">READ THE PASSAGE</span>
                <p>{question.passage}</p>
              </div>
            )}
            <h1 className="question-title" tabIndex={-1}>
              {question.prompt}
            </h1>
            <p className="muted small">
              {question.answers.length === 2
                ? "Select TWO words that complete the sentence with similar meanings. Both must be correct."
                : "Select the best answer."}
            </p>
            <div className="answer-options">
              {question.choices.map((choice, i) => (
                <button
                  key={i}
                  disabled={checked}
                  aria-pressed={selected.includes(i)}
                  className={`answer-option ${selected.includes(i) ? "selected" : ""} ${checked && question.answers.includes(i) ? "correct" : ""} ${checked && selected.includes(i) && !question.answers.includes(i) ? "incorrect" : ""}`}
                  onClick={() => choose(i)}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{choice}</span>
                  {checked && question.answers.includes(i) && (
                    <Check size={19} />
                  )}
                </button>
              ))}
            </div>
            {!checked ? (
              <button
                className="button primary wide"
                disabled={selected.length !== question.answers.length}
                onClick={check}
              >
                Check answer <ArrowRight size={18} />
              </button>
            ) : (
              <div
                className={`feedback ${isCorrect ? "success" : ""}`}
                role="status"
              >
                <strong>
                  {isCorrect
                    ? "You followed the clues."
                    : "Let’s unpack the reasoning."}
                </strong>
                <p>{question.explanation}</p>
                <button className="button primary" onClick={next}>
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            )}
            <p className="session-tip">
              Original GRE-style practice · independently written · saves as you
              go
            </p>
          </>
        )}
      </div>
    </div>
  );
}
