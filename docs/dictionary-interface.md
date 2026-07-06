# Dictionary interface rationale

## Source hierarchy

The 17 June structure PDF defines the visible entry in this order:

1. lemma with composition, variation, and reconstruction in square brackets;
2. word class 1, word class 2, and flexion supplements;
3. German or English equivalents;
4. source information in square brackets;
5. separate actions for inflection paradigm and word family.

`Paradigm` and `Domain` are explicitly internal. The redesigned interface uses
that hierarchy instead of presenting every workbook field as an equal card.

## Reference patterns

- [Merriam-Webster](https://www.merriam-webster.com/dictionary/definition):
  headword, word class, and numbered senses establish a strong primary reading
  order before word history and secondary material.
- [Wiktionary](https://en.wiktionary.org/wiki/etymology): alternative forms,
  etymology, grammar, senses, inflection, and related terms are separated into
  identifiable sections rather than mixed into one metadata grid.
- [Ojibwe People's Dictionary](https://ojibwe.lib.umn.edu/): the searchable
  dictionary is a tool in its own right, while paradigms, word stems, word parts,
  word families, cultural context, and project story are adjacent resources.
- [Visual Thesaurus](https://www.visualthesaurus.com/): relationship maps can
  turn word exploration into navigation. Roman uses the interaction idea only
  for explicit Base relationships, not inferred semantic links.

## Information priority

| Priority | Information | Presentation |
| --- | --- | --- |
| Primary | lemma, spelling alternative, word class, meanings | entry masthead and numbered sense list |
| Context | composition, variation, reconstruction, source | compact structure hierarchy and source block |
| Explore | word family | interactive base-to-derived node graph |
| Learn | practical conjugation/declension | generated words in plain-language grids |
| Specialist | paradigm derivation and raw codes | collapsed technical disclosure |
| Audit | raw paired fields, paradigm, domain, workbook row | Details view |

## Navigation layouts

All layouts use the same entry, search, lazy loading, and URL state. They are
presentation modes, not forks:

- **Focus** keeps search, Surprise me, and word-type filters above
  a full-width entry. No entries appear until the user searches or chooses a type.
- **Browse** is the default. Search stays at the top, the entry occupies the main
  reading flow, and the progressive alphabetical inventory follows below it.
- **Split** retains a persistent result sidebar for dense repeated lookup.

The comparison page was removed; the layout selector is sufficient. The legacy
`edition` URL values remain for link compatibility and browser preference storage.

Search matches are grouped by broad word type. Individual badges use readable
labels (`Particle verb`, `Noun phrase`) while source codes remain available in
Details. The broad grouping is a navigation aid, not a change to the workbook.

Alphabetical browsing is part of `dictionary.html`. The inventory covers all
12,525 entries, renders progressively in batches, and follows the same spelling,
meaning language, search text, word type, first-letter, and URL state as the
rest of the dictionary. `word-list.html` is retained only as a compatibility
redirect.

`grammar.html` turns the professor's paradigm dimensions into compact reference
sheets for noun cases, verb person/tense/aspect, adjective agreement, word-class
codes, spelling variants, and notation. It links to live generated paradigms
rather than duplicating or extending the source rules.

## Grammar presentation

- Verb paradigms are grouped by aspect and tense, then shown across the six
  grammatical persons using familiar pronouns.
- Noun paradigms become a case-by-number matrix with a short explanation of
  each case's typical sentence role.
- Adjective paradigms become a basic/oblique matrix across number and gender.
- Entry overviews show only high-value forms: present forms for verbs,
  nominative singular/plural for nouns, and basic agreement forms for adjectives.
- Actual forms come only from the generated paradigm model. The interface adds
  labels and grouping but no new endings, stems, relationships, or corrections.
- Generated sets remain unreviewed and are described that way in documentation
  and notation. The entry tables avoid repeated placeholder badges; raw grammar
  codes and the derivation explanation remain available under a technical
  disclosure.

## Visualisation rules

- A graph edge must correspond to an explicit workbook field.
- `Base INT/DEU` creates word-family edges.
- Composition, reconstruction, and variation create labelled structure nodes,
  not semantic or chronological claims beyond the professor's definitions.
- Missing data produces a clear empty explanation; it never creates guessed
  nodes.
- Every visual node remains readable and operable as ordinary HTML, including
  keyboard interaction and narrow layouts.
