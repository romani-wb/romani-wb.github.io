# Decision log

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
