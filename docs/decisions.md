# Decision log

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

- English interface labels;
- `INT` Roman spelling on first visit;
- German meanings on first visit;
- URL parameters override remembered browser preferences;
- generated morphology is collapsed and labelled `Provisional`;
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
