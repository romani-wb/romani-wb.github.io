# Roman Dictionary — Agent Handoff

Last updated: 22 June 2026

This is the primary restart document. Read `AGENTS.md` next, then follow links
from this file only as needed.

## Resume here

- Repository: `/Users/valentinedelsbrunner/Projects/romani-wb.github.io`
- Active branch: `main`
- Preservation tag: `prototype-before-june-data-refresh`
- Valentin explicitly authorized direct commits and pushes to `main`, without a
  PR, while the site is not in production. This does not authorize deployment.
- Valentin has authorized routine edits, generation, tests, and breaking changes
  inside this repository. Do not repeatedly ask for approval for those actions.
- Intermediate review gates are temporarily fast-tracked. Make conservative,
  reversible choices and document uncertainty for a later major review.

Recent checkpoints:

```text
38d6b31 Make dictionary grammar practical
00c73b3 Separate and redesign the Roman dictionary
f826536 Add sourced Roman introduction and visual shell
```

## Product state

The current prototype is a static Roman dictionary with:

- a sourced story/home page at `index.html`;
- a separate bookmarkable dictionary at `dictionary.html`;
- client-side search across Roman `INT`, Roman `DEU`, German, and English;
- independent Roman-spelling and meaning-language controls;
- URL-preserved query, selected entry, spelling, and meaning language;
- remembered spelling and meaning preferences in browser storage;
- lazy-loaded full entries in deterministic 500-entry chunks;
- an entry hierarchy based on the professor's required output structure;
- visual word-structure and interactive Base-to-derived family diagrams;
- dedicated Entry, Word family, Inflection, and Details views;
- three navigation layouts over one data/state layer: Focus, Browse, Split;
- search results grouped into readable word types instead of an arbitrary first
  page of 80 alphabetical entries;
- word-type filters and a Browse catalogue with real entry counts;
- source codes such as `PTCLV` translated into readable result labels such as
  `Particle verb`; raw codes remain in Details;
- grammar/details, source hyperlinks, and generated complete-word morphology;
- learner-facing verb conjugation, noun case, and adjective agreement grids;
- plain-language grammar primers and useful-form previews without onboarding;
- technical morphology derivation collapsed and all generated forms clearly
  identified as awaiting linguistic review;
- mobile layout, skip link, status announcements, and reduced-motion handling.

Valentin manually opened the current interface and responded positively. This was
a high-level review, not full acceptance of content, accessibility, linguistics,
or production readiness.

## Authoritative editorial package

Never modify files under `roman-wb-valentin/`.

- `roman-wb-valentin/2026-06-17_roman-wb.xlsx` — current workbook
- `roman-wb-valentin/2026-06-17_struktur.pdf` — current entry/display definition
- `roman-wb-valentin/materials/GRP_10_manuskript.pdf` — German context manuscript
- `roman-wb-valentin/materials/GRP_11_manuscript.pdf` — English context manuscript
- `roman-wb-valentin/However.docx` — purpose unknown; retained, do not use
- `docs/source-register.md` — source status and SHA-256 checksums

The professor stated that the June workbook is corrected and contains all English
equivalents. In the June structure definition, supplementary information for
lemma, flexion, and source uses square brackets `[…]`; supplementary information
inside equivalents uses round brackets `(…)`.

Dieter is pausing editorial work until mid-September 2026. The next and intended
final correction version is expected in early December 2026. Column names and
definitions are expected to remain unchanged.

The previous repository data tree is preserved at
`backups/2026-06-21-pre-june-refresh/data/`. It is historical, not an active
input.

## Current data facts

- 12,525 `GLOSSARY` entries
- 42 logical columns
- all 12,525 entries have German and English meanings
- 8 embedded Source-2 hyperlinks are preserved
- 26 generated entry chunks, normally 500 entries each
- 9,551 entries currently expose provisional generated forms
- current validation: 2 errors, 55 warnings, 188 informational items

Known source issues must remain uncorrected until the source owner changes them
or explicitly authorizes a mapping:

- row 2157: missing `ROMAN DEU` for `jednecombikáno trinségo`;
- row 1538: corrupted `Word class 1` value `N+V1536N1536:U1536` for
  `briateri/kíja`;
- `abbrs-lex`: English `m.` is labelled `mackuline`;
- `abbrs-gram`: `LOC` and `MOD` each have two definitions; all variants are
  preserved;
- five paired-field asymmetries are reported by row;
- 44 nouns/verbs lack inflection paradigms;
- current entry IDs include workbook row numbers and are not permanent identity.

Read `data/processed/reports/validation_summary.json` before opening the complete
row-level report.

Important ingestion rules and quirks:

- the June workbook has 18 sheets and adds `abbrs-lex`;
- pandas observes three fully empty formatting columns named `Unnamed: 42` to
  `Unnamed: 44`; the pipeline may ignore only fully empty unnamed columns and
  must fail on any non-empty unexpected column;
- the explicit compatibility alias is `NME-i` → `NM-E-i` in the June paradigm
  table, plus the documented irregular/zero-ending aliases in the script;
- embedded hyperlinks occur in both `Source-2 INT` and `Source-2 DEU` cells and
  require openpyxl extraction because dataframe values alone lose them;
- source-marker arrows are preserved as supplied; do not reinterpret or swap
  them without an explicit linguistic decision;
- duplicate spellings are legitimate possibilities and must not be merged only
  because their displayed headwords match.

## Architecture

This intentionally remains a dependency-light static site:

- `index.html` — contextual story/home and portal to the dictionary
- `styles.css` — story/home visual system
- `dictionary.html` — standalone dictionary shell and controls
- `dictionary.css` — dictionary-specific responsive information design
- `app.js` — search, URL state, lazy entry loading, rendering, word families,
  provisional morphology, and source links
- `scripts/preprocess_data.py` — deterministic workbook-to-JSON build
- `tests/test_preprocess_data.py` — real-workbook data-contract tests
- `tests/frontend-smoke.mjs` — deep-link and lazy-loading smoke test

Initial browser data:

- `data/processed/entries_search.json`
- `data/processed/entries_manifest.json`
- `data/processed/references.json`
- `data/processed/paradigm_model.json`

Full entry details are requested from
`data/processed/entries/entries-NNN.json`. The complete `entries.json` remains an
audit/compatibility artifact and must not return to the initial browser request.
The smoke test explicitly checks this.

URL parameters are:

- `q` — search query
- `entry` — selected development entry ID
- `spelling` — `int` or `deu`
- `meaning` — `de` or `en`
- `edition` — legacy-compatible layout values: `learner` = Focus, `compact` =
  Browse, `explorer` = Split
- `type` — word-type filter (`nouns`, `verbs`, `adjectives`, `adverbs`,
  `phrases`, or `grammar`)

Provisional defaults are English interface labels, `INT` spelling, and German
meanings. They are documented in `docs/decisions.md`.

## Run and verify

```bash
cd /Users/valentinedelsbrunner/Projects/romani-wb.github.io
git switch main
python3 -m pip install -r requirements.txt
python3 -m unittest discover -s tests -v
python3 scripts/preprocess_data.py
node tests/frontend-smoke.mjs
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Use `http://localhost:8000/dictionary.html` to bypass the story and open the
working dictionary directly.

Expected automated result: 8 Python tests pass and the frontend smoke test
passes. A second preprocessing run must produce byte-identical output.

Useful manual check:

1. Open `dictionary.html` and switch among Focus, Browse, and Split.
2. With no query, confirm Focus has no arbitrary entry list and Browse shows seven
   word-type catalogue cards with counts.
3. Search `stay`; confirm results are grouped under Nouns and Verbs and badges
   read `Verb`, `Verb phrase`, or `Particle verb`, never bare source codes.
4. Open verb `g00005_236c444a` (`áčav`); confirm six present forms and five
   aspect/tense groups in Conjugation.
5. Open noun `g00003_b284cd5c` (`ablativ`); confirm seven case rows with singular
   and plural columns.
6. Open adjective `g00008_ffa2702b` (`ačálo/i`); confirm basic/oblique forms
   across gender and number.
7. Toggle `INT/DEU`, `DE/EN`, layout, and type, then reload the explicit URL.
8. Open Details and check a Source-2 link; check the site at mobile width.
9. Click `Surprise me`; the entry and URL should change without losing settings.

Focus should place navigation above the entry; Browse should add the word-type
catalogue; Split should preserve the persistent sidebar for comparison. Word
family remains an interactive Base hierarchy. Grammar grids
must never create page-level horizontal overflow on mobile; wide matrices scroll
inside their panel.

On 22 June, in-app browser/Playwright QA covered all three layouts, grouped search,
word-type filtering, representative verb/noun/adjective paradigms, mobile width
(390×844), URL state, `Surprise me`, and console warnings/errors. It found no
console errors or page-level mobile overflow. This is not a screen-reader or
full keyboard audit.

## Decisions already made

- June source package is authoritative; raw files are immutable.
- Source defects are preserved and reported, never silently fixed.
- Static architecture remains until a concrete backend need exists.
- Entry details are chunked; the search index is loaded initially.
- Story and dictionary are separate static pages.
- Visual diagrams use only explicit workbook relationships.
- Generated morphology is visible as practical grammar but remains marked as a
  generated preview; raw codes and derivation remain collapsed.
- Dictionary layouts are presentation modes, not separate codebases.
- Story claims are limited to the supplied manuscripts and remain provisional.
- Review gates are fast-tracked until Valentin performs a major review.

The full rationale is in `docs/decisions.md`.

## Highest-value next work

1. Add CI for Python tests, preprocessing determinism, JavaScript syntax, and the
   frontend smoke test.
2. Decide and implement a stable public entry-identity strategy before treating
   deep links as permanent.
3. Run screen-reader, full keyboard, and performance testing; mobile visual QA
   now has a first representative pass.
4. Improve search result counting/ranking and consider moving search preparation
   to a worker if profiling justifies it.
5. Add a compact About/Method surface explaining sources, spellings, limitations,
   and the provisional status of generated forms.
6. Ask Dieter to review a deliberately small morphology corpus before changing
   the generated-preview status: at minimum one regular/irregular verb, each noun
   gender/class pattern, and adjective agreement.
7. During the later major review, revisit audience priority, interface language,
   spelling default, story tone/rights/attribution, community voice or imagery,
   duplicate behavior, and morphology accuracy.
8. Prepare a documented December source-refresh procedure before the final
   workbook arrives.

Avoid a framework migration unless a measured problem justifies it. Avoid visual
expansion before real-browser QA establishes that the current shell is sound.

## Documentation map

- `AGENTS.md` — binding agent workflow and constraints
- `docs/decisions.md` — chronological technical/product decisions
- `docs/product-brief.md` — scope, audiences, principles, and non-goals
- `docs/rebuild-plan.md` — phase status and release path
- `docs/data-workflow.md` — source-to-runtime transformation
- `docs/stakeholder-structure.md` — distilled linguistic/display rules
- `docs/source-register.md` — provenance and checksums
- `tests/fixtures/review-corpus.json` — eight representative review entries

If context conflicts, use this priority: raw June sources and professor email
semantics, then `AGENTS.md`, then `docs/decisions.md`, then this handoff and the
remaining documents.
