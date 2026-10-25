import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Flag, X } from "lucide-react";
import type { PrepAnswer, PrepGrade } from "./types";
import { formatLabel, hasCompleteAnswer, scoreAnswer } from "./engine";
import {
  accountRunTime,
  clearRun,
  finishRunSection,
  saveRun,
  type PrepRun,
} from "./session";
import { prepById } from "./bank";
import QuestionView, { getResponseSummary } from "./QuestionView";

interface Props {
  initial: PrepRun;
  onClose: () => void;
  onGrade: (grades: PrepGrade[]) => void;
}
type Confirmation = { kind: "submit" | "exit"; sectionIndex: number };
const focusable = (scope: HTMLElement | null) =>
  scope
    ? [
        ...scope.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary,[tabindex="0"]',
        ),
      ].filter(
        (node) => node.getClientRects().length > 0 && !node.closest("[inert]"),
      )
    : [];

export default function PrepRunner({ initial, onClose, onGrade }: Props) {
  const [run, setRun] = useState<PrepRun>(() =>
    initial.mode === "drill" && !initial.finished
      ? {
          ...initial,
          itemStartedAt: Math.max(initial.sectionStartedAt, Date.now()),
        }
      : initial,
  );
  const runRef = useRef(run);
  const container = useRef<HTMLDivElement>(null);
  const confirmation = useRef<HTMLElement>(null);
  const confirmationTrigger = useRef<HTMLElement | null>(null);
  const previousConfirm = useRef<Confirmation | null>(null);
  const grade = useRef(onGrade);
  grade.current = onGrade;
  const grading = useRef(false);
  const closing = useRef(false);
  const drillPaused = useRef(false);
  const [now, setNow] = useState(Date.now());
  const [saved, setSaved] = useState(true);
  const [confirm, setConfirm] = useState<Confirmation | null>(null);
  const [notice, setNotice] = useState("");
  const [reviewId, setReviewId] = useState("");
  const section = run.sections[run.sectionIndex];
  const q = prepById.get(section.questionIds[run.questionIndex]);
  const answer = q ? run.answers[q.id] || {} : {};
  const checked = q ? run.checked.includes(q.id) : false;
  const allIds = run.sections.flatMap((s) => s.questionIds);
  const left =
    run.deadline !== null
      ? Math.max(0, Math.ceil((run.deadline - now) / 1000))
      : 0;

  const commit = (next: PrepRun) => {
    runRef.current = next;
    setRun(next);
    setSaved(saveRun(next));
  };
  const submitAt = (expectedSection: number, time: number): boolean => {
    const current = runRef.current;
    if (
      current.finished ||
      current.sectionIndex !== expectedSection ||
      grading.current ||
      closing.current
    )
      return false;
    grading.current = true;
    try {
      const transition = finishRunSection(current, time);
      const batch: PrepGrade[] = transition.questionIds.map((id) => {
        const item = prepById.get(id);
        if (!item)
          throw new Error(
            "A question in this session is unavailable. Return to training and start a new session.",
          );
        return {
          id: `${current.id}:${id}`,
          question: item,
          answer: current.answers[id] || {},
          confidence:
            current.confidence[id] ||
            (current.mode === "drill" || current.flags.includes(id)
              ? "unsure"
              : "unrated"),
          elapsedMs: transition.next.spent[id] || 0,
          mode: current.mode,
        };
      });
      grade.current(batch);
      commit(transition.next);
      setConfirm(null);
      if (transition.expired)
        setNotice("Time expired. Submitted answers are now locked.");
      else setNotice("");
      return true;
    } catch (error) {
      setConfirm(null);
      setNotice(
        error instanceof Error
          ? error.message
          : "The answers could not be recorded. Please try submitting again.",
      );
      return false;
    } finally {
      grading.current = false;
    }
  };
  const settleDeadlines = (time = Date.now()): boolean => {
    let changed = false;
    // A suspended tab can return after both sections expired. Use each original
    // deadline as the next section's start, never the time the tab woke up.
    for (let i = 0; i < runRef.current.sections.length; i += 1) {
      const current = runRef.current;
      if (
        current.finished ||
        current.deadline === null ||
        time < current.deadline
      )
        break;
      if (!submitAt(current.sectionIndex, time)) break;
      changed = true;
    }
    return changed;
  };
  const currentForAction = (expectedQuestion?: string): PrepRun | null => {
    const time = Date.now();
    settleDeadlines(time);
    const current = runRef.current;
    if (
      closing.current ||
      current.finished ||
      grading.current ||
      current.sectionIndex !== run.sectionIndex ||
      (current.deadline !== null && time >= current.deadline)
    )
      return null;
    if (
      expectedQuestion &&
      current.sections[current.sectionIndex].questionIds[
        current.questionIndex
      ] !== expectedQuestion
    )
      return null;
    return current;
  };
  const tick = () => {
    const time = Date.now();
    setNow(time);
    settleDeadlines(time);
    if (
      !document.hidden &&
      drillPaused.current &&
      runRef.current.mode === "drill" &&
      !runRef.current.finished
    ) {
      drillPaused.current = false;
      commit({
        ...runRef.current,
        itemStartedAt: Math.max(runRef.current.sectionStartedAt, time),
      });
    }
  };
  const flush = () => {
    if (closing.current) return;
    const time = Date.now();
    settleDeadlines(time);
    if (runRef.current.mode === "drill" && drillPaused.current) return;
    commit(accountRunTime(runRef.current, time));
    if (runRef.current.mode === "drill") drillPaused.current = true;
  };
  const clock = useRef({ tick, flush });
  clock.current = { tick, flush };

  useEffect(() => {
    setSaved(saveRun(runRef.current));
    clock.current.tick();
    const interval = setInterval(() => clock.current.tick(), 500);
    const visibility = () =>
      document.hidden ? clock.current.flush() : clock.current.tick();
    const focus = () => clock.current.tick();
    const pagehide = () => clock.current.flush();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", focus);
    window.addEventListener("pageshow", focus);
    window.addEventListener("pagehide", pagehide);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("focus", focus);
      window.removeEventListener("pageshow", focus);
      window.removeEventListener("pagehide", pagehide);
    };
  }, []);
  useEffect(() => {
    container.current?.scrollTo({ top: 0 });
    container.current
      ?.querySelector<HTMLElement>(".prep-stem, .prep-results h2")
      ?.focus({ preventScroll: true });
  }, [run.questionIndex, run.sectionIndex, run.finished]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    const before = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      if (before?.isConnected) before.focus();
    };
  }, []);
  useEffect(() => {
    if (confirm) {
      focusable(confirmation.current)[0]?.focus();
    } else if (previousConfirm.current) {
      if (
        previousConfirm.current.sectionIndex === runRef.current.sectionIndex &&
        confirmationTrigger.current?.isConnected
      )
        confirmationTrigger.current.focus();
      else
        container.current
          ?.querySelector<HTMLElement>(".prep-stem, .prep-results h2")
          ?.focus({ preventScroll: true });
    }
    previousConfirm.current = confirm;
  }, [confirm]);

  const move = (index: number) => {
    const current = currentForAction(q?.id);
    if (
      !current ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= current.sections[current.sectionIndex].questionIds.length
    )
      return;
    commit({ ...accountRunTime(current), questionIndex: index });
  };
  const respond = (value: PrepAnswer) => {
    const current = currentForAction(q?.id);
    if (
      !current ||
      !q ||
      current.checked.includes(q.id) ||
      current.graded.includes(q.id)
    )
      return;
    const clean: PrepAnswer = {};
    if (value.selections) clean.selections = [...value.selections];
    if (value.blanks) clean.blanks = [...value.blanks];
    if (value.sentence !== undefined) clean.sentence = value.sentence;
    commit({
      ...accountRunTime(current),
      answers: { ...current.answers, [q.id]: clean },
    });
  };
  const check = () => {
    let current = currentForAction(q?.id);
    if (
      !current ||
      !q ||
      current.mode !== "drill" ||
      current.checked.includes(q.id) ||
      current.graded.includes(q.id) ||
      !hasCompleteAnswer(q, current.answers[q.id] || {})
    )
      return;
    grading.current = true;
    try {
      current = accountRunTime(current);
      grade.current([
        {
          id: `${current.id}:${q.id}`,
          question: q,
          answer: current.answers[q.id] || {},
          confidence: current.confidence[q.id] || "unsure",
          elapsedMs: current.spent[q.id] || 0,
          mode: current.mode,
        },
      ]);
      commit({
        ...current,
        checked: [...current.checked, q.id],
        graded: [...current.graded, q.id],
      });
      setNotice("");
      const checkedId = q.id;
      requestAnimationFrame(() => {
        const active = runRef.current;
        if (
          active.sections[active.sectionIndex].questionIds[
            active.questionIndex
          ] !== checkedId
        )
          return;
        const explanation =
          container.current?.querySelector<HTMLElement>(".prep-solution h3");
        explanation?.focus({ preventScroll: true });
        explanation?.scrollIntoView({ block: "nearest", behavior: "auto" });
      });
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "This answer could not be recorded. Please try again.",
      );
    } finally {
      grading.current = false;
    }
  };
  const flag = () => {
    const current = currentForAction(q?.id);
    if (!current || !q) return;
    commit({
      ...current,
      flags: current.flags.includes(q.id)
        ? current.flags.filter((id) => id !== q.id)
        : [...current.flags, q.id],
    });
  };
  const setConfidence = (confidence: PrepRun["confidence"][string]) => {
    const current = currentForAction(q?.id);
    if (
      !current ||
      !q ||
      current.mode !== "drill" ||
      current.checked.includes(q.id) ||
      current.graded.includes(q.id)
    )
      return;
    commit({
      ...accountRunTime(current),
      confidence: { ...current.confidence, [q.id]: confidence },
    });
  };
  const end = () => {
    if (closing.current) return;
    closing.current = true;
    clearRun();
    onClose();
  };
  const requestClose = () => {
    settleDeadlines();
    if (runRef.current.finished) end();
    else {
      confirmationTrigger.current = document.activeElement as HTMLElement;
      setConfirm({ kind: "exit", sectionIndex: runRef.current.sectionIndex });
    }
  };
  const requestSubmit = () => {
    const current = currentForAction(q?.id);
    if (current) {
      confirmationTrigger.current = document.activeElement as HTMLElement;
      setConfirm({ kind: "submit", sectionIndex: current.sectionIndex });
    }
  };
  const confirmAction = () => {
    if (!confirm || closing.current) return;
    const time = Date.now();
    const target = confirm.sectionIndex;
    if (runRef.current.sectionIndex !== target) {
      setConfirm(null);
      return;
    }
    if (settleDeadlines(time)) return;
    if (confirm.kind === "submit") submitAt(target, time);
    else {
      commit(accountRunTime(runRef.current, time));
      closing.current = true;
      onClose();
    }
  };
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (confirm) setConfirm(null);
        else requestClose();
      } else if (event.key === "Tab") {
        const scope = confirm ? confirmation.current : container.current;
        const nodes = focusable(scope);
        if (!nodes.length) {
          event.preventDefault();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (
          !scope?.contains(document.activeElement) ||
          (event.shiftKey && document.activeElement === first)
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", keyboard, true);
    return () => window.removeEventListener("keydown", keyboard, true);
  });

  const reviewQ = prepById.get(reviewId);
  const correctItem = (id: string) => {
    const item = prepById.get(id);
    return item ? scoreAnswer(item, run.answers[id] || {}) : false;
  };
  const answeredItem = (id: string) => {
    const item = prepById.get(id);
    return item ? hasCompleteAnswer(item, run.answers[id] || {}) : false;
  };
  const responseLabel = (id: string) => {
    const item = prepById.get(id);
    return item
      ? getResponseSummary(item, run.answers[id] || {}).label
      : "Not answered";
  };
  const answeredCount = section.questionIds.filter(answeredItem).length;
  const markedCount = section.questionIds.filter((id) =>
    run.flags.includes(id),
  ).length;
  const nextMatching = (matches: (id: string) => boolean) => {
    for (let offset = 1; offset < section.questionIds.length; offset += 1) {
      const index = (run.questionIndex + offset) % section.questionIds.length;
      if (matches(section.questionIds[index])) return index;
    }
    return -1;
  };
  const nextUnanswered = nextMatching((id) => !answeredItem(id));
  const nextMarked = nextMatching((id) => run.flags.includes(id));
  const selectReview = (id: string) => {
    setReviewId(id);
    requestAnimationFrame(() => {
      const question = container.current?.querySelector<HTMLElement>(
        ".prep-results .prep-stem",
      );
      question?.focus({ preventScroll: true });
      question?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  };
  return (
    <div
      ref={container}
      className="prep-runner"
      role="dialog"
      aria-modal="true"
      aria-label="GRE practice session"
    >
      <header className="prep-run-header" inert={!!confirm}>
        <button
          className="icon-button"
          aria-label="Leave GRE practice"
          onClick={requestClose}
        >
          <X />
        </button>
        <div>
          <span className="eyebrow">
            {run.mode === "exam"
              ? "FIXED-FORM VERBAL SIMULATION"
              : run.mode === "timed"
                ? "TIMED SECTION"
                : "DELIBERATE PRACTICE"}
          </span>
          <strong>{run.finished ? "Session review" : section.title}</strong>
        </div>
        <span
          className={`prep-timer ${left < 300 && run.deadline !== null ? "urgent" : ""}`}
          aria-label="Time remaining"
        >
          {run.deadline !== null ? (
            <>
              <Clock3 size={16} />
              {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
            </>
          ) : run.finished ? (
            "Complete"
          ) : (
            "Untimed"
          )}
        </span>
      </header>
      <div className="prep-run-main" inert={!!confirm}>
        {!saved && (
          <p className="prep-warning" role="alert">
            This browser could not save the session. Keep it open and export
            your progress before leaving.
          </p>
        )}
        {notice && (
          <p className="prep-notice" role="status">
            {notice}
          </p>
        )}
        {run.finished ? (
          <section className="prep-results">
            <span className="eyebrow">MEASURE. UNDERSTAND. REPEAT.</span>
            <h2 tabIndex={-1}>Make this practice count.</h2>
            <p className="prep-lead">
              {allIds.filter(correctItem).length} / {allIds.length} correct.
              These are raw results on original questions, not a predicted
              130–170 score.
            </p>
            <div className="prep-section-results">
              {run.sections.map((s) => (
                <div key={s.id}>
                  <strong>{s.title}</strong>
                  <span>
                    {s.questionIds.filter(correctItem).length} /{" "}
                    {s.questionIds.length} correct
                  </span>
                </div>
              ))}
            </div>
            <p className="muted small">
              Select any item to inspect the reasoning. Misses and uncertain
              answers are also in your review queue.
            </p>
            <div className="prep-result-grid">
              {allIds.map((id, i) => {
                const correct = correctItem(id);
                return (
                  <button
                    key={id}
                    className={correct ? "is-right" : "is-wrong"}
                    onClick={() => selectReview(id)}
                    aria-label={`Review question ${i + 1}, ${correct ? "correct" : "incorrect"}`}
                  >
                    {i + 1}
                    {correct ? <Check size={13} /> : <X size={13} />}
                  </button>
                );
              })}
            </div>
            {reviewQ && (
              <QuestionView
                question={reviewQ}
                answer={run.answers[reviewQ.id] || {}}
                onAnswer={() => {}}
                disabled
                showSolution
              />
            )}
            <button className="button primary" onClick={end}>
              Back to my training <ArrowRight size={17} />
            </button>
          </section>
        ) : q ? (
          <>
            <div className="prep-question-meta">
              <span className="pill mint">{formatLabel(q.format)}</span>
              <span>
                {run.questionIndex + 1} / {section.questionIds.length}
              </span>
              <button
                className={`prep-flag ${run.flags.includes(q.id) ? "active" : ""}`}
                aria-pressed={run.flags.includes(q.id)}
                onClick={flag}
              >
                <Flag size={16} />
                {run.flags.includes(q.id) ? "Flagged" : "Mark for review"}
              </button>
            </div>
            <QuestionView
              question={q}
              answer={answer}
              onAnswer={respond}
              disabled={checked}
              showSolution={run.mode === "drill" && checked}
            />
            {run.mode === "drill" && (
              <div className="prep-confidence">
                <span>Confidence</span>
                {(["sure", "unsure", "guess"] as const).map((c) => (
                  <button
                    key={c}
                    disabled={checked}
                    aria-pressed={(run.confidence[q.id] || "unsure") === c}
                    onClick={() => setConfidence(c)}
                  >
                    {c === "sure"
                      ? "Confident"
                      : c === "unsure"
                        ? "Unsure"
                        : "Guess"}
                  </button>
                ))}
              </div>
            )}
            {run.mode === "drill" && !checked && (
              <button
                className="button primary prep-check"
                disabled={!hasCompleteAnswer(q, answer)}
                onClick={check}
              >
                Check reasoning <Check size={17} />
              </button>
            )}
            <nav className="prep-item-nav" aria-label="Question navigation">
              <button
                className="button secondary"
                disabled={run.questionIndex === 0}
                onClick={() => move(run.questionIndex - 1)}
              >
                <ArrowLeft size={16} />
                Previous
              </button>
              {run.questionIndex < section.questionIds.length - 1 ? (
                <button
                  className="button primary"
                  onClick={() => move(run.questionIndex + 1)}
                >
                  {hasCompleteAnswer(q, answer) ? "Next" : "Skip for now"}
                  <ArrowRight size={17} />
                </button>
              ) : (
                <button className="button primary" onClick={requestSubmit}>
                  Submit {run.mode === "drill" ? "practice" : "section"}{" "}
                  <Check size={17} />
                </button>
              )}
            </nav>
            <details className="prep-map">
              <summary>
                Review this section · {answeredCount} answered ·{" "}
                {section.questionIds.length - answeredCount} remaining ·{" "}
                {markedCount} marked
              </summary>
              <div className="prep-review-tools">
                <button
                  type="button"
                  className="button secondary"
                  disabled={nextUnanswered < 0}
                  title={
                    nextUnanswered < 0
                      ? "No other unanswered questions in this section"
                      : undefined
                  }
                  onClick={() => move(nextUnanswered)}
                >
                  Next unanswered <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={nextMarked < 0}
                  title={
                    nextMarked < 0
                      ? "No other marked questions in this section"
                      : undefined
                  }
                  onClick={() => move(nextMarked)}
                >
                  Next marked <Flag size={14} />
                </button>
              </div>
              <div className="prep-question-map">
                {section.questionIds.map((id, i) => (
                  <button
                    key={id}
                    className={`${i === run.questionIndex ? "current" : ""} ${answeredItem(id) ? "answered" : ""} ${responseLabel(id) === "Incomplete" ? "incomplete" : ""}`}
                    onClick={() => move(i)}
                    aria-label={`Go to question ${i + 1}, ${responseLabel(id).toLowerCase()}${run.flags.includes(id) ? ", flagged for review" : ""}`}
                    title={`Question ${i + 1}: ${responseLabel(id)}${run.flags.includes(id) ? "; marked for review" : ""}`}
                    aria-current={i === run.questionIndex ? "step" : undefined}
                  >
                    {i + 1}
                    {run.flags.includes(id) && <Flag size={11} />}
                  </button>
                ))}
              </div>
              <p className="prep-map-key">
                Filled: answered · Dashed: incomplete · Flag: marked for review
              </p>
              <button className="text-button" onClick={requestSubmit}>
                Submit section now <ArrowRight size={15} />
              </button>
            </details>
            <p className="prep-caption">
              {run.mode === "drill"
                ? `${q.difficulty} · estimated ${q.estimatedSeconds} seconds · original Wordtrail item`
                : "Answers stay editable within this section. Explanations appear after submission. The clock continues in the background."}
            </p>
          </>
        ) : (
          <p>No question is available for this section.</p>
        )}
      </div>
      {confirm && (
        <div className="prep-confirm-backdrop">
          <section
            ref={confirmation}
            className="prep-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-label={
              confirm.kind === "exit" ? "Leave session" : "Submit section"
            }
          >
            <h3>
              {confirm.kind === "exit"
                ? "Keep your place?"
                : "Ready to submit this section?"}
            </h3>
            <p>
              {confirm.kind === "exit"
                ? run.mode === "drill"
                  ? "Your answers are saved. You can resume from the training hub."
                  : "Your answers are saved, but the timed clock keeps running even when you leave."
                : `${section.questionIds.filter((id) => !answeredItem(id)).length} unanswered items will count as incorrect. Submitted answers cannot be changed.`}
            </p>
            <div>
              <button
                className="button secondary"
                onClick={() => setConfirm(null)}
              >
                Keep working
              </button>
              <button className="button primary" onClick={confirmAction}>
                {confirm.kind === "exit" ? "Leave & save" : "Submit section"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
