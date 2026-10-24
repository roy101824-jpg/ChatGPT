# Vocabulary and source coverage

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

## Known boundaries

These uploaded PDFs exceed the download tool's 32 MiB limit and their contents were not inspected:

- Official GRE Super Power Pack, Second Edition.pdf
- Conquering GRE Verbal Reasoning and Analytical Writing.pdf
- Cracking the GRE Premium Edition with 6 Practice Tests, 2020.pdf

The supplied numbered legacy test collection contains 37 sections. Test 12, section 2 was absent. The answer key has a readable text layer; it is inventoried but not used to claim validation of the app's independently authored practice questions.

Older analogies, antonyms, and Argument essay resources are marked legacy. The writing studio uses the current 30-minute Issue-task format. The app's 30 context/equivalence questions, nine reading questions, and five writing prompts are original practice, not official ETS items or score predictors.

Source spellings, page breaks and malformed card order were checked during extraction; unambiguous defects were corrected. Imported definitions have provenance, but this is not a claim of exhaustive professional dictionary review. Pages refer to PDF positions, which can differ from printed page labels. Original editorial definitions are explicitly attributed to Wordtrail instead of the uploaded book.

## Rebuilding the content

The committed JSON is sufficient to build and deploy. Raw books and extracted full text are not committed or deployed.

Extraction scripts live in `scripts/`. They require Python, PyMuPDF, python-docx, openpyxl, and the `pdftotext` binary. Set `WORDTRAIL_SOURCE_DIR` to a local directory containing the authorized source files (original filenames; nested folders accepted) for the primary and secondary import scripts. The reference audit uses the local path manifest in `work/resource-downloads.json`; it is an import-session artifact and must be regenerated for a different machine. Run the primary/secondary parsers and reference audit before `python scripts/merge_vocab.py`. `src/data/editorial-definitions.json` preserves the original editorial additions for repeatable merging.

## Product references

The interaction design draws on short definition quizzes and targeted review described by [Magoosh Vocabulary Builder](https://gre.magoosh.com/vocabulary-builder), recurring practice and flashcards described by [GregMat](https://www.gregmat.com/app), and practice-bank variety described by [Kaplan](https://www.kaptest.com/gre). The design and original practice text were created for Wordtrail. Pocket Ledger was unavailable in the workspace, so no claim is made that its design was inspected or copied.

Current test format: [ETS GRE test structure](https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html).
