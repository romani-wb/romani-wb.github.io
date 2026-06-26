const STRINGS = {
  de: {
    "site.language": "Sprache",
    "nav.story": "Geschichte",
    "nav.dictionary": "Wörterbuch",
    "nav.wordList": "Wortliste",
    "nav.grammar": "Grammatik",
    "nav.explore": "Erkunden",
    "common.german": "Deutsch",
    "common.english": "Englisch",
    "common.entries": "Einträge",
    "common.words": "Wörter",
    "common.all": "Alle",
    "common.loading": "Wird geladen …",
    "dictionary.title": "Roman Wörterbuch",
    "dictionary.brand": "Wörterbuch",
    "dictionary.skip": "Zur Wörterbuchsuche springen",
    "dictionary.searchLabel": "Roman · Deutsch · Englisch",
    "dictionary.findWord": "Wort suchen",
    "dictionary.searchPlaceholder": "Roman-Wort oder deutsche/englische Bedeutung",
    "dictionary.surprise": "Überrasche mich",
    "dictionary.randomTitle": "Zufälligen Eintrag öffnen",
    "dictionary.layout": "Ansicht",
    "dictionary.layoutFocus": "Fokus",
    "dictionary.layoutBrowse": "Nachschlagen",
    "dictionary.layoutSplit": "Geteilt",
    "dictionary.romanSpelling": "Roman-Schreibweise",
    "dictionary.spellingInt": "International",
    "dictionary.spellingDeu": "Deutsch orientiert",
    "dictionary.translation": "Übersetzung",
    "dictionary.browseTypes": "Nach Wortart filtern",
    "dictionary.loading": "Wörterbuchdaten werden geladen …",
    "dictionary.entry": "Wörterbucheintrag",
    "dictionary.selectWord": "Wort auswählen",
    "dictionary.selectHelp": "Nach einem Wort oder einer Bedeutung suchen oder einen zufälligen Eintrag öffnen.",
    "wordList.title": "Roman Wortliste",
    "wordList.brand": "Wortliste",
    "wordList.heading": "Wortliste",
    "wordList.searchPlaceholder": "Wortliste filtern",
    "wordList.controls": "Wortliste filtern",
    "wordList.typeFilter": "Wortart",
    "wordList.letterFilter": "Anfangsbuchstabe",
    "wordList.columnWord": "Roman",
    "wordList.columnType": "Wortart",
    "wordList.columnMeaning": "Bedeutung",
    "wordList.openEntry": "Öffnen",
    "wordList.allLetters": "Alle Buchstaben",
    "wordList.noMatches": "Keine passenden Wörter.",
    "wordList.tryAnother": "Andere Schreibweise, Bedeutung, Wortart oder Buchstaben wählen.",
    "wordList.loadError": "Die Wortliste konnte nicht geladen werden.",
    "grammar.title": "Roman Grammatik",
    "grammar.brand": "Grammatik",
    "grammar.heading": "Grammatik",
    "grammar.sourceNote": "Strukturen aus den Paradigmentabellen des Wörterbuchs.",
    "grammar.sections": "Grammatikbereiche",
    "grammar.nouns": "Substantive",
    "grammar.nounHeading": "Deklination",
    "grammar.nounDimensions": "Kasus × Numerus; die Substantivklasse bestimmt die Endungstabelle.",
    "grammar.case": "Kasus",
    "grammar.caseNom": "Nominativ",
    "grammar.caseAcc": "Akkusativ",
    "grammar.caseDat": "Dativ",
    "grammar.caseAbl": "Ablativ",
    "grammar.caseLoc": "Lokativ",
    "grammar.caseIns": "Instrumental / Soziativ",
    "grammar.caseGen": "Genitiv",
    "grammar.number": "Numerus",
    "grammar.genderClass": "Genus / Substantivklasse",
    "grammar.singular": "Singular",
    "grammar.plural": "Plural",
    "grammar.masculine": "Maskulin",
    "grammar.feminine": "Feminin",
    "grammar.openNoun": "Beispieldeklination öffnen →",
    "grammar.verbs": "Verben",
    "grammar.verbHeading": "Konjugation",
    "grammar.verbDimensions": "Person × Aspekt × Tempus.",
    "grammar.person": "Person",
    "grammar.aspect": "Aspekt",
    "grammar.tense": "Tempus",
    "grammar.openVerb": "Beispielkonjugation öffnen →",
    "grammar.adjectives": "Adjektive",
    "grammar.adjectiveHeading": "Adjektivdeklination",
    "grammar.adjectiveDimensions": "Form × Numerus × Genus.",
    "grammar.form": "Form",
    "grammar.basic": "Grundform / Nominativ",
    "grammar.oblique": "Oblique Form",
    "grammar.openAdjective": "Beispieldeklination öffnen →",
    "grammar.wordTypes": "Wortarten",
    "grammar.wordTypesHeading": "Wortartkürzel",
    "grammar.notation": "Notation",
    "grammar.notationHeading": "Notation im Eintrag",
    "grammar.spellings": "INT / DEU",
    "grammar.spellingsText": "Internationale und deutsch orientierte Roman-Schreibweise.",
    "grammar.brackets": "Eckige Klammern",
    "grammar.bracketsText": "Zusatzinformationen bei Lemma, Flexion und Quelle. Bedeutungszusätze stehen in runden Klammern.",
    "grammar.generated": "Generierte Formen",
    "grammar.generatedText": "Aus Lemma und Paradigmentabelle zusammengesetzt; noch nicht fachlich geprüft.",
    "wordClass.N": "Substantiv",
    "wordClass.V": "Verb",
    "wordClass.ADJ": "Adjektiv",
    "wordClass.ADV": "Adverb",
    "wordClass.NP": "Nominalphrase",
    "wordClass.PTCLV": "Partikelverb",
    "wordClass.VP": "Verbalphrase",
    "wordClass.PRON": "Pronomen",
    "wordClass.PREP": "Präposition",
    "wordClass.CONJ": "Konjunktion",
    "wordClass.NUM": "Numerale",
    "wordClass.PTCL": "Partikel",
    "explore.title": "Roman Wortfamilien erkunden",
    "explore.brand": "Erkunden",
    "explore.skip": "Zur Familiensuche springen",
    "explore.eyebrow": "Datenexperiment · nur dokumentierte Beziehungen",
    "explore.heading": "Das Wörterbuch, verbunden.",
    "explore.intro": "Große Familien finden, eine dokumentierte Basis verfolgen oder zwei Basen vergleichen. Es werden keine Bedeutungen oder sprachwissenschaftlichen Beziehungen erfunden.",
    "explore.recordedBases": "dokumentierte Basen",
    "explore.multiFamilies": "mehrgliedrige Familien",
    "explore.find": "Wort oder Basis suchen",
    "explore.random": "Zufällige Familie",
    "explore.largeFamilies": "Große Wortfamilien",
    "explore.question": "Was möchten Sie herausfinden?",
    "explore.findBroad": "Große Familien finden",
    "explore.findBroadHelp": "Basen mit vielen dokumentierten Einträgen erkennen.",
    "explore.trace": "Eine Basis verfolgen",
    "explore.traceHelp": "Von der Basis über Wortarten zu Einträgen gehen.",
    "explore.compare": "Zwei Basen vergleichen",
    "explore.compareHelp": "Umfang und Wortartverteilung gegenüberstellen.",
    "explore.chooseView": "Visualisierung wählen",
    "explore.atlas": "Familienatlas",
    "explore.familyWeb": "Familiennetz",
    "explore.ribbons": "Wortartfluss",
    "explore.rings": "Familienringe",
    "explore.landscape": "Größenlandschaft",
    "explore.compareFamilies": "Familien vergleichen",
    "explore.zoomOut": "Verkleinern",
    "explore.zoomIn": "Vergrößern",
    "explore.reset": "Zurücksetzen",
    "explore.labels": "Beschriftungen",
    "explore.status": "Die Verbindungen verwenden nur die im Quellenarbeitsblatt dokumentierten Basisfelder.",
    "home.title": "Roman — Sprache und Wörterbuch",
    "home.skip": "Zur Geschichte springen",
    "home.context": "Kontext",
    "home.eyebrow": "Die Sprache der Burgenland-Roma",
    "home.heading": "Roman lebt in Wörtern, Erinnerung und Gebrauch.",
    "home.intro": "Eine über Generationen geprägte und dokumentierte Sprache – und ein Wörterbuch, das ihre Wörter wieder zugänglich macht.",
    "home.enter": "Zum Wörterbuch",
    "home.entries": "Einträge",
    "home.spellings": "Roman-Schreibweisen",
    "home.meanings": "Bedeutungen",
    "home.shortContext": "Kurzer Kontext",
    "home.storyHeading": "Eine dokumentierte Sprache mit lebendiger Geschichte",
    "home.place": "Ort und Kontakt",
    "home.placeText": "Roman ist die Eigenbezeichnung der Burgenland-Roma für ihre Sprache. Diese Romani-Varietät entstand im ehemals westungarischen Raum und wurde unter anderem von Deutsch und Kroatisch geprägt.",
    "home.continuity": "Druck und Kontinuität",
    "home.continuityText": "Verfolgung, Holocaust, anhaltende Diskriminierung und Sprachwechsel nach 1945 reduzierten den alltäglichen Gebrauch stark. Roman bleibt dennoch ein wichtiges Zeichen von Gemeinschaft und Identität.",
    "home.codification": "Kodifizierung und Zugang",
    "home.codificationText": "Die Selbstorganisation der Community führte zur Kodifizierungsarbeit mit Sprachwissenschaftlern der Universität Graz. Unterricht, Medien, Roma-Service und dieses Wörterbuch führen diese Arbeit fort.",
    "home.heritage": "Roman steht seit 2011 im nationalen Verzeichnis des immateriellen Kulturerbes der Österreichischen UNESCO-Kommission.",
    "home.portalEyebrow": "12.525 Einstiege",
    "home.portalHeading": "Ein Wort nachschlagen. Dann seinen Verbindungen folgen.",
    "home.portalText": "Das Wörterbuch ist ein eigenständiges Werkzeug. Beide Roman-Schreibweisen, deutsche und englische Bedeutungen, Formen und Wortfamilien sind direkt zugänglich.",
    "home.openDictionary": "Roman Wörterbuch öffnen"
  },
  en: {
    "site.language": "Language",
    "nav.story": "Story",
    "nav.dictionary": "Dictionary",
    "nav.wordList": "Word list",
    "nav.grammar": "Grammar",
    "nav.explore": "Explore",
    "common.german": "German",
    "common.english": "English",
    "common.entries": "entries",
    "common.words": "words",
    "common.all": "All",
    "common.loading": "Loading …",
    "dictionary.title": "Roman Dictionary",
    "dictionary.brand": "Dictionary",
    "dictionary.skip": "Skip to dictionary search",
    "dictionary.searchLabel": "Roman · German · English",
    "dictionary.findWord": "Find a word",
    "dictionary.searchPlaceholder": "Roman word or German/English meaning",
    "dictionary.surprise": "Surprise me",
    "dictionary.randomTitle": "Open a random entry",
    "dictionary.layout": "View",
    "dictionary.layoutFocus": "Focus",
    "dictionary.layoutBrowse": "Browse",
    "dictionary.layoutSplit": "Split",
    "dictionary.romanSpelling": "Roman spelling",
    "dictionary.spellingInt": "International",
    "dictionary.spellingDeu": "German-oriented",
    "dictionary.translation": "Translation",
    "dictionary.browseTypes": "Filter by word type",
    "dictionary.loading": "Loading dictionary data …",
    "dictionary.entry": "Dictionary entry",
    "dictionary.selectWord": "Select a word",
    "dictionary.selectHelp": "Search for a word or meaning, or open a random entry.",
    "wordList.title": "Roman Word List",
    "wordList.brand": "Word list",
    "wordList.heading": "Word list",
    "wordList.searchPlaceholder": "Filter the word list",
    "wordList.controls": "Filter the word list",
    "wordList.typeFilter": "Word type",
    "wordList.letterFilter": "First letter",
    "wordList.columnWord": "Roman",
    "wordList.columnType": "Word type",
    "wordList.columnMeaning": "Meaning",
    "wordList.openEntry": "Open",
    "wordList.allLetters": "All letters",
    "wordList.noMatches": "No matching words.",
    "wordList.tryAnother": "Choose another spelling, meaning, word type, or letter.",
    "wordList.loadError": "The word list could not be loaded.",
    "grammar.title": "Roman Grammar",
    "grammar.brand": "Grammar",
    "grammar.heading": "Grammar",
    "grammar.sourceNote": "Structures recorded in the dictionary paradigm tables.",
    "grammar.sections": "Grammar sections",
    "grammar.nouns": "Nouns",
    "grammar.nounHeading": "Declension",
    "grammar.nounDimensions": "Case × number; the noun class selects the ending table.",
    "grammar.case": "Case",
    "grammar.caseNom": "Nominative",
    "grammar.caseAcc": "Accusative",
    "grammar.caseDat": "Dative",
    "grammar.caseAbl": "Ablative",
    "grammar.caseLoc": "Locative",
    "grammar.caseIns": "Instrumental / sociative",
    "grammar.caseGen": "Genitive",
    "grammar.number": "Number",
    "grammar.genderClass": "Gender / noun class",
    "grammar.singular": "Singular",
    "grammar.plural": "Plural",
    "grammar.masculine": "Masculine",
    "grammar.feminine": "Feminine",
    "grammar.openNoun": "Open an example declension →",
    "grammar.verbs": "Verbs",
    "grammar.verbHeading": "Conjugation",
    "grammar.verbDimensions": "Person × aspect × tense.",
    "grammar.person": "Person",
    "grammar.aspect": "Aspect",
    "grammar.tense": "Tense",
    "grammar.openVerb": "Open an example conjugation →",
    "grammar.adjectives": "Adjectives",
    "grammar.adjectiveHeading": "Adjective declension",
    "grammar.adjectiveDimensions": "Form × number × gender.",
    "grammar.form": "Form",
    "grammar.basic": "Basic / nominative",
    "grammar.oblique": "Oblique",
    "grammar.openAdjective": "Open an example declension →",
    "grammar.wordTypes": "Word types",
    "grammar.wordTypesHeading": "Word-type codes",
    "grammar.notation": "Notation",
    "grammar.notationHeading": "Notation in entries",
    "grammar.spellings": "INT / DEU",
    "grammar.spellingsText": "International and German-oriented Roman spelling.",
    "grammar.brackets": "Square brackets",
    "grammar.bracketsText": "Supplementary information for lemma, inflection, and source. Meaning supplements use parentheses.",
    "grammar.generated": "Generated forms",
    "grammar.generatedText": "Assembled from lemma and paradigm table; not yet linguistically reviewed.",
    "wordClass.N": "Noun",
    "wordClass.V": "Verb",
    "wordClass.ADJ": "Adjective",
    "wordClass.ADV": "Adverb",
    "wordClass.NP": "Noun phrase",
    "wordClass.PTCLV": "Particle verb",
    "wordClass.VP": "Verb phrase",
    "wordClass.PRON": "Pronoun",
    "wordClass.PREP": "Preposition",
    "wordClass.CONJ": "Conjunction",
    "wordClass.NUM": "Numeral",
    "wordClass.PTCL": "Particle",
    "explore.title": "Explore Roman Word Families",
    "explore.brand": "Explore",
    "explore.skip": "Skip to family search",
    "explore.eyebrow": "Data experiment · recorded relationships only",
    "explore.heading": "The dictionary, connected.",
    "explore.intro": "Find broad families, trace one recorded base, or compare two bases. The views do not invent meanings or linguistic relationships.",
    "explore.recordedBases": "recorded bases",
    "explore.multiFamilies": "multi-word families",
    "explore.find": "Find a word or base",
    "explore.random": "Random family",
    "explore.largeFamilies": "Large word families",
    "explore.question": "What do you want to find out?",
    "explore.findBroad": "Find broad families",
    "explore.findBroadHelp": "See which recorded bases contain many entries.",
    "explore.trace": "Trace one base",
    "explore.traceHelp": "Follow a base through word types to entries.",
    "explore.compare": "Compare two bases",
    "explore.compareHelp": "Measure family size and word-type composition.",
    "explore.chooseView": "Choose a visualization",
    "explore.atlas": "Family atlas",
    "explore.familyWeb": "Family web",
    "explore.ribbons": "Type ribbons",
    "explore.rings": "Family rings",
    "explore.landscape": "Size landscape",
    "explore.compareFamilies": "Compare families",
    "explore.zoomOut": "Zoom out",
    "explore.zoomIn": "Zoom in",
    "explore.reset": "Reset",
    "explore.labels": "Labels",
    "explore.status": "Connections use only the recorded base fields in the source workbook.",
    "home.title": "Roman — Language and Dictionary",
    "home.skip": "Skip to the story",
    "home.context": "Context",
    "home.eyebrow": "The language of the Burgenland Roma",
    "home.heading": "Roman lives in words, memory, and use.",
    "home.intro": "A documented language shaped across generations—and a dictionary built to make its words accessible again.",
    "home.enter": "Enter the dictionary",
    "home.entries": "entries",
    "home.spellings": "Roman spellings",
    "home.meanings": "meanings",
    "home.shortContext": "A short context",
    "home.storyHeading": "A documented language with a living history",
    "home.place": "Place and contact",
    "home.placeText": "Roman is the name Burgenland Roma use for their language. It is a Romani variety shaped in the former western Hungarian region and influenced over time by German and Croatian.",
    "home.continuity": "Pressure and continuity",
    "home.continuityText": "Persecution, the Holocaust, persistent discrimination, and post-war language shift sharply reduced everyday use. Roman nevertheless remains an important marker of community and identity.",
    "home.codification": "Codification and access",
    "home.codificationText": "Community self-organisation led to codification work with linguists from the University of Graz. Teaching, media, Roma-Service activities, and this dictionary continue that work.",
    "home.heritage": "Roman has been listed in the Austrian UNESCO Commission’s national inventory of intangible cultural heritage since 2011.",
    "home.portalEyebrow": "12,525 ways in",
    "home.portalHeading": "Look up a word. Then follow where it leads.",
    "home.portalText": "The dictionary is a separate tool. Both Roman spellings, German and English meanings, forms, and word families are directly accessible.",
    "home.openDictionary": "Open Roman Dictionary"
  }
};

let activeLanguage = "de";
const listeners = new Set();

function safeStorageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeStorageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* URL state remains available. */ }
}

function initialLanguage() {
  if (typeof window === "undefined") return "de";
  const parameter = new URL(window.location.href).searchParams.get("ui");
  if (["de", "en"].includes(parameter)) return parameter;
  const stored = safeStorageGet("roman-ui-language");
  return ["de", "en"].includes(stored) ? stored : "de";
}

activeLanguage = initialLanguage();

export function uiLanguage() {
  return activeLanguage;
}

export function t(key, variables = {}, language = activeLanguage) {
  const template = STRINGS[language]?.[key] ?? STRINGS.en[key] ?? key;
  return Object.entries(variables).reduce((value, [name, replacement]) => value.replaceAll(`{${name}}`, String(replacement)), template);
}

export function formatNumber(value, language = activeLanguage) {
  return Number(value).toLocaleString(language === "de" ? "de-DE" : "en-US");
}

function updateInternalLinks() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  document.querySelectorAll("a[href]").forEach((link) => {
    if (typeof link.getAttribute !== "function" || typeof link.setAttribute !== "function") return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.endsWith(".html")) return;
      url.searchParams.set("ui", activeLanguage);
      link.setAttribute("href", `${url.pathname.split("/").pop()}${url.search}${url.hash}`);
    } catch { /* Leave malformed or unsupported links unchanged. */ }
  });
}

export function applyTranslations() {
  if (typeof document === "undefined") return;
  if (document.documentElement) document.documentElement.lang = activeLanguage;
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => { element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder)); });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => { element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel)); });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => { element.setAttribute("title", t(element.dataset.i18nTitle)); });
  document.querySelectorAll("[data-ui-language]").forEach((button) => {
    const active = button.dataset.uiLanguage === activeLanguage;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  updateInternalLinks();
}

export function setUiLanguage(language) {
  if (!["de", "en"].includes(language) || language === activeLanguage) return;
  activeLanguage = language;
  safeStorageSet("roman-ui-language", language);
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.searchParams.set("ui", language);
    history.replaceState(null, "", url);
  }
  applyTranslations();
  listeners.forEach((listener) => listener(language));
}

export function initI18n({ onChange } = {}) {
  if (typeof document === "undefined") return activeLanguage;
  if (onChange) listeners.add(onChange);
  document.querySelectorAll("[data-ui-language]").forEach((button) => {
    if (button.dataset.i18nBound) return;
    button.dataset.i18nBound = "true";
    button.addEventListener("click", () => setUiLanguage(button.dataset.uiLanguage));
  });
  applyTranslations();
  return activeLanguage;
}

if (typeof document !== "undefined" && document.querySelector("[data-ui-language]")) initI18n();
