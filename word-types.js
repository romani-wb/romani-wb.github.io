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

export const WORD_CLASS_LABELS_DE = {
  N: "Substantiv",
  ADJ: "Adjektiv",
  V: "Verb",
  NP: "Nominalphrase",
  PTCLV: "Partikelverb",
  ADV: "Adverb",
  PREFV: "Präfixverb",
  VP: "Verbalphrase",
  NUM: "Numerale",
  PTCL: "Partikel",
  PRON: "Pronomen",
  PREP: "Präposition",
  CONJ: "Konjunktion",
  ART: "Artikel",
  INTERJ: "Interjektion",
  PREF: "Präfix",
};

export const WORD_TYPE_GROUPS = [
  { key: "nouns", label: "Nouns", labelDe: "Substantive", description: "People, places, things, and ideas", descriptionDe: "Personen, Orte, Dinge und Begriffe", codes: ["N"] },
  { key: "verbs", label: "Verbs", labelDe: "Verben", description: "Actions, states, and verb phrases", descriptionDe: "Handlungen, Zustände und Verbalphrasen", codes: ["V", "PTCLV", "PREFV", "VP"] },
  { key: "adjectives", label: "Adjectives", labelDe: "Adjektive", description: "Words that describe nouns", descriptionDe: "Wörter, die Substantive näher bestimmen", codes: ["ADJ"] },
  { key: "adverbs", label: "Adverbs", labelDe: "Adverbien", description: "Words that modify actions or descriptions", descriptionDe: "Wörter, die Handlungen oder Beschreibungen bestimmen", codes: ["ADV"] },
  { key: "phrases", label: "Noun phrases", labelDe: "Nominalphrasen", description: "Multi-word nominal expressions", descriptionDe: "Mehrgliedrige nominale Ausdrücke", codes: ["NP"] },
  { key: "grammar", label: "Grammar words", labelDe: "Funktionswörter", description: "Pronouns, particles, prepositions, and more", descriptionDe: "Pronomen, Partikeln, Präpositionen und weitere", codes: ["NUM", "PTCL", "PRON", "PREP", "CONJ", "ART", "INTERJ", "PREF"] },
  { key: "other", label: "Other", labelDe: "Weitere", description: "Unclassified source entries", descriptionDe: "Nicht klassifizierte Quelleinträge", codes: [] },
];

export function wordClassLabel(entryOrCode, language = "en") {
  const code = typeof entryOrCode === "string" ? entryOrCode : entryOrCode?.word_class;
  if (!code) return language === "de" ? "Nicht klassifiziert" : "Unclassified";
  return (language === "de" ? WORD_CLASS_LABELS_DE[code] : WORD_CLASS_LABELS[code]) || (language === "de" ? "Nicht klassifiziert" : "Unclassified");
}

export function wordTypeLabel(group, language = "en") {
  return language === "de" ? group.labelDe : group.label;
}

export function wordTypeDescription(group, language = "en") {
  return language === "de" ? group.descriptionDe : group.description;
}

export function wordTypeGroup(entryOrCode) {
  const code = typeof entryOrCode === "string" ? entryOrCode : entryOrCode?.word_class;
  return WORD_TYPE_GROUPS.find((group) => group.codes.includes(code)) || WORD_TYPE_GROUPS[WORD_TYPE_GROUPS.length - 1];
}
