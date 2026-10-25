# Vocabulary, Verbal practice and source coverage

Wordtrail contains **5,188 distinct study headwords**. **5,186 have study-ready definitions**: 4,932 selected from the supplied resources and 254 with clearly labeled original Wordtrail definitions and examples. Two ambiguous source entries (`heterogenous` and `obstrusive`) remain searchable but excluded from quizzes. The app preserves 2,818 headwords' alternative source definitions and selected usage examples.

A separate **Reference index contains 4,005 additional terms** explicitly encountered in source glossaries, word groups, or legacy test answer choices. These may be ordinary words or inflections; they are neither counted as curated study vocabulary nor used in quizzes until their meanings are checked. Searchable source references retain PDF page positions.

All **67 supplied files** are inventoried: 11 imported vocabulary resources, one partially imported mnemonic resource, 52 text-indexed reference/practice resources, and three files unavailable through the upload-transfer tool. Text-indexed does not mean every exercise was converted. The source catalog in the app shows file-by-file counts and limitations.

## Word-list coverage

Counts overlap and must not be added to calculate distinct vocabulary.

| Source | Distinct extracted headwords | Notes |
| --- | ---: | --- |
| PowerScore Repeat Offenders | 699 | All 700 entries; one duplicate |
| GRE Master Wordlist | 1,535 | All labeled headwords |
| Barron 3500 | 3,368 | Internal title identifies SAT I; filename's 3,500 is not an audited count |
| 333 high-frequency sheet | 332 | All 333 rows; one duplicate |
| GregMat practice sheet | 1,045 | All 1,050 rows; duplicate forms merged |
| Additional Words sheet | 1,051 | One malformed cell split into its 31 words |
| Barron's Mnemonics | 2,931 | Partial; inconsistent formatting; uploaded file stops at “vogue” |
| Manhattan 500 Essential Words | 500 | All 500 cards |
| GRE Vocab Capacity | 1,301 | Main entries; mnemonic stories excluded |
| GRE Power Vocab | 819 | Structured dictionary headwords |
| GRE Contextual Vocabulary | 139 | All 24 explicit definition blocks |
| GRE Vocabulary Flash Review | 600 | All 600 headwords |

## Original Verbal practice

The training bank contains **99 original Wordtrail questions**: the previous 39 questions plus a 60-question Verbal expansion. The chooser uses the three official categories—Text Completion, Sentence Equivalence and Reading Comprehension—with these seven response subtypes:

| Format | Full bank | New expansion |
| --- | ---: | ---: |
| Text Completion, one blank | 28 | 10 |
| Text Completion, two blanks | 12 | 12 |
| Text Completion, three blanks | 10 | 10 |
| Sentence Equivalence | 24 | 12 |
| Reading Comprehension, Select One Answer Choice | 17 | 8 |
| Reading Comprehension, Select One or More Answer Choices | 4 | 4 |
| Reading Comprehension, Select-in-Passage | 4 | 4 |
| **Total** | **99** | **60** |

The new 60 questions include **37 Advanced**, 22 Standard and one Core item. Across the complete bank, the counts are 37 Advanced, 50 Standard and 12 Core. These labels are editorial estimates, not ETS difficulty calibrations or score bands. Items include an explanation, a trap to avoid and a reusable strategy. Multiblank and multiple-answer scoring requires the complete correct response.

For Reading Comprehension's Select One or More Answer Choices, one, two or all three choices can be correct. Sentence Equivalence requires two choices that produce equivalent completed sentences. These are response rules, not a count of how many questions of each subtype will appear in an official section. The taxonomy was reconfirmed against ETS on **25 October 2026**; see [GRE-2027-ALIGNMENT.md](GRE-2027-ALIGNMENT.md) for official references.

The Verbal training area includes **12 strategy guides** with original micro-examples and official ETS references, plus **six official-resource entries** covering format, scoring, POWERPREP, its paid options, the mini quiz and Verbal guidance. The two POWERPREP entries share an official destination. Links provide access to official material; official question banks are not copied into the app.

All new Verbal practice entry points use this combined bank and the current runner, including Today's Text Completion shortcut. Focused drills can filter by category, response format, topic, difficulty and unseen status. Setup displays the actual count after filtering, explains a shorter available session, and disables Start when no questions match. Practice tabs and filter choices are remembered for the browser session. These interface refinements add no questions to the bank.

Editable questions offer Clear answer. The section map distinguishes complete, incomplete and marked responses, with direct navigation to the next unanswered or marked item. A saved session can be resumed from the hub; replacing it requires confirmation. Older active sessions still recover in the legacy runner, with existing practice totals and backups preserved.

The review queue includes wrong answers and correct answers marked uncertain. Topic insights use the latest attempt per question, while the error journal retains recorded reasons and notes. User-entered official Verbal benchmarks remain separate from app results. Global backups include this prep progress alongside vocabulary progress, practice totals and the writing draft. Vocabulary support is a separate expandable area with Meaning match, Saved words and Missed words; it does not add to the Verbal question count.

## Timing and the 2027 preparation goal

The fixed-form Verbal simulation contains **27 questions in 41 minutes**: a 12-question section with 18 minutes followed by a 15-question section with 23 minutes. Answers can be revisited within the current section, and explanations appear after submission. The clock continues while the app is backgrounded or closed. Standalone 18- and 23-minute sections are also available.

This is Verbal-only timing practice. It does not implement ETS section adaptation, reproduce an official form's question mix, or estimate a 130–170 scaled score. Questions may repeat across sessions. A 170 target is an aspiration; no drill percentage, item count or difficulty label guarantees it.

As of **25 October 2026**, the official ETS pages checked did not identify a separately announced 2027 pattern. Preparation therefore follows the currently published format, with a reminder to recheck ETS before booking and before test day. See [GRE-2027-ALIGNMENT.md](GRE-2027-ALIGNMENT.md) for the dated verification, official links and precise limits of the simulation.

## Known boundaries

These uploaded PDFs exceed the download tool's 32 MiB limit and their contents were not inspected:

- Official GRE Super Power Pack, Second Edition.pdf
- Conquering GRE Verbal Reasoning and Analytical Writing.pdf
- Cracking the GRE Premium Edition with 6 Practice Tests, 2020.pdf

The supplied numbered legacy test collection contains 37 sections. Test 12, section 2 was absent. The answer key has a readable text layer; it is inventoried but not used to claim validation of the app's independently authored practice questions.

Older analogies, antonyms, and Argument essay resources are marked legacy. The optional writing studio has moved to **Settings → Open writing studio** and retains its five original prompts, saved drafts and timers. It follows the current 30-minute Issue-task format for the separate Analytical Writing measure. The 99-question training bank is exclusively Verbal; it does not add Quantitative Reasoning practice. All training questions and writing prompts are original practice, not official ETS items or score predictors.

Source spellings, page breaks and malformed card order were checked during extraction; unambiguous defects were corrected. Imported definitions have provenance, but this is not a claim of exhaustive professional dictionary review. Pages refer to PDF positions, which can differ from printed page labels. Original editorial definitions are explicitly attributed to Wordtrail instead of the uploaded book.

## Rebuilding the content

The committed JSON and TypeScript content modules are sufficient to build and deploy. Original Verbal questions live in `src/data/practice.ts` and `src/data/prep/verbal.ts`, with the combined bank in `src/prep/bank.ts`. Guides and official-resource metadata live alongside the expanded questions in `src/data/prep/`. Raw books and extracted full text are not committed or deployed.

Extraction scripts live in `scripts/`. They require Python, PyMuPDF, python-docx, openpyxl, and the `pdftotext` binary. Set `WORDTRAIL_SOURCE_DIR` to a local directory containing the authorized source files (original filenames; nested folders accepted) for the primary and secondary import scripts. The reference audit uses the local path manifest in `work/resource-downloads.json`; it is an import-session artifact and must be regenerated for a different machine. Run the primary/secondary parsers and reference audit before `python scripts/merge_vocab.py`. `src/data/editorial-definitions.json` preserves the original editorial additions for repeatable merging.

## Product references

The interaction design draws on short definition quizzes and targeted review described by [Magoosh Vocabulary Builder](https://gre.magoosh.com/vocabulary-builder), recurring practice and flashcards described by [GregMat](https://www.gregmat.com/app), and practice-bank variety described by [Kaplan](https://www.kaptest.com/gre). The design and original practice text were created for Wordtrail. Pocket Ledger was unavailable in the workspace, so no claim is made that its design was inspected or copied.

Current test format: [ETS GRE test structure](https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html).
