# Rebuild plan and approval gates

## Phase 0 — Preserve and establish the source contract

Status: completed in commit `a96379b`.

- tag the existing prototype;
- preserve a reversible baseline before moving active prototype work to `main`;
- archive the previous `data/` tree by date;
- register and checksum the professor's source package;
- ingest the 17 June workbook without modifying it;
- add schema tests, validation, and this decision framework.

Exit: deterministic build, tests green, known anomalies visible, local commit.

## Phase 1 — Confirm the dictionary model

Status: fast-tracked. The runtime contract and provisional policies are in place;
stable public identity and linguistic review remain open.

- review the representative corpus with Valentin;
- send only linguistic ambiguities to Dieter when he is available;
- define stable entry identity independent of workbook row order;
- confirm search fields, sorting/collation, spelling defaults, and empty states;
- keep provisional morphology visible as generated practical grammar, with its
  unreviewed status documented and representative review still required.

Gate 1 approval: entry model, audience priority, review corpus, and morphology
policy.

## Phase 2 — Information architecture and interaction prototype

Status: initial prototype completed in commit `74c26d0`. Formal real-browser,
keyboard, accessibility, and performance QA remains open.

- prototype landing, search/browse, entry detail, and about/method pages;
- test URL behavior, browser history, keyboard navigation, mobile layout, and
  loading strategy;
- split the search index from entry payloads so the full dataset is not required
  before first interaction.
- add the integrated alphabetical dictionary inventory, Grammar reference, and
  Explore lab over the same processed data.

Gate 2 approval: search behavior and entry information architecture.

## Phase 3 — Story and visual system

Status: initial sourced story and visual shell completed in commit `f826536`.
Copy, attribution, rights, community voice/imagery, and visual direction remain
provisional until the major review.

- derive a small set of sourced story beats from the supplied manuscripts;
- confirm attribution, rights, names, imagery, and wording;
- establish typography, color, illustration/photography, and motion rules;
- implement reduced-motion and accessibility behavior at the system level.

Gate 3 approval: story copy, attribution, and visual direction.

## Phase 4 — Production hardening and publication

Status: prototype deployment from `main` is available through the explicit Pages
workflow. Production hardening, final editorial approval, and publication
readiness remain open.

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
