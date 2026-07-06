# Decision log

## 2026-07-06 -- Data-driven logo concept remains provisional

The first `Roman-VP` identity experiment is a generated SVG heatmap wordmark.
Each visible letter samples entries whose `INT` Roman headword begins with that
letter; tile color encodes broad source word-class groups, the hyphen encodes
the 42 logical workbook columns, and captions expose entry, generated-form,
chunk, and validation counts. This is a visual concept only. It does not replace
the site wordmark, add linguistic interpretation, or claim editorial approval.

## 2026-07-06 — Footer and imprint mirror Romani Project attribution

The static site now carries the Romani Project-style footer: Volksgruppenförderung
/ Minority Promotion, the Bundeskanzleramt logo, and an imprint link. The imprint
page follows the reference project attribution for `[romani] project / Dieter W.
Halwachs`, Akademie Graz, Roma Service, and Romano Centro. The project-specific
credit is `Design und Technik: Valentin Edelsbrunner`; no external designer
credit is added for this dictionary prototype.

## 2026-07-06 — Dictionary adopts a provisional Romani Project visual system

The dictionary now uses the existing Romani Project assets and visual language as
its provisional design baseline: BDO Grotesk fonts, the Romani Project wordmark,
black dividing lines, white working surfaces, Romani blue for active states, and
a circular `DE/EN` UI-language control. The implementation keeps these choices in
CSS custom properties and local assets so the look can be changed without
rewriting dictionary behavior or data rendering.

This is a presentation decision only. It does not make the dictionary a final
Romani Project publication, does not change source data, and remains open for
later visual, attribution, accessibility, and publication review.

## 2026-07-06 — Alphabetical browsing belongs inside the dictionary

The separate Word list surface has been folded into the default Browse
dictionary flow. `dictionary.html` now owns lookup, selected-entry reading, and
the progressive alphabetical inventory over the same search index, spelling,
translation, type, and URL state. `word-list.html` remains only as a redirect to
`dictionary.html#dictionary-index` so old bookmarks keep working during the
prototype.

This reduces two overlapping entry points to one dictionary surface without
changing source data or ranking rules. The split Focus/Browse/Split layout model
remains: Browse is the integrated lookup-plus-inventory flow, Focus stays
search-first, and Split stays a dense repeated-lookup view.

## 2026-07-06 — Grammar reference follows the entry structure first

The Grammar page now starts from the 17 June structure definition before listing
paradigm dimensions. It shows the visible entry order, separates internal
`Paradigm` and `Domain` from reader-facing grammar, and condenses noun, verb,
and adjective forms into one source-field-to-display table. Entry form views now
include a short source summary before generated tables. This remains a
presentation layer over the workbook and paradigm model; no source values,
endings, or linguistic approvals are added.

## 2026-06-23 — German-first interface and separated language controls

The website interface is now German-first with an English UI toggle. The UI
language is independent from dictionary translation language and from Roman
spelling. This creates three explicit axes:

- UI language: `DE/EN` controls site chrome and explanatory labels (`ui`);
- Roman spelling: `INT/DEU` controls the Roman headword spelling (`spelling`);
- Translation language: `DE/EN` controls German or English equivalents
  (`meaning`).

The dictionary places spelling, translation, and layout controls next to search
instead of as detached top-right switches. GitHub Pages deployment now includes
the shared `site-i18n.js` module.

## 2026-06-23 — Dictionary cleanup favors lookup over onboarding

The dictionary entry no longer ends with a "Keep exploring" catalogue. At this
point the full Word list owned corpus browsing, while the dictionary page owned
lookup plus selected entry inspection. This separation was later reversed on
2026-07-06 when alphabetical browsing moved into `dictionary.html`.

The then-separate Word list became table-like: visible columns for Roman, word
type, and meaning, with search/spelling/translation/type/letter controls fixed
at the bottom. The old "complete index" and scroll-instruction copy was removed.

The Grammar page and generated grammar snippets now avoid artificial beginner
explanations. They expose source-derived dimensions, codes, generated forms, and
the unreviewed status in documentation/notation instead of repeated placeholder
badges. Case labels, person labels, tense/aspect labels, and word-type labels may
be readable, but the UI should not invent lessons or semantics beyond the
provided reference/paradigm data.

Verb conjugation rows include provisional English person examples such as
`I eat`, `you eat`, and `he/she/it eats`, derived from the first supplied English
meaning when possible. These are only placeholders to make person slots readable
until the professor confirms the correct labels/formulation.

## 2026-06-22 — Exploration uses recorded base relationships

The first corpus visualization is a dedicated `Explore` page built from the
workbook's explicit Roman base fields. It groups family entries through readable
word-type hubs and does not infer semantic similarity, etymology, or morphology.
The graph has a parallel readable member list and links every word back to its
full dictionary entry. The implementation uses native SVG and the existing
search index, preserving the dependency-light static architecture.

The Explore page now starts with a complementary canvas atlas. It shows up to
42 of the largest multi-word families per dominant word-type group (243 families
in the June data), rather than pretending that 2,664 overlapping families would
remain readable at once. Bubble size is entry count, colour is the family's most
common broad word type, and selecting a bubble opens the source-aligned SVG
family web. The atlas is an overview sample; corpus totals remain visible and the
search reaches every entry.

Four additional views remain deliberately labelled as exploration choices, not
final publication decisions. Type ribbons show the explicit base → broad word
type → entry flow; Family rings encode the same selected-family composition as
middle and outer arcs; Size landscape plots all 2,664 multi-word families in
dominant-type lanes against family size; Family comparison contrasts two selected
bases by size and word-type composition. The node-link Family web now adds curved
paths, type halos, selected-path emphasis, and optional labels. All six views
reuse one state/data layer and make no etymological or semantic-similarity claim.

## 2026-06-22 — Exact meanings outrank substrings

Dictionary search ranks exact case-preserving meanings, normalized exact meanings,
whole meaning words, prefixes, and loose substrings in that order. A globally
ranked set of ordinary result cards appears before the remaining word-type groups. This
prevents a query such as lowercase `essen` from ranking `Ausmessen` ahead of the
verb whose supplied German meaning is exactly `essen`.

## 2026-06-22 — Browse becomes the default reading flow

Browse now keeps search and Surprise me at the top, presents the selected entry
next, and places the word-type catalogue at the bottom. It initially linked to a
new progressive alphabetical Word list; that browsing surface was later folded
back into the dictionary page on 2026-07-06.

A separate Grammar guide provides source-aligned cheat sheets for noun cases,
verb person/tense/aspect, adjective agreement, word types, and dictionary notation.
It links to live paradigms and does not add endings or silently correct source data.

## 2026-06-22 — Search-first navigation replaces the comparison page

The arbitrary first 80 alphabetical entries and dedicated comparison page were
removed. Focus now starts with search, Surprise me, and word-type filters; Browse
adds a corpus-count catalogue; Split keeps the old sidebar as an optional dense
layout. Search results are grouped into broad navigation types and expose readable
labels instead of unexplained workbook codes. The existing `edition` values are
retained internally so development deep links do not break.

Onboarding copy was removed. Useful grammar remains embedded directly in entries;
the interface should demonstrate its structure rather than explain how to read it.

## 2026-06-22 — One dictionary, three reading modes

The standalone dictionary now supports `Focus`, `Browse`, and `Split`
presentation modes over the same data, component code, and deep-link state.
Browse is the provisional default; Focus is search-first, and Split preserves a
persistent result sidebar. Separate prototype codebases were rejected because
they would drift while testing presentation rather than data behavior. The
dedicated comparison surface was removed later the same day; the single
in-dictionary selector remains.

## 2026-06-22 — Paradigms become practical grammar, not bare endings

Generated verb forms are grouped by aspect/tense and person, noun forms by case
and number, and adjective forms by agreement dimensions. The overview exposes a
small set of useful complete forms. Plain-language labels and cheat sheets are a
presentation layer over `paradigm_model.json`; they do not add linguistic rules.
Generated forms remain unreviewed; the visible tables avoid repeated provisional
badges, while documentation, notation, raw codes, and derivation keep that status
traceable.

## 2026-06-22 — Story and dictionary are separate surfaces

`index.html` is the contextual story/home page. `dictionary.html` is the
bookmarkable working dictionary and loads `app.js`; users returning to search do
not pass through or scroll past the story. The two surfaces retain a shared Roman
identity but deliberately use different layouts and navigation states.

## 2026-06-22 — Entry hierarchy follows the professor's output structure

The primary entry view prioritises lemma, square-bracketed lemma supplements,
word class, meanings, and square-bracketed source information. Word family,
inflection, and raw details are separate views. `Paradigm` and `Domain` remain in
technical details because the structure PDF marks them as internal/not displayed.

## 2026-06-22 — Visualise only explicit workbook relationships

The entry overview uses a compact hierarchy for Base, Composition,
Reconstruction, current lemma, and Variation. The Word family view uses the
explicit `Base INT/DEU` relationship as a base-to-derived node graph. It does not
infer semantic similarity, synonymy, etymology, or graph edges from spelling.
The interaction pattern is informed by Visual Thesaurus, while the separation of
dictionary, language help, paradigms, and word families is informed by the
Ojibwe People's Dictionary. See `docs/dictionary-interface.md`.

## 2026-06-21 — Review gates temporarily fast-tracked

Valentin asked development to continue without intermediate review and will do a
major review later. Engineering may use conservative defaults and proceed through
the planned gates. Every unreviewed product or linguistic choice remains
provisional and must be easy to locate in this log, `AGENTS.md`, tests, or source
validation reports.

Current provisional defaults:

- German interface labels;
- `INT` Roman spelling on first visit;
- German meanings on first visit;
- Browse layout on first visit;
- URL parameters override remembered browser preferences;
- generated morphology is presented as practical grammar, with its generated and
  unreviewed status documented; raw codes and derivation are collapsed;
- the static-site architecture remains in place;
- current row-derived entry IDs may be shared during development but are not a
  permanent identity contract.

These choices are reversible and do not alter editorial source data.

## 2026-06-21 — Entry details load in deterministic chunks

The initial browser load uses the search index, references, morphology model, and
an entry-chunk manifest. Full entry records are fetched in 500-entry chunks on
demand. The monolithic `entries.json` remains generated for audit/compatibility,
but the frontend no longer blocks on it.

## 2026-06-21 — Introductory story uses only supplied manuscript claims

The first visual story is intentionally short and based on the supplied English
and German project manuscripts: the regional/contact setting of Roman, the
effects of persecution and language shift, codification with the University of
Graz, subsequent Roma-Service activity, and the 2011 Austrian UNESCO Commission
inventory listing. The presentation and copy are provisional. The later major
review must check tone, emphasis, attribution, rights, and whether community
voices or imagery should replace or extend this institutional summary.

## 2026-06-21 — June source package is authoritative

Use `2026-06-17_roman-wb.xlsx` and `2026-06-17_struktur.pdf`. Keep May files and
all supplied materials unchanged for provenance. Archive the repository's prior
`data/` tree rather than deleting it.

## 2026-06-21 — Preserve source defects

The build reports anomalies and retains original values. It does not repair the
missing `ROMAN DEU`, corrupted word class, `mackuline` label, or duplicate
abbreviation definitions.

## 2026-06-21 — Brackets depend on field role

Use square brackets for supplementary lemma, flexion, and source information.
Use round brackets for supplementary information in equivalents. This supersedes
the older entry-structure wording.

## 2026-06-21 — Morphology is provisional

The current transformation remains available for technical inspection, but it
is not an accepted linguistic feature until representative forms are reviewed.

## Open decisions for Gate 1

- priority audience and default interface language;
- default Roman spelling and sorting/collation behavior;
- stable public identifier strategy;
- exact duplicate-entry behavior;
- morphology visibility before Dieter's next review window;
- intended role, if any, of `However.docx`;
- publication rights and preferred attribution for manuscript-derived story copy.
