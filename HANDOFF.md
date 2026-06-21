# Roman Dictionary — Agent Handoff

Last updated: 21 June 2026

This is the primary restart document. Read `AGENTS.md` next, then follow links
from this file only as needed.

## Resume here

- Repository: `/Users/valentinedelsbrunner/Projects/romani-wb.github.io`
- Active branch: `rebuild`
- Preservation tag: `prototype-before-june-data-refresh`
- Working tree at handoff: clean before adding this handoff commit
- Do not work on `main` and do not push or publish without explicit permission.
- Valentin has authorized routine edits, generation, tests, and local commits
  inside this repository. Do not repeatedly ask for approval for those actions.
- Intermediate review gates are temporarily fast-tracked. Make conservative,
  reversible choices and document uncertainty for a later major review.

Recent checkpoints:

```text
f826536 Add sourced Roman introduction and visual shell
74c26d0 Add lazy dictionary loading and provisional UI state
a96379b Establish June 2026 dictionary rebuild workflow
```

## Product state

The current prototype is a static Roman dictionary with:

- a sourced introductory story and an initial visual system;
- client-side search across Roman `INT`, Roman `DEU`, German, and English;
- independent Roman-spelling and meaning-language controls;
- URL-preserved query, selected entry, spelling, and meaning language;
- remembered spelling and meaning preferences in browser storage;
- lazy-loaded full entries in deterministic 500-entry chunks;
- word families, grammar/details, source hyperlinks, and generated morphology;
- morphology collapsed and clearly labelled `Provisional`;
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

- `index.html` — story, semantic shell, controls, and dictionary layout
- `styles.css` — visual system, responsive layout, reduced-motion rules
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

Provisional defaults are English interface labels, `INT` spelling, and German
meanings. They are documented in `docs/decisions.md`.

## Run and verify

```bash
cd /Users/valentinedelsbrunner/Projects/romani-wb.github.io
git switch rebuild
python3 -m pip install -r requirements.txt
python3 -m unittest discover -s tests -v
python3 scripts/preprocess_data.py
node tests/frontend-smoke.mjs
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Expected automated result: 8 Python tests pass and the frontend smoke test
passes. A second preprocessing run must produce byte-identical output.

Useful manual check:

1. Search for `habrin`.
2. Confirm `habrínav` loads and the URL contains its entry ID.
3. Toggle `INT/DEU` and `DE/EN`, then reload the URL.
4. Open Details and check the Source-2 link.
5. Open Forms and confirm it is labelled `Provisional`.
6. Check the story and dictionary at mobile width.

The in-app browser automation connection was unavailable during development, so
the deterministic smoke harness was added instead. Do not claim comprehensive
visual, browser, keyboard, or accessibility QA yet.

## Decisions already made

- June source package is authoritative; raw files are immutable.
- Source defects are preserved and reported, never silently fixed.
- Static architecture remains until a concrete backend need exists.
- Entry details are chunked; the search index is loaded initially.
- Morphology remains visible only behind a collapsed provisional disclosure.
- Story claims are limited to the supplied manuscripts and remain provisional.
- Review gates are fast-tracked until Valentin performs a major review.

The full rationale is in `docs/decisions.md`.

## Highest-value next work

1. Add CI for Python tests, preprocessing determinism, JavaScript syntax, and the
   frontend smoke test.
2. Decide and implement a stable public entry-identity strategy before treating
   deep links as permanent.
3. Run real-browser keyboard, screen-reader, mobile, and performance testing;
   fix findings without redesigning blindly.
4. Improve search result counting/ranking and consider moving search preparation
   to a worker if profiling justifies it.
5. Add a compact About/Method surface explaining sources, spellings, limitations,
   and the provisional status of generated forms.
6. During the later major review, revisit audience priority, interface language,
   spelling default, story tone/rights/attribution, community voice or imagery,
   duplicate behavior, and morphology accuracy.
7. Prepare a documented December source-refresh procedure before the final
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
