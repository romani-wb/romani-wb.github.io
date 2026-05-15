# Romani Dictionary Project Context

## Project Purpose

This repository is the early technical base for a Romani dictionary website. `WB`
means the German `Wörterbuch`. The project should primarily become a dictionary,
with room for related linguistic views such as paradigms, word families, domains,
and source/etymology views.

The current priority is not visual polish. The priority is a reliable data
pipeline and a simple information architecture that can survive long pauses
between work sessions.

## Source Data

Treat files in `data/` as source material unless explicitly asked to edit them.

- `data/2026-05-07_roman-wb-2.xlsx`: main workbook.
- `data/2026-05-07_struktur.pdf`: column and entry logic notes.
- `data/README.md`: current human-readable source overview and known issues.
- `docs/stakeholder-structure.md`: distilled implementation rules from the PDF.

The main workbook sheet is `GLOSSARY`:

- 12,464 entries.
- 42 fixed columns.
- Important independent display switches:
  - Roman spelling: `INT` or `DEU`.
  - Translation language: `DEUTSCH` or `ENGLISH`.

Key implementation sheets:

- `GLOSSARY`: lexical entries.
- `ADJ-DECL`, `F-DECL`, `M-DECL`, `MF-DECL`, `V-CONJG`, `V-EXIST`: morphology.
- `abbrs-gram`, `abbrs-lang`: abbreviation/reference tables.
- `structure`: stakeholder-provided structure notes. Treat this as a helpful
  interpretive guide, not as the authoritative schema.

## Data Pipeline

The intended workflow is:

1. Keep the raw Excel and PDF intact.
2. Run `scripts/preprocess_data.py`.
3. Use generated JSON in `data/processed/` as the stable frontend input.
4. Add richer validation and morphology generation only after the basic
   dictionary entry model is confirmed.

The preprocessing script should stay deterministic: same input workbook, same
output files.

## Frontend Direction

Start with a static site-friendly architecture. The first usable product should
prioritize:

- Search by Roman `INT`, Roman `DEU`, German meaning, and eventually English.
- Entry detail view with spelling toggle and translation-language toggle.
- Optional sections for composition, variation, reconstruction, source/base,
  grammar/flexion, paradigm, and domain.
- A conservative route structure such as:
  - `/` search and browse.
  - `/entry/:id` entry detail.
  - `/about` data/source notes.

Do not build around a complex backend until the data model requires it.

## Known Data Caveats

Preserve auditability back to workbook rows. `data/README.md` lists current
known inconsistencies, including a corrupted word-class value, possible shifted
fields, incomplete English meanings, sheet-name mismatches between PDF and
workbook, and paradigm keys that may need explicit mapping.

The stakeholder-created `structure` sheet may express the intended grammar, but
the stakeholder is not expected to provide a clean technical schema. Prefer
observed workbook columns, actual row patterns, and explicit validation reports
over assuming the `structure` sheet is complete or internally consistent.

The PDF is stronger than the `structure` sheet for intended display logic:
hyphens are internal stem markers, `Paradigm` and `Domain` are internal fields,
forms should be generated from the paradigm tables, and word-family links should
come from `Base INT/DEU`.

When adding validation, report issues instead of silently correcting source data.
