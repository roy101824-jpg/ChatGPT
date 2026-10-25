import { ArrowRight, BookOpen, Layers3, ListChecks } from "lucide-react";
import { formatDetails, questionFamilies, type PrepFamily } from "./catalog";
import type { PrepFormat, PrepQuestion } from "./types";

export default function ChallengeChooser({
  bank,
  attempted,
  family,
  format,
  onChoose,
}: {
  bank: PrepQuestion[];
  attempted: Set<string>;
  family: PrepFamily;
  format: string;
  onChoose: (family: PrepFamily, format: PrepFormat | "all") => void;
}) {
  const icons = { tc: Layers3, se: ListChecks, rc: BookOpen };
  return (
    <section className="prep-challenges" aria-labelledby="challenge-heading">
      <div className="section-title prep-challenge-heading">
        <div>
          <h2 id="challenge-heading">Choose your challenge</h2>
          <p>
            The three GRE Verbal question types, with every response format.
          </p>
        </div>
      </div>
      <div className="prep-challenge-grid">
        {questionFamilies.map((group) => {
          const Icon = icons[group.id];
          const questions = bank.filter((q) =>
            group.formats.includes(q.format),
          );
          const unseen = questions.filter((q) => !attempted.has(q.id)).length;
          return (
            <article
              key={group.id}
              className={`prep-challenge-card ${group.id} ${family === group.id ? "selected" : ""}`}
              aria-labelledby={`challenge-${group.id}`}
            >
              <div className="prep-challenge-top">
                <span className="prep-type-icon">
                  <Icon size={21} />
                </span>
                <span>
                  {questions.length} questions <b>· {unseen} new</b>
                </span>
              </div>
              <h3 id={`challenge-${group.id}`}>{group.title}</h3>
              <p>{group.description}</p>
              <div className="prep-subtypes">
                {group.formats.map((f) => {
                  const items = questions.filter((q) => q.format === f);
                  return (
                    <button
                      key={f}
                      type="button"
                      aria-label={`Configure ${group.title}: ${formatDetails[f].label}`}
                      aria-pressed={family === group.id && format === f}
                      onClick={() => onChoose(group.id, f)}
                    >
                      <span>
                        <strong>{formatDetails[f].label}</strong>
                        <small>{formatDetails[f].rule}</small>
                      </span>
                      <span className="prep-subtype-count">
                        {items.length}
                        <ArrowRight size={14} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="prep-card-rule">{group.rule}</p>
              {group.formats.length > 1 && (
                <button
                  className="text-button prep-mix-formats"
                  onClick={() => onChoose(group.id, "all")}
                >
                  Mix {group.title} formats <ArrowRight size={15} />
                </button>
              )}
            </article>
          );
        })}
      </div>
      <button
        className="text-button prep-all-types"
        onClick={() => onChoose("all", "all")}
      >
        Practice all three question types <ArrowRight size={15} />
      </button>
    </section>
  );
}
