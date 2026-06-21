# Data workflow

## Source and output

The editorial source is
`roman-wb-valentin/2026-06-17_roman-wb.xlsx`. It is never modified by the build.
`scripts/preprocess_data.py` writes deterministic runtime data to
`data/processed/`.

```bash
python3 -m unittest discover -s tests -v
python3 scripts/preprocess_data.py
```

Generated files include full entries, a compact search index, reference tables,
provisional morphology tables, a source-to-output coverage report, and row-level
validation reports.

## Ingestion rules

- Require the 42 named `GLOSSARY` columns.
- Ignore only unnamed columns that are completely empty formatting residue.
- Fail when an unexpected column contains data.
- Preserve raw source values, workbook row numbers, spelling variants, and
  embedded Source-2 hyperlinks.
- Parse `abbrs-gram`, `abbrs-lang`, and `abbrs-lex` independently.
- Preserve duplicate abbreviation definitions as variants instead of silently
  overwriting them.
- Apply explicit paradigm aliases only in generated morphology; retain the
  original glossary value.

## Presentation semantics

Per the 17 June structure PDF and Dieter Halwachs's accompanying email:

- supplementary information for lemma, flexion, and source uses square brackets
  `[…]`;
- supplementary information within German/English equivalents uses round
  brackets `(…)`;
- `Paradigm` and `Domain` are internal fields;
- internal lemma hyphens are retained in raw values and removed only in explicit
  display values;
- word-family behavior derives from `Base INT/DEU`.

Do not infer brackets merely from punctuation in arbitrary text. The UI should
render brackets according to the field group.

## Validation policy

Validation does not repair source data. Each issue has a severity and, where
applicable, a workbook row:

- `error`: missing core data or a value outside the accepted source model;
- `warning`: ambiguity or an editorial/linguistic decision still required;
- `info`: preserved source behavior or a non-blocking structural observation.

The current known errors are one missing `ROMAN DEU` lemma and one corrupted
`Word class 1` value. Known reference warnings include duplicate `LOC`/`MOD`
definitions and English `m. = mackuline` in `abbrs-lex`.

## Morphology status

Generated forms are a hypothesis derived from the workbook tables. They are not
publication-ready until the entries in `tests/fixtures/review-corpus.json` have
been checked. A failed or unmatched paradigm must produce an explicit absence,
never a guessed form.
