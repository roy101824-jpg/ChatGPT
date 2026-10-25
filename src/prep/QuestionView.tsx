import { Fragment, useId, useRef } from "react";
import { hasCompleteAnswer, scoreAnswer } from "./engine";
import type { PrepAnswer, PrepQuestion } from "./types";
import "./prep-question.css";

interface Props {
  question: PrepQuestion;
  answer: PrepAnswer;
  onAnswer: (answer: PrepAnswer) => void;
  disabled?: boolean;
  showSolution?: boolean;
}

export function getResponseSummary(question: PrepQuestion, answer: PrepAnswer) {
  const selections = answer.selections || [];
  const filled =
    answer.blanks?.filter((value) => value !== null && value !== undefined)
      .length || 0;
  const hasResponse =
    selections.length > 0 || filled > 0 || answer.sentence !== undefined;
  const complete = hasCompleteAnswer(question, answer);
  const label = complete
    ? "Answered"
    : hasResponse
      ? "Incomplete"
      : "Not answered";
  let detail = "Select one answer choice.";
  if (question.blanks)
    detail = `${filled} of ${question.blanks.length} ${question.blanks.length === 1 ? "blank" : "blanks"} selected`;
  else if (question.format === "se")
    detail = `${selections.length} of 2 choices selected`;
  else if (question.format === "rc-multi")
    detail = `${selections.length} ${selections.length === 1 ? "choice" : "choices"} selected`;
  else if (question.format === "rc-sentence")
    detail =
      answer.sentence === undefined
        ? "Choose one sentence in the passage."
        : `Sentence ${answer.sentence + 1} selected`;
  else if (selections.length)
    detail = `Choice ${String.fromCharCode(65 + selections[0])} selected`;
  return { hasResponse, complete, label, detail };
}

function correctResponse(question: PrepQuestion): string {
  if (question.blanks)
    return question.blanks
      .map(
        (blank, index) => `Blank ${index + 1}: ${blank.choices[blank.answer]}`,
      )
      .join(" · ");
  if (question.format === "rc-sentence")
    return `Sentence ${(question.sentenceAnswer ?? 0) + 1}: ${question.passage?.sentences[question.sentenceAnswer ?? 0] || ""}`;
  const choices = question.choices || [];
  return (question.answers || []).map((index) => choices[index]).join("; ");
}

export default function QuestionView({
  question,
  answer,
  onAnswer,
  disabled = false,
  showSolution = false,
}: Props) {
  const uid = useId();
  const stem = useRef<HTMLHeadingElement>(null);
  const passageHeading = useRef<HTMLHeadingElement>(null);
  const readOnly = disabled || showSolution;
  const selected = answer.selections || [];
  const multi = ["se", "rc-multi"].includes(question.format);
  const isSE = question.format === "se";
  const choiceList = question.choices;
  const correct = showSolution ? scoreAnswer(question, answer) : false;
  const response = getResponseSummary(question, answer);
  const jumpTo = (element: HTMLElement | null) => {
    element?.focus({ preventScroll: true });
    element?.scrollIntoView({ block: "start", behavior: "auto" });
  };
  const choose = (index: number) => {
    if (readOnly) return;
    if (!multi) {
      onAnswer({ ...answer, selections: [index] });
      return;
    }
    const next = selected.includes(index)
      ? selected.filter((value) => value !== index)
      : [...selected, index];
    if (!isSE || next.length <= 2) onAnswer({ ...answer, selections: next });
  };
  return (
    <article className="prep-question" aria-labelledby={`${uid}-stem`}>
      {question.passage && (
        <section className="prep-passage" aria-label="Reading passage">
          <div className="prep-passage-heading">
            <h3 ref={passageHeading} tabIndex={-1}>
              {question.passage.title || "Read the passage"}
            </h3>
            <button
              type="button"
              className="prep-reading-jump"
              onClick={() => jumpTo(stem.current)}
            >
              Go to question <span aria-hidden="true">↓</span>
            </button>
          </div>
          {question.format === "rc-sentence" ? (
            <div className="prep-sentences">
              <p className="prep-instruction">
                Select the sentence that meets the question’s description. Tap
                anywhere on that sentence to choose it.
              </p>
              <p className="prep-selectable-passage">
                {question.passage.sentences.map((sentence, index) => {
                  const chosen = answer.sentence === index;
                  const expected =
                    showSolution && question.sentenceAnswer === index;
                  const select = () => {
                    if (!readOnly) onAnswer({ ...answer, sentence: index });
                  };
                  return (
                    <Fragment key={index}>
                      <span
                        role="button"
                        tabIndex={readOnly ? -1 : 0}
                        aria-disabled={readOnly}
                        aria-pressed={chosen}
                        aria-label={`Sentence ${index + 1}: ${sentence}${expected ? " Correct sentence." : ""}`}
                        className={`prep-sentence ${chosen ? "prep-selected" : ""} ${expected ? "prep-correct" : ""} ${showSolution && chosen && !expected ? "prep-incorrect" : ""}`}
                        onClick={select}
                        onKeyDown={(event) => {
                          if (
                            !readOnly &&
                            !event.repeat &&
                            (event.key === "Enter" || event.key === " ")
                          ) {
                            event.preventDefault();
                            select();
                          }
                        }}
                      >
                        <span
                          className="prep-sentence-number"
                          aria-hidden="true"
                        >
                          {index + 1}
                        </span>
                        <span>{sentence}</span>
                      </span>{" "}
                    </Fragment>
                  );
                })}
              </p>
            </div>
          ) : (
            <p>{question.passage.sentences.join(" ")}</p>
          )}
        </section>
      )}
      <h2
        id={`${uid}-stem`}
        className="prep-question-stem prep-stem"
        ref={stem}
        tabIndex={-1}
      >
        {question.stem}
      </h2>
      {question.passage && (
        <button
          type="button"
          className="prep-reading-jump prep-back-to-passage"
          onClick={() => jumpTo(passageHeading.current)}
        >
          <span aria-hidden="true">↑</span> Back to passage
        </button>
      )}
      {question.blanks && (
        <div className="prep-blanks">
          <p className="prep-instruction">
            Choose one entry for each blank to make the passage coherent. Every
            blank must be correct to earn credit.
          </p>
          <div className="prep-blank-columns">
            {question.blanks.map((blank, blankIndex) => (
              <fieldset key={blankIndex} className="prep-choice-group">
                <legend>Blank {blankIndex + 1}</legend>
                {blank.choices.map((choice, choiceIndex) => {
                  const chosen = answer.blanks?.[blankIndex] === choiceIndex;
                  const expected = showSolution && blank.answer === choiceIndex;
                  return (
                    <label
                      key={choiceIndex}
                      className={`prep-choice ${chosen ? "prep-selected" : ""} ${expected ? "prep-correct" : ""} ${showSolution && chosen && !expected ? "prep-incorrect" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`${uid}-blank-${blankIndex}`}
                        checked={chosen}
                        disabled={readOnly}
                        onChange={() => {
                          const blanks = question.blanks!.map(
                            (_, index) => answer.blanks?.[index] ?? null,
                          );
                          blanks[blankIndex] = choiceIndex;
                          onAnswer({ ...answer, blanks });
                        }}
                      />
                      <span className="prep-choice-letter" aria-hidden="true">
                        {String.fromCharCode(65 + choiceIndex)}
                      </span>
                      <span className="prep-choice-text">{choice}</span>
                      {showSolution && (expected || chosen) && (
                        <span className="prep-choice-state">
                          {expected ? "Correct" : "Your choice"}
                        </span>
                      )}
                    </label>
                  );
                })}
              </fieldset>
            ))}
          </div>
        </div>
      )}
      {choiceList && !question.blanks && question.format !== "rc-sentence" && (
        <fieldset className="prep-choice-group">
          <legend className="prep-instruction">
            {isSE
              ? "Choose exactly two words. Each must fit the sentence, and both completed sentences must have the same meaning."
              : multi
                ? "Select every correct answer. One, two, or all three choices may be correct. All correct choices are required for credit."
                : "Select one answer choice."}
          </legend>
          {isSE && (
            <p className="prep-selection-count">
              {selected.length} of 2 selected
              {selected.length === 2 && !readOnly
                ? " · uncheck a choice to change your pair"
                : ""}
            </p>
          )}
          {choiceList.map((choice, index) => {
            const chosen = selected.includes(index);
            const expected =
              showSolution && !!question.answers?.includes(index);
            return (
              <label
                key={index}
                className={`prep-choice ${chosen ? "prep-selected" : ""} ${expected ? "prep-correct" : ""} ${showSolution && chosen && !expected ? "prep-incorrect" : ""}`}
              >
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={`${uid}-choices`}
                  checked={chosen}
                  disabled={
                    readOnly || (isSE && selected.length === 2 && !chosen)
                  }
                  onChange={() => choose(index)}
                />
                <span className="prep-choice-letter" aria-hidden="true">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="prep-choice-text">{choice}</span>
                {showSolution && (expected || chosen) && (
                  <span className="prep-choice-state">
                    {expected ? "Correct answer" : "Your choice"}
                  </span>
                )}
              </label>
            );
          })}
        </fieldset>
      )}
      <div className="prep-response-tools">
        <div
          className="prep-response-summary"
          aria-live="polite"
          aria-atomic="true"
        >
          <strong>
            {showSolution
              ? response.hasResponse
                ? "Response submitted"
                : "No response submitted"
              : response.label}
          </strong>
          <span>
            {showSolution && !response.hasResponse
              ? "This item was left unanswered."
              : response.detail}
          </span>
        </div>
        {!readOnly && (
          <button
            type="button"
            className="prep-clear-answer"
            disabled={!response.hasResponse}
            onClick={() => {
              onAnswer({});
              stem.current?.focus({ preventScroll: true });
            }}
          >
            Clear answer
          </button>
        )}
      </div>
      {showSolution && (
        <section
          className={`prep-solution ${correct ? "prep-solution-correct" : ""}`}
          role="status"
          aria-label="Answer and explanation"
        >
          <h3 tabIndex={-1}>
            {correct ? "You got it. Here’s why." : "Let’s work through it."}
          </h3>
          <p className="prep-correct-response">
            <strong>Correct response: </strong>
            {correctResponse(question)}
          </p>
          <div>
            <h4>The reasoning</h4>
            <p>{question.explanation}</p>
          </div>
          <div>
            <h4>The tempting trap</h4>
            <p>{question.trap}</p>
          </div>
          <div>
            <h4>A more efficient approach</h4>
            <p>{question.strategy}</p>
          </div>
        </section>
      )}
    </article>
  );
}
