export const WORD_CLASS_LABELS = {
  N: "Noun",
  ADJ: "Adjective",
  V: "Verb",
  NP: "Noun phrase",
  PTCLV: "Particle verb",
  ADV: "Adverb",
  PREFV: "Prefix verb",
  VP: "Verb phrase",
  NUM: "Numeral",
  PTCL: "Particle",
  PRON: "Pronoun",
  PREP: "Preposition",
  CONJ: "Conjunction",
  ART: "Article",
  INTERJ: "Interjection",
  PREF: "Prefix",
};

export const WORD_TYPE_GROUPS = [
  { key: "nouns", label: "Nouns", description: "People, places, things, and ideas", codes: ["N"] },
  { key: "verbs", label: "Verbs", description: "Actions, states, and verb phrases", codes: ["V", "PTCLV", "PREFV", "VP"] },
  { key: "adjectives", label: "Adjectives", description: "Words that describe nouns", codes: ["ADJ"] },
  { key: "adverbs", label: "Adverbs", description: "Words that modify actions or descriptions", codes: ["ADV"] },
  { key: "phrases", label: "Noun phrases", description: "Multi-word nominal expressions", codes: ["NP"] },
  { key: "grammar", label: "Grammar words", description: "Pronouns, particles, prepositions, and more", codes: ["NUM", "PTCL", "PRON", "PREP", "CONJ", "ART", "INTERJ", "PREF"] },
  { key: "other", label: "Other", description: "Unclassified source entries", codes: [] },
];

export function wordClassLabel(entryOrCode) {
  const code = typeof entryOrCode === "string" ? entryOrCode : entryOrCode?.word_class;
  if (!code) return "Unclassified";
  return WORD_CLASS_LABELS[code] || "Unclassified";
}

export function wordTypeGroup(entryOrCode) {
  const code = typeof entryOrCode === "string" ? entryOrCode : entryOrCode?.word_class;
  return WORD_TYPE_GROUPS.find((group) => group.codes.includes(code)) || WORD_TYPE_GROUPS[WORD_TYPE_GROUPS.length - 1];
}
