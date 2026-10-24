/**
 * Original Wordtrail teaching routines and examples, checked 2026-10-24.
 * ETS links support the test formats, tested skills, and navigation rules.
 * The micro-examples, practice routines, and error-log workflow are original
 * instructional suggestions; they are not ETS questions or prescribed methods.
 */
export interface VerbalGuide {
  id: string;
  title: string;
  category:
    | "Text completion"
    | "Sentence equivalence"
    | "Reading comprehension"
    | "Pacing & review";
  summary: string;
  steps: string[];
  traps: string[];
  microExample: { prompt: string; reasoning: string };
  sourceUrls: string[];
}

const ETS_VERBAL =
  "https://www.ets.org/gre/test-takers/general-test/prepare/content/verbal-reasoning.html";
const ETS_TC = "https://grediagnostic.ets.org/GREDWeb/gred/text_completion.jsp";
const ETS_SE =
  "https://grediagnostic.ets.org/GREDWeb/gred/sentence_equivalance.jsp";
const ETS_RC =
  "https://grediagnostic.ets.org/GREDWeb/gred/reading_comprehension.jsp";
const ETS_STRATEGIES =
  "https://www.ets.org/gre/test-takers/general-test/prepare/strategies-tips.html";
const ETS_STRUCTURE =
  "https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html";
const ETS_DIAGNOSTIC = "https://grediagnostic.ets.org/GREDWeb/gred/help.jsp";

export const verbalGuides: VerbalGuide[] = [
  {
    id: "guide-tc-relationships",
    title: "Find the relationship before the word",
    category: "Text completion",
    summary:
      "Reduce a difficult sentence to its logic, then choose the word that preserves it.",
    steps: [
      "Restate each clause simply. Keep negatives and limits such as only, rarely, despite, and unless; dropping one can reverse the claim.",
      "Name what the clauses do together: support, contrast, explain, qualify, or give an example. A contrast may oppose appearance and reality rather than two adjectives.",
      "Give the blank a precise provisional meaning, such as fragile-looking or brief but complete. A vague positive/negative label is often insufficient.",
      "Test the options against that meaning, then read the completed sentence once. Check who or what the word describes and whether every clue still works.",
    ],
    traps: [
      "Treating although as an instruction to choose an antonym without identifying the actual contrast.",
      "Choosing a familiar or impressive word that fits the topic but not the logical relationship.",
    ],
    microExample: {
      prompt:
        "Despite its _____ appearance, the device survived repeated impacts. Options: fragile, reliable, novel, ornate, ordinary.",
      reasoning:
        "Survival contradicts the expectation created by looking breakable, so fragile supplies the required contrast. Novel or ornate may describe a device, but neither establishes the expectation that the impact evidence overturns.",
    },
    sourceUrls: [ETS_TC, ETS_VERBAL],
  },
  {
    id: "guide-tc-multiple-blanks",
    title: "Make every blank constrain the others",
    category: "Text completion",
    summary:
      "Build one coherent reading instead of solving several isolated vocabulary puzzles.",
    steps: [
      "Locate the blank with the clearest local clue. Start there even if it is not the first blank.",
      "Write a short meaning for each blank and connect the meanings: earlier rejection, later evidence, weakened objection. Keep tentative choices tentative.",
      "If a later blank has no convincing completion, revisit the earlier choice. Do not force an awkward second answer to protect your first guess.",
      "Insert one option from each blank’s own column and audit the complete passage. Every blank must be right; a partly correct combination earns no credit.",
    ],
    traps: [
      "Selecting a locally plausible word that makes the next clause contradictory.",
      "Trying every combination before using the passage’s constraints.",
    ],
    microExample: {
      prompt:
        "The committee initially (i) _____ the proposal as impractical; revised cost estimates, however, made its former (ii) _____ difficult to defend. (i): rejected / endorsed / implemented. (ii): skepticism / enthusiasm / neutrality.",
      reasoning:
        "Impractical supports rejected. The second clause reverses the committee’s earlier position, so skepticism becomes difficult to defend. Endorsed clashes with as impractical, and enthusiasm does not describe the rejection established in the first clause.",
    },
    sourceUrls: [ETS_TC],
  },
  {
    id: "guide-se-whole-meaning",
    title: "Find two equivalent completed meanings",
    category: "Sentence equivalence",
    summary:
      "A good pair passes two tests: each word fits, and both completed sentences convey the same meaning.",
    steps: [
      "Predict the blank’s role from the sentence before examining possible pairs.",
      "Check each candidate independently for grammar, connotation, degree, and the precise context. Keep more than two temporarily if needed.",
      "Compare the surviving completed sentences. Ask what claim a reader would take away from each; dictionary synonymy alone does not settle the question.",
      "Choose exactly two of the six options. Reject a tempting pair if either word breaks a clue, even when the words resemble each other.",
    ],
    traps: [
      "Pairing synonyms first and overlooking that both produce the wrong meaning in this sentence.",
      "Choosing one excellent fit and one merely related word; both selections are required for credit.",
    ],
    microExample: {
      prompt:
        "The report is so _____ that readers must consult a specialist just to understand its central claim. Options: opaque, obscure, concise, terse, candid, thorough.",
      reasoning:
        "Opaque and obscure both express difficulty understanding the report. Concise and terse form an attractive pair about brevity, but the sentence’s explicit problem is intelligibility. Candid concerns frankness, and thorough concerns completeness.",
    },
    sourceUrls: [ETS_SE, ETS_VERBAL],
  },
  {
    id: "guide-rc-scope",
    title: "Keep the answer inside the evidence",
    category: "Reading comprehension",
    summary:
      "Track exactly who, when, where, and how strongly the passage makes a claim.",
    steps: [
      "Identify the population, period, conditions, and comparison involved in the relevant evidence.",
      "Check the answer’s quantifiers and modal words: some versus most, may versus will, and association versus causation.",
      "Split an answer containing and, because, or therefore into its separate claims. Every required part needs support.",
      "Name the exact overreach before eliminating a choice. Strong wording is acceptable when the passage actually supports a strong conclusion.",
    ],
    traps: [
      "Generalizing from a studied group to every member of a wider population.",
      "Rejecting always automatically, or accepting a weak-sounding answer automatically, without checking the evidence.",
    ],
    microExample: {
      prompt:
        "Weekend bus ridership rose in two coastal towns after weekend fares were reduced. The study did not examine weekday travel. Does this establish that fare reductions will increase ridership in every city?",
      reasoning:
        "No. The evidence concerns two towns and weekend travel, and the before/after observation alone does not isolate a cause. A defensible summary retains those limits instead of extending the finding to all cities, all days, and a guaranteed outcome.",
    },
    sourceUrls: [ETS_VERBAL],
  },
  {
    id: "guide-rc-inference",
    title: "Infer the smallest supported step",
    category: "Reading comprehension",
    summary:
      "Connect the stated facts without supplying a new story to make an answer work.",
    steps: [
      "Read the stem’s demand carefully: must follow, most strongly supported, and most likely are not interchangeable instructions.",
      "Identify the minimum facts needed and preserve their logical direction. If A implies B, B alone does not establish A.",
      "For a must-follow claim, try making it false while keeping the passage true. A coherent counterexample shows that the claim is not necessary.",
      "Prefer the supported connection over an interesting explanation that requires an unstated motive, mechanism, or event.",
    ],
    traps: [
      "Turning a sufficient condition into a necessary one.",
      "Calling an answer an inference merely because it is plausible in the real world.",
    ],
    microExample: {
      prompt:
        "Every tested alloy containing cobalt resisted corrosion. Alloy R was tested and did not resist corrosion. What follows about Alloy R?",
      reasoning:
        "R did not contain cobalt: otherwise it would have resisted under the stated rule. The reverse inference would fail—an alloy that resisted might have done so without cobalt. The restriction to tested alloys matters, and R explicitly satisfies it.",
    },
    sourceUrls: [ETS_VERBAL],
  },
  {
    id: "guide-rc-main-purpose",
    title: "Describe what the passage is doing",
    category: "Reading comprehension",
    summary:
      "A main-purpose answer needs the author’s central action, not just the passage’s subject.",
    steps: [
      "Give each paragraph a brief job label: introduces a view, reports evidence, challenges an explanation, or adds a limitation.",
      "Finish this sentence in your own words: The author uses this material to explain, question, qualify, compare, or defend…",
      "Check that your answer accommodates the major turns. A vivid example may illustrate the purpose without being the purpose itself.",
      "Compare the scope and force of the final candidates. Qualifying an argument is narrower than rejecting it, and presenting possibilities is weaker than proving a cause.",
    ],
    traps: [
      "Choosing an accurate detail that covers only one part of the passage.",
      "Mistaking the opening view for the author’s final position after a later challenge.",
    ],
    microExample: {
      prompt:
        "Digitizing a collection can broaden access. However, poorly labelled images are difficult to search, and producing useful labels is costly. Access therefore depends on cataloguing as well as scanning. What is the main purpose?",
      reasoning:
        "The passage qualifies the case for digitization by explaining a condition for useful access. It neither rejects digital collections nor simply describes scanning technology. The final answer must accommodate both the potential benefit and the cataloguing limitation.",
    },
    sourceUrls: [ETS_VERBAL],
  },
  {
    id: "guide-rc-voice-structure",
    title: "Separate the voices and track the turns",
    category: "Reading comprehension",
    summary:
      "Tone comes from the author’s commitment to a claim, not the emotional weight of the topic.",
    steps: [
      "Assign claims to their speakers: earlier researchers, a critic, a hypothetical opponent, or the current author.",
      "Track transitions by their effect on the argument. However can limit one claim while leaving the broader position intact.",
      "Translate evaluative language into a degree of commitment: endorsement, tentative support, reservation, or rejection.",
      "For structure questions, connect the parts explicitly: new evidence challenges an older dismissal, but a remaining limitation prevents certainty.",
    ],
    traps: [
      "Attributing a quoted critic’s opinion to the author who later questions it.",
      "Calling a passage hostile because it discusses a harmful event, or enthusiastic because it reports a promising result.",
    ],
    microExample: {
      prompt:
        "Earlier critics dismissed the diary as unreliable. Recently discovered letters corroborate several entries, although gaps remain. How should the author’s stance be characterized?",
      reasoning:
        "The stance is a qualified reassessment of the diary’s reliability. The corroboration challenges wholesale dismissal, while although gaps remain prevents complete endorsement. The earlier critics’ stronger negative view is reported, not simply adopted.",
    },
    sourceUrls: [ETS_VERBAL],
  },
  {
    id: "guide-rc-select-all",
    title: "Judge each option independently",
    category: "Reading comprehension",
    summary:
      "Select-all questions reward complete evidence checks, not a guess about how many answers look right.",
    steps: [
      "For each option, find the relevant evidence before considering the other options.",
      "Classify it as supported, contradicted, or not established. Not established is enough to reject an option; it need not be proven false.",
      "Test every clause and qualification within that option. One supported phrase cannot rescue an unsupported second claim.",
      "Select all supported options. These RC questions have three choices, and one, two, or all three can be correct; there is no partial credit.",
    ],
    traps: [
      "Stopping after two choices because selecting all three feels unlikely.",
      "Treating no measurement as evidence that there was no effect.",
    ],
    microExample: {
      prompt:
        "Pilot A shortened waiting time but left attendance unchanged. Pilot B increased attendance; its waiting-time effect was not measured. Select all supported statements: A) Attendance increased in at least one pilot. B) Pilot A shortened waiting time. C) Pilot B did not shorten waiting time.",
      reasoning:
        "Select A and B. A follows from Pilot B’s attendance result, and B is stated directly. C is not established: an unmeasured effect could be positive, negative, or absent. The truth of A and B provides no shortcut for judging C.",
    },
    sourceUrls: [ETS_RC],
  },
  {
    id: "guide-rc-sentence-function",
    title: "Choose the sentence that performs the job",
    category: "Reading comprehension",
    summary:
      "Distinguish what a sentence says from why it appears at that point in the passage.",
    steps: [
      "Translate the requested function: offers evidence, introduces an objection, concedes a point, or limits a conclusion.",
      "Read the candidate sentence with its neighbours. Resolve references such as this result, that view, and those findings.",
      "Explain its contribution using a verb and an object: questions whether the observed decline demonstrates a policy effect.",
      "For a sentence-selection item, select the complete sentence within the specified part of the passage; matching a keyword is insufficient.",
    ],
    traps: [
      "Choosing the sentence that reports the result when the question asks for a limitation on interpreting it.",
      "Ignoring a reference to the preceding sentence and assigning the wrong argumentative role.",
    ],
    microExample: {
      prompt:
        "(1) A tax on disposable cups was expected to reduce waste. (2) In the first year, measured cup waste fell by a quarter. (3) Because the city also changed its waste-counting method, that decline alone cannot establish the tax’s effect. Select the sentence that qualifies what the evidence establishes.",
      reasoning:
        "Select sentence 3. Sentence 2 supplies the observation; sentence 3 explains why that observation does not isolate the tax’s effect. The phrase that decline links the qualification directly to the preceding evidence.",
    },
    sourceUrls: [ETS_RC, ETS_VERBAL],
  },
  {
    id: "guide-rc-arguments",
    title: "Find the gap between evidence and conclusion",
    category: "Reading comprehension",
    summary:
      "For argument questions, examine the link being claimed rather than debating the topic in general.",
    steps: [
      "State the conclusion separately from the evidence. Notice whether the conclusion asserts a cause, recommends an action, or generalizes from a sample.",
      "Identify the bridge the reasoning needs: comparable groups, reliable measurements, suitable timing, or a representative sample.",
      "Test a strengthen or weaken option by its effect on that bridge. Useful evidence need not prove the conclusion completely true or completely false.",
      "If the question asks for a necessary assumption, negate the candidate carefully. Ask whether the reasoning can still support its conclusion; mere relevance is insufficient.",
    ],
    traps: [
      "Confusing association with causation, especially when groups selected themselves into the comparison.",
      "Rejecting a weakening answer because the conclusion could still be true for another reason.",
    ],
    microExample: {
      prompt:
        "Restaurants using a new booking app reported fewer empty tables than restaurants not using it. The writer concludes that the app reduces unused capacity. What would the fact that early adopters were already more popular before adopting it do to this argument?",
      reasoning:
        "It weakens the causal inference by providing a pre-existing difference that could explain the comparison. It does not prove the app has no benefit; it shows that the supplied evidence does not isolate that benefit. This targets the inference rather than disputing the reported table counts.",
    },
    sourceUrls: [ETS_VERBAL],
  },
  {
    id: "guide-pacing-revisit",
    title: "Protect the section, not a single question",
    category: "Pacing & review",
    summary:
      "Use a practiced pacing plan that leaves room to answer, mark, and revisit within the current section.",
    steps: [
      "Practice the current Verbal section limits: 12 questions in 18 minutes, then 15 questions in 23 minutes. Treat these as section budgets, not equal time allowances for every item.",
      "When a deliberate reread produces no new evidence, record your best available answer, mark the item, and move on. Decide your personal stopping signal during practice.",
      "Budget shared passage reading across its question set. Track unfinished questions and remaining time at a few planned checkpoints rather than repeatedly opening Review.",
      "Before the section ends, check unanswered items and revisit marked ones if time permits. Incorrect answers carry no subtraction, so provide an answer to every question. Revisiting is limited to the current section.",
    ],
    traps: [
      "Spending several extra minutes defending a guess while accessible questions remain unseen.",
      "Changing an answer on a vague feeling instead of identifying new evidence or a specific earlier mistake.",
    ],
    microExample: {
      prompt:
        "Eight minutes remain and six questions are unfinished, including three attached to one passage. You have reread a difficult SE sentence twice without finding a new clue. What is a useful next move?",
      reasoning:
        "Choose the best supported pair available, mark it, and move to the unfinished work. The passage requires shared reading time, so six identical per-question timers would be misleading. Return to the marked SE item only if the remaining section budget permits another evidence-based attempt.",
    },
    sourceUrls: [ETS_STRUCTURE, ETS_STRATEGIES],
  },
  {
    id: "guide-review-precision",
    title: "Turn a miss into one better decision",
    category: "Pacing & review",
    summary:
      "Build an error log around the decision that failed, then test that decision on fresh material.",
    steps: [
      "Before opening the explanation, note your answer, confidence, time spent, and the evidence you thought justified it. Include correct guesses in review.",
      "Identify the earliest decisive mistake: missing a contrast, misreading a quantifier, choosing the wrong word sense, adding an assumption, or rushing the response format.",
      "Write one precise distinction between your answer and the supported answer, then one action you can repeat on the next question. Careless alone is not an actionable diagnosis.",
      "Reattempt after a delay and then try a different item testing the same skill. Track accuracy and time on unseen work. Use official practice scores to assess a 170 goal; app completion and drill percentages do not predict or guarantee that score.",
    ],
    traps: [
      "Remembering the answer letter on a repeat and mistaking recognition for improved reasoning.",
      "Calling every TC or SE error a vocabulary problem when the decisive failure was logic or context.",
    ],
    microExample: {
      prompt:
        "You chose an answer saying most participants improved, although the passage said some participants improved. The vocabulary was familiar. What belongs in the error log?",
      reasoning:
        "Record scope inflation: I strengthened some to most without evidence. The next action is to compare the passage’s quantifier with the answer’s before confirming. Test that action on a new inference item; merely memorizing the original answer would not demonstrate the repair.",
    },
    sourceUrls: [ETS_DIAGNOSTIC, ETS_STRATEGIES, ETS_STRUCTURE],
  },
];

export const verbalChecklist: string[] = [
  "Read the response instruction first: one choice, two choices, all supported choices, one choice per blank, or a sentence from the passage.",
  "Text completion has one to three blanks. A single blank has five options; each blank in a two- or three-blank item has three. Choose one option from each blank’s own list.",
  "For multiblank text completion, check the completed passage as a whole. Every blank must be correct for credit.",
  "Sentence equivalence requires exactly two of six choices. Both must fit and yield equivalent completed meanings.",
  "For RC select-one, compare all five options. A partly true answer may still fail to answer the question.",
  "For RC select-all, evaluate all three options independently. Select every correct option and no incorrect ones; there is no partial credit.",
  "For select-in-passage, choose the sentence that satisfies the requested description within the permitted passage region.",
  "Match scope, degree, logical direction, and speaker. Use passage evidence rather than outside expertise.",
  "Separate unfamiliar vocabulary from a reasoning error. Learn the relevant sense and practice it in a new context.",
  "Answer every question before leaving a section, then use remaining time for purposeful review. A completed section cannot be revisited.",
  "Treat 170 as a goal, not a promised outcome. Check progress with fresh, timed official practice rather than a claimed conversion from app accuracy.",
];
