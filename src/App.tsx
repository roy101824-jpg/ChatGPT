import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  AudioLines,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Feather,
  Flame,
  GraduationCap,
  Leaf,
  Library,
  Menu,
  MoreHorizontal,
  Mountain,
  Search,
  Settings2,
  Share,
  Sparkles,
  Sprout,
  Target,
  Trophy,
  Volume2,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import {
  buildSession,
  getStats,
  localDay,
  rateWord,
  type Word,
  type Progress,
} from "./lib/study";
import {
  loadProgress,
  saveProgress,
  parseBackup,
  serializeBackup,
} from "./lib/storage";
import StudySession, { speak, type Rating } from "./components/StudySession";
import PracticeSession, {
  readActivePractice,
  type Question,
} from "./components/PracticeSession";
import { TrailArt } from "./components/TrailArt";
import PrepHub from "./prep/PrepHub";
import { prepBank } from "./prep/bank";
import {
  loadPrepProgress,
  savePrepProgress,
  parsePrepBackup,
  serializePrepBackup,
} from "./prep/storage";
import { clearRun } from "./prep/session";
import type { PrepFormat, PrepProgress } from "./prep/types";
import {
  practiceQuestions,
  readingPassages,
  essayPrompts,
} from "./data/practice";
import vocabulary from "./data/vocabulary.json";
import sourceData from "./data/sources.json";
import referenceData from "./data/reference-index.json";

type Tab = "today" | "trail" | "practice" | "library" | "progress";
type Source = {
  id: string;
  title: string;
  kind?: string;
  status?: string;
  count?: number;
  wordCount?: number;
  pages?: number;
  note?: string;
};
const words = vocabulary as Word[];
const sources = sourceData as Source[];
const referenceWords = referenceData as Word[];
const learnable = words.filter((w) => w.definition?.trim());
const allQuestions: Question[] = [
  ...practiceQuestions,
  ...readingPassages.flatMap((p) =>
    p.questions.map((q) => ({ ...q, passage: p.passage })),
  ),
];
function restorePractice() {
  const snapshot = readActivePractice();
  if (!snapshot) return null;
  const questions = snapshot.questionIds.map((id) =>
    allQuestions.find((q) => q.id === id),
  );
  return questions.some((q) => !q)
    ? null
    : { questions: questions as Question[], title: snapshot.title };
}
function restoreStudy() {
  try {
    const value = JSON.parse(safeRead("wordtrail.activeSession", "null"));
    if (
      !value ||
      !Array.isArray(value.ids) ||
      !["flashcard", "quiz"].includes(value.kind) ||
      value.ids.length > 100 ||
      !Number.isInteger(value.index) ||
      value.index < 0 ||
      value.index >= value.ids.length
    )
      return null;
    const restored = value.ids.map((id: string) =>
      words.find((w) => w.id === id),
    );
    if (restored.some((w: Word | undefined) => !w?.definition)) return null;
    return {
      words: restored as Word[],
      kind: value.kind as "flashcard" | "quiz",
    };
  } catch {
    return null;
  }
}
const navigation = [
  { id: "today" as Tab, label: "Today", icon: Compass },
  { id: "trail" as Tab, label: "My trail", icon: Mountain },
  { id: "practice" as Tab, label: "Practice", icon: Zap },
  { id: "library" as Tab, label: "Word library", icon: Library },
  { id: "progress" as Tab, label: "Progress", icon: ChartIcon },
];
function ChartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M4 20V13M12 20V5M20 20V9" />
    </svg>
  );
}
function safeRead(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function cleanPracticeLog(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const p = value as { correct?: unknown; total?: unknown };
  return typeof p.correct === "number" &&
    typeof p.total === "number" &&
    Number.isSafeInteger(p.correct) &&
    Number.isSafeInteger(p.total) &&
    p.correct >= 0 &&
    p.total >= p.correct &&
    p.total <= 10_000_000
    ? { correct: p.correct, total: p.total }
    : null;
}
function importedEssay(raw: unknown) {
  if (typeof raw !== "string" || raw.length > 200000)
    throw new Error("The essay draft in this backup is invalid.");
  if (!raw) return "";
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("The essay draft in this backup is not valid JSON.");
  }
  if (
    !value ||
    typeof value.draft !== "string" ||
    value.draft.length > 100000 ||
    !Number.isInteger(value.promptIndex) ||
    value.promptIndex < 0 ||
    value.promptIndex >= essayPrompts.length
  )
    throw new Error("The essay draft in this backup is invalid.");
  return JSON.stringify(readEssay(raw));
}

function download(name: string, text: string, type = "application/json") {
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([text], { type }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input,select,textarea,a[href],[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", key);
      before?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className={`modal ${wide ? "wide-modal" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function App() {
  const [tab, setTab] = useState<Tab>(() => {
    const hash = location.hash.slice(1);
    return navigation.some((n) => n.id === hash) ? (hash as Tab) : "today";
  });
  const [prepFocus, setPrepFocus] = useState<PrepFormat>();
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [limit, setLimit] = useState(60);
  const [detail, setDetail] = useState<Word | null>(null);
  const [modal, setModal] = useState<"settings" | "install" | "sources" | null>(
    null,
  );
  const [toast, setToast] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const [session, setSession] = useState<{
    words: Word[];
    kind: "flashcard" | "quiz";
  } | null>(restoreStudy);
  const [practice, setPractice] = useState<{
    questions: Question[];
    title: string;
  } | null>(restorePractice);
  const [essay, setEssay] = useState(false);
  const [practiceLog, setPracticeLog] = useState<{
    correct: number;
    total: number;
  }>(() => {
    try {
      const p = JSON.parse(safeRead("wordtrail.practice", "{}"));
      return cleanPracticeLog(p) || { correct: 0, total: 0 };
    } catch {
      return { correct: 0, total: 0 };
    }
  });
  const [backupCandidate, setBackupCandidate] = useState<{
    progress: Progress;
    practice?: { correct: number; total: number };
    essay?: string;
    prep?: PrepProgress;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stats = getStats(learnable, progress, clock);
  const today = localDay();
  const dayPercent = Math.min(
    100,
    (stats.todayReviews / progress.settings.dailyGoal) * 100,
  );
  const sourceMap = useMemo(() => new Map(sources.map((s) => [s.id, s])), []);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const check = () => {
      const worker = navigator.serviceWorker.controller;
      if (!worker) return;
      const channel = new MessageChannel();
      channel.port1.onmessage = (e) => {
        setOfflineReady(e.data?.ready === true);
        channel.port1.close();
      };
      worker.postMessage({ type: "GET_OFFLINE_STATUS" }, [channel.port2]);
    };
    navigator.serviceWorker.ready.then(check).catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", check);
    return () =>
      navigator.serviceWorker.removeEventListener("controllerchange", check);
  }, []);
  useEffect(() => {
    if (!saveProgress(progress))
      setToast(
        "Progress could not be saved. Export a backup from Settings before closing.",
      );
  }, [progress]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    addEventListener("online", update);
    addEventListener("offline", update);
    return () => {
      removeEventListener("online", update);
      removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setLimit(60);
  }, [tab, query, filter, sourceFilter]);
  const update = (fn: (p: Progress) => Progress) => setProgress(fn);
  const bookmark = (id: string) =>
    update((p) => ({
      ...p,
      bookmarks: p.bookmarks.includes(id)
        ? p.bookmarks.filter((x) => x !== id)
        : [...p.bookmarks, id],
    }));
  const start = (
    mode: "learn" | "review" | "weak" | "bookmarked" = "learn",
    kind: "flashcard" | "quiz" = "flashcard",
    custom?: Word[],
  ) => {
    const selected =
      custom
        ?.filter((w) => w.definition)
        .slice(0, progress.settings.sessionSize) ||
      buildSession(learnable, progress, {
        mode,
        limit: progress.settings.sessionSize,
      });
    if (!selected.length) {
      setToast(
        mode === "review"
          ? "You’re all caught up. Try a few new words."
          : mode === "bookmarked"
            ? "Save some words in your library to practice them here."
            : mode === "weak"
              ? "No tricky words yet. Your missed words will appear here."
              : "You’ve explored every word in this selection. Review what you’ve learned.",
      );
      return;
    }
    setSession({ words: selected, kind });
  };
  const rated = (id: string, rating: Rating) =>
    update((p) => rateWord(p, id, rating));
  const wordOfDay = useMemo(() => {
    const featured = learnable.filter((w) => w.example && w.word.length < 15);
    return featured.length
      ? featured[Math.floor(Date.now() / 86400000) % featured.length]
      : learnable[0];
  }, []);
  const visible = useMemo(
    () =>
      (filter === "reference" ? referenceWords : words).filter(
        (w) =>
          (!query ||
            `${w.word} ${w.definition || ""}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (sourceFilter === "all" ||
            w.sources.some((s) => s.id === sourceFilter)) &&
          (filter === "all" ||
            filter === "reference" ||
            (filter === "saved" && progress.bookmarks.includes(w.id)) ||
            (filter === "new" && !progress.words[w.id]) ||
            (filter === "learning" && !!progress.words[w.id]) ||
            (filter === "unresolved" && !w.definition)),
      ),
    [query, filter, sourceFilter, progress],
  );
  const practiced = (correct: number, total: number) =>
    setPracticeLog((p) => {
      const next = { correct: p.correct + correct, total: p.total + total };
      try {
        localStorage.setItem("wordtrail.practice", JSON.stringify(next));
      } catch {
        setToast("Practice results could not be saved.");
      }
      return next;
    });
  const nav = (newTab: Tab) => {
    setTab(newTab);
    setPrepFocus(undefined);
    history.replaceState(null, "", "#" + newTab);
    setQuery("");
    setFilter("all");
    setSourceFilter("all");
  };
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      key: localDay(date.getTime()),
      label: date.toLocaleDateString("en", { weekday: "short" }).slice(0, 1),
      full: date.toLocaleDateString("en", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    };
  });
  const chapters = useMemo(() => {
    const sorted = [...learnable].sort(
      (a, b) =>
        b.sources.length - a.sources.length || a.word.localeCompare(b.word),
    );
    return Array.from({ length: Math.ceil(sorted.length / 30) }, (_, i) =>
      sorted.slice(i * 30, i * 30 + 30),
    );
  }, []);
  const notice = toast ? (
    <div className="toast" role="status">
      {toast}
      <button aria-label="Dismiss notification" onClick={() => setToast("")}>
        <X size={16} />
      </button>
    </div>
  ) : null;
  if (session)
    return (
      <>
        <StudySession
          words={session.words}
          allWords={learnable}
          kind={session.kind}
          onRate={rated}
          onClose={() => {
            try {
              localStorage.removeItem("wordtrail.activeSession");
            } catch {}
            setSession(null);
          }}
        />
        {notice}
      </>
    );
  if (practice)
    return (
      <>
        <PracticeSession
          questions={practice.questions}
          title={practice.title}
          onClose={() => setPractice(null)}
          onFinish={practiced}
        />
        {notice}
      </>
    );
  if (essay)
    return (
      <>
        <EssayStudio onClose={() => setEssay(false)} notify={setToast} />
        {notice}
      </>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          href="#today"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            nav("today");
          }}
        >
          <span className="brand-mark">
            <Sprout size={26} />
          </span>
          wordtrail<span className="brand-dot">.</span>
        </a>
        <div className="sidebar-caption">A LITTLE BETTER, EVERY DAY</div>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => nav(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon size={21} />
              {label}
              {id === "today" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-spark">✧</span>
            <p>
              Big goals.
              <br />
              <b>Small, daily steps.</b>
            </p>
            <div className="little-hills">
              <span />
              <span />
              <span />
            </div>
          </div>
          <button
            className="sidebar-action"
            onClick={() => setModal("install")}
          >
            <ArrowDownToLine size={19} /> Get the app <ChevronRight size={16} />
          </button>
          <button
            className="sidebar-action"
            onClick={() => setModal("settings")}
          >
            <Settings2 size={19} /> Make it yours
          </button>
          <div className="profile">
            <div className="avatar">Y</div>
            <div>
              <strong>Your learning space</strong>
              <span>Personal GRE companion</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>My learning space</span>
            <ChevronRight size={14} />
            <b>{navigation.find((n) => n.id === tab)?.label}</b>
          </div>
          <a
            href="#today"
            className="brand mobile-brand"
            onClick={(e) => {
              e.preventDefault();
              nav("today");
            }}
          >
            <Sprout size={25} />
            wordtrail.
          </a>
          <div className="topbar-actions">
            <span
              className={`connection ${online ? "" : "is-offline"}`}
              title={
                online
                  ? "Connected. Your progress saves on this device."
                  : "Offline. Keep learning."
              }
            >
              {online ? <Wifi size={15} /> : <WifiOff size={15} />}
              <span>
                {online
                  ? offlineReady
                    ? "Offline ready"
                    : "On your device"
                  : "Offline"}
              </span>
            </span>
            <button className="streak-badge" onClick={() => nav("progress")}>
              <Flame size={17} />
              {stats.streak}
              <span>day streak</span>
            </button>
            <button
              className="icon-button mobile-settings"
              onClick={() => setModal("settings")}
              aria-label="Settings"
            >
              <Settings2 size={20} />
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {tab === "today" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR DAILY DOSE OF POSSIBILITY</div>
                  <h1>
                    A little practice. <span>A bigger vocabulary.</span>
                  </h1>
                  <p>
                    Your next chapter starts with a few words. Let’s make them
                    stick.
                  </p>
                </div>
                <button
                  className="date-chip"
                  onClick={() => setModal("settings")}
                >
                  <Target size={17} />
                  {progress.settings.dailyGoal} reviews / day{" "}
                  <ChevronDown size={14} />
                </button>
              </div>
              <section className="prep-home-banner">
                <Target size={28} />
                <div>
                  <h2>Your 170 Verbal training plan</h2>
                  <p>
                    {prepBank.length} original questions · every Verbal response
                    format · timed sections and mistake review
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => nav("practice")}
                >
                  Enter Verbal training <ArrowRight size={17} />
                </button>
              </section>
              <div className="dashboard-grid">
                <section className="hero-card">
                  <div className="hero-copy">
                    <span className="hero-tag">
                      <span /> YOUR DAILY ADVENTURE
                    </span>
                    <h2>
                      Small steps.
                      <br />
                      Remarkable progress.
                    </h2>
                    <p>
                      Discover new words, connect the dots,
                      <br className="desktop-only" /> and build confidence for
                      test day.
                    </p>
                    <button
                      className="button primary"
                      onClick={() => start(stats.due ? "review" : "learn")}
                    >
                      {stats.due
                        ? "Continue my reviews"
                        : "Let’s learn some words"}
                      <ArrowRight size={19} />
                    </button>
                    <span className="hero-foot">
                      <Clock3 size={14} /> About 5 minutes <span>·</span>{" "}
                      {Math.min(
                        progress.settings.sessionSize,
                        stats.due || learnable.length,
                      )}{" "}
                      words
                    </span>
                  </div>
                  <TrailArt />
                </section>
                <section className="daily-card">
                  <div className="card-heading">
                    <h3>Today’s little wins</h3>
                    <span className="pill pale">YOU’VE GOT THIS</span>
                  </div>
                  <div
                    className="daily-ring"
                    style={
                      { "--progress": `${dayPercent}%` } as React.CSSProperties
                    }
                  >
                    <div>
                      <strong>
                        {stats.todayReviews}
                        <span>/{progress.settings.dailyGoal}</span>
                      </strong>
                      <small>words practiced</small>
                    </div>
                  </div>
                  <p>
                    {dayPercent >= 100
                      ? "Daily goal, beautifully done."
                      : stats.todayReviews
                        ? "You’re building momentum. Keep going."
                        : "A fresh day. A fresh opportunity."}
                  </p>
                  <div className="week-days">
                    {days.map((d) => (
                      <div
                        key={d.key}
                        className={d.key === today ? "current" : ""}
                        title={d.full}
                      >
                        <span>{d.label}</span>
                        <div
                          className={
                            progress.activity[d.key]?.reviews ? "done" : ""
                          }
                        >
                          {progress.activity[d.key]?.reviews ? (
                            <Check size={13} />
                          ) : d.key === today ? (
                            <span />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <div className="section-title">
                <h2>Find your flow</h2>
                <button className="text-button" onClick={() => nav("practice")}>
                  Explore practice <ArrowRight size={16} />
                </button>
              </div>
              <div className="flow-grid">
                <button className="flow-card" onClick={() => start("review")}>
                  <span className="tile-icon peach">
                    <Clock3 size={23} />
                  </span>
                  <span className="flow-content">
                    <strong>Ready for a refresh</strong>
                    <span>
                      {stats.due
                        ? `${stats.due} words are ready for review`
                        : "Keep your growing vocabulary fresh"}
                    </span>
                    <small>
                      {stats.due ? `${stats.due} due now` : "All caught up"}{" "}
                      <ArrowRight size={14} />
                    </small>
                  </span>
                </button>
                <button
                  className="flow-card"
                  onClick={() => start("learn", "quiz")}
                >
                  <span className="tile-icon lavender">
                    <Zap size={23} />
                  </span>
                  <span className="flow-content">
                    <strong>A quick brain boost</strong>
                    <span>Match words to their meanings</span>
                    <small>
                      Meaning match <ArrowRight size={14} />
                    </small>
                  </span>
                </button>
                <button
                  className="flow-card"
                  onClick={() => {
                    nav("practice");
                    setPrepFocus("tc1");
                  }}
                >
                  <span className="tile-icon butter">
                    <BookOpen size={23} />
                  </span>
                  <span className="flow-content">
                    <strong>Text Completion</strong>
                    <span>Follow the clues and complete the sentence</span>
                    <small>
                      One-blank practice <ArrowRight size={14} />
                    </small>
                  </span>
                </button>
              </div>
              <div className="lower-grid">
                <section className="journey-card">
                  <div className="card-heading">
                    <div>
                      <span className="eyebrow">THE BIG PICTURE</span>
                      <h2>Every word is a step forward.</h2>
                    </div>
                    <span className="tile-icon mint">
                      <Sprout size={23} />
                    </span>
                  </div>
                  <div className="journey-stats">
                    <div>
                      <strong>{stats.learned.toLocaleString()}</strong>
                      <span>words explored</span>
                    </div>
                    <div>
                      <strong>{stats.mastered.toLocaleString()}</strong>
                      <span>growing strong</span>
                    </div>
                    <div>
                      <strong>{learnable.length.toLocaleString()}</strong>
                      <span>ready to discover</span>
                    </div>
                  </div>
                  <div className="long-progress">
                    <span
                      style={{
                        width: `${(stats.learned / Math.max(1, learnable.length)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="journey-footer">
                    <span>
                      {stats.learned
                        ? `${Math.round((stats.learned / learnable.length) * 100)}% of your collection explored`
                        : "Your adventure is just beginning"}
                    </span>
                    <button
                      className="text-button"
                      onClick={() => nav("trail")}
                    >
                      See my trail <ArrowRight size={15} />
                    </button>
                  </div>
                </section>
                {wordOfDay && (
                  <section className="daily-word">
                    <div className="card-heading">
                      <span className="eyebrow">
                        <Sparkles size={13} /> A WORD TO TAKE WITH YOU
                      </span>
                      <button
                        aria-label="Save word of the day"
                        className={`icon-button ${progress.bookmarks.includes(wordOfDay.id) ? "saved" : ""}`}
                        onClick={() => bookmark(wordOfDay.id)}
                      >
                        <Bookmark size={18} />
                      </button>
                    </div>
                    <div className="daily-word-title">
                      <h2>{wordOfDay.word}</h2>
                      <button
                        className="icon-button"
                        onClick={() => {
                          if (!speak(wordOfDay.word))
                            setToast(
                              "Pronunciation isn’t supported in this browser.",
                            );
                        }}
                        aria-label="Pronounce word of the day"
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>
                    <p>
                      {wordOfDay.definition.length > 130
                        ? wordOfDay.definition.slice(0, 130) + "…"
                        : wordOfDay.definition}
                    </p>
                    <button
                      className="text-button"
                      onClick={() => setDetail(wordOfDay)}
                    >
                      Get to know this word <ArrowRight size={15} />
                    </button>
                  </section>
                )}
              </div>
              <div className="page-foot">
                <Leaf size={14} />
                <span>
                  Progress over perfection. You’re in the right place.
                </span>
                <button onClick={() => setModal("sources")}>
                  {sources.length} resources, one learning space{" "}
                  <ArrowRight size={13} />
                </button>
              </div>
            </>
          )}
          {tab === "trail" && (
            <>
              <PageHeading
                eyebrow="ONE WORD AT A TIME"
                title="Your vocabulary adventure."
                text="A clear path through your collection. Start with words that appear across more of your lists."
              />
              <div className="trail-banner">
                <div>
                  <span className="pill mint">YOUR OWN PACE</span>
                  <h2>No locks. No falling behind.</h2>
                  <p>
                    Each chapter has up to 30 words. Return as often as you
                    like.
                  </p>
                </div>
                <TrailArt small />
              </div>
              <div className="section-title">
                <h2>{chapters.length} chapters to explore</h2>
                <span className="muted small">
                  {stats.learned.toLocaleString()} words explored
                </span>
              </div>
              <div className="chapter-grid">
                {chapters.slice(0, limit).map((chapter, i) => {
                  const learned = chapter.filter(
                    (w) => progress.words[w.id],
                  ).length;
                  return (
                    <button
                      className="chapter-card"
                      key={i}
                      onClick={() =>
                        start(
                          "learn",
                          "flashcard",
                          chapter.filter((w) => !progress.words[w.id]).length
                            ? chapter.filter((w) => !progress.words[w.id])
                            : chapter,
                        )
                      }
                    >
                      <div className="chapter-top">
                        <span
                          className={`chapter-number ${learned === chapter.length ? "complete" : ""}`}
                        >
                          {learned === chapter.length ? (
                            <Check size={22} />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </span>
                        <span className="small muted">
                          {learned} / {chapter.length}
                        </span>
                      </div>
                      <h3>
                        {i < 3
                          ? [
                              "Lay the groundwork",
                              "Find your footing",
                              "Build your momentum",
                            ][i]
                          : `Chapter ${i + 1}`}
                      </h3>
                      <p>
                        {chapter
                          .slice(0, 3)
                          .map((w) => w.word)
                          .join(" · ")}
                      </p>
                      <div className="long-progress">
                        <span
                          style={{
                            width: `${(learned / chapter.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="chapter-cta">
                        {learned ? "Continue exploring" : "Start this chapter"}{" "}
                        <ArrowRight size={16} />
                      </span>
                    </button>
                  );
                })}
              </div>
              {limit < chapters.length && (
                <button
                  className="button secondary load-more"
                  onClick={() => setLimit((l) => l + 60)}
                >
                  More chapters
                </button>
              )}
            </>
          )}
          {tab === "practice" && (
            <PrepHub initialFormat={prepFocus}>
              <div className="section-title">
                <h2>Vocabulary support</h2>
                <span className="muted small">
                  Build the word knowledge behind your answers
                </span>
              </div>
              <div className="practice-grid">
                <PracticeCard
                  icon={<Zap />}
                  color="lavender"
                  title="Meaning match"
                  label="VOCABULARY RECALL"
                  text="Match words to their meanings in a quick recall session."
                  count={`${progress.settings.sessionSize} words per session`}
                  onClick={() => start("learn", "quiz")}
                />
                <PracticeCard
                  icon={<Bookmark />}
                  color="pink"
                  title="Saved words"
                  label="YOUR COLLECTION"
                  text="Review the words you’ve bookmarked with focused flashcards."
                  count={`${progress.bookmarks.length} saved words`}
                  onClick={() => start("bookmarked", "flashcard")}
                />
                <PracticeCard
                  icon={<Target />}
                  color="blue"
                  title="Missed words"
                  label="FOCUSED REVIEW"
                  text="Practice meanings you’ve missed and strengthen your recall."
                  count={`${Object.values(progress.words).filter((w) => w.lapses > 0).length} words to strengthen`}
                  onClick={() => start("weak", "quiz")}
                />
              </div>
              <p className="content-note">
                Vocabulary practice uses your supplied word collection and
                tracks your recall separately from Verbal question practice.
              </p>
            </PrepHub>
          )}
          {tab === "library" && (
            <>
              <PageHeading
                eyebrow="ALL YOUR WORDS. ONE HAPPY PLACE."
                title="A world of words awaits."
                text="Search your collection, follow a source, or save a word for another day."
              />
              <div className="library-toolbar">
                <div className="search-field">
                  <Search size={19} />
                  <input
                    aria-label="Search words and meanings"
                    placeholder="Find a word or a meaning…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      className="icon-button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>
                <select
                  aria-label="Filter by source"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="all">All word sources</option>
                  {sources
                    .filter((s) =>
                      words.some((w) => w.sources.some((ws) => ws.id === s.id)),
                    )
                    .map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.title}
                      </option>
                    ))}
                </select>
              </div>
              <div className="filter-row">
                {[
                  { id: "all", name: "All words" },
                  { id: "new", name: "Not explored" },
                  { id: "learning", name: "Explored" },
                  { id: "saved", name: "Saved" },
                  { id: "unresolved", name: "Needs a definition" },
                  { id: "reference", name: "Reference index" },
                ].map((f) => (
                  <button
                    className={`filter-chip ${filter === f.id ? "active" : ""}`}
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.id === "saved" && <Bookmark size={14} />} {f.name}
                  </button>
                ))}
              </div>
              <div className="section-title">
                <span className="muted small">
                  {visible.length.toLocaleString()} words
                  {query ? ` matching “${query}”` : ""}
                </span>
                <button
                  className="text-button"
                  onClick={() => setModal("sources")}
                >
                  About your sources <CircleHelp size={15} />
                </button>
              </div>
              {filter === "reference" && (
                <div className="info-box">
                  <BookOpen size={19} />
                  <p>
                    These {referenceWords.length.toLocaleString()} additional
                    terms occur in source lists and legacy test choices. They
                    are searchable for reference, with page labels, and excluded
                    from practice until their meanings are checked.
                  </p>
                </div>
              )}
              <div className="word-list">
                {visible.slice(0, limit).map((w) => (
                  <div className="word-row" key={w.id}>
                    <button
                      className="word-row-main"
                      onClick={() => setDetail(w)}
                    >
                      <div>
                        <h3>{w.word}</h3>
                        <span className="small muted">
                          {w.pos || "vocabulary"} · {w.sources.length} source
                          {w.sources.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p>
                        {w.definition ||
                          "Headword imported · definition needs review"}
                      </p>
                      <span
                        className={`word-state ${progress.words[w.id] ? "explored" : ""}`}
                      >
                        {!w.definition
                          ? "Review needed"
                          : progress.words[w.id]
                            ? "Explored"
                            : "New"}
                      </span>
                      <ChevronRight size={17} />
                    </button>
                    <button
                      className={`icon-button ${progress.bookmarks.includes(w.id) ? "saved" : ""}`}
                      onClick={() => bookmark(w.id)}
                      aria-label={`${progress.bookmarks.includes(w.id) ? "Unsave" : "Save"} ${w.word}`}
                    >
                      <Bookmark size={19} />
                    </button>
                  </div>
                ))}
              </div>
              {!visible.length && (
                <div className="empty-state">
                  <Search size={32} />
                  <h3>No words found, yet.</h3>
                  <p>Try a different spelling or clear your filters.</p>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                      setSourceFilter("all");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
              {limit < visible.length && (
                <button
                  className="button secondary load-more"
                  onClick={() => setLimit((l) => l + 60)}
                >
                  Show more words <ChevronDown size={16} />
                </button>
              )}
            </>
          )}
          {tab === "progress" && (
            <>
              <PageHeading
                eyebrow="LOOK HOW FAR YOU’RE GOING"
                title="Your effort adds up."
                text="Every honest review gives you a clearer picture of what you know and what comes next."
              />
              <div className="stats-grid">
                {[
                  {
                    icon: <Flame />,
                    number: stats.streak,
                    label: "day streak",
                    color: "peach",
                  },
                  {
                    icon: <Sprout />,
                    number: stats.learned,
                    label: "words explored",
                    color: "mint",
                  },
                  {
                    icon: <Trophy />,
                    number: stats.mastered,
                    label: "words mastered",
                    color: "butter",
                  },
                  {
                    icon: <Zap />,
                    number: stats.xp,
                    label: "XP earned",
                    color: "lavender",
                  },
                ].map((item) => (
                  <div className="stat-card" key={item.label}>
                    <span className={`tile-icon ${item.color}`}>
                      {item.icon}
                    </span>
                    <strong>{item.number.toLocaleString()}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="progress-panels">
                <section className="panel">
                  <h2>A week of small steps</h2>
                  <p className="muted">Your vocabulary reviews, day by day.</p>
                  <div className="bar-chart">
                    {days.map((d) => {
                      const value = progress.activity[d.key]?.reviews || 0;
                      const max = Math.max(
                        progress.settings.dailyGoal,
                        ...days.map(
                          (day) => progress.activity[day.key]?.reviews || 0,
                        ),
                      );
                      return (
                        <div key={d.key}>
                          <span>{value}</span>
                          <div className="bar-track">
                            <div
                              style={{
                                height: `${Math.max(value ? 4 : 0, (value / max) * 100)}%`,
                              }}
                            />
                          </div>
                          <span>{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section className="panel">
                  <h2>Knowledge that lasts</h2>
                  <div className="metric-row">
                    <span>Vocabulary recall</span>
                    <strong>
                      {stats.totalReviews
                        ? `${stats.accuracy}%`
                        : "Not started"}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Total vocabulary reviews</span>
                    <strong>{stats.totalReviews}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Question-practice accuracy</span>
                    <strong>
                      {practiceLog.total
                        ? `${Math.round((practiceLog.correct / practiceLog.total) * 100)}%`
                        : "Not started"}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Practice questions completed</span>
                    <strong>{practiceLog.total}</strong>
                  </div>
                  <p className="small muted">
                    A word becomes mastered after successful reviews on separate
                    days and a longer review interval. XP celebrates effort; it
                    doesn’t estimate your GRE score.
                  </p>
                </section>
              </div>
              <section className="backup-banner">
                <span className="tile-icon mint">
                  <ArrowDownToLine />
                </span>
                <div>
                  <h3>Your progress deserves a safe place.</h3>
                  <p>
                    Learning data stays in this browser. Export a backup to keep
                    it safe or move to another device.
                  </p>
                </div>
                <button
                  className="button secondary"
                  onClick={() => exportAll(progress, practiceLog)}
                >
                  Export backup <ArrowDownToLine size={17} />
                </button>
              </section>
            </>
          )}
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => nav(id)}
          >
            <Icon size={22} />
            <span>{id === "library" ? "Library" : label}</span>
          </button>
        ))}
      </nav>
      {detail && (
        <Modal title="A word worth knowing" onClose={() => setDetail(null)}>
          <div className="detail-heading">
            <div>
              <span className="eyebrow">
                {detail.pos || "FROM YOUR COLLECTION"}
              </span>
              <h2>{detail.word}</h2>
            </div>
            <button
              className="icon-button"
              aria-label={`Pronounce ${detail.word}`}
              onClick={() => {
                if (!speak(detail.word))
                  setToast("Pronunciation isn’t supported here.");
              }}
            >
              <Volume2 />
            </button>
          </div>
          <p className="detail-definition">
            {detail.definition ||
              "This headword is indexed from your source material, but its meaning still needs verification. You can save it and add a note; it is excluded from quizzes."}
          </p>
          {detail.definitionNote && (
            <p className="info-box">{detail.definitionNote}</p>
          )}
          {detail.alternateDefinitions &&
            detail.alternateDefinitions.length > 0 && (
              <details className="alternate-definitions">
                <summary>
                  Explore other meanings ({detail.alternateDefinitions.length})
                </summary>
                {detail.alternateDefinitions.map((a, i) => (
                  <div key={i}>
                    <p>{a.definition}</p>
                    <span>
                      {sourceMap.get(a.source.id)?.title || a.source.id}
                      {a.source.page ? ` · p. ${a.source.page}` : ""}
                    </span>
                  </div>
                ))}
              </details>
            )}
          {detail.definitionSource && (
            <p className="definition-attribution">
              Meaning from{" "}
              {sourceMap.get(detail.definitionSource.id)?.title ||
                detail.definitionSource.title ||
                detail.definitionSource.id}
              {detail.definitionSource.page
                ? ` · p. ${detail.definitionSource.page}`
                : ""}
            </p>
          )}
          {detail.example && <blockquote>{detail.example}</blockquote>}
          {detail.mnemonic && (
            <div className="memory-note">
              <Sparkles size={18} />
              <p>{detail.mnemonic}</p>
            </div>
          )}
          <label className="field-label" htmlFor="personal-note">
            Make it memorable <span>Your own note or connection</span>
          </label>
          <textarea
            id="personal-note"
            placeholder="What will help you remember this word?"
            rows={3}
            value={progress.notes[detail.id] || ""}
            onChange={(e) =>
              update((p) => ({
                ...p,
                notes: {
                  ...p.notes,
                  [detail.id]: e.target.value.slice(0, 2000),
                },
              }))
            }
          />
          <div className="source-tags">
            {detail.sources.map((s) => (
              <span key={s.id}>
                {sourceMap.get(s.id)?.title || s.title}
                {s.page ? ` · p. ${s.page}` : ""}
              </span>
            ))}
          </div>
          <button
            className="button secondary wide"
            onClick={() => bookmark(detail.id)}
          >
            <Bookmark size={17} />
            {progress.bookmarks.includes(detail.id)
              ? "Saved to your collection"
              : "Save for later"}
          </button>
        </Modal>
      )}
      {modal === "install" && (
        <Modal
          title="A little learning, always with you."
          onClose={() => setModal(null)}
        >
          <div className="install-icon">
            <Sprout size={42} />
          </div>
          <p>
            Add Wordtrail to your iPhone Home Screen for an app-like space to
            study.
          </p>
          <ol className="install-steps">
            <li>
              <span>1</span>
              <p>
                Open your deployed Wordtrail link in <b>Safari</b>.
              </p>
            </li>
            <li>
              <span>2</span>
              <p>
                Tap <b>Share</b> <Share size={16} /> in the browser menu.
              </p>
            </li>
            <li>
              <span>3</span>
              <p>
                Choose <b>Add to Home Screen</b>, keep “Open as Web App” enabled
                if shown, and tap <b>Add</b>.
              </p>
            </li>
          </ol>
          <div className="info-box">
            <WifiOff size={20} />
            <p>
              <b>
                {offlineReady
                  ? "Ready for offline practice."
                  : "Offline setup: open the deployed app and keep it online until ready."}
              </b>{" "}
              Your word collection and practice can then work offline.
              Pronunciation depends on your device’s available voices.
            </p>
          </div>
          <p className="small muted">
            Progress is stored on this device. Export a backup before switching
            browsers or clearing website data.
          </p>
        </Modal>
      )}
      {modal === "sources" && (
        <Modal title="Your source library" wide onClose={() => setModal(null)}>
          <p>
            {words.length.toLocaleString()} unique headwords ·{" "}
            {learnable.length.toLocaleString()} with definitions ·{" "}
            {sources.length} supplied resources. A separate reference index
            preserves {referenceWords.length.toLocaleString()} additional terms.
          </p>
          <div className="info-box">
            <BookOpen size={20} />
            <p>
              Word lists are merged by headword with source labels. Practice
              books are inventoried separately. Scanned pages and unavailable
              files are flagged; indexed does not mean every exercise has been
              converted. Old Argument essays, analogies, and antonyms are legacy
              material.
            </p>
          </div>
          <div className="source-list">
            {sources.map((s) => (
              <div key={s.id}>
                <span className="tile-icon mint">
                  <BookOpen size={19} />
                </span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.note || s.kind || "Vocabulary source"}</p>
                  <span className="small muted">
                    {(s.wordCount ?? s.count)
                      ? `${(s.wordCount ?? s.count)?.toLocaleString()} headwords · `
                      : ""}
                    {s.pages ? `${s.pages} pages · ` : ""}
                    {s.status?.replaceAll("-", " ") || "Imported"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {modal === "settings" && (
        <Modal title="Make your trail your own." onClose={() => setModal(null)}>
          <p className="muted">Build a rhythm that fits your day.</p>
          <div className="setting-row">
            <label htmlFor="daily-goal">Daily review goal</label>
            <select
              id="daily-goal"
              value={progress.settings.dailyGoal}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  settings: { ...p.settings, dailyGoal: +e.target.value },
                }))
              }
            >
              {[5, 10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} reviews
                </option>
              ))}
            </select>
          </div>
          <div className="setting-row">
            <label htmlFor="session-size">Words per session</label>
            <select
              id="session-size"
              value={progress.settings.sessionSize}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  settings: { ...p.settings, sessionSize: +e.target.value },
                }))
              }
            >
              {[5, 10, 12, 15, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n} words
                </option>
              ))}
            </select>
          </div>
          <div className="setting-row">
            <label htmlFor="exam-date">
              Test date <span className="small muted">optional</span>
            </label>
            <input
              id="exam-date"
              type="date"
              value={progress.settings.examDate}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  settings: { ...p.settings, examDate: e.target.value },
                }))
              }
            />
          </div>
          {progress.settings.examDate && (
            <p className="info-box">
              {Math.ceil(
                (new Date(progress.settings.examDate + "T12:00:00").getTime() -
                  Date.now()) /
                  86400000,
              ) > 0
                ? `${Math.ceil((new Date(progress.settings.examDate + "T12:00:00").getTime() - Date.now()) / 86400000)} days to build your confidence.`
                : "Your daily practice is always worth keeping."}
            </p>
          )}
          <h3 className="settings-subtitle">Optional writing practice</h3>
          <p className="small muted">
            Analytical Writing is a separate GRE task. The writing studio has{" "}
            {essayPrompts.length} original Issue prompts, a 30-minute timer, and
            a self-check. Your saved draft and timer are kept here.
          </p>
          <button
            className="button secondary"
            onClick={() => {
              setModal(null);
              setEssay(true);
            }}
          >
            <Feather size={17} /> Open writing studio
          </button>
          <h3 className="settings-subtitle">Keep your progress safe</h3>
          <p className="small muted">
            No account required. No automatic device sync. Back up your
            vocabulary reviews, notes, bookmarks, Verbal attempts, mistake
            notes, official benchmarks, practice totals, and essay draft.
            Unfinished timed sessions remain on their original device.
          </p>
          <div className="backup-actions">
            <button
              className="button secondary"
              onClick={() => exportAll(progress, practiceLog)}
            >
              <ArrowDownToLine size={17} /> Export
            </button>
            <button
              className="button secondary"
              onClick={() => fileRef.current?.click()}
            >
              <ArrowUpFromLine size={17} /> Import
            </button>
          </div>
          <input
            type="file"
            ref={fileRef}
            className="visually-hidden"
            accept="application/json,.json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                if (file.size > 15_000_000)
                  throw new Error("Backup is too large.");
                const raw = await file.text();
                const parsed = JSON.parse(raw);
                const next = parseBackup(
                  parsed.vocabulary ? JSON.stringify(parsed.vocabulary) : raw,
                );
                const importedPractice =
                  parsed.practice === undefined
                    ? undefined
                    : cleanPracticeLog(parsed.practice);
                if (parsed.practice !== undefined && !importedPractice)
                  throw new Error(
                    "The practice totals in this backup are invalid.",
                  );
                const essay =
                  parsed.essay === undefined
                    ? undefined
                    : importedEssay(parsed.essay);
                const prep =
                  parsed.prep === undefined
                    ? undefined
                    : parsePrepBackup(JSON.stringify(parsed.prep));
                setBackupCandidate({
                  prep,
                  progress: next,
                  practice: importedPractice || undefined,
                  essay,
                });
              } catch (error) {
                setToast(
                  error instanceof Error
                    ? error.message
                    : "This backup could not be read.",
                );
              }
            }}
          />
          {backupCandidate && (
            <div className="feedback">
              <strong>Replace the progress on this device?</strong>
              <p>
                The imported backup has{" "}
                {Object.keys(backupCandidate.progress.words).length} reviewed
                words. Export your current progress first if you need to keep
                it.
              </p>
              <div className="backup-actions">
                <button
                  className="button secondary"
                  onClick={() => setBackupCandidate(null)}
                >
                  Cancel
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    const extras = backupCandidate;
                    setProgress(backupCandidate.progress);
                    let storageOkay = true;
                    if (extras.prep) {
                      storageOkay = savePrepProgress(extras.prep);
                      clearRun();
                      window.dispatchEvent(new Event("wordtrail:prep-import"));
                    }
                    if (extras.practice) {
                      setPracticeLog(extras.practice);
                      try {
                        localStorage.setItem(
                          "wordtrail.practice",
                          JSON.stringify(extras.practice),
                        );
                      } catch {
                        storageOkay = false;
                      }
                    }
                    if (typeof extras.essay === "string") {
                      try {
                        localStorage.setItem("wordtrail.essay", extras.essay);
                      } catch {
                        storageOkay = false;
                      }
                    }
                    if (!storageOkay) {
                      setToast(
                        "Imported, but this browser could not save all data. Keep your backup file.",
                      );
                      setBackupCandidate(null);
                      return;
                    }
                    setBackupCandidate(null);
                    setToast("Backup imported. Welcome back to your trail.");
                  }}
                >
                  Replace & import
                </button>
              </div>
            </div>
          )}
          <div className="settings-links">
            <button onClick={() => setModal("install")}>
              Add to Home Screen <ArrowRight size={16} />
            </button>
            <button onClick={() => setModal("sources")}>
              Source library & coverage <ArrowRight size={16} />
            </button>
          </div>
          <p className="tiny muted">
            Wordtrail is an independent personal study app. GRE is a registered
            trademark of ETS. No affiliation with ETS or the source publishers.
          </p>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
function exportAll(
  progress: Progress,
  practice: { correct: number; total: number },
) {
  download(
    `wordtrail-backup-${localDay()}.json`,
    JSON.stringify(
      {
        app: "wordtrail",
        version: 1,
        exportedAt: new Date().toISOString(),
        vocabulary: JSON.parse(serializeBackup(progress)),
        prep: JSON.parse(serializePrepBackup(loadPrepProgress())),
        practice,
        essay: safeRead("wordtrail.essay", ""),
      },
      null,
      2,
    ),
  );
}
function PageHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}
function PracticeCard({
  icon,
  color,
  title,
  label,
  text,
  count,
  onClick,
}: {
  icon: ReactNode;
  color: string;
  title: string;
  label: string;
  text: string;
  count: string;
  onClick: () => void;
}) {
  return (
    <button className="practice-card" onClick={onClick}>
      <div className="practice-card-top">
        <span className={`tile-icon ${color}`}>{icon}</span>
        <ArrowRight size={20} />
      </div>
      <span className="eyebrow">{label}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <span className="small muted">{count}</span>
    </button>
  );
}
function readEssay(raw = safeRead("wordtrail.essay", "{}")) {
  const fallback = {
    promptIndex: 0,
    draft: "",
    remaining: 1800,
    deadline: 0,
    running: false,
  };
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object") return fallback;
    const draft =
      typeof value.draft === "string" ? value.draft.slice(0, 100000) : "";
    const promptIndex =
      Number.isInteger(value.promptIndex) &&
      value.promptIndex >= 0 &&
      value.promptIndex < essayPrompts.length
        ? value.promptIndex
        : 0;
    const savedRemaining =
      Number.isFinite(value.remaining) &&
      value.remaining >= 0 &&
      value.remaining <= 1800
        ? Math.floor(value.remaining)
        : 1800;
    const deadline =
      Number.isFinite(value.deadline) &&
      value.deadline > 0 &&
      value.deadline <= Date.now() + 1801_000
        ? value.deadline
        : 0;
    const remaining =
      value.running === true && deadline
        ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
        : savedRemaining;
    return {
      promptIndex,
      draft,
      remaining,
      deadline,
      running: value.running === true && !!deadline && remaining > 0,
    };
  } catch {
    return fallback;
  }
}
function EssayStudio({
  onClose,
  notify,
}: {
  onClose: () => void;
  notify: (s: string) => void;
}) {
  const [initial] = useState(() => readEssay());
  const [promptIndex, setPromptIndex] = useState(initial.promptIndex);
  const [draft, setDraft] = useState(initial.draft);
  const [remaining, setRemaining] = useState(initial.remaining);
  const [running, setRunning] = useState(initial.running);
  const [check, setCheck] = useState(initial.remaining === 0);
  const [saved, setSaved] = useState(true);
  const [newDraft, setNewDraft] = useState(false);
  const deadline = useRef(initial.deadline);
  const prompt = essayPrompts[promptIndex] || essayPrompts[0];
  useEffect(() => {
    try {
      localStorage.setItem(
        "wordtrail.essay",
        JSON.stringify({
          promptIndex,
          draft,
          remaining,
          running,
          deadline: deadline.current,
        }),
      );
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [draft, promptIndex, remaining, running]);
  useEffect(() => {
    if (!running) return;
    if (!deadline.current) deadline.current = Date.now() + remaining * 1000;
    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setRemaining(left);
      if (!left) {
        setRunning(false);
        setCheck(true);
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [running]);
  const toggleTimer = () => {
    if (running) {
      setRemaining(
        Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)),
      );
      setRunning(false);
      deadline.current = 0;
    } else {
      deadline.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  };
  const downloadDraft = () =>
    download(
      "wordtrail-issue-draft.txt",
      prompt.prompt + "\n\n" + draft,
      "text/plain",
    );
  return (
    <div className="session essay-studio">
      <div className="session-top">
        <button
          className="icon-button"
          aria-label="Close writing studio"
          onClick={onClose}
        >
          <X />
        </button>
        <span>Make your case · Issue studio</span>
        <span className={`timer ${remaining < 300 ? "urgent" : ""}`}>
          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
        </span>
      </div>
      <div className="essay-body">
        <div className="essay-prompt">
          <span className="eyebrow">ORIGINAL ISSUE-STYLE PROMPT</span>
          <select
            aria-label="Choose essay prompt"
            value={promptIndex}
            disabled={running || draft.length > 0}
            onChange={(e) => setPromptIndex(+e.target.value)}
          >
            {essayPrompts.map((_, i) => (
              <option value={i} key={i}>
                Prompt {i + 1}
              </option>
            ))}
          </select>
          <h1>{prompt.prompt}</h1>
          <p>
            Discuss the extent to which you agree or disagree. Develop your
            position with reasons and examples, and consider circumstances that
            might challenge it.
          </p>
          <div className="info-box">
            <Feather size={18} />
            <p>{prompt.tip}</p>
          </div>
          <button
            className="button secondary"
            onClick={toggleTimer}
            disabled={remaining === 0}
          >
            {running
              ? "Pause timer"
              : remaining < 1800
                ? "Resume timer"
                : "Start 30-minute practice"}
          </button>
          <p className="small muted">
            The timer keeps running when you leave this screen. The real test
            runs continuously; pausing is available here for practice.
          </p>
          <button className="text-button" onClick={() => setNewDraft(true)}>
            Start a new draft <ArrowRight size={15} />
          </button>
        </div>
        <div className="essay-editor">
          <label className="eyebrow" htmlFor="essay-draft">
            YOUR ARGUMENT, YOUR VOICE
          </label>
          <textarea
            id="essay-draft"
            placeholder="Start with your position. Build it with reasons. Test it with a counterexample…"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 100000))}
          />
          <div className="editor-footer">
            <span>
              {draft.trim() ? draft.trim().split(/\s+/).length : 0} words ·{" "}
              {saved
                ? "Draft saved on this device"
                : "Draft could not be saved — download a copy"}
            </span>
            <button className="text-button" onClick={downloadDraft}>
              Download <ArrowDownToLine size={15} />
            </button>
          </div>
          <button
            className="button primary"
            onClick={() => {
              if (running) toggleTimer();
              setCheck(!check);
            }}
          >
            Review my argument <Check size={18} />
          </button>
          {check && (
            <div className="essay-check">
              <h3>A thoughtful self-check</h3>
              {[
                "Have I stated a clear, qualified position?",
                "Does each main point have a specific example?",
                "Have I considered the strongest counterargument?",
                "Do my examples support my reasoning?",
                "Are my sentences clear and logically connected?",
              ].map((item) => (
                <label key={item}>
                  <input type="checkbox" />
                  {item}
                </label>
              ))}
              <p className="small muted">
                This checklist helps you revise; it does not provide an official
                or automated GRE score.
              </p>
            </div>
          )}
        </div>
      </div>
      {newDraft && (
        <Modal
          title="Make room for a new argument."
          onClose={() => setNewDraft(false)}
        >
          <p>
            Download your current draft if you want to keep it. Starting again
            clears this editor and resets the timer.
          </p>
          <div className="backup-actions">
            <button className="button secondary" onClick={downloadDraft}>
              Download draft
            </button>
            <button
              className="button primary"
              onClick={() => {
                setRunning(false);
                deadline.current = 0;
                setRemaining(1800);
                setDraft("");
                setCheck(false);
                setNewDraft(false);
              }}
            >
              Start fresh
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default App;
