# Roman Dictionary — Agent Working Agreement

Start every new agent session with `HANDOFF.md`, then use this file as the
binding working agreement.

## Goal

Build a reliable, static-site-friendly dictionary for Roman, the Romani variety
documented with Dieter Halwachs. The product includes a short, carefully sourced
introduction before the dictionary. Correctness and editorial traceability take
precedence over visual polish.

## Authoritative sources

- Current workbook: `roman-wb-valentin/2026-06-17_roman-wb.xlsx`
- Current structure definition: `roman-wb-valentin/2026-06-17_struktur.pdf`
- Context manuscripts: `roman-wb-valentin/materials/`
- File status and checksums: `docs/source-register.md`

Never edit raw files in `roman-wb-valentin/`. Previous generated/source data is
kept under `backups/`; it is not an input to the current build.

## Data contract

- `GLOSSARY` has 42 logical columns and 12,525 entries in the June source.
- Roman spelling (`INT`/`DEU`) and meaning language (`DEUTSCH`/`ENGLISH`) are
  independent UI choices.
- Square brackets `[…]` are supplementary information for lemma, flexion, and
  source. Round brackets `(…)` are supplementary information in equivalents.
- Preserve source values and workbook row numbers. Report anomalies; do not
  silently repair them.
- Empty unnamed Excel formatting columns may be ignored. Any non-empty
  unexpected column must fail ingestion.
- Morphology output is provisional until the representative corpus is reviewed.
- Current entry IDs include workbook row numbers and are not yet permanent URLs.

## Workflow

1. Change `scripts/preprocess_data.py` or its tests.
2. Run `python3 -m unittest discover -s tests -v`.
3. Run `node tests/frontend-smoke.mjs` for frontend/data-contract changes.
4. Run `python3 scripts/preprocess_data.py`.
5. Inspect `data/processed/reports/validation_summary.json`.
6. Compare generated output and commit source, code, tests, reports, and docs
   together.

The pipeline must be deterministic. Generated JSON is frontend input, not an
editorial source.

## Review gates

Do not cross a gate without recording the decision in `docs/decisions.md`:

1. Data/schema and representative-entry review.
2. Search behavior and entry information architecture.
3. Story, tone, attribution, and visual direction.
4. Accessibility, performance, deployment, and publication readiness.

As of 21 June 2026, Valentin has authorized fast-tracking these gates until a
later major review. Continue autonomously with reversible, conservative defaults;
record assumptions and deferred questions rather than pausing. This does not
authorize silent source corrections, publication, pushing, or claims that
provisional morphology has been linguistically approved.

## Engineering constraints

- Keep the site static until a concrete editorial need requires a backend.
- Add dependencies only when they remove meaningful complexity.
- Test transformations against the real workbook and small explicit fixtures.
- Avoid linguistic inference. Encode only source rules or reviewed decisions.
- Do not publish or push changes without explicit authorization.
