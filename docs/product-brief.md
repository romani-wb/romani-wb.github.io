# Product brief

## Product

A public, bilingual German/English dictionary for Roman with two Roman spelling
systems (`INT` and `DEU`), preceded by a concise visual introduction to the
language, community, and dictionary project.

## Primary jobs

1. Find a Roman word from either Roman spelling or a German/English equivalent.
2. Understand an entry without needing to decode the workbook's abbreviations.
3. Move between spelling systems without losing the selected meaning language.
4. Inspect source, variants, word family, and grammar when those details exist.
5. Understand what Roman is and how the dictionary came to exist before browsing.

## Initial audiences

- Burgenland Roma community members and learners;
- teachers, linguists, and researchers;
- German- and English-speaking visitors encountering Roman for the first time.

These are working assumptions. Audience priority is a Gate 1 decision.

## Product principles

- Editorial source remains visible and auditable.
- The common path is simple search; specialist detail is progressively revealed.
- Empty data is omitted rather than represented as broken UI.
- Storytelling claims need an identified source and attribution review.
- Motion and visual atmosphere may add character but cannot obstruct search,
  reading, keyboard use, reduced-motion preferences, or small screens.

## First production scope

- contextual landing/introduction;
- fast client-side search across both Roman spellings and both meaning languages;
- browse and entry detail views with shareable URLs;
- independent spelling and meaning-language controls;
- readable abbreviation/reference help;
- optional entry sections only when data exists;
- accessible responsive behavior and static hosting.

## Explicit non-goals for the first release

- editorial accounts or in-browser workbook editing;
- crowdsourced corrections;
- automatic linguistic correction;
- a backend without a demonstrated requirement;
- publishing generated morphology before review;
- treating current row-derived entry IDs as permanent identifiers.

## Success checks

- representative searches return the expected entry quickly on mobile and
  desktop;
- every displayed field can be traced to a workbook row or reviewed story source;
- all representative entries pass stakeholder review;
- no critical accessibility failures and no initial 17 MB blocking payload;
- a source update can be rebuilt and audited without manual JSON editing.
