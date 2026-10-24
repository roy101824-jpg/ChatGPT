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
const formats: PrepFormat[] = [
  "tc1",
  "tc2",
  "tc3",
  "se",
  "rc-single",
  "rc-multi",
  "rc-sentence",
];
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
export default function PrepHub({ children }: { children?: ReactNode }) {
  const [view, setView] = useState<
    "train" | "timed" | "review" | "guides" | "resources"
  >("train");
  const [progress, setProgress] = useState(loadPrepProgress);
  const progressRef = useRef(progress);
  const [run, setRun] = useState<PrepRun | null>(() => loadRun(prepBank));
  const [pending, setPending] = useState<PrepRun | null>(null);
  const [message, setMessage] = useState("");
  const [format, setFormat] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [topic, setTopic] = useState("all");
  const [count, setCount] = useState(10);
  const [fresh, setFresh] = useState(true);
  const [score, setScore] = useState("");
  const [scoreDate, setScoreDate] = useState(localDay());
  const [scoreSource, setScoreSource] = useState("Timed POWERPREP");
  const stats = getPrepStats(prepBank, progress);
  const latest = latestAttempts(progress);
  const topics = [...new Set(prepBank.map((q) => q.topic))].sort();
  const attempted = new Set(latest.map((a) => a.questionId));
  const available = prepBank.filter(
    (q) =>
      (format === "all" || q.format === format) &&
      (difficulty === "all" || q.difficulty === difficulty) &&
      (topic === "all" || q.topic === topic) &&
      (!fresh || !attempted.has(q.id)),
  );
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
      "Focused verbal practice",
    );
  const timed = (n: 12 | 15) => {
    const selection = selectQuestions(prepBank, {
      section: "verbal",
      count: n,
      seed: Date.now(),
    });
    begin(
      newRun(`Verbal section ${n === 12 ? 1 : 2}`, "timed", [
        {
          id: "timed",
          title: `Verbal · ${n} questions`,
          section: "verbal",
          minutes: n === 12 ? 18 : 23,
          questionIds: selection.map((q) => q.id),
        },
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
    setView("review");
  };
  const notice = examBlueprint.notice;
  return (
    <section className="prep-hub">
      <div className="prep-heading">
        <div>
          <span className="eyebrow">YOUR 170 VERBAL TRAINING SPACE</span>
          <h1>Know the words. Master the reasoning.</h1>
          <p>
            Complete Verbal coverage. Deliberate practice. A clearer picture of
            every mistake.
          </p>
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
            { id: "train", label: "Train", icon: Zap },
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
            aria-selected={view === id}
            key={id}
            onClick={() => setView(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
      {message && (
        <p className="prep-notice" role="status">
          {message}
        </p>
      )}
      <div className="prep-stat-strip">
        <div>
          <strong>{prepBank.length}</strong>
          <span>original verbal questions</span>
        </div>
        <div>
          <strong>{stats.attempted}</strong>
          <span>unique questions tried</span>
        </div>
        <div>
          <strong>{stats.attempted ? stats.accuracy + "%" : "—"}</strong>
          <span>latest-answer accuracy</span>
        </div>
        <div>
          <strong>{stats.reviewIds.length}</strong>
          <span>to review deliberately</span>
        </div>
      </div>
      {view === "train" && (
        <>
          <div className="prep-feature">
            <div>
              <span className="eyebrow">PRECISION BEFORE PACE</span>
              <h2>Aim high. Train specifically.</h2>
              <p>
                Multi-blank logic, equivalent meanings, and passage-based
                reasoning. Begin with a timed diagnostic, then use your evidence
                to choose the next drill.
              </p>
              <button className="button primary" onClick={() => timed(12)}>
                Start Verbal diagnostic <ArrowRight size={17} />
              </button>
              <span className="prep-caption">
                12 questions · 18 minutes · raw results, not a scaled-score
                estimate
              </span>
            </div>
            <div className="prep-format-grid">
              {formats.map((f) => (
                <div key={f}>
                  <Check size={15} />
                  <span>{formatLabel(f)}</span>
                  <b>{prepBank.filter((q) => q.format === f).length}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="section-title">
            <h2>Build your next session</h2>
            <span className="small muted">
              {available.length} matching {fresh ? "unseen " : ""}questions
            </span>
          </div>
          <div className="prep-filter-panel">
            <div className="prep-filters">
              <label>
                Question format
                <select
                  aria-label="Verbal question format"
                  value={format}
                  onChange={(e) => {
                    setFormat(e.target.value);
                    setTopic("all");
                  }}
                >
                  <option value="all">All formats</option>
                  {formats.map((f) => (
                    <option key={f} value={f}>
                      {formatLabel(f)}
                    </option>
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
              <button className="button primary" onClick={selectedDrill}>
                Start focused drill <ArrowRight size={17} />
              </button>
            </div>
            <p className="prep-caption">
              Difficulty labels are editorial estimates. They are not
              ETS-calibrated difficulty levels or score bands.
            </p>
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
                  "Advanced verbal challenge",
                )
              }
            >
              <span className="tile-icon lavender">
                <Sparkles />
              </span>
              <strong>Advanced challenge</strong>
              <p>
                Nuanced logic, close distractors, and disciplined inference.
              </p>
              <span>
                Up to 15 questions <ArrowRight size={15} />
              </span>
            </button>
            <button
              onClick={() =>
                reviewQuestions.length
                  ? drill(reviewQuestions.slice(0, 10), "Precision review")
                  : setMessage(
                      "Your misses and uncertain answers will appear here after practice.",
                    )
              }
            >
              <span className="tile-icon peach">
                <RotateCcw />
              </span>
              <strong>Turn misses into methods</strong>
              <p>Revisit mistakes and answers you weren’t sure about.</p>
              <span>
                {reviewQuestions.length} in your queue <ArrowRight size={15} />
              </span>
            </button>
            <button onClick={() => setView("guides")}>
              <span className="tile-icon butter">
                <ListChecks />
              </span>
              <strong>Build a repeatable process</strong>
              <p>
                Use evidence, scope, and sentence logic to eliminate tempting
                answers.
              </p>
              <span>
                12 practical guides <ArrowRight size={15} />
              </span>
            </button>
          </div>
          {children && (
            <section className="prep-vocabulary-tools">
              <div className="section-title">
                <h2>Vocabulary games & writing studio</h2>
              </div>
              {children}
            </section>
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
                in 23 minutes. Move freely within each section, mark items, and
                change answers before submitting.
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
            Question mix varies in our simulations. ETS does not promise a fixed
            per-section count for each Verbal subtype. Some questions can repeat
            across sessions; use fresh drills for unseen-item accuracy.
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
            Statistics use your latest answer per question. Repeated practice is
            useful, but familiar-question accuracy is not an official score
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
              .filter((a) => !a.correct || a.confidence !== "sure")
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
                          {a.correct ? "Correct but uncertain" : "Incorrect"} ·{" "}
                          {Math.round(a.elapsedMs / 1000)} sec
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
              Use original Wordtrail questions for skill practice. Use official
              ETS materials to benchmark the real test’s wording and scoring.
              These links open the provider’s site and may need an internet
              connection or ETS account.
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
      {run && <PrepRunner initial={run} onClose={closeRun} onGrade={grade} />}
      {pending && (
        <div className="prep-confirm-backdrop">
          <section
            className="prep-confirm"
            role="alertdialog"
            aria-label="Unfinished practice"
          >
            <h3>You have an unfinished session.</h3>
            <p>
              Resume it, or replace its saved answers with this new session.
              Already recorded practice results stay in your progress.
            </p>
            <div>
              <button
                className="button secondary"
                onClick={() => {
                  setRun(loadRun(prepBank));
                  setPending(null);
                }}
              >
                Resume previous
              </button>
              <button
                className="button primary"
                onClick={() => {
                  clearRun();
                  setRun(newRun(pending.title, pending.mode, pending.sections));
                  setPending(null);
                }}
              >
                Replace session
              </button>
              <button className="text-button" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
