# Stakeholder Structure Notes

These notes summarize `roman-wb-valentin/2026-06-17_struktur.pdf`. Treat the PDF as the
stakeholder's intended model. It is important context for the pipeline, even
where the workbook contains inconsistencies or the PDF has outdated sheet names.

## Display And Internal Markers

- `ROMAN INT` and `ROMAN DEU` are the two lemma spellings.
- Hyphens in the lemma are internal stem/ending markers. They should not be
  shown in the headword. They indicate where paradigm endings attach.
- `Paradigm` is internal. It should drive generated forms, not be the primary
  user-facing grammar explanation.
- `Domain` is internal. The PDF says it is not relevant for dictionary display
  and is used for internal sorting/extraction.

## Main Entry Structure

The PDF describes the intended entry as:

```text
lemma [composition; variation; reconstruction]
WORDCLASS 1. WORDCLASS 2. FLEX1 [flex2; flex3]
meaning 01, ..., 10
[SOURCE1 source2]
```

In the June definition, supplementary lemma information (composition,
variation, reconstruction), flexion information, and source information uses
square brackets `[…]`. Supplementary information inside an equivalent continues
to use round brackets `(…)`. The field role determines the presentation; source
punctuation is not rewritten.

For the viewer, this means:

- headword and meanings are primary,
- grammar should be expanded into readable labels,
- composition, variation, reconstruction, base, source, paradigm, and domain
  can be shown as details,
- raw codes should be retained for auditability but should not be the only user
  explanation.

## Morphology Rules

The PDF's implementation logic:

- For `Word class 1 = ADJ`, use `ADJ-DECL`.
- For `Word class 1 = N`, use `Flexion 1` to select:
  - `M` -> `M-DECL`
  - `F` -> `F-DECL`
  - `M/F` -> `MF-DECL`
- For `Word class 1 = V`, use `V-CONJG`.
- Forms of "to be" use `V-EXIST`.
- `IRR` paradigms are irregular. Their table cells already contain the full
  form or stem/form and should not be assembled by adding an ending to the lemma
  stem.
- Noun and verb paradigms have separate `INT` and `DEU` sections. Adjective
  endings are the same for `INT` and `DEU`; only the lemma stem changes.

## Buttons / Secondary Views

The PDF explicitly mentions additional buttons for:

- flexion paradigm,
- word family with links to individual entries.

The current viewer implements this as:

- generated forms table when the paradigm can be resolved,
- word-family section based on `Base INT/DEU`.

## Known PDF / Workbook Mismatches

- The PDF says `V-CONJ`; the workbook sheet is `V-CONJG`.
- The PDF refers to `abbrvs-gramm`; the workbook sheet is `abbrs-gram`.
- Some column descriptions likely have copy/paste mistakes, for example saying
  "Spalte G" where the workbook has a matching `DEU` partner column.

These mismatches should be documented and validated, not silently corrected in
the source workbook.

## Explicit Pipeline Aliases

The current workbook has a small set of paradigm-name drifts where `GLOSSARY`
uses one name and the paradigm table uses another. The pipeline resolves these
through explicit aliases while preserving the original source value:

- `NME-i` -> `NM-E-i`
- `NME-IRR-01` -> `NM-IRR-01`
- `NME-IRR-02` -> `NM-IRR-02`
- `NME-IRR-03` -> `NM-IRR-03`
- `NME-IRR-04` -> `NM-IRR-04`
- `NME-IRR-05` -> `NM-IRR-05`
- `NFPE-∅-01` -> `NFPE-∅-1`

These aliases are intentionally not source edits. They are provisional
compatibility rules for generating forms from the current workbook and require
review through the representative corpus.
