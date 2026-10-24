/** Original practice written for this app; not official ETS questions or a score predictor. */
export type Difficulty = "Foundation" | "Building" | "Challenge";
export interface PracticeQuestion {
  id: string;
  type: "context" | "equivalence";
  prompt: string;
  choices: string[];
  answers: number[];
  explanation: string;
  skill: string;
  difficulty: Difficulty;
}

export const practiceQuestions: PracticeQuestion[] = [
  {
    id: "tc-01",
    type: "context",
    difficulty: "Foundation",
    skill: "Contrast clues",
    prompt:
      "Although the lecturer addressed a notoriously complex subject, her explanation was remarkably _____; even newcomers could follow each step.",
    choices: ["lucid", "elliptical", "pedantic", "tentative", "convoluted"],
    answers: [0],
    explanation:
      "The newcomers could follow every step, so the explanation was lucid: clear and easy to understand. “Although” contrasts this clarity with the complexity of the subject. Pedantic means overly concerned with small details; it does not establish clarity.",
  },
  {
    id: "tc-02",
    type: "context",
    difficulty: "Foundation",
    skill: "Supporting evidence",
    prompt:
      "The archivist was _____ in checking the catalog: she verified every date against the original document and recorded even minor discrepancies.",
    choices: [
      "perfunctory",
      "meticulous",
      "impetuous",
      "credulous",
      "equivocal",
    ],
    answers: [1],
    explanation:
      "Checking every date and recording tiny differences demonstrate meticulous care. Perfunctory would describe doing a task with little care. Credulous means too willing to believe, whereas this archivist verifies the evidence.",
  },
  {
    id: "tc-03",
    type: "context",
    difficulty: "Foundation",
    skill: "Contrast clues",
    prompt:
      "Far from being _____, the committee welcomed criticism and revised its proposal when opponents identified weaknesses.",
    choices: [
      "conciliatory",
      "impartial",
      "dogmatic",
      "deliberate",
      "pragmatic",
    ],
    answers: [2],
    explanation:
      "“Far from being” reverses the evidence. A committee willing to revise its beliefs is not dogmatic, or rigidly insistent that its views are correct. Conciliatory fits its cooperative behavior, but the sentence requires the opposite.",
  },
  {
    id: "tc-04",
    type: "context",
    difficulty: "Foundation",
    skill: "Meaning in context",
    prompt:
      "The headline called the discovery revolutionary, but the study itself made the more _____ claim that the treatment might help a small subset of patients.",
    choices: ["sweeping", "derivative", "polemical", "categorical", "modest"],
    answers: [4],
    explanation:
      "The actual claim is limited to a possible benefit for a small group, making it modest. Sweeping and categorical suggest broad or unqualified claims. Derivative concerns originality, which the sentence does not address.",
  },
  {
    id: "tc-05",
    type: "context",
    difficulty: "Foundation",
    skill: "Cause and effect",
    prompt:
      "Because the instructions were _____, two equally careful technicians interpreted them in incompatible ways.",
    choices: ["explicit", "redundant", "succinct", "ambiguous", "mandatory"],
    answers: [3],
    explanation:
      "Two reasonable but incompatible interpretations point to ambiguous instructions: wording open to more than one meaning. Succinct instructions are brief, but brevity alone does not cause conflicting interpretations.",
  },
  {
    id: "tc-06",
    type: "context",
    difficulty: "Foundation",
    skill: "Tone",
    prompt:
      "The critic praised the novel without a single reservation; her review was wholly _____.",
    choices: [
      "laudatory",
      "caustic",
      "ambivalent",
      "dispassionate",
      "reticent",
    ],
    answers: [0],
    explanation:
      "Praise without reservations is laudatory. Ambivalent would require mixed feelings. Dispassionate means emotionally detached and does not itself convey praise.",
  },
  {
    id: "tc-07",
    type: "context",
    difficulty: "Building",
    skill: "Concession",
    prompt:
      "The engineer conceded that the prototype was _____, yet insisted that its rough appearance did not compromise its ability to perform the essential task.",
    choices: ["superfluous", "rudimentary", "unreliable", "ornate", "obsolete"],
    answers: [1],
    explanation:
      "The concession concerns a rough, basic design, so rudimentary fits. Unreliable would undermine the engineer’s claim that it performs its task. Obsolete means out of date; rough appearance does not establish that.",
  },
  {
    id: "tc-08",
    type: "context",
    difficulty: "Building",
    skill: "Logical reversal",
    prompt:
      "The new documents did not _____ the accusation, as the defendant had hoped; instead, they supplied the strongest evidence yet in its support.",
    choices: ["corroborate", "qualify", "formulate", "publicize", "refute"],
    answers: [4],
    explanation:
      "The defendant hoped the accusation would be disproved, but the evidence supported it. Refute means disprove. Corroborate means support and would make the contrast after “instead” incoherent.",
  },
  {
    id: "tc-09",
    type: "context",
    difficulty: "Building",
    skill: "Degree",
    prompt:
      "The researcher described the finding as _____: it suggested a possible relationship, but the small sample prevented a firm conclusion.",
    choices: [
      "definitive",
      "spurious",
      "incontrovertible",
      "provisional",
      "irrelevant",
    ],
    answers: [3],
    explanation:
      "A possible relationship that still needs stronger evidence is provisional, or tentative. Spurious would assert that the relationship is false; a small sample alone does not justify that stronger judgment.",
  },
  {
    id: "tc-10",
    type: "context",
    difficulty: "Building",
    skill: "Behavior as evidence",
    prompt:
      "Despite repeated requests for a direct answer, the witness remained _____, responding with carefully qualified phrases that left her position unclear.",
    choices: ["forthcoming", "equivocal", "vehement", "garrulous", "candid"],
    answers: [1],
    explanation:
      "Qualified answers that leave a position unclear are equivocal. Garrulous means excessively talkative, but the sentence concerns ambiguity rather than how much the witness says. Candid and forthcoming suggest openness.",
  },
  {
    id: "tc-11",
    type: "context",
    difficulty: "Building",
    skill: "Supporting evidence",
    prompt:
      "The editor removed the essay’s _____ passages, arguing that their elaborate repetitions obscured an otherwise concise argument.",
    choices: ["incisive", "laconic", "prolix", "germane", "cogent"],
    answers: [2],
    explanation:
      "Elaborate repetitions make passages prolix, or needlessly wordy. Laconic means brief. Germane means relevant, but relevance does not explain the editor’s objection to repetitive length.",
  },
  {
    id: "tc-12",
    type: "context",
    difficulty: "Building",
    skill: "Contrast clues",
    prompt:
      "Although its architecture seemed austere, the library’s interior was surprisingly _____, with comfortable seating, warm lighting, and inviting reading alcoves.",
    choices: [
      "forbidding",
      "utilitarian",
      "sumptuous",
      "labyrinthine",
      "hospitable",
    ],
    answers: [4],
    explanation:
      "The details emphasize a welcoming environment, making hospitable the best fit. Sumptuous suggests costly luxury, which comfortable seating and warm lighting do not establish. Forbidding would work against the inviting atmosphere.",
  },
  {
    id: "tc-13",
    type: "context",
    difficulty: "Challenge",
    skill: "Distinguishing motive from effect",
    prompt:
      "Whatever the donor’s private motives, the practical effect of her contribution was _____: it supplied equipment that the clinic urgently needed but could not afford.",
    choices: [
      "beneficent",
      "ostentatious",
      "disinterested",
      "expedient",
      "fortuitous",
    ],
    answers: [0],
    explanation:
      "The sentence explicitly separates motive from beneficial effect, so beneficent fits. Disinterested would characterize an absence of self-interest, which the sentence does not establish. Ostentatious concerns display, not the described benefit.",
  },
  {
    id: "tc-14",
    type: "context",
    difficulty: "Challenge",
    skill: "Scope of a claim",
    prompt:
      "The historian does not reject the traditional account outright; she seeks to _____ it by showing that it applies only to some regions and periods.",
    choices: ["vindicate", "supplant", "qualify", "disseminate", "repudiate"],
    answers: [2],
    explanation:
      "Showing limits to an account qualifies it without rejecting it entirely. Repudiate means reject, and supplant means replace; both go further than the historian intends. Vindicate would defend the account rather than narrow its scope.",
  },
  {
    id: "tc-15",
    type: "context",
    difficulty: "Challenge",
    skill: "Evidence limits",
    prompt:
      "It would be _____ to conclude that the absence of surviving complaints proves universal approval; the archive preserves only letters selected by the policy’s supporters.",
    choices: ["orthodox", "judicious", "inevitable", "redundant", "premature"],
    answers: [4],
    explanation:
      "The surviving evidence is selectively preserved, so concluding universal approval would be premature: insufficiently supported at this stage. Inevitable would ignore the selection problem. Orthodox means conventional, not necessarily warranted.",
  },
  {
    id: "tc-16",
    type: "context",
    difficulty: "Challenge",
    skill: "Distinguishing similar concepts",
    prompt:
      "The mediator’s tone was _____ rather than submissive: she offered concessions to reduce hostility while firmly defending the interests she represented.",
    choices: [
      "obsequious",
      "conciliatory",
      "imperious",
      "indifferent",
      "vitriolic",
    ],
    answers: [1],
    explanation:
      "Reducing hostility through reasonable concessions is conciliatory. Obsequious means excessively submissive, precisely the quality the sentence denies. Firmness does not make her imperious, which suggests domineering authority.",
  },
  {
    id: "tc-17",
    type: "context",
    difficulty: "Challenge",
    skill: "Evidence versus reputation",
    prompt:
      "The report’s reputation for _____ was undeserved: beneath its confident prose lay figures copied from an unverified source and calculations no one had checked.",
    choices: ["audacity", "originality", "rigor", "brevity", "accessibility"],
    answers: [2],
    explanation:
      "Unchecked calculations and unverified data undermine rigor, meaning thorough, disciplined accuracy. Originality is tempting because some figures were copied, but the combined clues focus on verification and care rather than novelty.",
  },
  {
    id: "tc-18",
    type: "context",
    difficulty: "Challenge",
    skill: "Sentence structure",
    prompt:
      "What appeared to be a sudden change of direction was actually the _____ of years of quiet experimentation: the final design united techniques the team had tested separately.",
    choices: [
      "repudiation",
      "interruption",
      "culmination",
      "aberration",
      "precondition",
    ],
    answers: [2],
    explanation:
      "A final design that brings together earlier experiments is their culmination, the resulting high point. A precondition would have to precede the experiments. Repudiation would reject the techniques rather than unite them.",
  },
  {
    id: "se-01",
    type: "equivalence",
    difficulty: "Foundation",
    skill: "Pair meaning with evidence",
    prompt:
      "The guide’s instructions were so _____ that visitors found their way without asking a single follow-up question.",
    choices: [
      "lucid",
      "terse",
      "cryptic",
      "clear",
      "abbreviated",
      "circuitous",
    ],
    answers: [0, 3],
    explanation:
      "Lucid and clear both explain why no clarification was needed. Terse and abbreviated form a tempting pair about brevity, but brief instructions are not necessarily understandable. The right pair must fit the evidence as well as each other.",
  },
  {
    id: "se-02",
    type: "equivalence",
    difficulty: "Foundation",
    skill: "Contrast and synonym pairs",
    prompt:
      "Unlike her impulsive predecessor, the director was _____, considering the likely consequences before making even minor changes.",
    choices: [
      "rash",
      "circumspect",
      "indecisive",
      "capricious",
      "prudent",
      "timid",
    ],
    answers: [1, 4],
    explanation:
      "Circumspect and prudent both convey thoughtful caution. Timid and indecisive could explain hesitation, but the director is shown considering consequences, not fearing action or failing to decide.",
  },
  {
    id: "se-03",
    type: "equivalence",
    difficulty: "Foundation",
    skill: "Supporting evidence",
    prompt:
      "The audience found the speaker _____, for every answer expanded into a lengthy story only loosely connected to the question.",
    choices: [
      "taciturn",
      "concise",
      "garrulous",
      "candid",
      "reticent",
      "talkative",
    ],
    answers: [2, 5],
    explanation:
      "Garrulous and talkative fit the lengthy stories. Taciturn and reticent also form a related pair, but both suggest reluctance to speak and contradict the evidence. Candid concerns honesty, not length.",
  },
  {
    id: "se-04",
    type: "equivalence",
    difficulty: "Foundation",
    skill: "Contrast clues",
    prompt:
      "Although the critic initially dismissed the proposal, new evidence made her earlier objections _____.",
    choices: [
      "tenable",
      "untenable",
      "irrelevant",
      "indefensible",
      "pertinent",
      "fashionable",
    ],
    answers: [1, 3],
    explanation:
      "Untenable and indefensible both mean that the objections can no longer be reasonably maintained. Irrelevant means unrelated to the issue; it is not equivalent to being unsupported. The contrast signals that the evidence weakened the objections.",
  },
  {
    id: "se-05",
    type: "equivalence",
    difficulty: "Building",
    skill: "Concession",
    prompt:
      "Though celebrated for his bold theories, the scientist was _____ about announcing results, withholding them until several independent tests agreed.",
    choices: [
      "cautious",
      "reckless",
      "unorthodox",
      "apathetic",
      "innovative",
      "circumspect",
    ],
    answers: [0, 5],
    explanation:
      "Circumspect and cautious describe delaying an announcement until independent tests agree. Unorthodox and innovative match the reputation for bold theories but not the contrasting behavior introduced by “though.”",
  },
  {
    id: "se-06",
    type: "equivalence",
    difficulty: "Building",
    skill: "Meaning in context",
    prompt:
      "The museum’s new labels are deliberately _____, explaining each object in plain language without specialized terminology.",
    choices: [
      "esoteric",
      "exhaustive",
      "accessible",
      "comprehensive",
      "comprehensible",
      "arcane",
    ],
    answers: [2, 4],
    explanation:
      "Accessible and comprehensible both mean easy to understand in this context. Exhaustive and comprehensive concern completeness, which plain language does not establish. Esoteric and arcane describe the opposite of the labels’ approach.",
  },
  {
    id: "se-07",
    type: "equivalence",
    difficulty: "Building",
    skill: "Degree and qualification",
    prompt:
      "Because the measurements have not yet been replicated, the team regards its conclusion as _____.",
    choices: [
      "infallible",
      "fraudulent",
      "spurious",
      "tentative",
      "provisional",
      "definitive",
    ],
    answers: [3, 4],
    explanation:
      "Provisional and tentative mean subject to further confirmation. Fraudulent and spurious go too far: a lack of replication does not prove deception or falsity. Infallible and definitive overstate the certainty.",
  },
  {
    id: "se-08",
    type: "equivalence",
    difficulty: "Building",
    skill: "Behavior as evidence",
    prompt:
      "The reviewer was _____ in her criticism, attacking the author with cutting ridicule rather than calmly examining his evidence.",
    choices: [
      "acerbic",
      "dispassionate",
      "meticulous",
      "caustic",
      "impartial",
      "restrained",
    ],
    answers: [0, 3],
    explanation:
      "Acerbic and caustic both describe biting, harsh criticism. Meticulous could describe careful examination, which the sentence contrasts with her actual approach. Dispassionate and impartial imply detachment rather than ridicule.",
  },
  {
    id: "se-09",
    type: "equivalence",
    difficulty: "Challenge",
    skill: "Context-specific synonymy",
    prompt:
      "The manager’s apparent agreement was _____: in private she rejected the policy and took no steps to implement it.",
    choices: [
      "sincere",
      "simulated",
      "reluctant",
      "genuine",
      "qualified",
      "feigned",
    ],
    answers: [1, 5],
    explanation:
      "Feigned and simulated indicate a pretense of agreement. Reluctant or qualified agreement could still be real agreement, but the private rejection shows that her public assent was an act. Sincere and genuine reverse the meaning.",
  },
  {
    id: "se-10",
    type: "equivalence",
    difficulty: "Challenge",
    skill: "Avoiding the obvious wrong pair",
    prompt:
      "For all its ornate language, the speech was intellectually _____, repeating familiar slogans without developing a single substantive idea.",
    choices: [
      "empty",
      "florid",
      "vacuous",
      "erudite",
      "grandiloquent",
      "abstruse",
    ],
    answers: [0, 2],
    explanation:
      "Vacuous and empty capture the lack of intellectual substance. Florid and grandiloquent describe the ornate style, but the blank follows “intellectually” and must characterize the content. Abstruse means difficult to understand, not devoid of ideas.",
  },
  {
    id: "se-11",
    type: "equivalence",
    difficulty: "Challenge",
    skill: "Limits of inference",
    prompt:
      "The audit was _____ in scope, examining only travel expenses rather than attempting to assess the organization’s entire financial position.",
    choices: [
      "fraudulent",
      "comprehensive",
      "circumscribed",
      "exhaustive",
      "superficial",
      "limited",
    ],
    answers: [2, 5],
    explanation:
      "Circumscribed and limited describe the narrow scope. Superficial concerns depth, and an audit can examine one category thoroughly. Comprehensive and exhaustive suggest breadth or completeness contrary to the explicit restriction.",
  },
  {
    id: "se-12",
    type: "equivalence",
    difficulty: "Challenge",
    skill: "Concession and precision",
    prompt:
      "The researcher’s response was _____ rather than dismissive: she acknowledged the objection and modified her claim to accommodate it.",
    choices: [
      "dogmatic",
      "defensive",
      "receptive",
      "evasive",
      "open-minded",
      "intransigent",
    ],
    answers: [2, 4],
    explanation:
      "Receptive and open-minded both fit acknowledging an objection and revising a claim. Defensive or evasive responses need not engage with the objection. Dogmatic and intransigent imply resistance to revision, the opposite of the evidence.",
  },
];

export interface EssayPrompt {
  id: string;
  prompt: string;
  tip: string;
}

export const essayPrompts: EssayPrompt[] = [
  {
    id: "issue-01",
    prompt:
      "Universities should require every student to study a subject substantially different from their primary field. Discuss the extent to which you agree or disagree, and explain the circumstances that would affect your judgment.",
    tip: "Define what counts as a substantially different subject. Weigh intellectual breadth against cost and depth. Develop concrete examples and consider whether the same rule should apply to every degree.",
  },
  {
    id: "issue-02",
    prompt:
      "Public institutions should give citizens more influence over decisions, even when doing so makes those decisions slower. Develop a position on this claim, considering situations in which greater participation might or might not improve the result.",
    tip: "Distinguish ordinary policy choices from urgent decisions. Explain a mechanism by which participation improves or weakens a decision rather than merely praising or criticizing democracy.",
  },
  {
    id: "issue-03",
    prompt:
      "The most valuable research is research whose practical uses cannot yet be predicted. Discuss the extent to which you agree or disagree, using reasons and examples to address the relationship between immediate usefulness and long-term value.",
    tip: "Avoid treating all exploratory research as successful or all applied research as short-sighted. Consider funding constraints and whether “most valuable” can be judged before outcomes are known.",
  },
  {
    id: "issue-04",
    prompt:
      "A community should preserve places that express its history even when redevelopment would produce greater economic benefits. Explain your position and address the tradeoffs that make this recommendation more or less reasonable.",
    tip: "Discuss which places deserve protection and who bears the costs. A strong argument can distinguish irreplaceable historical value from preservation that serves only a small group.",
  },
  {
    id: "issue-05",
    prompt:
      "People become better decision-makers when they regularly defend views they do not personally hold. Discuss the extent to which you agree or disagree, and consider potential limits to this practice.",
    tip: "Explain how understanding an opposing argument could affect a decision. Also examine the difference between sincerely testing an idea and practicing persuasive performance without changing one’s reasoning.",
  },
];

export interface ReadingQuestion {
  id: string;
  prompt: string;
  choices: string[];
  answers: number[];
  explanation: string;
  skill: string;
  difficulty: Difficulty;
}
export interface ReadingPassage {
  id: string;
  title: string;
  passage: string;
  questions: ReadingQuestion[];
}

export const readingPassages: ReadingPassage[] = [
  {
    id: "reading-01",
    title: "The archive’s silence",
    passage:
      "Historians sometimes treat the scarcity of complaints in an institution’s archive as evidence that its policies were widely accepted. Yet an archive is not a transparent record of everything people said. Documents reach it through a series of choices: someone must create a written account, someone must retain it, and someone must judge it worth preserving. These choices may favor the views of people with authority. This does not mean that every apparently harmonious institution concealed widespread opposition. It means that the surviving record alone may not distinguish genuine agreement from selective preservation. A more reliable interpretation compares official records with sources produced for different purposes, such as private correspondence or legal disputes. Such sources have biases of their own, but their selection mechanisms need not coincide. Agreement across differently selected records can therefore strengthen an inference that would remain weak if it rested on a single archive.",
    questions: [
      {
        id: "rc-01",
        difficulty: "Building",
        skill: "Main idea",
        prompt:
          "The passage is primarily concerned with which of the following?",
        choices: [
          "Showing that institutional archives are usually deliberately falsified",
          "Explaining why a lack of archived complaints is insufficient by itself to establish agreement",
          "Arguing that private correspondence is always more accurate than official records",
          "Demonstrating that past institutions generally faced widespread opposition",
          "Describing the technical process of restoring damaged records",
        ],
        answers: [1],
        explanation:
          "The author explains how selection affects archives and recommends comparing differently selected sources. The passage explicitly declines to infer universal hidden opposition and never claims that records are usually falsified.",
      },
      {
        id: "rc-02",
        difficulty: "Challenge",
        skill: "Inference",
        prompt:
          "The author would most likely regard agreement between two records as particularly useful when the records:",
        choices: [
          "were preserved by the same official",
          "contain equally detailed descriptions",
          "were produced and preserved through different selection processes",
          "exclude all mention of disagreement",
          "were written long after the events they describe",
        ],
        answers: [2],
        explanation:
          "The final sentences explain that different selection mechanisms can make agreement more informative. Shared custodianship may repeat the same bias. Detail, silence, and later composition are not identified as grounds for greater reliability.",
      },
      {
        id: "rc-03",
        difficulty: "Building",
        skill: "Function of a qualification",
        prompt:
          "Why does the author state that not every apparently harmonious institution concealed widespread opposition?",
        choices: [
          "To retract the claim that document selection affects archives",
          "To distinguish uncertainty about agreement from proof of disagreement",
          "To endorse official records over private correspondence",
          "To suggest that complaints were rarely written down",
          "To explain why institutions destroyed private letters",
        ],
        answers: [1],
        explanation:
          "The qualification prevents an unjustified reversal: weak evidence of agreement is not proof of opposition. It narrows the author’s claim without abandoning the concern about selection.",
      },
    ],
  },
  {
    id: "reading-02",
    title: "A city beneath the trees",
    passage:
      "A city found that streets with more mature trees were cooler during summer than streets with fewer trees. Officials proposed planting saplings throughout the hottest neighborhoods, citing the comparison as proof that the program would quickly lower temperatures. The comparison supports the possibility of a benefit, but the promised speed does not follow from it. Mature trees provide shade that newly planted trees cannot immediately match. Moreover, the streets compared differed in building density and surface materials, factors that could also influence temperature. These limitations do not show that planting is ineffective. They identify questions a more informative study would address: how temperatures change on the same streets as trees grow, and how that change compares with similar streets receiving no new trees. Even a careful study would need to consider maintenance, since a planting program’s long-term benefit depends on whether its trees survive.",
    questions: [
      {
        id: "rc-04",
        difficulty: "Building",
        skill: "Author’s position",
        prompt:
          "Which statement best describes the author’s assessment of the proposed planting program?",
        choices: [
          "It cannot affect temperatures because buildings determine urban heat.",
          "It is certain to work quickly if mature trees are present elsewhere.",
          "It may be beneficial, but the cited comparison does not establish the promised speed or isolate its effect.",
          "It should be abandoned because controlled studies are impossible.",
          "It is useful only on streets that already have many trees.",
        ],
        answers: [2],
        explanation:
          "The author leaves a benefit possible while questioning the speed claim and identifying confounding differences. Neither ineffectiveness nor certain rapid success is established.",
      },
      {
        id: "rc-05",
        difficulty: "Challenge",
        skill: "Study design",
        prompt:
          "Tracking similar streets with and without new trees would help address which concern raised in the passage?",
        choices: [
          "That all trees will eventually become equally tall",
          "That temperature differences may be associated with factors other than the planting program",
          "That private records are less reliable than official measurements",
          "That planting can never produce a long-term benefit",
          "That maintenance costs necessarily exceed cooling benefits",
        ],
        answers: [1],
        explanation:
          "A comparison with similar streets helps separate changes associated with planting from other influences. The passage does not assert equal growth, inevitable failure, or any cost-benefit conclusion.",
      },
      {
        id: "rc-06",
        difficulty: "Foundation",
        skill: "Explicit detail",
        prompt:
          "According to the passage, why is tree survival relevant to evaluating the program?",
        choices: [
          "It determines whether the program’s intended long-term benefits can be realized.",
          "It proves that surface materials do not affect temperature.",
          "It eliminates the need to measure temperatures.",
          "It guarantees that saplings provide as much shade as mature trees.",
          "It shows that the original comparison was deliberately misleading.",
        ],
        answers: [0],
        explanation:
          "The final sentence links long-term benefit to survival. The other options add claims the passage does not make or contradict its discussion of shade and confounding factors.",
      },
    ],
  },
  {
    id: "reading-03",
    title: "What a model leaves out",
    passage:
      "A scientific model is often criticized for leaving out features of the system it represents. Some omissions do indeed make a model unsuitable for a particular purpose. But including more detail does not automatically make a model more useful. A model designed to explain a broad pattern may illuminate a relationship precisely because it suppresses distracting variation. A model designed to forecast individual events may need to preserve that same variation. Thus, the relevant question is not whether a model is complete, but whether its simplifications are compatible with the task. This standard does not permit researchers to disregard inconvenient evidence: a simplification must be tested against the consequences that matter for the model’s intended use. Two models with different assumptions may therefore be valuable without being interchangeable. Evaluating them solely by the number of details they contain confuses an easily counted property with the harder question of fitness for purpose.",
    questions: [
      {
        id: "rc-07",
        difficulty: "Building",
        skill: "Main idea",
        prompt: "Which principle does the passage primarily defend?",
        choices: [
          "Models with incompatible assumptions cannot both be useful.",
          "A model’s value should be assessed in relation to its intended task.",
          "The simplest model is always the most accurate.",
          "Detailed models inevitably hide causal relationships.",
          "A model that explains a pattern can necessarily predict every event.",
        ],
        answers: [1],
        explanation:
          "The passage repeatedly makes intended use the standard for evaluating simplifications. It does not universally prefer simple models and explicitly allows differently constructed models to serve different purposes.",
      },
      {
        id: "rc-08",
        difficulty: "Challenge",
        skill: "Application",
        prompt:
          "Which situation most closely illustrates the author’s reasoning?",
        choices: [
          "A researcher adds every available variable because completeness guarantees usefulness.",
          "A model is rejected solely because another model includes more detail.",
          "A simplified model explains average traffic flow, while a more detailed model is used to predict delays at a particular junction.",
          "A forecasting model ignores repeated failures because all models simplify reality.",
          "Two models are treated as interchangeable because both omit some features.",
        ],
        answers: [2],
        explanation:
          "Different tasks—explaining an average pattern and forecasting a particular event—can warrant different detail. The other choices either count detail without considering purpose or use simplification to excuse a failure of evidence.",
      },
      {
        id: "rc-09",
        difficulty: "Challenge",
        skill: "Role of a sentence",
        prompt:
          "The statement that researchers may not disregard inconvenient evidence serves mainly to:",
        choices: [
          "concede that every simplification invalidates a model",
          "reject forecasting as a legitimate scientific task",
          "prevent task-based evaluation from becoming an excuse for ignoring relevant failures",
          "establish that all models must eventually converge on identical assumptions",
          "claim that evidence matters only for highly detailed models",
        ],
        answers: [2],
        explanation:
          "The author endorses useful simplification but requires testing its consequences for the intended use. This guards against treating “fitness for purpose” as an unrestricted excuse to ignore contrary evidence.",
      },
    ],
  },
];
