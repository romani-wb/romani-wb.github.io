# Rebuild plan and approval gates

## Phase 0 — Preserve and establish the source contract

Status: in progress.

- tag the existing prototype;
- work on a dedicated `rebuild` branch;
- archive the previous `data/` tree by date;
- register and checksum the professor's source package;
- ingest the 17 June workbook without modifying it;
- add schema tests, validation, and this decision framework.

Exit: deterministic build, tests green, known anomalies visible, local commit.

## Phase 1 — Confirm the dictionary model

- review the representative corpus with Valentin;
- send only linguistic ambiguities to Dieter when he is available;
- define stable entry identity independent of workbook row order;
- confirm search fields, sorting/collation, spelling defaults, and empty states;
- decide whether provisional morphology is hidden, labelled, or omitted.

Gate 1 approval: entry model, audience priority, review corpus, and morphology
policy.

## Phase 2 — Information architecture and interaction prototype

- prototype landing, search/browse, entry detail, and about/method pages;
- test URL behavior, browser history, keyboard navigation, mobile layout, and
  loading strategy;
- split the search index from entry payloads so the full dataset is not required
  before first interaction.

Gate 2 approval: search behavior and entry information architecture.

## Phase 3 — Story and visual system

- derive a small set of sourced story beats from the supplied manuscripts;
- confirm attribution, rights, names, imagery, and wording;
- establish typography, color, illustration/photography, and motion rules;
- implement reduced-motion and accessibility behavior at the system level.

Gate 3 approval: story copy, attribution, and visual direction.

## Phase 4 — Production hardening and publication

- automate build/test checks;
- test performance, accessibility, browsers, and static-host routing;
- define the December source-update procedure;
- publish only after final content and deployment approval.

Gate 4 approval: release candidate and publication.

## Source calendar

Dieter is pausing editorial work until mid-September 2026. The next and intended
final correction version is expected in early December 2026. Column names and
definitions are expected to remain stable, so engineering can proceed against
the June schema while treating lexical content as versioned.
