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
| Specialist | generated inflection | dedicated provisional table |
| Audit | raw paired fields, paradigm, domain, workbook row | Details view |

## Visualisation rules

- A graph edge must correspond to an explicit workbook field.
- `Base INT/DEU` creates word-family edges.
- Composition, reconstruction, and variation create labelled structure nodes,
  not semantic or chronological claims beyond the professor's definitions.
- Missing data produces a clear empty explanation; it never creates guessed
  nodes.
- Every visual node remains readable and operable as ordinary HTML, including
  keyboard interaction and narrow layouts.
