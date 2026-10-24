import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { quizChoices, type Word } from "../lib/study";
export type Rating = "again" | "hard" | "good" | "easy";

const SESSION_KEY = "wordtrail.activeSession";
const XP: Record<Rating, number> = { again: 2, hard: 6, good: 10, easy: 12 };
type Kind = "flashcard" | "quiz";
type SessionState = {
  queue: Word[];
  index: number;
  correct: number;
  earnedXp: number;
  missed: Word[];
  selected: string | null;
  revealed: boolean;
  round: number;
};

function initialSession(words: Word[], kind: Kind): SessionState {
  const fresh: SessionState = {
    queue: words,
    index: 0,
    correct: 0,
    earnedXp: 0,
    missed: [],
    selected: null,
    revealed: false,
    round: 0,
  };
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw || raw.length > 100000) return fresh;
    const saved = JSON.parse(raw);
    if (
      !saved ||
      saved.kind !== kind ||
      !Array.isArray(saved.ids) ||
      saved.ids.length !== words.length ||
      saved.ids.some((id: unknown, i: number) => id !== words[i].id)
    )
      return fresh;
    if (
      !Number.isInteger(saved.index) ||
      saved.index < 0 ||
      saved.index >= words.length ||
      !Number.isInteger(saved.correct) ||
      saved.correct < 0 ||
      saved.correct > saved.index ||
      !Number.isInteger(saved.earnedXp) ||
      saved.earnedXp < 0 ||
      saved.earnedXp > saved.index * 12
    )
      return fresh;
    if (
      !Array.isArray(saved.missedIds) ||
      saved.correct + saved.missedIds.length !== saved.index ||
      saved.missedIds.some(
        (id: unknown) =>
          typeof id !== "string" ||
          !words.slice(0, saved.index).some((word) => word.id === id),
      )
    )
      return fresh;
    if (saved.selected !== null && typeof saved.selected !== "string")
      return fresh;
    if (typeof saved.revealed !== "boolean") return fresh;
    return {
      ...fresh,
      index: saved.index,
      correct: saved.correct,
      earnedXp: saved.earnedXp,
      missed: saved.missedIds.map((id: string) =>
        words.find((word) => word.id === id)!,
      ),
      selected: saved.selected,
      revealed: saved.revealed,
    };
  } catch {
    return fresh;
  }
}

export function speak(word: string) {
  try {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    )
      return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export default function StudySession({
  words,
  allWords,
  kind,
  onRate,
  onClose,
}: {
  words: Word[];
  allWords: Word[];
  kind: Kind;
  onRate: (id: string, rating: Rating) => void;
  onClose: () => void;
}) {
  const [state, setState] = useState(() => initialSession(words, kind));
  const [audioError, setAudioError] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(true);
  const container = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const committed = useRef(new Set<string>());
  const closing = useRef(false);
  const { queue, index, revealed, correct, missed, earnedXp, round } = state;
  const word = queue[index];
  const complete = index >= queue.length;
  const options = useMemo(
    () => (word ? quizChoices(word, allWords, index + 73) : []),
    [word, allWords, index],
  );
  const canQuiz =
    kind === "quiz" &&
    options.length >= 2 &&
    options.filter((option) => option.correct).length === 1;
  // A stale or edited backup cannot select an answer outside this question.
  const selected =
    canQuiz && options.some((option) => option.id === state.selected)
      ? state.selected
      : null;
  const selectedOption = options.find((option) => option.id === selected);
  const isFlashcard = !canQuiz;
  const cardToken = `${round}:${index}:${word?.id ?? "complete"}`;
  const activeCard = useRef(cardToken);
  activeCard.current = cardToken;
  const sourcedWord = word as
    (Word & { definitionSource?: { id: string; page?: number } }) | undefined;
  const matchedSource = sourcedWord?.definitionSource
    ? word.sources.find(
        (source) => source.id === sourcedWord.definitionSource!.id,
      )
    : word?.sources[0];
  const sourcePage = sourcedWord?.definitionSource?.page ?? matchedSource?.page;

  useEffect(() => {
    if (closing.current) return;
    try {
      if (complete) localStorage.removeItem(SESSION_KEY);
      else
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            ids: queue.map((item) => item.id),
            kind,
            index,
            correct,
            earnedXp,
            missedIds: missed.map((item) => item.id),
            selected,
            revealed,
          }),
        );
      setSessionSaved(true);
    } catch {
      setSessionSaved(false);
    }
  }, [
    queue,
    kind,
    index,
    correct,
    earnedXp,
    missed,
    selected,
    revealed,
    complete,
  ]);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
    setAudioError(false);
  }, [cardToken]);
  useEffect(() => {
    if (selected !== null) feedback.current?.focus({ preventScroll: true });
  }, [selected]);
  useEffect(
    () => () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  const close = () => {
    closing.current = true;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* Progress storage is separate. */
    }
    onClose();
  };
  const rate = (rating: Rating) => {
    if (
      !word ||
      !word.definition.trim() ||
      committed.current.has(cardToken) ||
      activeCard.current !== cardToken
    )
      return;
    if (isFlashcard && !revealed) return;
    if (!isFlashcard && selected === null) return;
    committed.current.add(cardToken);
    onRate(word.id, rating);
    setState((previous) => ({
      ...previous,
      correct: previous.correct + (rating === "again" ? 0 : 1),
      missed: rating === "again" ? [...previous.missed, word] : previous.missed,
      earnedXp: previous.earnedXp + XP[rating],
      index: previous.index + 1,
      selected: null,
      revealed: false,
    }));
  };
  const choose = (id: string) => {
    if (
      !canQuiz ||
      selected !== null ||
      !options.some((option) => option.id === id)
    )
      return;
    setState((previous) =>
      previous.selected === null ||
      !options.some((option) => option.id === previous.selected)
        ? { ...previous, selected: id }
        : previous,
    );
  };
  const reveal = () =>
    setState((previous) => ({ ...previous, revealed: true }));
  const continueQuiz = () => {
    if (selectedOption) rate(selectedOption.correct ? "good" : "again");
  };

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "Tab") {
        const nodes = container.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          last.focus();
          event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === last) {
          first.focus();
          event.preventDefault();
        }
        return;
      }
      if (
        complete ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      const target = event.target as HTMLElement;
      if (target?.matches("input,textarea,select") || target?.isContentEditable)
        return;
      const choiceIndex = /^[1-4]$/.test(event.key)
        ? Number(event.key) - 1
        : /^[a-d]$/i.test(event.key)
          ? event.key.toLowerCase().charCodeAt(0) - 97
          : -1;
      if (
        canQuiz &&
        selected === null &&
        choiceIndex >= 0 &&
        options[choiceIndex]
      ) {
        event.preventDefault();
        choose(options[choiceIndex].id);
      } else if (isFlashcard && revealed && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        rate(
          (["again", "hard", "good", "easy"] as Rating[])[
            Number(event.key) - 1
          ],
        );
      } else if (
        !target?.closest("button,a") &&
        (event.key === "Enter" || event.key === " ")
      ) {
        if (isFlashcard && !revealed) {
          event.preventDefault();
          reveal();
        } else if (canQuiz && selected !== null) {
          event.preventDefault();
          continueQuiz();
        }
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  });

  return (
    <div
      className="session"
      ref={container}
      role="dialog"
      aria-modal="true"
      aria-label="Vocabulary practice"
    >
      <div className="session-top">
        <button
          className="icon-button"
          onClick={close}
          aria-label="End session"
        >
          <X size={23} />
        </button>
        <span>{kind === "quiz" ? "Meaning match" : "Word discovery"}</span>
        <span className="session-count">
          {Math.min(index + 1, queue.length)} / {queue.length}
        </span>
      </div>
      <div
        className="session-progress"
        role="progressbar"
        aria-label="Session progress"
        aria-valuemin={0}
        aria-valuemax={queue.length || 1}
        aria-valuenow={index}
      >
        <span
          style={{
            width: `${queue.length ? (index / queue.length) * 100 : 100}%`,
          }}
        />
      </div>
      {!sessionSaved && (
        <p className="small" role="status">
          Your browser could not save this session. Before closing the app, end
          this session and export a backup from Settings.
        </p>
      )}
      {complete ? (
        <div className="session-body finish">
          <div className="finish-icon">
            <Sparkles size={38} />
          </div>
          <span className="eyebrow">ONE STEP FURTHER</span>
          <h1 ref={heading} tabIndex={-1}>
            Look at you grow.
          </h1>
          <p>
            You practiced {queue.length} words. Every honest answer helps shape
            your next review.
          </p>
          <div className="finish-stats">
            <div>
              <strong>{correct}</strong>
              <span>
                {kind === "flashcard" ? "self-rated recall" : "correct matches"}
              </span>
            </div>
            <div>
              <strong>{missed.length}</strong>
              <span>to revisit</span>
            </div>
            <div>
              <strong>{earnedXp}</strong>
              <span>XP earned</span>
            </div>
          </div>
          {missed.length > 0 && (
            <button
              className="button secondary"
              onClick={() =>
                setState((previous) => ({
                  queue: [
                    ...new Map(
                      previous.missed.map((item) => [item.id, item]),
                    ).values(),
                  ],
                  index: 0,
                  correct: 0,
                  earnedXp: 0,
                  missed: [],
                  selected: null,
                  revealed: false,
                  round: previous.round + 1,
                }))
              }
            >
              <RotateCcw size={18} /> Revisit tricky words
            </button>
          )}
          <button className="button primary" onClick={close}>
            Back to my trail <ArrowRight size={18} />
          </button>
          <p className="small muted">
            Mastery grows across review days, not just one session.
          </p>
        </div>
      ) : (
        <div className="session-body">
          <div className="session-label">
            <span className="pill mint">
              {canQuiz
                ? "RETRIEVE · THEN REINFORCE"
                : "THINK · FLIP · REMEMBER"}
            </span>
            <span className="small muted">
              {word.sources.length} source{word.sources.length !== 1 ? "s" : ""}
            </span>
          </div>
          {kind === "quiz" && !canQuiz && (
            <p className="small muted">
              This word needs more distinct answer choices. Try a recall card
              instead.
            </p>
          )}
          <div className={`word-card ${revealed ? "revealed" : ""}`}>
            <div className="word-pronounce">
              <span className="eyebrow">{word.pos || "YOUR NEXT WORD"}</span>
              <button
                className="icon-button"
                aria-label={`Pronounce ${word.word}`}
                onClick={() => setAudioError(!speak(word.word))}
              >
                <Volume2 size={22} />
              </button>
            </div>
            <h1 ref={heading} tabIndex={-1}>
              {word.word}
            </h1>
            {audioError && (
              <p className="small" role="status">
                Pronunciation isn’t available in this browser.
              </p>
            )}
            {isFlashcard ? (
              !revealed ? (
                <>
                  <p className="muted">Can you explain it in your own words?</p>
                  <button
                    className="button primary reveal-button"
                    onClick={reveal}
                  >
                    Reveal meaning <Sparkles size={17} />
                  </button>
                </>
              ) : (
                <div className="word-reveal">
                  <p className="definition">{word.definition}</p>
                  {word.example && <blockquote>{word.example}</blockquote>}
                  {word.mnemonic && (
                    <div className="memory-note">
                      <Sparkles size={17} />
                      <p>{word.mnemonic}</p>
                    </div>
                  )}
                  {(matchedSource || word.definitionSource) && (
                    <span className="source-line">
                      From{" "}
                      {word.definitionSource?.title || matchedSource?.title}
                      {sourcePage ? ` · p. ${sourcePage}` : ""}
                    </span>
                  )}
                </div>
              )
            ) : (
              <p className="muted">Choose the closest meaning.</p>
            )}
          </div>
          {canQuiz && (
            <div className="answer-options" aria-label="Answer choices">
              {options.map((option, i) => (
                <button
                  disabled={selected !== null}
                  className={`answer-option ${selected !== null && option.correct ? "correct" : ""} ${selected === option.id && !option.correct ? "incorrect" : ""}`}
                  key={option.id}
                  onClick={() => choose(option.id)}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{option.text}</span>
                  {selected !== null && option.correct && (
                    <Check size={20} aria-label="Correct answer" />
                  )}
                </button>
              ))}
            </div>
          )}
          {canQuiz && selected !== null && (
            <div
              className={`feedback ${selectedOption?.correct ? "success" : ""}`}
              ref={feedback}
              tabIndex={-1}
              role="status"
            >
              <strong>
                {selectedOption?.correct
                  ? "That’s the one."
                  : "A useful one to revisit."}
              </strong>
              <p>
                <b>{word.word}</b>: {word.definition}
              </p>
              {word.example && <p className="example">{word.example}</p>}
              <button className="button primary" onClick={continueQuiz}>
                Continue <ArrowRight size={18} />
              </button>
            </div>
          )}
          {isFlashcard && revealed && (
            <div className="rating-area">
              <p className="small muted">How well did you remember?</p>
              <div className="ratings">
                <button onClick={() => rate("again")}>
                  <RotateCcw size={19} />
                  <b>Again</b>
                  <span>Still learning</span>
                </button>
                <button onClick={() => rate("hard")}>
                  <b>Hard</b>
                  <span>With effort</span>
                </button>
                <button onClick={() => rate("good")}>
                  <Check size={19} />
                  <b>Good</b>
                  <span>Got it</span>
                </button>
                <button onClick={() => rate("easy")}>
                  <CheckCircle2 size={19} />
                  <b>Easy</b>
                  <span>Knew it well</span>
                </button>
              </div>
            </div>
          )}
          <p className="session-tip">
            <span>✧</span> A little effort now. A stronger memory tomorrow.
          </p>
        </div>
      )}
    </div>
  );
}
