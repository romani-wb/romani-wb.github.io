# Roman Dictionary Data

This directory contains the first data package for the Roman dictionary project.

- `2026-05-07_roman-wb-2.xlsx` is the main workbook.
- `2026-05-07_struktur.pdf` describes the column structure and entry logic.

## Workbook Overview

The workbook has 17 sheets.
The main sheet is `GLOSSARY`, with 12,464 entries and 42 fixed columns.

The implementation-relevant sheets are:

- `GLOSSARY`: main lexical data.
- `ADJ-DECL`: adjective declension endings.
- `F-DECL`: feminine noun declension paradigms.
- `M-DECL`: masculine noun declension paradigms.
- `MF-DECL`: masculine/feminine noun declension paradigms.
- `V-CONJG`: verb conjugation paradigms.
- `V-EXIST`: forms of the verb "to be".
- `abbrs-gram`: grammatical abbreviations.
- `abbrs-lang`: language/source abbreviations.

The other sheets appear to contain helper lists, structural notes, or analytical extracts for the descriptive volume.

## Display Model

The dictionary needs two independent switches:

- Roman spelling: `INT` or `DEU`.
- Translation language: `DEUTSCH` or `ENGLISH`.

The basic entry display is:

`Roman word + word class + meaning`

Additional information should be optional/toggleable:

- composition
- variation
- reconstruction
- source/etymology
- base or word family
- flexion/paradigm
- domain or word field

## GLOSSARY Columns

Columns `A:AP` are fixed.
Important groups are:

- `ROMAN INT`, `ROMAN DEU`: lemma in international and German-oriented spelling.
- `Composition INT/DEU`: compound structure, if present.
- `Variation INT/DEU`: variant forms, if present.
- `Reconstruction INT/DEU`: reconstructed or underlying forms, often marked with `*` or `<`.
- `Source-1`, `Source-2 INT/DEU`: etymological source or derivational base.
- `Base INT/DEU`: base lexeme for word-family grouping.
- `Word class 1`, `Word class 2`: grammatical classification.
- `Flexion 1`, `Flexion 2 INT/DEU`, `Flexion 3 INT/DEU`: flexion class details.
- `Paradigm`: internal key for generating declension/conjugation forms; do not display directly.
- `Domain`: internal categorisation; probably not displayed by default.
- `DEUTSCH 01-10`: German meanings.
- `ENGLISH 01-10`: English meanings.

A dash-like value such as `–` means "no value" or "not applicable".
English meanings are still incomplete: about 4,500 entries currently have at least one non-empty English meaning.

## Flexion Logic

`GLOSSARY.Paradigm` selects the paradigm used to generate forms.

For nouns, combine:

- `Word class 1 = N`
- `Flexion 1` / gender class such as `M`, `F`, or `M/F`
- `Paradigm`
- the matching noun paradigm sheet: `M-DECL`, `F-DECL`, or `MF-DECL`

For adjectives, use `ADJ-DECL`.
For verbs, use `V-CONJG`.
Forms of "to be" use `V-EXIST`.

Paradigms marked as irregular already contain the stem/form in the paradigm table.
Those entries should not be assembled by adding endings to the lemma stem.

## Clarifications / Potential Inconsistencies

Ask the data owner about these before building import rules:

- The PDF refers to `V-CONJ`, but the workbook sheet is named `V-CONJG`.
- The PDF refers to `abbrvs-gramm`, but the workbook sheet is named `abbrs-gram`.
- In the PDF, column `K` is described as "Spalte G in DEU-Schreibung"; this likely means `Source-2 DEU`.
- In the PDF, column `R` is described as "Spalte P in DEU-Schreibung"; this likely means `Flexion 2 DEU`.
- Row `1532`, lemma `briater-i/-kíja`, has a corrupted `Word class 1` value: `N+V1536N1536:U1536`.
- Row `8189`, lemma `palkiníp-e`, appears shifted or misclassified: `Word class 2 = M`, `Flexion 1 = -és-`, `Flexion 2 INT = -ča`, and `Flexion 3 DEU = -tscha`.
- Some paired `INT/DEU` fields have only one side filled, for example rows `5195`, `7339`, `7352`, `8168`, and `12388`.
- Some `GLOSSARY.Paradigm` values do not exactly match paradigm sheet headers, including `NME-i`, `NME-IRR-01` through `NME-IRR-05`, and `NFPE-∅-01`.
  These may need explicit mapping or correction.

