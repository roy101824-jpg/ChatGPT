import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  Flag,
  GraduationCap,
  History,
  ListChecks,
  RotateCcw,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { prepBank, prepById } from "./bank";
import type {
  ErrorReason,
  PrepAttempt,
  PrepFormat,
  PrepProgress,
  PrepQuestion,
  PrepGrade,
} from "./types";
import {
  buildExamPlan,
  formatLabel,
  getPrepStats,
  isUncertain,
  selectQuestions,
} from "./engine";
import { commitGradeBatch } from "./grading";
import { loadPrepProgress, savePrepProgress } from "./storage";
import { clearRun, loadRun, newRun, type PrepRun } from "./session";
import PrepRunner from "./PrepRunner";
import {
  examBlueprint,
  resourceLinks,
  targetScorePlan,
  formatRules,
} from "../data/prep/resources";
import { verbalGuides } from "../data/prep/verbal-guides";
import "./prep.css";
import { localDay } from "../lib/study";
import ChallengeChooser from "./ChallengeChooser";
import SessionConflictDialog from "./SessionConflictDialog";
import {
  familyOf,
  formatDetails,
  familyTitle,
  questionFamilies,
  type PrepFamily,
} from "./catalog";
import {
  readPreferences,
  rememberPreferences,
  type PrepView,
} from "./preferences";
const errorReasons: ErrorReason[] = [
  "Concept gap",
  "Misread the question",
  "Logic or evidence",
  "Timing",
  "Vocabulary",
  "Careless selection",
];
function latestAttempts(progress: PrepProgress) {
  const map = new Map<string, PrepAttempt>();
  for (const attempt of progress.attempts) {
    const previous = map.get(attempt.questionId);
    if (!previous || previous.createdAt <= attempt.createdAt)
      map.set(attempt.questionId, attempt);
  }
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}
export default function PrepHub({
  children,
  initialFormat,
}: {
  children?: ReactNode;
  initialFormat?: PrepFormat;
}) {
  const [preferences] = useState(() =>
    readPreferences(prepBank, initialFormat),
  );
  const [view, setView] = useState<PrepView>(preferences.view);
  const [progress, setProgress] = useState(loadPrepProgress);
  const progressRef = useRef(progress);
  const [run, setRun] = useState<PrepRun | null>(() => loadRun(prepBank));
  const [pending, setPending] = useState<PrepRun | null>(null);
  const [message, setMessage] = useState("");
  const [family, setFamily] = useState<PrepFamily>(preferences.family);
  const [format, setFormat] = useState<PrepFormat | "all">(preferences.format);
  const [difficulty, setDifficulty] = useState(preferences.difficulty);
  const [topic, setTopic] = useState(preferences.topic);
  const [count, setCount] = useState(preferences.count);
  const [fresh, setFresh] = useState(preferences.fresh);
  const builder = useRef<HTMLDivElement>(null);
  const focusBuilder = () =>
    requestAnimationFrame(() => {
      builder.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
      builder.current?.focus({ preventScroll: true });
    });
  useEffect(() => {
    if (initialFormat) focusBuilder();
  }, []);
  useEffect(() => {
    rememberPreferences({
      view,
      family,
      format,
      difficulty,
      topic,
      count,
      fresh,
    });
  }, [view, family, format, difficulty, topic, count, fresh]);
  const choose = (nextFamily: PrepFamily, nextFormat: PrepFormat | "all") => {
    setFamily(nextFamily);
    setFormat(nextFormat);
    setTopic("all");
    setMessage("");
    setDifficulty("all");
    setView("train");
    focusBuilder();
  };
  const resetFilters = () => {
    setFamily("all");
    setFormat("all");
    setDifficulty("all");
    setTopic("all");
    setCount(10);
    setFresh(true);
    setMessage("");
  };
  const [score, setScore] = useState("");
  const [scoreDate, setScoreDate] = useState(localDay());
  const [scoreSource, setScoreSource] = useState("Timed POWERPREP");
  const stats = getPrepStats(prepBank, progress);
  const latest = latestAttempts(progress);
  const typePool = prepBank.filter(
    (q) =>
      (family === "all" || familyOf(q.format) === family) &&
      (format === "all" || q.format === format),
  );
  const topics = [...new Set(typePool.map((q) => q.topic))].sort();
  const attempted = new Set(latest.map((a) => a.questionId));
  const available = typePool.filter(
    (q) =>
      (difficulty === "all" || q.difficulty === difficulty) &&
      (topic === "all" || q.topic === topic) &&
      (!fresh || !attempted.has(q.id)),
  );
  const selectedCount = Math.min(count, available.length);
  const sessionTitle =
    format === "all" ? familyTitle(family) : formatLabel(format);
  const resumable = !run ? loadRun(prepBank) : null;
  const update = (next: PrepProgress) => {
    progressRef.current = next;
    setProgress(next);
    if (!savePrepProgress(next))
      setMessage(
        "This browser could not save exam-prep progress. Export a backup from Settings before closing.",
      );
  };
  useEffect(() => {
    const imported = () => {
      const p = loadPrepProgress();
      progressRef.current = p;
      setProgress(p);
      setRun(null);
      clearRun();
    };
    window.addEventListener("wordtrail:prep-import", imported);
    return () => window.removeEventListener("wordtrail:prep-import", imported);
  }, []);
  const begin = (next: PrepRun) => {
    const existing = loadRun(prepBank);
    if (existing && !existing.finished) {
      setPending(next);
      return;
    }
    setMessage("");
    setRun(next);
  };
  const drill = (questions: PrepQuestion[], title: string) => {
    if (!questions.length) {
      setMessage(
        "No questions match this selection. Allow previously seen items or choose another filter.",
      );
      return;
    }
    begin(
      newRun(title, "drill", [
        {
          id: "drill",
          title,
          section: "verbal",
          minutes: 0,
          questionIds: questions.map((q) => q.id),
        },
      ]),
    );
  };
  const selectedDrill = () =>
    drill(
      selectQuestions(available, {
        section: "verbal",
        count,
        seed: Date.now(),
      }),
      sessionTitle,
    );
  const timed = (n: 12 | 15) => {
    const section = buildExamPlan(prepBank, Date.now()).sections[
      n === 12 ? 0 : 1
    ];
    begin(
      newRun("Verbal section " + (n === 12 ? 1 : 2), "timed", [
        { ...section, id: "timed" },
      ]),
    );
  };
  const simulate = () => {
    try {
      const plan = buildExamPlan(prepBank, Date.now());
      begin(newRun("Verbal simulation · 41 minutes", "exam", plan.sections));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Not enough questions for a complete verbal simulation.",
      );
    }
  };
  const grade = (grades: PrepGrade[]) => {
    // Publish nothing until every new result passes validation and the entire
    // batch has been persisted in one write. Failed sections remain editable.
    const next = commitGradeBatch(
      progressRef.current,
      grades,
      savePrepProgress,
    );
    progressRef.current = next;
    setProgress(next);
  };
  const patchAttempt = (
    id: string,
    values: Partial<Pick<PrepAttempt, "errorReason" | "note">>,
  ) =>
    update({
      ...progressRef.current,
      attempts: progressRef.current.attempts.map((a) =>
        a.id === id ? { ...a, ...values } : a,
      ),
    });
  const reviewQuestions = stats.reviewIds
    .map((id) => prepById.get(id))
    .filter((q): q is PrepQuestion => !!q);
  const closeRun = () => {
    setRun(null);
    const saved = loadRun(prepBank);
    setView(saved && !saved.finished ? "train" : "review");
  };
  const notice = examBlueprint.notice;
  return (
    <section className="prep-hub">
      <div className="prep-heading">
        <div>
          <span className="eyebrow">YOUR 170 VERBAL TRAINING SPACE</span>
          <h1>Verbal Reasoning</h1>
          <p>The exam’s question types. Your next focused practice session.</p>
        </div>
        <span className="prep-target">
          <Target size={21} />
          <span>
            GOAL<strong>170</strong>
          </span>
        </span>
      </div>
      <div
        className="prep-tabs"
        role="tablist"
        aria-label="Verbal training views"
      >
        {(
          [
            { id: "train", label: "Practice", icon: Zap },
            { id: "timed", label: "Timed practice", icon: Clock3 },
            { id: "review", label: "Review & insights", icon: History },
            { id: "guides", label: "Strategies", icon: BookOpen },
            {
              id: "resources",
              label: "Official resources",
              icon: GraduationCap,
            },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            role="tab"
            id={"prep-tab-" + id}
            aria-controls="prep-view-panel"
            tabIndex={view === id ? 0 : -1}
            aria-selected={view === id}
            onKeyDown={(e) => {
              const ids: PrepView[] = [
                "train",
                "timed",
                "review",
                "guides",
                "resources",
              ];
              const position = ids.indexOf(id);
              const next =
                e.key === "ArrowRight"
                  ? ids[(position + 1) % ids.length]
                  : e.key === "ArrowLeft"
                    ? ids[(position + ids.length - 1) % ids.length]
                    : e.key === "Home"
                      ? ids[0]
                      : e.key === "End"
                        ? ids[ids.length - 1]
                        : null;
              if (next) {
                e.preventDefault();
                setView(next);
                document.getElementById("prep-tab-" + next)?.focus();
              }
            }}
            key={id}
            onClick={() => setView(id)}
          >
            <Icon size={17} />
            <span className="prep-tab-label">{label}</span>
            <span className="prep-tab-short" aria-hidden="true">
              {
                {
                  train: "Practice",
                  timed: "Timed",
                  review: "Review",
                  guides: "Strategies",
                  resources: "Resources",
                }[id]
              }
            </span>
          </button>
        ))}
      </div>
      {message && (
        <p className="prep-notice" role="status">
          {message}
        </p>
      )}
      {resumable && !resumable.finished && (
        <div className="prep-resume">
          <div>
            <strong>Your session is saved</strong>
            <p>
              {resumable.title}
              {resumable.mode === "drill"
                ? " · Continue where you left off."
                : " · The timed clock is still running."}
            </p>
          </div>
          <button
            className="button primary"
            onClick={() => setRun(loadRun(prepBank))}
          >
            Resume session <ArrowRight size={16} />
          </button>
        </div>
      )}
      <div className="prep-stat-strip">
        <div>
          <strong>{prepBank.length}</strong>
          <span>original questions</span>
        </div>
        <div>
          <strong>{stats.attempted}</strong>
          <span>questions tried</span>
        </div>
        <div>
          <strong>{stats.attempted ? stats.accuracy + "%" : "—"}</strong>
          <span>latest accuracy</span>
        </div>
        <div>
          <strong>{stats.reviewIds.length}</strong>
          <span>to review</span>
        </div>
      </div>
      <div
        id="prep-view-panel"
        role="tabpanel"
        aria-labelledby={"prep-tab-" + view}
      >
        {view === "train" && (
          <>
            <ChallengeChooser
              bank={prepBank}
              attempted={attempted}
              family={family}
              format={format}
              onChoose={choose}
            />
            <div
              ref={builder}
              tabIndex={-1}
              className="prep-session-builder"
              aria-label="Practice session setup"
            >
              <div className="section-title">
                <div>
                  <span className="eyebrow">YOUR SESSION</span>
                  <h2>{sessionTitle}</h2>
                </div>
                <button className="text-button" onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
              <div className="prep-filter-panel">
                <div className="prep-filters">
                  <label>
                    Question type
                    <select
                      aria-label="Verbal question type"
                      value={family}
                      onChange={(e) => {
                        const next = e.target.value as PrepFamily;
                        setFamily(next);
                        setFormat(next === "se" ? "se" : "all");
                        setTopic("all");
                      }}
                    >
                      <option value="all">All three types</option>
                      {questionFamilies.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="prep-format-filter">
                    Response format
                    <select
                      aria-label="Verbal question format"
                      value={format}
                      onChange={(e) => {
                        const f = e.target.value as PrepFormat | "all";
                        setFormat(f);
                        if (f !== "all") setFamily(familyOf(f));
                        setTopic("all");
                      }}
                    >
                      <option value="all">All formats for selected type</option>
                      {questionFamilies.map((g) => (
                        <optgroup key={g.id} label={g.title}>
                          {g.formats.map((f) => (
                            <option key={f} value={f}>
                              {formatDetails[f].label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <label>
                    Difficulty
                    <select
                      aria-label="Verbal difficulty"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                    >
                      <option value="all">Mixed difficulty</option>
                      {["Core", "Standard", "Advanced"].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Topic
                    <select
                      aria-label="Verbal topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    >
                      <option value="all">All topics</option>
                      {topics.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Session length
                    <select
                      aria-label="Verbal session length"
                      value={count}
                      onChange={(e) => setCount(+e.target.value)}
                    >
                      {[5, 10, 15, 20].map((n) => (
                        <option key={n} value={n}>
                          {n} questions
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="prep-filter-bottom">
                  <label>
                    <input
                      type="checkbox"
                      checked={fresh}
                      onChange={(e) => setFresh(e.target.checked)}
                    />{" "}
                    Only questions I haven’t attempted
                  </label>
                  <div className="prep-start">
                    <span aria-live="polite">
                      {selectedCount
                        ? selectedCount +
                          " questions · untimed · feedback after each answer"
                        : "No questions match these filters."}
                    </span>
                    <button
                      className="button primary"
                      disabled={!selectedCount}
                      onClick={selectedDrill}
                    >
                      Start focused drill <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
                {available.length < count && available.length > 0 && (
                  <p className="prep-filter-feedback" role="status">
                    This selection has {available.length} matching{" "}
                    {fresh ? "unseen " : ""}questions. Your session will include
                    all {available.length}.
                  </p>
                )}
                {!available.length && (
                  <div className="prep-filter-feedback">
                    <p>
                      {fresh
                        ? "Try including questions you’ve seen, or choose another type or difficulty."
                        : "Try a different difficulty or reset your filters."}
                    </p>
                    {fresh && (
                      <button
                        className="text-button"
                        onClick={() => setFresh(false)}
                      >
                        Include previously seen questions
                      </button>
                    )}
                  </div>
                )}
                <p className="prep-caption">
                  Difficulty labels are editorial estimates, not ETS-calibrated
                  levels or score bands.
                </p>
              </div>
            </div>
            <div className="prep-study-actions">
              <button onClick={() => timed(12)}>
                <Clock3 size={21} />
                <span>
                  <strong>Start Verbal diagnostic</strong>
                  <small>12 questions · 18 minutes · results at the end</small>
                </span>
                <ArrowRight size={17} />
              </button>
              <button onClick={() => setView("timed")}>
                <ListChecks size={21} />
                <span>
                  <strong>Practice under exam timing</strong>
                  <small>12 + 15 questions · 41 minutes total</small>
                </span>
                <ArrowRight size={17} />
              </button>
            </div>
            <div className="prep-quick-grid">
              <button
                onClick={() =>
                  drill(
                    selectQuestions(prepBank, {
                      section: "verbal",
                      difficulty: "Advanced",
                      count: 15,
                      seed: Date.now(),
                      excludeIds: fresh ? [...attempted] : undefined,
                    }),
                    "Advanced Verbal practice",
                  )
                }
              >
                <span className="tile-icon lavender">
                  <Sparkles />
                </span>
                <strong>Advanced practice</strong>
                <p>Close distractors, subtle logic, and careful inference.</p>
                <span>
                  Up to 15 questions <ArrowRight size={15} />
                </span>
              </button>
              <button
                disabled={!reviewQuestions.length}
                onClick={() =>
                  drill(reviewQuestions.slice(0, 10), "Mistake review")
                }
              >
                <span className="tile-icon peach">
                  <RotateCcw />
                </span>
                <strong>Review mistakes & guesses</strong>
                <p>
                  Use your misses and uncertain answers to choose what comes
                  next.
                </p>
                <span>
                  {reviewQuestions.length
                    ? reviewQuestions.length + " questions to revisit"
                    : "Complete a session to build your queue"}{" "}
                  <ArrowRight size={15} />
                </span>
              </button>
              <button onClick={() => setView("guides")}>
                <span className="tile-icon butter">
                  <BookOpen />
                </span>
                <strong>Question-type strategies</strong>
                <p>Learn a method, apply it, then check your reasoning.</p>
                <span>
                  12 practical guides <ArrowRight size={15} />
                </span>
              </button>
            </div>
            {children && (
              <details className="prep-vocabulary-tools">
                <summary>
                  <span>
                    <strong>Vocabulary support</strong>
                    <small>
                      Recall games, saved words, and targeted word review
                    </small>
                  </span>
                  <ChevronDown size={18} />
                </summary>
                {children}
              </details>
            )}
          </>
        )}
        {view === "timed" && (
          <>
            <div className="prep-feature">
              <div>
                <span className="eyebrow">27 QUESTIONS. 41 MINUTES.</span>
                <h2>Train the whole Verbal experience.</h2>
                <p>
                  Section 1: 12 questions in 18 minutes. Section 2: 15 questions
                  in 23 minutes. Move freely within each section, mark items,
                  and change answers before submitting.
                </p>
                <button className="button primary" onClick={simulate}>
                  Start 41-minute Verbal simulation <ArrowRight size={17} />
                </button>
              </div>
              <div className="prep-timing-art">
                <span>
                  01 <strong>18:00</strong>
                  <small>12 questions</small>
                </span>
                <span>
                  02 <strong>23:00</strong>
                  <small>15 questions</small>
                </span>
              </div>
            </div>
            <div className="prep-notice">
              <Clock3 size={19} />
              <p>
                This is a fixed-form timing simulation. The real GRE is
                section-adaptive; this app does not reproduce ETS’s routing or
                scaled scoring. Explanations are hidden until submission. The
                timer continues if you leave or lock your phone.
              </p>
            </div>
            <div className="prep-timed-cards">
              <button className="panel" onClick={() => timed(12)}>
                <span className="eyebrow">ONE SECTION AT A TIME</span>
                <h3>18-minute section</h3>
                <p>12 questions · review at the end</p>
                <ArrowRight size={20} />
              </button>
              <button className="panel" onClick={() => timed(15)}>
                <span className="eyebrow">ONE SECTION AT A TIME</span>
                <h3>23-minute section</h3>
                <p>15 questions · review at the end</p>
                <ArrowRight size={20} />
              </button>
            </div>
            <p className="prep-caption">
              Question mix varies in our simulations. ETS does not promise a
              fixed per-section count for each Verbal subtype. Some questions
              can repeat across sessions; use fresh drills for unseen-item
              accuracy.
            </p>
          </>
        )}
        {view === "review" && (
          <>
            <div className="section-title">
              <h2>Find the reason, not just the answer</h2>
              <button
                className="button secondary"
                disabled={!reviewQuestions.length}
                onClick={() =>
                  drill(reviewQuestions.slice(0, 10), "Precision review")
                }
              >
                Practice review queue <ArrowRight size={16} />
              </button>
            </div>
            <p className="prep-lead">
              Statistics use your latest answer per question. Repeated practice
              is useful, but familiar-question accuracy is not an official score
              forecast.
            </p>
            <div className="prep-topic-table">
              <table>
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Tried</th>
                    <th>Accuracy</th>
                    <th>Avg. elapsed</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byTopic.map((t) => (
                    <tr key={t.topic}>
                      <td>{t.topic}</td>
                      <td>{t.attempts}</td>
                      <td>{t.attempts ? `${t.accuracy}%` : "—"}</td>
                      <td>
                        {t.attempts ? `${Math.round(t.avgSeconds)} sec` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!stats.byTopic.length && (
                <div className="prep-empty">
                  Your topic profile begins with your first session.
                </div>
              )}
            </div>
            <div className="section-title">
              <h2>Your mistake journal</h2>
              <span className="small muted">
                Incorrect or uncertain latest responses
              </span>
            </div>
            <div className="prep-error-list">
              {latest
                .filter((a) => !a.correct || isUncertain(a.confidence))
                .slice(0, 40)
                .map((a) => {
                  const q = prepById.get(a.questionId);
                  if (!q) return null;
                  return (
                    <details key={a.id}>
                      <summary>
                        <span
                          className={`prep-result-dot ${a.correct ? "correct" : ""}`}
                        >
                          {a.correct ? <Check size={15} /> : <Flag size={15} />}
                        </span>
                        <span>
                          <strong>{q.skill}</strong>
                          <small>
                            {formatLabel(q.format)} · {q.difficulty} ·{" "}
                            {a.correct ? "Correct but uncertain" : "Incorrect"}{" "}
                            · {Math.round(a.elapsedMs / 1000)} sec
                          </small>
                        </span>
                        <ChevronDown size={17} />
                      </summary>
                      <p className="prep-journal-stem">{q.stem}</p>
                      <div className="prep-error-fields">
                        <label>
                          What went wrong?
                          <select
                            aria-label={`Error reason for ${q.id}`}
                            value={a.errorReason || ""}
                            onChange={(e) =>
                              patchAttempt(a.id, {
                                errorReason:
                                  (e.target.value as ErrorReason) || undefined,
                              })
                            }
                          >
                            <option value="">Choose a reason</option>
                            {errorReasons.map((reason) => (
                              <option key={reason}>{reason}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          What will you do differently?
                          <textarea
                            aria-label={`Review note for ${q.id}`}
                            rows={2}
                            maxLength={2000}
                            value={a.note || ""}
                            onChange={(e) =>
                              patchAttempt(a.id, { note: e.target.value })
                            }
                          />
                        </label>
                      </div>
                      <p>
                        <b>Strategy:</b> {q.strategy}
                      </p>
                      <button
                        className="button secondary"
                        onClick={() => drill([q], "Review one question")}
                      >
                        Try again with a plan <ArrowRight size={16} />
                      </button>
                    </details>
                  );
                })}
              {!reviewQuestions.length && (
                <div className="prep-empty">
                  No misses or uncertain answers in your current queue. Use an
                  unseen, harder set to keep testing your understanding.
                </div>
              )}
            </div>
            <section className="panel prep-benchmark">
              <h3>Keep official scores separate</h3>
              <p>
                Record Verbal results from an actual GRE or an official scored,
                timed ETS practice test. Untimed POWERPREP 1 does not provide
                Verbal scores.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = Number(score);
                  if (
                    !Number.isInteger(n) ||
                    n < 130 ||
                    n > 170 ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(scoreDate) ||
                    !scoreSource.trim()
                  ) {
                    setMessage(
                      "Enter a valid date, a Verbal score from 130 to 170, and the test name.",
                    );
                    return;
                  }
                  update({
                    ...progressRef.current,
                    officialScores: [
                      ...progressRef.current.officialScores,
                      {
                        date: scoreDate,
                        verbal: n,
                        source: scoreSource.trim().slice(0, 160),
                      },
                    ],
                  });
                  setScore("");
                }}
              >
                <label>
                  Test date
                  <input
                    aria-label="Official test date"
                    type="date"
                    required
                    value={scoreDate}
                    onChange={(e) => setScoreDate(e.target.value)}
                  />
                </label>
                <label>
                  Verbal score
                  <input
                    aria-label="Official Verbal score"
                    type="number"
                    min={130}
                    max={170}
                    required
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                  />
                </label>
                <label>
                  Test name
                  <input
                    aria-label="Official test name"
                    value={scoreSource}
                    onChange={(e) => setScoreSource(e.target.value)}
                    maxLength={160}
                  />
                </label>
                <button className="button secondary" type="submit">
                  Save benchmark
                </button>
              </form>
              {progress.officialScores.map((s, i) => (
                <div className="prep-benchmark-row" key={i}>
                  <span>
                    {s.date} · {s.source}
                  </span>
                  <b>Verbal {s.verbal}</b>
                </div>
              ))}
            </section>
          </>
        )}
        {view === "guides" && (
          <>
            <div className="section-title">
              <h2>Precision is a learnable process</h2>
              <span className="small muted">Read · apply · review</span>
            </div>
            <div className="prep-guide-grid">
              {verbalGuides.map((g) => (
                <details className="panel" key={g.id}>
                  <summary>
                    <span className="eyebrow">{g.category}</span>
                    <h3>{g.title}</h3>
                    <p>{g.summary}</p>
                    <span className="text-button">
                      Open the method <ChevronDown size={15} />
                    </span>
                  </summary>
                  <ol>
                    {g.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  <div className="prep-guide-example">
                    <b>Try this reasoning</b>
                    <p>{g.microExample.prompt}</p>
                    <p>{g.microExample.reasoning}</p>
                  </div>
                  <h4>Watch for</h4>
                  <ul>
                    {g.traps.map((trap, i) => (
                      <li key={i}>{trap}</li>
                    ))}
                  </ul>
                  {g.sourceUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      ETS guidance <ExternalLink size={12} />
                    </a>
                  ))}
                </details>
              ))}
            </div>
            <div className="section-title">
              <h2>A sensible path toward 170</h2>
            </div>
            <div className="prep-plan">
              {targetScorePlan.map((step, i) => (
                <div key={step.id}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {view === "resources" && (
          <>
            <div className="prep-format-notice">
              <span className="eyebrow">
                VERIFIED {examBlueprint.verifiedOn} · PLANNING FOR 2027
              </span>
              <h2>Build on the published exam.</h2>
              <p>{notice}</p>
              <p>
                Use original Wordtrail questions for skill practice. Use
                official ETS materials to benchmark the real test’s wording and
                scoring. These links open the provider’s site and may need an
                internet connection or ETS account.
              </p>
            </div>
            <div className="prep-resource-grid">
              {resourceLinks.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div>
                    <span className="pill mint">{resource.provider}</span>
                    <span>
                      {resource.access}
                      <ExternalLink size={15} />
                    </span>
                  </div>
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>
                  <p className="prep-resource-use">
                    <b>Use it for:</b> {resource.howToUse}
                  </p>
                  <small>Link checked {resource.verifiedOn}</small>
                </a>
              ))}
            </div>
            <div className="section-title">
              <h2>Rules that matter</h2>
            </div>
            <div className="prep-rule-list">
              {formatRules.map((rule) => (
                <div key={rule.id}>
                  <Check size={17} />
                  <div>
                    <h3>{rule.title}</h3>
                    <p>{rule.description}</p>
                    <a href={rule.sourceUrl} target="_blank" rel="noreferrer">
                      Official guidance <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {run && <PrepRunner initial={run} onClose={closeRun} onGrade={grade} />}
      {pending && (
        <SessionConflictDialog
          onResume={() => {
            setRun(loadRun(prepBank));
            setPending(null);
          }}
          onReplace={() => {
            clearRun();
            setRun(newRun(pending.title, pending.mode, pending.sections));
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </section>
  );
}
