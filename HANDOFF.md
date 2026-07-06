# Roman Dictionary — Agent Handoff

Last updated: 6 July 2026

This is the primary restart document. Read `AGENTS.md` next, then follow links
from this file only as needed.

## Resume here

- Repository: `/Users/valentinedelsbrunner/Projects/romani-wb.github.io`
- Active branch: `main`
- Preservation tag: `prototype-before-june-data-refresh`
- Valentin explicitly authorized direct commits and pushes to `main`, without a
  PR, while the site is not in production. GitHub Pages deployment from `main`
  is in scope for this prototype.
- Valentin has authorized routine edits, generation, tests, and breaking changes
  inside this repository. Do not repeatedly ask for approval for those actions.
- Intermediate review gates are temporarily fast-tracked. Make conservative,
  reversible choices and document uncertainty for a later major review.
- Valentin may now ask multiple agents to make minor changes simultaneously.
  Before editing, always run `git status --short` and inspect recent commits.
  Treat any unfamiliar local modifications as another agent's/user's work:
  do not overwrite them, do not use destructive checkout/reset, and pull/rebase
  before pushing if `main` moved.

Recent checkpoints:

```text
fa6bf92 Remove leftover placeholder UI text
accf6d0 Add verb person placeholders
2548582 Localize interface and simplify references
44ccb1f Exclude private sources from Pages
0b7aadf Add practical exploration and Pages deployment
95a9f50 Refocus dictionary navigation
```

## Product state

The current prototype is a static Roman dictionary with:

- a sourced story/home page at `index.html`;
- a separate bookmarkable dictionary at `dictionary.html`;
- a German-first site interface with an English toggle preserved in URL/storage;
- client-side search across Roman `INT`, Roman `DEU`, German, and English;
- independent controls for interface language, Roman spelling, and translation
  language; `INT/DEU` are Roman spelling systems, `DE/EN` are meaning languages;
- URL-preserved query, selected entry, spelling, and meaning language;
- remembered spelling and meaning preferences in browser storage;
- lazy-loaded full entries in deterministic 500-entry chunks;
- an entry hierarchy based on the professor's required output structure;
- visual word-structure and interactive Base-to-derived family diagrams;
- dedicated Entry, Word family, Inflection, and Details views;
- three navigation layouts over one data/state layer: Focus, Browse, Split;
- Browse as the default layout: search first, entry second, and an alphabetical
  corpus inventory below the entry;
- search results grouped into readable word types instead of an arbitrary first
  page of 80 alphabetical entries;
- globally ranked leading results where exact meanings outrank whole-word, prefix,
  and loose substring matches, without a visually privileged result section;
- word-type filters and an integrated Browse inventory with real entry counts;
- source codes such as `PTCLV` translated into readable result labels such as
  `Particle verb`; raw codes remain in Details;
- grammar/details, source hyperlinks, and generated complete-word morphology;
- learner-facing verb conjugation, noun case, and adjective agreement grids;
- source-aligned generated grammar forms and useful-form previews without
  onboarding or artificial grammar lessons;
- technical morphology derivation collapsed under Details; visible "preview" /
  "provisional" UI labels were removed as unnecessary placeholder copy, but the
  underlying morphology remains unreviewed and must not be described as approved;
- verb conjugation person rows include provisional English helper phrases such
  as "I eat / you eat / he/she/it eats", derived from the first English meaning
  where possible, to make person slots readable until Dieter confirms better
  labels;
- a progressively rendered table-like alphabetical index integrated into
  `dictionary.html` Browse mode; `word-list.html` is only a compatibility
  redirect to `dictionary.html#dictionary-index`;
- a minimal source-aligned grammar reference at `grammar.html`;
- a six-view visualization lab at `explore.html`, built only from recorded base
  fields and word classes: Family atlas, refined Family web, Type ribbons,
  Family rings, Size landscape, and Family comparison; all share search,
  filters, URL state, entry inspection, and direct links to full entries;
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
- `word-list.html` — compatibility redirect into the dictionary inventory
- `grammar.html` — static practical grammar cheat sheets linked to live entries
- `explore.html` / `explore.js` / `explore.css` — six coordinated canvas/SVG
  visualization experiments over the existing compact search index
- `reference.css` — shared Grammar and Explore reference layout
- `word-types.js` — shared readable word-class labels and broad type groups
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
- `ui` — interface language, `de` or `en`
- `spelling` — `int` or `deu`
- `meaning` — `de` or `en`
- `edition` — legacy-compatible layout values: `learner` = Focus, `compact` =
  Browse, `explorer` = Split
- `type` — word-type filter (`nouns`, `verbs`, `adjectives`, `adverbs`,
  `phrases`, or `grammar`)
- `letter` — optional first-letter filter for the integrated alphabetical
  dictionary inventory

Provisional defaults are German interface labels, `INT` spelling, and German
meanings. Browse is the default layout. They are documented in
`docs/decisions.md`.

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
2. In Browse, confirm search, Surprise me, spelling, translation, and view
   controls sit above the entry. There should be no bottom "Keep exploring"
   catalogue inside the dictionary entry.
3. Search `stay`; confirm results are grouped under Nouns and Verbs and badges
   read `Verb`, `Verb phrase`, or `Particle verb`, never bare source codes.
4. Search lowercase `essen`; confirm `háv` is the first result and
   `armiršágo` (`Ausmessen`) is not ranked ahead of exact eating meanings.
5. Open verb `g00005_236c444a` (`áčav`); confirm six present forms and five
   aspect/tense groups in Conjugation.
6. Open noun `g00003_b284cd5c` (`ablativ`); confirm seven case rows with singular
   and plural columns and no "Case and use" explanatory column.
7. Open adjective `g00008_ffa2702b` (`ačálo/i`); confirm basic/oblique forms
   across gender and number.
8. Toggle `INT/DEU`, `DE/EN`, layout, and type, then reload the explicit URL.
9. Open Details and check a Source-2 link; check the site at mobile width.
10. Click `Surprise me`; the entry and URL should change without losing settings.
11. In Browse mode, scroll to the integrated alphabetical inventory; confirm 240
    of 12,525 rows render initially, then test search, word type, letter,
    spelling, meaning language, and progressive loading. Open `word-list.html`
    only to confirm it redirects to `dictionary.html#dictionary-index`.
12. Open `grammar.html`; confirm it is a compact source-derived inventory
    (noun case codes, verb person/aspect/tense codes, adjective form dimensions,
    word-type codes, and notation), not a beginner grammar lesson.
13. Open `explore.html`; switch through Family atlas, Family web, Type ribbons,
    Family rings, Size landscape, and Family comparison. Hover and select marks,
    filter each view, toggle Family-web labels, search `kerav`, change
    spelling/meaning, zoom the SVG views, and follow a selected word into its
    full dictionary entry.

Focus should place navigation above the entry; Browse should place the
alphabetical inventory below the entry; Split should preserve the persistent
sidebar. Word family remains an interactive Base hierarchy. Grammar grids
must never create page-level horizontal overflow on mobile; wide matrices scroll
inside their panel.

On 23 June, in-app browser QA covered the German-first dictionary, language
toggle to English, the then-separate Word list filters, minimal Grammar
reference, Explore page, representative noun forms, URL state, and console
errors on the local static preview. It found no browser console errors. This is
not a screen-reader, full keyboard, or linguistic correctness audit.

## Decisions already made

- June source package is authoritative; raw files are immutable.
- Source defects are preserved and reported, never silently fixed.
- Static architecture remains until a concrete backend need exists.
- Entry details are chunked; the search index is loaded initially.
- Story and dictionary are separate static pages.
- Visual diagrams use only explicit workbook relationships.
- Corpus exploration uses recorded base fields; it does not claim inferred
  semantic, etymological, or morphological relationships.
- Generated morphology is visible as practical grammar but remains documented as
  generated and unreviewed; raw codes and derivation remain collapsed in the UI.
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
6. Ask Dieter to review a deliberately small morphology corpus before treating
   generated forms as linguistically accepted: at minimum one regular/irregular
   verb, each noun gender/class pattern, adjective agreement, and the temporary
   English person helper phrases in verb tables.
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
- `docs/dictionary-interface.md` — entry/interface rationale and navigation rules
- `tests/fixtures/review-corpus.json` — eight representative review entries

If context conflicts, use this priority: raw June sources and professor email
semantics, then `AGENTS.md`, then `docs/decisions.md`, then this handoff and the
remaining documents.
