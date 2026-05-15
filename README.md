# Romani WB

Early technical workspace for a Romani dictionary website (`WB` = German
`Wörterbuch`).

The project currently focuses on understanding and normalizing the source data.
Design and frontend implementation should build on the processed JSON files, not
directly on the Excel workbook.

## Data Sources

- `data/2026-05-07_roman-wb-2.xlsx`: source workbook.
- `data/2026-05-07_struktur.pdf`: source notes about column structure.
- `data/README.md`: current workbook overview and known data caveats.

## Preprocess Data

Install the Python dependencies in your preferred environment:

```bash
python3 -m pip install -r requirements.txt
```

Generate frontend-friendly data:

```bash
python3 scripts/preprocess_data.py
```

This writes:

- `data/processed/entries.json`
- `data/processed/entries_search.json`
- `data/processed/abbreviations.json`
- `data/processed/references.json`
- `data/processed/paradigm_model.json`
- `data/processed/paradigm_tables.json`
- `data/processed/summary.json`
- `data/processed/reports/data_coverage.json`
- `data/processed/reports/validation_summary.json`
- `data/processed/reports/validation_report.json`

See `docs/data-workflow.md` for the intended data model and next steps.
See `docs/stakeholder-structure.md` for the implementation rules distilled from
the stakeholder PDF.

Use `validation_summary.json` first. It contains issue counts and small samples.
Use `validation_report.json` only when you need every affected row.

## Run The Viewer

The viewer is a small static app that reads the generated JSON files.
It expands grammar abbreviations into readable labels and generates adjective,
noun, and verb forms from `paradigm_model.json` when the selected entry has a
usable paradigm.

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

Opening `index.html` directly from the filesystem is not enough because browsers
block local JSON fetches.

## Current Product Direction

Start with a static dictionary UI:

- search and browse entries,
- toggle Roman spelling between `INT` and `DEU`,
- toggle meanings between German and English,
- show optional linguistic details only on demand.

Morphology generation should come after the basic entry display and stakeholder
review.
