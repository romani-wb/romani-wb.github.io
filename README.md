# Roman Dictionary

This repository is the rebuild workspace for a public Roman dictionary and a
short contextual introduction to the language and project.

The current authoritative editorial package is dated 17 June 2026. The raw
files are immutable; a deterministic Python pipeline converts the workbook into
auditable JSON for a static frontend.

## Current checkpoint

- 12,525 glossary entries
- German and English equivalents for every entry
- 42 logical glossary columns
- source hyperlinks preserved
- known source anomalies reported by row
- morphology retained as provisional output pending linguistic review

## Run locally

```bash
python3 -m pip install -r requirements.txt
python3 -m unittest discover -s tests -v
python3 scripts/preprocess_data.py
node tests/frontend-smoke.mjs
python3 -m http.server 8000
```

Open `http://localhost:8000`.

- Story/home: `http://localhost:8000/index.html`
- Standalone dictionary: `http://localhost:8000/dictionary.html`
The dictionary offers three layouts over the same data and URL state: `Focus`
(search-first), `Browse` (word-type catalogue), and `Split` (persistent result
sidebar). Generated conjugations and declensions are useful previews derived
from the professor's paradigm tables and remain marked for linguistic review.

Read these before making structural changes:

- `AGENTS.md`
- `docs/product-brief.md`
- `docs/rebuild-plan.md`
- `docs/source-register.md`
- `docs/data-workflow.md`
- `docs/dictionary-interface.md`
- `docs/stakeholder-structure.md`
