import type { PrepQuestion, PrepPassage } from "../../prep/types";

// Independently authored practice, not ETS items or an official score scale.
const original = (
  item: Omit<PrepQuestion, "section" | "provenance">,
): PrepQuestion => ({
  ...item,
  section: "verbal",
  provenance: {
    kind: "original",
    author: "Wordtrail",
    verifiedOn: "2026-10-24",
  },
});

const completionQuestions: PrepQuestion[] = [
  original({
    id: "v27-tc1-01",
    format: "tc1",
    topic: "Text completion",
    skill: "Circular reasoning",
    difficulty: "Advanced",
    stem: "The committee defines excellent research as whatever it chooses to reward, then justifies rewarding this year’s winner solely by calling the work excellent; its justification is (i) _____.",
    blanks: [
      {
        choices: [
          "empirical",
          "tautological",
          "provisional",
          "probabilistic",
          "incidental",
        ],
        answer: 1,
      },
    ],
    explanation:
      "By defining excellence as being chosen for an award, the committee merely restates its decision as the reason for that decision. Its justification is tautological because it supplies no independent criterion of merit. Empirical would require evidence beyond relabeling the committee’s choice.",
    trap: "Calling a choice excellent adds no independent justification when excellence has been defined solely by that choice.",
    strategy:
      "Replace the blank with a plain-language diagnosis of the argument before matching a technical word.",
    estimatedSeconds: 65,
  }),
  original({
    id: "v27-tc1-02",
    format: "tc1",
    topic: "Text completion",
    skill: "Scope of disagreement",
    difficulty: "Standard",
    stem: "Both factions endorse the proposed destination; their disagreement is (i) _____, concerning only the sequence of approvals required to reach it.",
    blanks: [
      {
        choices: [
          "ideological",
          "irreconcilable",
          "substantive",
          "procedural",
          "illusory",
        ],
        answer: 3,
      },
    ],
    explanation:
      "The factions agree on the goal and disagree only about the steps for achieving it. Procedural describes that limited disagreement. Substantive would suggest disagreement about the proposal’s actual content, while illusory would incorrectly deny that there is a real dispute.",
    trap: "A disagreement can be real without being about fundamental aims.",
    strategy:
      "Identify exactly what is shared and exactly what differs; choose a word that names the difference.",
    estimatedSeconds: 55,
  }),
  original({
    id: "v27-tc1-03",
    format: "tc1",
    topic: "Text completion",
    skill: "Evidence and degree",
    difficulty: "Advanced",
    stem: "Because the observed association could be explained by an unmeasured variable, the paper’s conclusion is deliberately (i) _____, asserting a possibility where its press release proclaims a cause.",
    blanks: [
      {
        choices: [
          "circumspect",
          "peremptory",
          "sanguine",
          "indiscriminate",
          "dogmatic",
        ],
        answer: 0,
      },
    ],
    explanation:
      "The paper limits its claim because an alternative explanation remains possible. Circumspect means carefully cautious. Peremptory and dogmatic convey unwarranted finality, while sanguine concerns optimism rather than the degree of evidential certainty.",
    trap: "Do not let the confident press release determine the paper’s tone; the sentence contrasts them.",
    strategy:
      "Track which document each description modifies, then calibrate the strength of the conclusion to the evidence.",
    estimatedSeconds: 65,
  }),
  original({
    id: "v27-tc1-04",
    format: "tc1",
    topic: "Text completion",
    skill: "Selection versus completeness",
    difficulty: "Standard",
    stem: "The anthology is (i) _____ rather than exhaustive: its editor draws from sharply different intellectual traditions without trying to include every important writer in any one of them.",
    blanks: [
      {
        choices: [
          "chronological",
          "homogeneous",
          "canonical",
          "redundant",
          "eclectic",
        ],
        answer: 4,
      },
    ],
    explanation:
      "Drawing selectively from diverse traditions makes the anthology eclectic. Exhaustive would mean attempting full coverage, which the sentence explicitly denies. Canonical concerns established authority rather than the diversity of the selection.",
    trap: "Breadth across traditions is different from completeness within each tradition.",
    strategy:
      "Separate the number of perspectives represented from the proportion of any perspective that is covered.",
    estimatedSeconds: 55,
  }),
  original({
    id: "v27-tc1-05",
    format: "tc1",
    topic: "Text completion",
    skill: "Direction of change",
    difficulty: "Core",
    stem: "The emergency payments did not eliminate the hardship, but they did (i) _____ it, allowing families to meet expenses that had previously gone unpaid.",
    blanks: [
      {
        choices: [
          "aggravate",
          "conceal",
          "alleviate",
          "perpetuate",
          "anticipate",
        ],
        answer: 2,
      },
    ],
    explanation:
      "The payments reduced hardship without removing it entirely, so alleviate fits. Conceal would mean hiding the hardship rather than improving families’ ability to pay. Aggravate and perpetuate conflict with the described benefit.",
    trap: "A partial benefit is still a benefit; the opening qualification does not reverse the direction of the effect.",
    strategy:
      "Decide whether the effect is positive, negative, or merely presentational before comparing vocabulary.",
    estimatedSeconds: 45,
  }),
  original({
    id: "v27-tc1-06",
    format: "tc1",
    topic: "Text completion",
    skill: "Concession and tone",
    difficulty: "Advanced",
    stem: "Even the reviewer who found the argument unconvincing called its author (i) _____: she represented rival positions fairly and acknowledged evidence unfavorable to her own.",
    blanks: [
      {
        choices: [
          "irresolute",
          "magniloquent",
          "credulous",
          "scrupulous",
          "partisan",
        ],
        answer: 3,
      },
    ],
    explanation:
      "Fair treatment of opponents and candid acknowledgment of contrary evidence demonstrate scrupulous intellectual care. The reviewer disputes the argument’s success, not the author’s honesty. Irresolute would suggest an inability to decide, which is not established.",
    trap: "An unsuccessful argument need not be carelessly or dishonestly constructed.",
    strategy:
      "Keep the evaluation of the conclusion separate from the evaluation of the author’s methods.",
    estimatedSeconds: 65,
  }),
  original({
    id: "v27-tc1-07",
    format: "tc1",
    topic: "Text completion",
    skill: "Unexpected result",
    difficulty: "Standard",
    stem: "The new evidence proved (i) _____ to the prevailing account: rather than overturning its central claim, it filled a gap that critics had long regarded as the account’s principal weakness.",
    blanks: [
      {
        choices: [
          "inimical",
          "corroborative",
          "extraneous",
          "incongruous",
          "opaque",
        ],
        answer: 1,
      },
    ],
    explanation:
      "Filling a major evidential gap strengthens the account, making the new evidence corroborative. Inimical means harmful or hostile and reverses the effect. Extraneous would mean irrelevant, whereas the evidence addresses the account’s principal weakness.",
    trap: "The mention of critics describes the earlier vulnerability, not the effect of the new evidence.",
    strategy:
      "State what the new information does to the claim—supports, weakens, or leaves it unchanged.",
    estimatedSeconds: 55,
  }),
  original({
    id: "v27-tc1-08",
    format: "tc1",
    topic: "Text completion",
    skill: "Information and accessibility",
    difficulty: "Advanced",
    stem: "The commentary’s difficulty lies less in its syntax than in its (i) _____ references: understanding its allusions requires familiarity with manuscripts consulted by only a handful of specialists.",
    blanks: [
      {
        choices: [
          "recondite",
          "fallacious",
          "hackneyed",
          "fortuitous",
          "explicit",
        ],
        answer: 0,
      },
    ],
    explanation:
      "References accessible only to a small circle of specialists are recondite, or obscure and requiring specialized knowledge. Fallacious would describe faulty reasoning, not inaccessible allusions. Explicit references can still be obscure, so explicit does not explain the difficulty.",
    trap: "Do not confuse unfamiliar evidence with false evidence.",
    strategy:
      "Use the explanatory clause after the colon to define the precise source of difficulty.",
    estimatedSeconds: 65,
  }),
  original({
    id: "v27-tc1-09",
    format: "tc1",
    topic: "Text completion",
    skill: "Inferring a motive cautiously",
    difficulty: "Standard",
    stem: "The director’s silence was (i) _____, not accidental: she had decided that answering the rumor would give it attention it had not otherwise earned.",
    blanks: [
      {
        choices: [
          "involuntary",
          "inarticulate",
          "incredulous",
          "unprecedented",
          "calculated",
        ],
        answer: 4,
      },
    ],
    explanation:
      "The director deliberately chooses silence to avoid amplifying a rumor, so it is calculated. Inarticulate would describe difficulty expressing ideas, whereas she has consciously decided not to speak. Unprecedented concerns whether silence has occurred before.",
    trap: "Silence is not evidence of inability to speak when the sentence gives a deliberate reason for it.",
    strategy:
      "Distinguish an intentional strategy from an accidental outcome or a limitation in ability.",
    estimatedSeconds: 50,
  }),
  original({
    id: "v27-tc1-10",
    format: "tc1",
    topic: "Text completion",
    skill: "Description versus endorsement",
    difficulty: "Standard",
    stem: "The historian’s account is (i) _____: it explains how the institution operated without claiming that those operations were morally defensible.",
    blanks: [
      {
        choices: [
          "exculpatory",
          "prescriptive",
          "descriptive",
          "celebratory",
          "polemical",
        ],
        answer: 2,
      },
    ],
    explanation:
      "An account of how an institution worked, without an argument about how it ought to work or whether it was justified, is descriptive. Exculpatory would excuse wrongdoing, while prescriptive would recommend a course of action. Explanation alone is not endorsement.",
    trap: "Understanding a practice does not necessarily amount to defending it.",
    strategy:
      "Ask whether the author is reporting, recommending, excusing, or attacking; these are distinct tasks.",
    estimatedSeconds: 60,
  }),
  original({
    id: "v27-tc2-01",
    format: "tc2",
    topic: "Text completion",
    skill: "Qualified praise",
    difficulty: "Advanced",
    stem: "The review’s praise is (i) _____: the proposed mechanism is persuasive only if an untested assumption holds, so the review can hardly be read as an unreserved (ii) _____ of the theory.",
    blanks: [
      { choices: ["unintelligible", "effusive", "conditional"], answer: 2 },
      { choices: ["vindication", "repudiation", "qualification"], answer: 0 },
    ],
    explanation:
      "The praise depends on an assumption, making it conditional. Because that condition is untested, the review is not an unreserved vindication, or confirmation, of the theory. Repudiation would mean rejection, but the review does give some praise.",
    trap: "“Hardly” negates the second blank’s phrase; do not choose a word that already describes the review’s caution.",
    strategy:
      "Solve the condition first, then explicitly paraphrase “hardly an unreserved ___” before selecting the second word.",
    estimatedSeconds: 80,
  }),
  original({
    id: "v27-tc2-02",
    format: "tc2",
    topic: "Text completion",
    skill: "Symptoms versus structure",
    difficulty: "Standard",
    stem: "Temporary rebates may (i) _____ public discontent by reducing immediate costs, even while the (ii) _____ arrangement that assigns a disproportionate burden to low-income households remains intact.",
    blanks: [
      { choices: ["alleviate", "discount", "exacerbate"], answer: 0 },
      { choices: ["ineffectual", "inchoate", "inequitable"], answer: 2 },
    ],
    explanation:
      "Reducing immediate costs may alleviate, or ease, discontent. The arrangement is inequitable because it distributes the burden unfairly. Ineffectual means ineffective, not unfair, and the sentence does not establish that the arrangement fails to function.",
    trap: "A policy can relieve a symptom while preserving the unfair structure that contributes to it.",
    strategy:
      "Assign each blank to its own level of analysis: the immediate effect and the underlying distribution.",
    estimatedSeconds: 75,
  }),
  original({
    id: "v27-tc2-03",
    format: "tc2",
    topic: "Text completion",
    skill: "Skepticism versus blanket rejection",
    difficulty: "Advanced",
    stem: "Her skepticism is (i) _____ rather than reflexive: she accepts claims backed by strong evidence and reserves her (ii) _____ for those whose support collapses under examination.",
    blanks: [
      {
        choices: ["indiscriminate", "theatrical", "discriminating"],
        answer: 2,
      },
      { choices: ["enthusiasm", "doubt", "deference"], answer: 1 },
    ],
    explanation:
      "She distinguishes well-supported claims from poorly supported ones, making her skepticism discriminating. She reserves doubt for the latter. Indiscriminate would describe the reflexive rejection that the sentence explicitly contrasts with her approach.",
    trap: "Skepticism need not mean doubting every claim equally.",
    strategy:
      "Use the two contrasting behaviors to identify the criterion controlling the person’s judgment.",
    estimatedSeconds: 80,
  }),
  original({
    id: "v27-tc2-04",
    format: "tc2",
    topic: "Text completion",
    skill: "Reversal across clauses",
    difficulty: "Advanced",
    stem: "Far from (i) _____ the dispute, the minister’s intervention (ii) _____ it: factions that had differed over a single provision began questioning one another’s legitimacy.",
    blanks: [
      { choices: ["documenting", "provoking", "resolving"], answer: 2 },
      { choices: ["circumscribed", "anticipated", "exacerbated"], answer: 2 },
    ],
    explanation:
      "The dispute grows from a narrow disagreement into a challenge to legitimacy, so the intervention exacerbated it. “Far from” requires the opposing result in the first blank: resolving the dispute. Documenting a dispute is not the opposite of making it worse.",
    trap: "The two blanks are not synonyms; the sentence contrasts an expected resolution with an actual escalation.",
    strategy:
      "Read the evidence after the colon first, then use the reversal phrase to work backward.",
    estimatedSeconds: 80,
  }),
  original({
    id: "v27-tc2-05",
    format: "tc2",
    topic: "Text completion",
    skill: "Collection versus explanation",
    difficulty: "Advanced",
    stem: "The monograph’s (i) _____ of examples is impressive, but without an account of how those examples fit together, abundance never becomes (ii) _____.",
    blanks: [
      {
        choices: ["misrepresentation", "suppression", "accumulation"],
        answer: 2,
      },
      { choices: ["redundancy", "prolixity", "synthesis"], answer: 2 },
    ],
    explanation:
      "The author has collected many examples, so accumulation fits the first blank. What is missing is synthesis: an integration of those examples into a coherent account. Prolixity is excessive length, which abundance may already produce; it is not the missing intellectual achievement.",
    trap: "Impressive quantity does not necessarily supply an explanation of relationships.",
    strategy:
      "Identify the positive feature that is present and the different intellectual feature that the contrast says is absent.",
    estimatedSeconds: 80,
  }),
  original({
    id: "v27-tc2-06",
    format: "tc2",
    topic: "Text completion",
    skill: "Borrowing versus transformation",
    difficulty: "Advanced",
    stem: "The composer openly acknowledges her borrowings, yet calling the work merely (i) _____ overlooks how thoroughly she alters their function; quotation here is a means of (ii) _____, not simple replication.",
    blanks: [
      { choices: ["cacophonous", "innovative", "derivative"], answer: 2 },
      { choices: ["transformation", "concealment", "restoration"], answer: 0 },
    ],
    explanation:
      "Derivative means dependent on earlier work rather than original, but “merely” makes that description inadequate because the borrowed material is transformed. Concealment contradicts the open acknowledgment, and restoration would return material to an earlier condition rather than alter its function.",
    trap: "The presence of borrowing does not settle the question of originality.",
    strategy:
      "Track what happens to the borrowed material instead of stopping at the fact that it was borrowed.",
    estimatedSeconds: 90,
  }),
  original({
    id: "v27-tc2-07",
    format: "tc2",
    topic: "Text completion",
    skill: "Conceptual distinctions",
    difficulty: "Advanced",
    stem: "The argument (i) _____ popularity with accuracy, treating widespread acceptance as proof of truth; a careful assessment must instead (ii) _____ the two.",
    blanks: [
      { choices: ["conflates", "reconciles", "contrasts"], answer: 0 },
      { choices: ["equate", "disseminate", "disentangle"], answer: 2 },
    ],
    explanation:
      "Treating popularity and accuracy as equivalent conflates them. The remedy is to disentangle them by evaluating whether acceptance is actually justified. Reconciling two concepts would presuppose a recognized difference, whereas the argument fails to preserve that difference.",
    trap: "Widespread belief and evidential support may coincide, but they are not the same property.",
    strategy:
      "Translate the argument into “X is being treated as Y,” then choose the verb for that specific error.",
    estimatedSeconds: 75,
  }),
  original({
    id: "v27-tc2-08",
    format: "tc2",
    topic: "Text completion",
    skill: "Expertise and limits",
    difficulty: "Advanced",
    stem: "Recognizing experts as (i) _____ need not entail rejecting expertise; it requires replacing unquestioning (ii) _____ with confidence proportionate to an expert’s evidence and record.",
    blanks: [
      { choices: ["venal", "fallible", "infallible"], answer: 1 },
      { choices: ["deference", "antagonism", "scrutiny"], answer: 0 },
    ],
    explanation:
      "Experts are fallible, or capable of error, without being useless or corrupt. The sentence recommends replacing unquestioning deference with calibrated confidence. Venal would accuse experts of corruption, which goes well beyond recognizing that they can make mistakes.",
    trap: "Avoid the false choice between treating experts as perfect and rejecting them entirely.",
    strategy:
      "Look for the middle position between the two extremes the sentence distinguishes.",
    estimatedSeconds: 90,
  }),
  original({
    id: "v27-tc2-09",
    format: "tc2",
    topic: "Text completion",
    skill: "Separating virtues",
    difficulty: "Standard",
    stem: "No one questioned the treasurer’s (i) _____, but honesty did not compensate for his lack of (ii) _____: he disclosed every transaction yet repeatedly miscalculated the balance.",
    blanks: [
      { choices: ["probity", "affluence", "dexterity"], answer: 0 },
      { choices: ["competence", "integrity", "candor"], answer: 0 },
    ],
    explanation:
      "Probity means honesty or uprightness, established by full disclosure. Repeated miscalculation shows a lack of competence. Candor and integrity belong with the virtue already acknowledged rather than the separate skill he lacks.",
    trap: "Do not choose two words for honesty when the sentence explicitly contrasts honesty with ability.",
    strategy:
      "Use the concrete behaviors after the colon to assign a distinct quality to each blank.",
    estimatedSeconds: 70,
  }),
  original({
    id: "v27-tc2-10",
    format: "tc2",
    topic: "Text completion",
    skill: "Relevant analogy",
    difficulty: "Advanced",
    stem: "The two cases share a date and a location, but those (i) _____ similarities are not (ii) _____ to the legal issue, which turns on whether consent was obtained.",
    blanks: [
      { choices: ["causal", "inexplicable", "superficial"], answer: 2 },
      { choices: ["germane", "subordinate", "antithetical"], answer: 0 },
    ],
    explanation:
      "The shared date and location do not address the legally decisive feature, so their similarity is superficial and not germane, or relevant, to the issue. Antithetical means directly opposed, but the similarities need not contradict the issue to be irrelevant to it.",
    trap: "A visible similarity is not necessarily a relevant similarity.",
    strategy:
      "Find the criterion that decides the question before evaluating an analogy.",
    estimatedSeconds: 85,
  }),
  original({
    id: "v27-tc2-11",
    format: "tc2",
    topic: "Text completion",
    skill: "Concession without contradiction",
    difficulty: "Standard",
    stem: "The laboratory’s boundaries were intellectually (i) _____, allowing ideas from neighboring disciplines to enter freely, yet it retained enough institutional (ii) _____ to choose its own research agenda.",
    blanks: [
      { choices: ["permeable", "impermeable", "arbitrary"], answer: 0 },
      { choices: ["autonomy", "dependence", "uniformity"], answer: 0 },
    ],
    explanation:
      "Freely admitting outside ideas makes the intellectual boundaries permeable. Choosing its own agenda indicates autonomy. Openness to intellectual influence does not require institutional dependence, so the two clauses describe compatible features.",
    trap: "Do not assume that receiving ideas from others means surrendering decision-making authority.",
    strategy:
      "Notice whether apparently contrasting clauses describe different dimensions of the institution.",
    estimatedSeconds: 80,
  }),
  original({
    id: "v27-tc2-12",
    format: "tc2",
    topic: "Text completion",
    skill: "Possibility versus necessity",
    difficulty: "Advanced",
    stem: "The historian presents the reform’s success as (i) _____ on a fragile coalition, challenging later accounts that portray the outcome as (ii) _____.",
    blanks: [
      { choices: ["impervious", "contingent", "extraneous"], answer: 1 },
      { choices: ["precarious", "ineluctable", "accidental"], answer: 1 },
    ],
    explanation:
      "Success depended on a coalition that might not have held, so it was contingent on that coalition. This challenges the claim that success was ineluctable, or unavoidable. Accidental and precarious would reinforce uncertainty rather than provide the opposing portrayal.",
    trap: "Knowing what eventually happened does not establish that it had to happen.",
    strategy:
      "Distinguish dependence on conditions from inevitability, and use the contrast to pair the blanks.",
    estimatedSeconds: 85,
  }),
  original({
    id: "v27-tc3-01",
    format: "tc3",
    topic: "Text completion",
    skill: "Three-part argument structure",
    difficulty: "Advanced",
    stem: "The critic’s apparent (i) _____ masks a consistent standard: she praises experimentation when it clarifies experience but condemns it when novelty becomes an (ii) _____ in itself. Her judgments are therefore less (iii) _____ than they first appear.",
    blanks: [
      { choices: ["deference", "severity", "inconsistency"], answer: 2 },
      { choices: ["end", "anachronism", "obstacle"], answer: 0 },
      { choices: ["capricious", "stringent", "consequential"], answer: 0 },
    ],
    explanation:
      "Alternately praising and condemning experimentation can appear inconsistent. The standard is whether novelty serves understanding or becomes an end in itself. Because a consistent criterion explains the different judgments, they are less capricious, or arbitrary, than they seem.",
    trap: "Different verdicts do not prove inconsistent standards when the works satisfy those standards differently.",
    strategy:
      "Identify the hidden rule linking the examples, then use it to reinterpret the apparent contradiction.",
    estimatedSeconds: 105,
  }),
  original({
    id: "v27-tc3-02",
    format: "tc3",
    topic: "Text completion",
    skill: "Counterproductive intervention",
    difficulty: "Advanced",
    stem: "The rule was intended to (i) _____ discretion by prescribing a single procedure. Yet because that procedure could not accommodate unusual cases, officials developed (ii) _____ exceptions that appeared in no published guidelines, making actual decisions more (iii) _____ to outside observers.",
    blanks: [
      { choices: ["legitimize", "celebrate", "curtail"], answer: 2 },
      { choices: ["ad hoc", "codified", "uniform"], answer: 0 },
      { choices: ["opaque", "accessible", "predictable"], answer: 0 },
    ],
    explanation:
      "A prescribed procedure was intended to curtail discretion. Unusual cases prompted ad hoc exceptions made for particular situations rather than a uniform published rule. Because those exceptions were unpublished, actual decisions became opaque, or difficult for outsiders to understand.",
    trap: "Do not extend the rule’s intended effect into the outcome clause; “yet” introduces its unintended reversal.",
    strategy:
      "Write the intended mechanism and the actual response separately, then infer the consequence of the response.",
    estimatedSeconds: 105,
  }),
  original({
    id: "v27-tc3-03",
    format: "tc3",
    topic: "Text completion",
    skill: "Scale and precision",
    difficulty: "Advanced",
    stem: "The map’s (i) _____ is deliberate: omitting minor streets makes the main routes easier to see. Its usefulness for regional planning does not, however, (ii) _____ its use for door-to-door navigation, a task for which those omissions are (iii) _____.",
    blanks: [
      { choices: ["verisimilitude", "simplicity", "intricacy"], answer: 1 },
      { choices: ["complicate", "warrant", "preclude"], answer: 1 },
      { choices: ["decisive", "decorative", "inconsequential"], answer: 0 },
    ],
    explanation:
      "Omitting detail creates simplicity that serves one purpose. Usefulness for regional planning does not warrant, or justify, using the map for individual addresses. For door-to-door navigation, omitted streets are decisive because the missing detail can determine whether a destination can be found.",
    trap: "A design advantage for one task can become a limitation for another; avoid declaring the map universally good or bad.",
    strategy:
      "Evaluate each feature against the specific task named in its clause.",
    estimatedSeconds: 100,
  }),
  original({
    id: "v27-tc3-04",
    format: "tc3",
    topic: "Text completion",
    skill: "Absence of evidence",
    difficulty: "Advanced",
    stem: "The daytime survey’s failure to detect the species is not (i) _____ evidence of its absence: the animal’s nocturnal habits make daytime sightings (ii) _____. Treating a negative result as conclusive would therefore (iii) _____ what the method can establish.",
    blanks: [
      { choices: ["circumstantial", "negative", "definitive"], answer: 2 },
      { choices: ["irrelevant", "routine", "improbable"], answer: 2 },
      { choices: ["vindicate", "overstate", "understate"], answer: 1 },
    ],
    explanation:
      "A daytime survey is poorly suited to detecting a nocturnal animal, making sightings improbable. Its negative result therefore cannot be definitive proof of absence. Claiming certainty would overstate the method’s evidential reach.",
    trap: "Failure to detect something is strong evidence of absence only when the method was likely to detect it if present.",
    strategy:
      "Ask how likely the observation method was to find the thing being sought before interpreting a negative result.",
    estimatedSeconds: 105,
  }),
  original({
    id: "v27-tc3-05",
    format: "tc3",
    topic: "Text completion",
    skill: "Public appearance and private motive",
    difficulty: "Advanced",
    stem: "The politician’s apparent (i) _____ to advice was widely praised, but private letters reveal that the display was (ii) _____: before consulting anyone, she had already resolved to reject every recommendation. The letters expose a gap between her public welcome for suggestions and her private (iii) _____.",
    blanks: [
      { choices: ["receptiveness", "vacillation", "belligerence"], answer: 0 },
      { choices: ["feigned", "spontaneous", "imprudent"], answer: 0 },
      { choices: ["intransigence", "diffidence", "contrition"], answer: 0 },
    ],
    explanation:
      "A public welcome for suggestions displays receptiveness. The letters show that this appearance was feigned, or pretended, because she had decided in advance to reject all advice. That fixed unwillingness to change is intransigence, not diffidence or contrition.",
    trap: "The praised public behavior and the revealed private attitude must not be assigned the same meaning.",
    strategy:
      "Separate appearance from evidence of intent, then use the final clause to name the revealed attitude.",
    estimatedSeconds: 105,
  }),
  original({
    id: "v27-tc3-06",
    format: "tc3",
    topic: "Text completion",
    skill: "Distinguishing ideals and implementation",
    difficulty: "Advanced",
    stem: "The reformer was (i) _____ about ends but (ii) _____ about means: she refused to abandon equal access as a goal, while readily changing procedures that failed to advance it. Such flexibility was not a (iii) _____ of her principles but a way to pursue them.",
    blanks: [
      { choices: ["steadfast", "indifferent", "equivocal"], answer: 0 },
      { choices: ["doctrinaire", "pragmatic", "inert"], answer: 1 },
      { choices: ["codification", "vindication", "repudiation"], answer: 2 },
    ],
    explanation:
      "Refusing to abandon the goal makes her steadfast about ends. Adjusting ineffective procedures makes her pragmatic about means. The sentence denies that procedural flexibility repudiates, or rejects, her principles; it serves those principles instead.",
    trap: "Changing a method does not necessarily mean changing the goal the method is meant to serve.",
    strategy:
      "Label each clause as about goals or methods before interpreting apparent inconsistency.",
    estimatedSeconds: 100,
  }),
  original({
    id: "v27-tc3-07",
    format: "tc3",
    topic: "Text completion",
    skill: "Evidence strength and alternatives",
    difficulty: "Advanced",
    stem: "The pattern is (i) _____ with the proposed explanation, but that agreement is not (ii) _____: several rival explanations predict the same pattern. A useful test must identify an observation that (iii) _____ among them.",
    blanks: [
      { choices: ["synonymous", "consistent", "incompatible"], answer: 1 },
      { choices: ["decisive", "provisional", "relevant"], answer: 0 },
      { choices: ["mediates", "discriminates", "equivocates"], answer: 1 },
    ],
    explanation:
      "The explanation predicts the pattern, so they are consistent. Yet the agreement is not decisive because rival explanations predict it too. A useful test must discriminate among the rivals by producing evidence that favors one over the others.",
    trap: "Evidence predicted by a theory is not uniquely supporting evidence when competing theories make the same prediction.",
    strategy:
      "Ask what observation would differ under the competing explanations, rather than merely fit the preferred one.",
    estimatedSeconds: 110,
  }),
  original({
    id: "v27-tc3-08",
    format: "tc3",
    topic: "Text completion",
    skill: "Reputation and practical behavior",
    difficulty: "Standard",
    stem: "Though famous for (i) _____ speeches, the negotiator was surprisingly (ii) _____ in private, willing to exchange concessions and accept partial gains. Her public militancy thus gave a misleading impression of her practical (iii) _____.",
    blanks: [
      { choices: ["laconic", "bellicose", "conciliatory"], answer: 1 },
      { choices: ["obdurate", "implacable", "accommodating"], answer: 2 },
      { choices: ["indifference", "flexibility", "hostility"], answer: 1 },
    ],
    explanation:
      "Public militancy points to bellicose, or combative, speeches. Willingness to exchange concessions makes her accommodating in private. The public tone therefore misrepresents her practical flexibility rather than proving practical hostility.",
    trap: "A person’s public rhetorical style may not reveal the strategy used in private negotiations.",
    strategy:
      "Use the explicit behavior to anchor each setting, then resolve the final summary from the private behavior.",
    estimatedSeconds: 95,
  }),
  original({
    id: "v27-tc3-09",
    format: "tc3",
    topic: "Text completion",
    skill: "Competing definitions of success",
    difficulty: "Advanced",
    stem: "With attendance breaking every previous record, the exhibition was a (i) _____ by that measure; measured by its stated aim of changing visitors’ understanding, its achievement remains (ii) _____ because no learning outcomes were assessed. The curator therefore rejects attendance as a sufficient (iii) _____ for educational impact.",
    blanks: [
      { choices: ["triumph", "nonentity", "debacle"], answer: 0 },
      { choices: ["superfluous", "inevitable", "unverified"], answer: 2 },
      { choices: ["obstacle", "rebuttal", "proxy"], answer: 2 },
    ],
    explanation:
      "High attendance makes the event a triumph by that measure, but no evidence of changed understanding is supplied, so educational success is unverified. Attendance cannot automatically function as a proxy, or substitute measure, for educational impact.",
    trap: "A readily measured output is not automatically a valid measure of the goal it is supposed to represent.",
    strategy:
      "Separate the metric from the intended outcome and look for evidence that connects them.",
    estimatedSeconds: 105,
  }),
  original({
    id: "v27-tc3-10",
    format: "tc3",
    topic: "Text completion",
    skill: "Reinterpreting disagreement",
    difficulty: "Advanced",
    stem: "The apparent (i) _____ between the two studies largely disappears once their populations are distinguished: a treatment beneficial for one group may be (ii) _____ for another. Their results need not be mutually exclusive; they may instead be (iii) _____.",
    blanks: [
      { choices: ["contradiction", "collaboration", "consensus"], answer: 0 },
      { choices: ["salutary", "ineffective", "indispensable"], answer: 1 },
      { choices: ["complementary", "redundant", "fraudulent"], answer: 0 },
    ],
    explanation:
      "Different reported outcomes initially suggest a contradiction. A treatment can benefit one population while being ineffective in another, so both results may hold. They can be complementary by describing different limits of the treatment’s usefulness.",
    trap: "Conflicting-looking results are not incompatible unless they make incompatible claims about the same conditions.",
    strategy:
      "Check whether the groups, contexts, and quantities are identical before declaring findings contradictory.",
    estimatedSeconds: 105,
  }),
];

const equivalenceQuestions: PrepQuestion[] = [
  original({
    id: "v27-se-01",
    format: "se",
    topic: "Sentence equivalence",
    skill: "Scope of a revision",
    difficulty: "Standard",
    stem: "The revisions were merely _____: the editor changed headings and typography while leaving every substantive claim intact.",
    choices: [
      "cosmetic",
      "expensive",
      "profound",
      "substantial",
      "conspicuous",
      "superficial",
    ],
    answers: [0, 5],
    explanation:
      "Cosmetic and superficial both describe surface changes that leave the substance untouched. Profound and substantial form a tempting pair but contradict the unchanged claims. Conspicuous means noticeable, which does not imply that a change is only superficial.",
    trap: "Do not select a synonym pair before checking whether it fits the sentence’s contrast.",
    strategy:
      "Predict “surface-only,” then select the two choices that produce that same meaning.",
    estimatedSeconds: 65,
  }),
  original({
    id: "v27-se-02",
    format: "se",
    topic: "Sentence equivalence",
    skill: "Standards versus conclusions",
    difficulty: "Advanced",
    stem: "Her willingness to entertain unusual hypotheses did not make her evidential standards less _____; every claim still had to survive demanding attempts to disprove it.",
    choices: [
      "conventional",
      "exacting",
      "permissive",
      "rigorous",
      "orthodox",
      "lenient",
    ],
    answers: [1, 3],
    explanation:
      "Exacting and rigorous both fit standards requiring demanding tests. Permissive and lenient contradict those standards. Conventional and orthodox describe conformity to established views, not the demanding quality of the evidence required.",
    trap: "Openness to an unusual idea is not the same as accepting weak evidence for it.",
    strategy:
      "Separate which ideas may be considered from the standard those ideas must meet.",
    estimatedSeconds: 80,
  }),
  original({
    id: "v27-se-03",
    format: "se",
    topic: "Sentence equivalence",
    skill: "Behavioral evidence",
    difficulty: "Standard",
    stem: "After the third unexplained postponement, the audience grew _____, shifting in their seats and demanding that the performance begin.",
    choices: [
      "impatient",
      "composed",
      "complacent",
      "indifferent",
      "docile",
      "restive",
    ],
    answers: [0, 5],
    explanation:
      "Restive and impatient describe the audience’s discomfort with waiting and demand for action. Docile and complacent indicate a lack of resistance or concern, contrary to the behavior. Composed would suggest calm control.",
    trap: "Restive means restless or impatient, not restful.",
    strategy:
      "Let the observable behavior define the emotional state; beware of words that resemble their opposites.",
    estimatedSeconds: 60,
  }),
  original({
    id: "v27-se-04",
    format: "se",
    topic: "Sentence equivalence",
    skill: "Direction of evidence",
    difficulty: "Advanced",
    stem: "The recording was _____: by placing the accused in another city at the relevant time, it established that she could not have committed the offense.",
    choices: [
      "exculpatory",
      "tangential",
      "equivocal",
      "exonerating",
      "inculpatory",
      "incriminating",
    ],
    answers: [0, 3],
    explanation:
      "Exculpatory and exonerating both describe evidence that clears a person of blame. Incriminating and inculpatory form the opposite pair. Equivocal would leave the evidence uncertain, whereas the sentence describes a decisive alibi.",
    trap: "Several words share a legal context; their direction—toward blame or away from it—is decisive.",
    strategy:
      "Translate the evidence’s effect into “clears” or “implicates” before pairing the vocabulary.",
    estimatedSeconds: 75,
  }),
  original({
    id: "v27-se-05",
    format: "se",
    topic: "Sentence equivalence",
    skill: "Tone and communicative effect",
    difficulty: "Advanced",
    stem: "To avoid provoking either faction, the spokesperson confined herself to _____ remarks about the value of cooperation, endorsing no disputed proposal.",
    choices: [
      "inquisitive",
      "provocative",
      "anodyne",
      "trenchant",
      "innocuous",
      "incendiary",
    ],
    answers: [2, 4],
    explanation:
      "Anodyne and innocuous fit remarks designed to be harmless and inoffensive. Incendiary and provocative would inflame disagreement. Trenchant suggests sharp, penetrating commentary, not deliberately noncommittal reassurance.",
    trap: "A statement can sound positive while avoiding every disputed issue.",
    strategy:
      "Identify the speaker’s stated purpose, then test whether each candidate would advance or defeat it.",
    estimatedSeconds: 80,
  }),
  original({
    id: "v27-se-06",
    format: "se",
    topic: "Sentence equivalence",
    skill: "Public rejection",
    difficulty: "Advanced",
    stem: "After documenting the damage caused by the practice, the association voted to _____ it, publicly declaring that its members would no longer participate.",
    choices: ["sanitize", "renounce", "recast", "abjure", "extol", "embrace"],
    answers: [1, 3],
    explanation:
      "Renounce and abjure both mean formally or openly reject and give up. Recast would mean alter the practice rather than abandon it. Sanitize would make it appear more acceptable, contrary to the public rejection.",
    trap: "Do not substitute reforming an activity for the stronger action of giving it up.",
    strategy:
      "Use “would no longer participate” to determine the required degree of rejection.",
    estimatedSeconds: 75,
  }),
  original({
    id: "v27-se-07",
    format: "se",
    topic: "Sentence equivalence",
    skill: "Temporal pattern",
    difficulty: "Standard",
    stem: "The correspondence was _____, with clusters of letters separated by long intervals in which neither writer sent anything.",
    choices: [
      "incessant",
      "intermittent",
      "voluminous",
      "prolific",
      "continuous",
      "sporadic",
    ],
    answers: [1, 5],
    explanation:
      "Sporadic and intermittent both describe activity occurring with gaps rather than continuously. Prolific and voluminous concern quantity, not distribution over time. Continuous and incessant contradict the long silent intervals.",
    trap: "A large number of letters can still be exchanged intermittently; quantity and frequency pattern are distinct.",
    strategy:
      "Identify whether the clue concerns amount, regularity, duration, or tone before choosing a pair.",
    estimatedSeconds: 60,
  }),
  original({
    id: "v27-se-08",
    format: "se",
    topic: "Sentence equivalence",
    skill: "Persistence of a habit",
    difficulty: "Advanced",
    stem: "The habit was so _____ that even employees who recognized its inefficiency reverted to it whenever work became hectic.",
    choices: [
      "inchoate",
      "transitory",
      "ingrained",
      "deliberate",
      "expedient",
      "entrenched",
    ],
    answers: [2, 5],
    explanation:
      "Entrenched and ingrained describe a deeply established habit that persists despite conscious criticism. Expedient means convenient for an immediate purpose, which is not the same as deeply established. Inchoate and transitory contradict its persistent character.",
    trap: "Recognition of a habit’s flaws does not imply that the habit is easy to change.",
    strategy:
      "Use the repeated reversion as evidence of depth and persistence, not deliberate endorsement.",
    estimatedSeconds: 75,
  }),
  original({
    id: "v27-se-09",
    format: "se",
    topic: "Sentence equivalence",
    skill: "Replacement versus addition",
    difficulty: "Standard",
    stem: "The digital index was designed to _____ the card catalog, which the library planned to retire once the migration was complete.",
    choices: [
      "augment",
      "supplement",
      "supplant",
      "emulate",
      "corroborate",
      "displace",
    ],
    answers: [2, 5],
    explanation:
      "Supplant and displace both fit replacing the card catalog. Supplement and augment would add to a catalog that remains in use, but the retirement plan rules that out. Emulate means imitate, which does not necessarily involve replacement.",
    trap: "The purpose clause about retirement settles whether the new system replaces or merely adds to the old one.",
    strategy:
      "Read to the end before choosing between words for replacement and words for addition.",
    estimatedSeconds: 65,
  }),
  original({
    id: "v27-se-10",
    format: "se",
    topic: "Sentence equivalence",
    skill: "Emotional stance",
    difficulty: "Advanced",
    stem: "Although personally affected by the decision, the analyst’s published assessment remained _____, evaluating the evidence without visible anger or enthusiasm.",
    choices: [
      "detached",
      "apathetic",
      "dispassionate",
      "indifferent",
      "fervent",
      "partisan",
    ],
    answers: [0, 2],
    explanation:
      "Dispassionate and detached describe the emotionally restrained assessment. Indifferent and apathetic imply a lack of interest or concern, which the sentence does not establish; personal involvement can coexist with an impartial analytical tone.",
    trap: "An unemotional evaluation is not proof that its author does not care.",
    strategy:
      "Distinguish the tone of the written assessment from the analyst’s level of personal concern.",
    estimatedSeconds: 80,
  }),
  original({
    id: "v27-se-11",
    format: "se",
    topic: "Sentence equivalence",
    skill: "Relevance to an argument",
    difficulty: "Standard",
    stem: "The author’s popularity is _____ to the question of whether her calculation is correct; the arithmetic can be checked without knowing anything about her readership.",
    choices: [
      "salient",
      "incontrovertible",
      "decisive",
      "irrelevant",
      "extraneous",
      "germane",
    ],
    answers: [3, 4],
    explanation:
      "Extraneous and irrelevant both mean that popularity has no bearing on checking the calculation. Germane means relevant and reverses the claim. Incontrovertible concerns certainty, not whether a fact bears on the question.",
    trap: "A fact may be true or striking without being relevant to the conclusion under examination.",
    strategy:
      "Ask whether changing the proposed fact would alter the validity of the calculation.",
    estimatedSeconds: 70,
  }),
  original({
    id: "v27-se-12",
    format: "se",
    topic: "Sentence equivalence",
    skill: "Context-specific meaning",
    difficulty: "Advanced",
    stem: "Of two explanations that fit the evidence equally well, the committee preferred the more _____ one, which required fewer independent assumptions.",
    choices: [
      "profligate",
      "parsimonious",
      "economical",
      "counterintuitive",
      "orthodox",
      "elaborate",
    ],
    answers: [1, 2],
    explanation:
      "Parsimonious and economical both describe an explanation that uses fewer assumptions. Here parsimonious concerns theoretical economy, not reluctance to spend money. Orthodox means conventional, a different criterion from the number of assumptions.",
    trap: "A word’s familiar everyday sense may not be its relevant sense in an academic context.",
    strategy:
      "Use the explicit criterion after the comma to select the contextual meaning of each word.",
    estimatedSeconds: 80,
  }),
];

const busPassage: PrepPassage = {
  id: "v27-p-bus",
  title: "Arrival information",
  sentences: [
    "A transit agency installed live arrival displays at selected stops on six bus routes.",
    "Over the following six months, ridership on those routes rose by eight percent, while ridership on six comparison routes remained approximately constant.",
    "Fares and scheduled service frequency were unchanged in both groups.",
    "Agency officials attributed the increase to reduced uncertainty about waiting, arguing that the displays persuaded more commuters to take the bus.",
    "The pilot routes had been chosen because electrical connections at their stops made installation inexpensive, rather than through random assignment.",
    "The comparison therefore supplies evidence consistent with the officials’ explanation, but it does not exclude changes affecting only the communities served by the pilot routes.",
    "A stronger evaluation would investigate such changes before assigning the entire increase to the displays.",
  ],
};
const dyePassage: PrepPassage = {
  id: "v27-p-dye",
  title: "Tracing a textile dye",
  sentences: [
    "A museum researcher argues that a surviving textile was colored with an imported plant dye rather than a locally available mineral pigment.",
    "Her strongest evidence is a chemical marker found in several samples taken from its surface.",
    "Laboratory reference samples show that the plant dye produces this marker, whereas the proposed mineral pigment does not.",
    "However, an adhesive sometimes used in textile restoration can also produce the marker as it ages.",
    "The museum has no record of adhesive being applied to this textile, but its restoration records are incomplete.",
    "Samples from fibers inside a tightly folded seam, if the seam had remained closed since manufacture, could help distinguish an original dye from a later surface treatment.",
    "The relevant question is thus not merely whether the marker is present, but how it came to be present in the sampled fibers.",
  ],
};
const auditPassage: PrepPassage = {
  id: "v27-p-audits",
  title: "What an audit counts",
  sentences: [
    "A software consortium tested whether paying reviewers would increase the number of serious vulnerabilities they uncovered.",
    "Reviewers of comparable prior experience were randomly assigned to paid and unpaid groups, given identical copies of the same frozen source code, and allotted the same amount of review time.",
    "Each report concerned one alleged serious flaw, and duplicate reports of the same alleged flaw were counted only once within each group; the paid group then had substantially more reports than the unpaid group.",
    "On this basis, the consortium concluded that payment had increased the discovery of genuine serious flaws and recommended paying future reviewers.",
    "The reported problems had not yet undergone independent technical validation, however.",
    "A report may identify a real vulnerability, but it may instead describe harmless behavior that the reviewer has misunderstood.",
    "The experiment therefore directly measured report production, while leaving the relationship between that measure and validated discoveries unresolved.",
  ],
};
const bookingPassage: PrepPassage = {
  id: "v27-p-bookings",
  title: "What counts as a booking",
  sentences: [
    "After a restaurant introduced a refundable reservation deposit, the manager found that the number of advance reservations fell, yet the number of diners served increased.",
    "In its reports, an advance reservation meant a booking made at least twenty-four hours before the meal.",
    "Opening hours, seating capacity, and average dining-party size were unchanged between the two periods.",
    "The restaurant accepted no walk-in customers in either period, so every party that ate there had made a reservation.",
    "The manager initially regarded the figures as inconsistent, assuming that fewer advance reservations must imply fewer reserved tables in total.",
    "That inference treats the timing category used in the report as if it covered every possible reservation.",
    "To resolve the apparent conflict, it is necessary to distinguish the reported category from bookings made closer to the meal itself.",
  ],
};
const translationPassage: PrepPassage = {
  id: "v27-p-translation",
  title: "Fidelity and familiar language",
  sentences: [
    "Discussions of literary translation often treat closeness to the source’s individual words as a convenient measure of fidelity.",
    "This measure can be useful when a particular image or repeated term matters to the work’s structure, but it becomes misleading when it ignores how language functions for its original audience.",
    "An expression that was ordinary and conversational when a novel appeared may sound ceremonious or obscure if translated with words selected chiefly for their historical resemblance.",
    "Such a translation can preserve lexical associations while altering the social impression made by a speaker.",
    "A familiar contemporary expression may therefore better preserve the character’s unpretentious manner, even when it departs from the source’s verbal form.",
    "This is not a license to modernize every feature indiscriminately: a deliberately archaic phrase may be meant to make a character sound affected.",
    "Fidelity requires deciding which effect a particular expression creates, rather than applying one degree of literalness throughout a work.",
  ],
};
const sedimentPassage: PrepPassage = {
  id: "v27-p-sediment",
  title: "Charcoal in a sediment core",
  sentences: [
    "A lake-sediment core contains a layer with a much higher concentration of microscopic charcoal than the layers immediately below it.",
    "Researchers initially took this increase as evidence of more frequent forest fires near the lake.",
    "Yet concentration measures particles relative to the amount of sediment, so it can rise when sediment accumulates more slowly even if charcoal delivery remains unchanged.",
    "With reliable dates and estimates of sediment accumulation, researchers can instead calculate charcoal flux: the number of particles deposited per unit of lake-bed area per year.",
    "A rise in concentration without a rise in flux would be consistent with reduced dilution by other sediment.",
    "A rise in flux would establish increased charcoal delivery, but would not by itself establish more frequent fires, because changes in erosion or wind could transport more charcoal to the lake.",
    "Dating can thus help distinguish a delivery change from a dilution change, while additional evidence is needed to identify the cause of increased delivery.",
  ],
};

// Related questions share the same passage object and stable passage ID.
const readingQuestions: PrepQuestion[] = [
  original({
    id: "v27-rc-01",
    format: "rc-single",
    topic: "Reading comprehension",
    skill: "Weaken a causal claim",
    difficulty: "Advanced",
    passage: busPassage,
    stem: "Which finding would most seriously weaken the officials’ explanation of the ridership increase?",
    choices: [
      "The displays were easiest to read after sunset.",
      "Major employers served by the pilot routes ended subsidized employee parking when the displays were installed, while employers served by comparison routes retained it.",
      "Some passengers on the pilot routes occasionally traveled on comparison routes.",
      "The agency paid less to install the displays than it had initially budgeted.",
      "The displays showed the expected arrival of more than one bus.",
    ],
    answers: [1],
    explanation:
      "Losing subsidized parking creates an alternative reason for commuters on pilot routes, specifically, to switch to buses at the relevant time. The unchanged comparison routes therefore do not isolate the displays’ effect. The other findings do not supply a competing cause for the selective increase.",
    trap: "A detail about display usability does not establish that the increase would have occurred without the displays.",
    strategy:
      "Identify the proposed cause and look for another change that differs between the two groups and predicts the same outcome.",
    estimatedSeconds: 110,
  }),
  original({
    id: "v27-rc-02",
    format: "rc-multi",
    topic: "Reading comprehension",
    skill: "Separate evidence from inference",
    difficulty: "Standard",
    passage: busPassage,
    stem: "Which statements are supported by the passage? Select all that apply.",
    choices: [
      "The pilot and comparison routes retained their scheduled service frequencies during the study.",
      "The agency selected pilot routes on the basis of anticipated ridership growth.",
      "The observed ridership pattern is compatible with the displays having an effect.",
    ],
    answers: [0, 2],
    explanation:
      "The passage explicitly holds scheduled frequency constant. It also says the evidence is consistent with the officials’ account. The route-selection criterion was inexpensive installation, not anticipated ridership growth.",
    trap: "Nonrandom selection does not license inventing a particular unreported selection criterion.",
    strategy:
      "Test each option separately; distinguish what the study permits from what it proves.",
    estimatedSeconds: 65,
  }),
  original({
    id: "v27-rc-03",
    format: "rc-sentence",
    topic: "Reading comprehension",
    skill: "Locate a methodological limitation",
    difficulty: "Standard",
    passage: busPassage,
    stem: "Select the sentence that most directly states why the comparison does not establish the officials’ causal conclusion.",
    sentenceAnswer: 5,
    explanation:
      "The sixth sentence identifies the remaining alternative: changes confined to communities served by pilot routes. The preceding sentence describes the selection method but does not itself articulate the inferential limitation.",
    trap: "A description of design is not the same as the sentence explaining its consequence.",
    strategy:
      "Find the sentence that connects the evidence to what cannot yet be concluded.",
    estimatedSeconds: 55,
  }),
  original({
    id: "v27-rc-04",
    format: "rc-single",
    topic: "Reading comprehension",
    skill: "Strengthen an attribution",
    difficulty: "Advanced",
    passage: dyePassage,
    stem: "Which additional finding would most strengthen the researcher’s attribution to the plant dye?",
    choices: [
      "The textile’s current color is attractive to museum visitors.",
      "Most textiles in the museum have never been restored.",
      "The adhesive becomes less visible as it ages.",
      "Fibers sealed inside an original seam contain the marker together with a second compound produced by the plant dye but by neither the adhesive nor the mineral pigment.",
      "The mineral pigment was less expensive than the imported plant dye.",
    ],
    answers: [3],
    explanation:
      "The protected location reduces the plausibility of a later surface treatment, and the second compound independently distinguishes the plant dye from both specified alternatives. A collection-wide restoration rate cannot settle the history of this particular textile.",
    trap: "General prevalence is weaker than evidence directly distinguishing candidate sources in the object under study.",
    strategy:
      "Favor evidence that fits the proposed explanation and is difficult for the strongest alternative to explain.",
    estimatedSeconds: 110,
  }),
  original({
    id: "v27-rc-05",
    format: "rc-multi",
    topic: "Reading comprehension",
    skill: "Identify limits of evidence",
    difficulty: "Standard",
    passage: dyePassage,
    stem: "Which statements can be inferred from the passage? Select all that apply.",
    choices: [
      "The chemical marker has more than one possible source.",
      "The museum’s records establish that no adhesive was used.",
      "The location from which a sample is taken may affect its usefulness for identifying the original dye.",
    ],
    answers: [0, 2],
    explanation:
      "Both the plant dye and aging adhesive can produce the marker. Incomplete records cannot establish the absence of adhesive. The proposed sampling inside a protected seam explicitly makes location relevant to interpretation.",
    trap: "Absence from incomplete records does not establish that an event never occurred.",
    strategy:
      "Check whether each inference survives the author’s stated qualifications.",
    estimatedSeconds: 70,
  }),
  original({
    id: "v27-rc-06",
    format: "rc-sentence",
    topic: "Reading comprehension",
    skill: "Identify an alternative explanation",
    difficulty: "Standard",
    passage: dyePassage,
    stem: "Select the sentence that introduces a specific alternative source of the chemical evidence.",
    sentenceAnswer: 3,
    explanation:
      "The fourth sentence identifies aging restoration adhesive as another producer of the marker. The next sentence evaluates how confidently that alternative can be excluded but does not introduce it.",
    trap: "Evidence about an alternative is not the initial statement of that alternative.",
    strategy:
      "Locate the newly introduced mechanism capable of producing the observed result.",
    estimatedSeconds: 50,
  }),
  original({
    id: "v27-rc-07",
    format: "rc-single",
    topic: "Reading comprehension",
    skill: "Identify a necessary assumption",
    difficulty: "Advanced",
    passage: auditPassage,
    stem: "The consortium’s inference that payment increased the discovery of genuine serious flaws depends on which assumption?",
    choices: [
      "Every submitted report accurately identifies a serious vulnerability.",
      "Paid reviewers would always outperform unpaid reviewers on any source code.",
      "The paid group’s advantage in total reports is not offset by an equally large or larger excess of reports that would fail technical validation.",
      "Independent validation requires less time than reviewing source code.",
      "No unpaid reviewer has previously received payment for technical work.",
    ],
    answers: [2],
    explanation:
      "Genuine discoveries are what remains after invalid reports are excluded. If the paid group’s extra reports were offset by an equal or larger excess of invalid reports, it would have no advantage in genuine discoveries. The inference therefore requires that this offset not occur. It does not require every report to be accurate or the result to generalize to all source code.",
    trap: "An assumption strong enough to guarantee a conclusion can be stronger than the reasoning actually needs.",
    strategy:
      "Negate the proposed assumption and subtract invalid reports from each group’s total; ask whether the claimed advantage survives.",
    estimatedSeconds: 115,
  }),
  original({
    id: "v27-rc-08",
    format: "rc-multi",
    topic: "Reading comprehension",
    skill: "Distinguish observation from conclusion",
    difficulty: "Standard",
    passage: auditPassage,
    stem: "Which statements describe features of the experiment explicitly reported in the passage? Select all that apply.",
    choices: [
      "Both groups reviewed copies of the same fixed source code.",
      "The paid group had greater prior technical experience.",
      "The classification of submitted problems had not yet been independently validated.",
    ],
    answers: [0, 2],
    explanation:
      "The study used identical frozen code and reviewers of comparable experience. The passage explicitly states that independent validation had not occurred. The reported output difference does not establish a preexisting difference in experience.",
    trap: "Do not treat a possible cause of a result as an observed difference when the passage expressly controls it.",
    strategy:
      "Match each option to a described procedure rather than to the consortium’s interpretation.",
    estimatedSeconds: 75,
  }),
  original({
    id: "v27-rc-09",
    format: "rc-sentence",
    topic: "Reading comprehension",
    skill: "Identify the evidence gap",
    difficulty: "Standard",
    passage: auditPassage,
    stem: "Select the sentence that states a missing procedure relevant to distinguishing reported problems from genuine vulnerabilities.",
    sentenceAnswer: 4,
    explanation:
      "The fifth sentence states that independent technical validation has not occurred. The sixth explains why that check matters, and the seventh summarizes the limitation; neither is the sentence that directly reports the missing procedure.",
    trap: "The rationale for a procedure is not the statement that the procedure has not occurred.",
    strategy:
      "Look for the explicit omission in the study’s method, not merely a related criticism.",
    estimatedSeconds: 55,
  }),
  original({
    id: "v27-rc-10",
    format: "rc-single",
    topic: "Reading comprehension",
    skill: "Resolve an apparent paradox",
    difficulty: "Advanced",
    passage: bookingPassage,
    stem: "Which finding best resolves the apparent conflict between fewer advance reservations and more diners served?",
    choices: [
      "The deposit policy was unpopular with some former customers.",
      "The number of honored reservations made less than twenty-four hours before a meal rose by more than the decline in honored advance reservations.",
      "The restaurant’s staff preferred reservations made well in advance.",
      "Deposits were refunded using the same payment method by which they were collected.",
      "The manager reviewed the reservation figures more frequently after the policy changed.",
    ],
    answers: [1],
    explanation:
      "Late bookings are excluded from the advance-reservation measure but can still bring diners to the restaurant. The stated rise in honored late bookings more than offsets the fall in honored advance bookings; with average party size unchanged, more diners can therefore be served. The other findings do not reconcile the counted outcomes.",
    trap: "Every diner requiring a reservation does not mean every diner required an advance reservation as the restaurant defines it.",
    strategy:
      "Identify the exact population counted by each statistic before deciding that their directions conflict.",
    estimatedSeconds: 100,
  }),
  original({
    id: "v27-rc-11",
    format: "rc-multi",
    topic: "Reading comprehension",
    skill: "Respect a metric’s definition",
    difficulty: "Standard",
    passage: bookingPassage,
    stem: "Which statements must be true on the information given? Select all that apply.",
    choices: [
      "Every reservation made in either period was made at least twenty-four hours before the meal.",
      "Every party served during the two periods had made a reservation.",
      "Introducing the deposit caused the increase in diners served.",
    ],
    answers: [1],
    explanation:
      "The no-walk-in rule establishes that every party served had made a reservation. The passage does not establish that all reservations were advance reservations, and a before-and-after pattern alone does not prove that the deposit caused the increase.",
    trap: "A select-all question can have only one correct option; do not add a merely plausible causal claim.",
    strategy:
      "Evaluate each option independently and keep temporal sequence separate from causation.",
    estimatedSeconds: 65,
  }),
  original({
    id: "v27-rc-12",
    format: "rc-sentence",
    topic: "Reading comprehension",
    skill: "Locate a flawed inference",
    difficulty: "Advanced",
    passage: bookingPassage,
    stem: "Select the sentence that directly characterizes the mistaken equivalence underlying the manager’s initial interpretation.",
    sentenceAnswer: 5,
    explanation:
      "The sixth sentence diagnoses the error: treating one timing category as all reservations. The fifth reports the manager’s assumption, while the seventh proposes how to correct it.",
    trap: "The question asks for the analysis of the mistake, not merely the sentence reporting the manager’s belief.",
    strategy:
      "Separate a viewpoint from the author’s diagnosis of its logical structure.",
    estimatedSeconds: 55,
  }),
  original({
    id: "v27-rc-13",
    format: "rc-single",
    topic: "Reading comprehension",
    skill: "Main claim with qualification",
    difficulty: "Standard",
    passage: translationPassage,
    stem: "Which statement best expresses the passage’s central claim?",
    choices: [
      "Translations should replace all historical expressions with contemporary slang.",
      "Lexical closeness is the only reliable criterion of a translation’s quality.",
      "A translation’s fidelity depends partly on preserving the function of language, so the appropriate degree of literalness may vary.",
      "Readers of translations cannot understand the social impressions created by characters.",
      "Deliberately archaic expressions are normally accidental defects in the source text.",
    ],
    answers: [2],
    explanation:
      "The author allows lexical closeness to matter but argues that communicative and social effects also matter, requiring case-by-case decisions. The qualification about deliberate archaism rules out indiscriminate modernization.",
    trap: "A conditional defense of contemporary language is not a universal preference for it.",
    strategy:
      "Build the main claim from both the recommendation and its limiting qualification.",
    estimatedSeconds: 100,
  }),
  original({
    id: "v27-rc-14",
    format: "rc-single",
    topic: "Reading comprehension",
    skill: "Apply an interpretive principle",
    difficulty: "Advanced",
    passage: translationPassage,
    stem: "Which translation choice would the author most likely endorse, given only the stated circumstances?",
    choices: [
      "Rendering a character’s deliberately pompous archaic greeting as casual slang to make the text easier.",
      "Using an ordinary contemporary phrase for dialogue that was ordinary to its original audience, when a historically similar rendering would wrongly make the speaker sound grandiose.",
      "Retaining the same English term for every occurrence of two different source words regardless of context.",
      "Replacing a structurally important recurring image with a different image at each appearance.",
      "Making every character speak in the same register to ensure stylistic consistency.",
    ],
    answers: [1],
    explanation:
      "The ordinary contemporary phrase preserves the original speech’s ordinary social effect and avoids an unintended grandiose impression. The other choices erase deliberate effects or structural distinctions the passage says can matter.",
    trap: "Ease of reading alone does not justify changing a feature whose strangeness is intentional.",
    strategy:
      "Ask what the expression did for its original audience, then choose the option that preserves that function.",
    estimatedSeconds: 75,
  }),
  original({
    id: "v27-rc-15",
    format: "rc-single",
    topic: "Reading comprehension",
    skill: "Function of a methodological proposal",
    difficulty: "Advanced",
    passage: sedimentPassage,
    stem: "The discussion of calculating charcoal flux primarily serves to:",
    choices: [
      "show that all historical changes in fire frequency can be recovered without uncertainty.",
      "provide a way to distinguish increased charcoal delivery from an apparent increase caused by slower sediment accumulation.",
      "establish that wind is more important than fire in producing charcoal.",
      "explain why counting charcoal particles is unnecessary.",
      "prove that the initial interpretation of the core must be false.",
    ],
    answers: [1],
    explanation:
      "Flux accounts for accumulation over time and area, allowing researchers to test whether higher concentration reflects greater delivery or less dilution. The passage retains other explanations for increased delivery, so the measure does not by itself recover fire frequency or disprove the initial claim.",
    trap: "A method that resolves one ambiguity does not automatically resolve every subsequent causal question.",
    strategy:
      "Match the proposed measurement to the particular alternative explanation it addresses.",
    estimatedSeconds: 110,
  }),
  original({
    id: "v27-rc-16",
    format: "rc-single",
    topic: "Reading comprehension",
    skill: "Draw a bounded inference",
    difficulty: "Advanced",
    passage: sedimentPassage,
    stem: "Suppose reliable dating shows that both charcoal concentration and charcoal flux rose in the layer. Which conclusion is best supported by the passage?",
    choices: [
      "Fire frequency necessarily increased near the lake.",
      "The rise in concentration can be explained entirely by slower accumulation of noncharcoal sediment.",
      "More charcoal reached the sampled area per year, although the cause of that increase remains to be established.",
      "Changes in wind and erosion can be ruled out.",
      "The number of fires increased by the same percentage as charcoal concentration.",
    ],
    answers: [2],
    explanation:
      "Increased flux directly indicates more particles deposited per area per year. This rules out reduced dilution as the entire explanation but does not separate more burning from changes in transport. No evidence establishes a number or percentage change in fires.",
    trap: "Increased delivery of a proxy is not equivalent to an increase in the event it is intended to represent.",
    strategy:
      "Stop at the strongest conclusion directly supported by the measurement, retaining the alternatives the author leaves open.",
    estimatedSeconds: 80,
  }),
];

export const verbalQuestions: PrepQuestion[] = [
  ...completionQuestions,
  ...equivalenceQuestions,
  ...readingQuestions,
];
