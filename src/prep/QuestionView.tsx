import { useId } from "react";
import { scoreAnswer } from "./engine";
import type { PrepAnswer, PrepQuestion } from "./types";
import "./prep-question.css";

interface Props {
  question: PrepQuestion;
  answer: PrepAnswer;
  onAnswer: (answer: PrepAnswer) => void;
  disabled?: boolean;
  showSolution?: boolean;
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
  const readOnly = disabled || showSolution;
  const selected = answer.selections || [];
  const multi = ["se", "rc-multi"].includes(question.format);
  const isSE = question.format === "se";
  const choiceList = question.choices;
  const correct = showSolution ? scoreAnswer(question, answer) : false;
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
          <h3>{question.passage.title || "Read the passage"}</h3>
          {question.format === "rc-sentence" ? (
            <div className="prep-sentences">
              <p className="prep-instruction">
                Select the whole sentence that answers the question.
              </p>
              {question.passage.sentences.map((sentence, index) => {
                const chosen = answer.sentence === index;
                const expected =
                  showSolution && question.sentenceAnswer === index;
                return (
                  <button
                    type="button"
                    key={index}
                    disabled={readOnly}
                    aria-pressed={chosen}
                    className={`prep-sentence ${chosen ? "prep-selected" : ""} ${expected ? "prep-correct" : ""} ${showSolution && chosen && !expected ? "prep-incorrect" : ""}`}
                    onClick={() => onAnswer({ ...answer, sentence: index })}
                  >
                    <span className="prep-sentence-number" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span>{sentence}</span>
                    {showSolution && (expected || chosen) && (
                      <span className="prep-choice-state">
                        {expected ? "Correct sentence" : "Your selection"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p>{question.passage.sentences.join(" ")}</p>
          )}
        </section>
      )}
      <h2
        id={`${uid}-stem`}
        className="prep-question-stem prep-stem"
        tabIndex={-1}
      >
        {question.stem}
      </h2>
      {question.blanks && (
        <div className="prep-blanks">
          <p className="prep-instruction">
            Select one answer for each blank. All blanks must be correct.
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
              ? "Choose exactly two words that produce equivalent meanings."
              : multi
                ? "Select every answer that applies."
                : "Select one answer."}
          </legend>
          {isSE && (
            <p className="prep-selection-count" aria-live="polite">
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
      {showSolution && (
        <section
          className={`prep-solution ${correct ? "prep-solution-correct" : ""}`}
          role="status"
          aria-label="Answer and explanation"
        >
          <h3>
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
