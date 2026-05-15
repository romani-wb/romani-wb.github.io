# Data Workflow

## Why Preprocess

The workbook is the editorial source, but it is not the ideal runtime format for
a website. The first technical step should be a small, repeatable preprocessing
layer that turns the workbook into explicit JSON files:

- one full entry file for detail pages,
- one lightweight search file for fast lookup,
- one reference file for abbreviations,
- one raw paradigm-table file for later morphology work,
- one summary file for counts and quick sanity checks.

This keeps the frontend simple and makes future sessions easy to restart.

The workbook also contains a `structure` sheet. Use it as stakeholder context
for the intended linguistic model, but do not treat it as a strict technical
schema. The practical source of truth for preprocessing is the actual `GLOSSARY`
columns and the values found in the workbook.

Also use `data/2026-05-07_struktur.pdf` as the stakeholder's intended model for
display and morphology rules. The distilled implementation notes are in
`docs/stakeholder-structure.md`.

## Current Output Files

Run:

```bash
python3 scripts/preprocess_data.py
```

Default input:

```text
data/2026-05-07_roman-wb-2.xlsx
```

Default output directory:

```text
data/processed/
```

Generated files:

- `entries.json`: normalized glossary records with source row numbers.
- `entries_search.json`: compact search/display records.
- `abbreviations.json`: grammar and language abbreviation tables.
- `references.json`: abbreviation and source-marker lookup tables for readable
  UI labels.
- `paradigm_model.json`: compact parsed morphology tables used by the viewer to
  generate forms for the selected entry.
- `paradigm_tables.json`: raw morphology/reference tables for later parsing.
- `summary.json`: counts and source metadata.
- `reports/data_coverage.json`: source-column to processed-schema mapping and
  non-empty counts, used to verify that the pipeline preserves the workbook
  structure.
- `reports/validation_summary.json`: issue counts, samples, parsed paradigm keys,
  and structure-sheet comparisons.
- `reports/validation_report.json`: complete row-level issue list.

## First Dictionary Model

Each entry should be understood as:

- stable audit identifier,
- source workbook row,
- Roman lemma in `INT` and `DEU`,
- display lemma with internal hyphen markers removed,
- word class and flexion metadata,
- German meanings,
- English meanings where available,
- optional detail groups:
  - composition,
  - variation,
  - reconstruction,
  - etymological source,
  - base or word family,
  - domain,
  - paradigm.

The website should have two independent switches:

- Roman spelling: `INT` or `DEU`.
- meaning language: `DEUTSCH` or `ENGLISH`.

## What Not To Solve Yet

Do not make morphology generation a blocker for the first frontend. Paradigm
tables have multi-row and multi-section structures, and irregular forms need
special handling. The current viewer can generate forms for entries whose
paradigm is present in `paradigm_model.json`; entries with unmatched or suspicious
paradigms should show an explicit "no generated forms" note rather than guessing.

Do not silently repair source inconsistencies in generated output. Add validation
reports first, then ask the data owner for corrections or explicit mapping rules.

## Validation Severity

The validation report intentionally separates different kinds of concern:

- `error`: data that is likely corrupt or outside the expected model.
- `warning`: data that may be valid stakeholder logic, but needs a rule before
  the website can safely derive forms or display it as structured grammar.
- `info`: known incompleteness or context mismatch, such as missing English
  translations or values present in `GLOSSARY` but absent from the `structure`
  sheet.

The current workflow should not auto-correct these issues. It should preserve
the source values, report them with workbook row numbers, and let us decide
whether each case needs a source correction, a mapping rule, or a UI fallback.

Explicit paradigm aliases are allowed when the workbook and paradigm table use
different names for what is evidently the same stakeholder concept. These aliases
must remain visible in `scripts/preprocess_data.py`, appear in the validation
summary, and preserve the original source `Paradigm` value in each entry.

## Recommended Next Steps

1. Add validation reports for missing paired `INT`/`DEU` fields, suspicious word
   classes, unmatched paradigm keys, and mismatches between the `structure` sheet
   and actual `GLOSSARY` values.
2. Build a minimal static UI against `data/processed/entries_search.json` and
   `data/processed/entries.json`.
3. Review the entry detail wireframe with the stakeholder before investing in
   visual design.
4. Add morphology generation only for the most common noun/adjective/verb cases,
   backed by tests and fixture entries.
