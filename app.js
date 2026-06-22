import { WORD_CLASS_LABELS, WORD_TYPE_GROUPS, wordClassLabel, wordTypeGroup } from "./word-types.js";

const DATA_URLS = {
  manifest: "data/processed/entries_manifest.json",
  search: "data/processed/entries_search.json",
  references: "data/processed/references.json",
  paradigmModel: "data/processed/paradigm_model.json",
};

const state = {
  entriesById: new Map(),
  entryChunks: new Map(),
  searchEntriesById: new Map(),
  entryManifest: {},
  searchEntries: [],
  wordFamilies: new Map(),
  lemmasBySpelling: new Map(),
  references: {},
  paradigmModel: {},
  filteredEntries: [],
  selectedId: null,
  spelling: "int",
  language: "de",
  query: "",
  entryView: "overview",
  edition: "compact",
  wordClassFilter: "all",
  wordTypeCounts: new Map(),
  matchTypeCounts: new Map(),
  matchGroupOrder: [],
  totalMatches: 0,
};

const els = {
  status: document.querySelector("#data-status"),
  search: document.querySelector("#search-input"),
  results: document.querySelector("#results"),
  resultMeta: document.querySelector("#result-meta"),
  entryPane: document.querySelector("#entry-pane"),
  randomEntry: document.querySelector("#random-entry"),
  editionSelect: document.querySelector("#edition-select"),
  wordClassFilters: document.querySelector("#word-class-filters"),
  spellingButtons: document.querySelectorAll("[data-spelling]"),
  languageButtons: document.querySelectorAll("[data-language]"),
};

const MAX_RESULTS = 60;

const PERSON_LABELS = {
  de: {
    "1SG": ["ich", "1. Person Singular"],
    "2SG": ["du", "2. Person Singular"],
    "3SG": ["er / sie / es", "3. Person Singular"],
    "1PL": ["wir", "1. Person Plural"],
    "2PL": ["ihr", "2. Person Plural"],
    "3PL": ["sie", "3. Person Plural"],
  },
  en: {
    "1SG": ["I", "first person singular"],
    "2SG": ["you", "second person singular"],
    "3SG": ["he / she / it", "third person singular"],
    "1PL": ["we", "first person plural"],
    "2PL": ["you (plural)", "second person plural"],
    "3PL": ["they", "third person plural"],
  },
};

const CASE_GUIDES = {
  NOM: ["Nominative", "the subject — who or what acts"],
  ACC: ["Accusative", "the direct object — whom or what"],
  DAT: ["Dative", "the recipient — to or for whom"],
  ABL: ["Ablative", "origin or separation — from where"],
  LOC: ["Locative", "place or direction — where"],
  "INS/SOC": ["Instrumental / sociative", "means or company — with whom or by what"],
  GEN: ["Genitive", "possession or relation — whose"],
  OBL: ["Oblique", "a form used outside the basic subject form"],
};

const TENSE_GUIDES = {
  PRS: ["Present", "now, generally, or repeatedly"],
  FUT: ["Future", "after now"],
  PST: ["Past", "before now"],
  PRT: ["Past", "before now"],
  IRR: ["Irrealis", "imagined, conditional, or not presented as fact"],
};

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function normalizeSearchCase(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function joinMeanings(values) {
  return values.filter(Boolean).join("; ");
}

function currentLabelLanguage() {
  return state.language === "de" ? "de" : "en";
}

function referenceLabel(code, language = currentLabelLanguage()) {
  const value = String(code || "").trim();
  if (!value) return "";
  const grammar = state.references.grammar_abbreviations?.[value] || {};
  const sourceMarker = state.references.source_markers?.[value] || {};
  const languageRef = state.references.language_abbreviations?.[value] || {};
  return grammar[language] || sourceMarker[language] || languageRef[language] || value;
}

function labelWithCode(code, language = currentLabelLanguage()) {
  const value = String(code || "").trim();
  if (!value) return "";
  const label = referenceLabel(value, language);
  return label && label !== value ? `${value} · ${label}` : value;
}

function grammarExplanation(code, language = currentLabelLanguage()) {
  const value = String(code || "").trim();
  if (!value) return "";
  const grammar = state.references.grammar_abbreviations?.[value] || {};
  return grammar[`explanation_${language}`] || grammar.explanation_en || "";
}

function labelOnly(labelOrCode) {
  const value = String(labelOrCode || "");
  return value.includes("·") ? value.split("·").slice(1).join("·").trim() : value;
}

function countWordTypes(entries) {
  const counts = new Map(WORD_TYPE_GROUPS.map((group) => [group.key, 0]));
  for (const entry of entries) {
    const key = wordTypeGroup(entry).key;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function stemFromLemma(value) {
  const text = String(value || "");
  return text.includes("-") ? text.split("-", 1)[0] : text.replaceAll("-", "");
}

function combineStemAndEnding(stem, ending) {
  if (!ending) return stem;
  return ending.startsWith("-") ? `${stem}${ending.slice(1)}` : ending;
}

function displayLemma(searchEntry) {
  const preferred = state.spelling === "deu" ? searchEntry.roman_deu : searchEntry.roman_int;
  return preferred || searchEntry.roman_int || searchEntry.roman_deu || "Untitled entry";
}

function rawLemma(entry) {
  const lemma = entry?.lemma || {};
  return state.spelling === "deu" ? lemma.deu : lemma.int;
}

function entryDisplayLemma(entry) {
  if (!entry?.lemma) return displayLemma(entry || {});
  const lemma = entry?.lemma || {};
  return lemma[`display_${state.spelling}`] || lemma.display_int || lemma.display_deu || "";
}

function displayMeaning(searchEntry) {
  const preferred = searchEntry[state.language] || [];
  if (preferred.length) {
    return joinMeanings(preferred);
  }
  const fallback = state.language === "en" ? searchEntry.de || [] : searchEntry.en || [];
  return fallback.length ? joinMeanings(fallback) : "No meaning available";
}

function entryMeanings(entry) {
  const meanings = entry?.meanings || {};
  const preferred = meanings[state.language] || [];
  if (preferred.length) {
    return { values: preferred, fallback: false };
  }
  const fallbackLanguage = state.language === "en" ? "de" : "en";
  return {
    values: meanings[fallbackLanguage] || [],
    fallback: Boolean((meanings[fallbackLanguage] || []).length),
  };
}

function spellingValue(value) {
  if (!value) return "";
  return value[state.spelling] || value.int || value.deu || "";
}

function alternateSearchLemma(entry) {
  const alternate = state.spelling === "deu" ? entry.roman_int : entry.roman_deu;
  return alternate && alternate !== displayLemma(entry) ? alternate : "";
}

function buildSearchText(entry) {
  const chunks = [
    entry.roman_int,
    entry.roman_deu,
    entry.raw_roman_int,
    entry.raw_roman_deu,
    entry.word_class,
    entry.word_class_label,
    entry.subclass,
    entry.subclass_label,
    ...(entry.de || []),
    ...(entry.en || []),
  ];
  return normalizeSearch(chunks.join(" "));
}

function grammarFieldLabels(wordClass) {
  if (wordClass === "N") {
    return {
      flexion1: "Gender / noun class",
      flexion2Int: "Oblique singular ending INT",
      flexion2Deu: "Oblique singular ending DEU",
      flexion3Int: "Plural ending INT",
      flexion3Deu: "Plural ending DEU",
    };
  }
  if (wordClass === "V") {
    return {
      flexion1: "Verb class",
      flexion2Int: "Non-perfective marker INT",
      flexion2Deu: "Non-perfective marker DEU",
      flexion3Int: "3rd plural NPFV ending INT",
      flexion3Deu: "3rd plural NPFV ending DEU",
    };
  }
  if (wordClass === "ADJ") {
    return {
      flexion1: "Adjective class",
      flexion2Int: "Plural/oblique endings INT",
      flexion2Deu: "Plural/oblique endings DEU",
      flexion3Int: "Additional flexion INT",
      flexion3Deu: "Additional flexion DEU",
    };
  }
  return {
    flexion1: "Flexion 1",
    flexion2Int: "Flexion 2 INT",
    flexion2Deu: "Flexion 2 DEU",
    flexion3Int: "Flexion 3 INT",
    flexion3Deu: "Flexion 3 DEU",
  };
}

function rowLabel(row) {
  const parts = [
    row.aspect,
    row.tense,
    row.case_group,
    row.case,
    row.number,
    row.person_number,
    row.gender,
    row.polarity,
  ].filter(Boolean);
  return parts.map((part) => referenceLabel(part)).join(" · ");
}

function rowExplanation(row) {
  const parts = [
    row.aspect,
    row.tense,
    row.case_group,
    row.case,
    row.number,
    row.person_number,
    row.gender,
    row.polarity,
  ].filter(Boolean);
  return parts
    .map((part) => grammarExplanation(part))
    .filter(Boolean)
    .join(" ");
}

function generateForms(entry) {
  const morphology = entry.morphology || {};
  if (!morphology.available) return null;

  const lemma = entry.lemma || {};
  const stem = stemFromLemma(lemma[state.spelling] || lemma.int || lemma.deu);
  const spelling = state.spelling;
  const model = state.paradigmModel;
  const kind = morphology.kind;
  const paradigm = morphology.paradigm;
  let rows = [];

  if (kind === "adjective_declension") {
    rows = model.adjectives?.[paradigm] || [];
  } else if (kind === "noun_declension") {
    const nounTables = model.nouns?.[morphology.gender_class]?.[spelling] || {};
    if (morphology.gender_class === "M/F") {
      rows = [
        ...(nounTables[`${paradigm}:M`] || []),
        ...(nounTables[`${paradigm}:F`] || []),
      ];
    } else {
      rows = nounTables[paradigm] || [];
    }
  } else if (kind === "verb_conjugation") {
    rows = model.verbs?.[spelling]?.[paradigm] || [];
  } else if (kind === "verb_exist") {
    rows = model.exist || [];
  }

  if (!rows.length) return null;

  return {
    kind,
    paradigm,
    rows: rows.map((row) => ({
      ...row,
      label: rowLabel(row),
      code: [
        row.aspect,
        row.tense,
        row.case_group,
        row.case,
        row.number,
        row.person_number,
        row.gender,
        row.polarity,
      ].filter(Boolean).join(" · "),
      ending: row.ending || "",
      explanation: rowExplanation(row),
      gloss: row[state.language === "de" ? "german" : "english"] || "",
      form: kind === "verb_exist"
        ? row[`form_${spelling}`] || row.form_int
        : combineStemAndEnding(stem, row.ending || ""),
    })),
  };
}

function personGuide(code) {
  return PERSON_LABELS[state.language]?.[code] || PERSON_LABELS.en[code] || [code, code];
}

function caseGuide(code) {
  return CASE_GUIDES[code] || [referenceLabel(code), grammarExplanation(code)];
}

function tenseGuide(code) {
  return TENSE_GUIDES[code] || [referenceLabel(code), grammarExplanation(code)];
}

function aspectGuide(code) {
  if (code === "NPFV") return ["Non-perfective", "the action is viewed as ongoing, repeated, or open-ended"];
  if (code === "PFV") return ["Perfective", "the action is viewed as a completed whole"];
  return [referenceLabel(code), grammarExplanation(code)];
}

function formCell(row) {
  return row ? `<strong>${escapeHtml(row.form)}</strong>${row.gloss ? `<small>${escapeHtml(row.gloss)}</small>` : ""}` : `<span class="empty-form">—</span>`;
}

function renderVerbForms(generated) {
  const groups = new Map();
  for (const row of generated.rows) {
    const key = `${row.aspect || ""}|${row.tense || ""}|${row.polarity || ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return `<div class="conjugation-groups">${[...groups.values()].map((rows, index) => {
    const first = rows[0];
    const [tense, tenseHelp] = tenseGuide(first.tense);
    const [aspect, aspectHelp] = first.aspect ? aspectGuide(first.aspect) : ["", ""];
    const title = [aspect, tense, first.polarity === "NEG" ? "Negative" : ""].filter(Boolean).join(" · ");
    return `
      <section class="form-group${index === 0 ? " featured" : ""}">
        <div class="form-group-heading">
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml([aspectHelp, tenseHelp].filter(Boolean).join("; "))}</p>
        </div>
        <div class="person-grid">
          ${rows.map((row) => {
            const [pronoun, description] = personGuide(row.person_number);
            return `<div class="person-form"><span><strong>${escapeHtml(pronoun)}</strong><small>${escapeHtml(description)}</small></span>${formCell(row)}</div>`;
          }).join("")}
        </div>
      </section>
    `;
  }).join("")}</div>`;
}

function renderNounForms(generated) {
  const order = ["NOM", "ACC", "DAT", "ABL", "LOC", "INS/SOC", "GEN"];
  const hasGenderForms = generated.rows.some((row) => row.gender);
  const columns = hasGenderForms
    ? [["SG", "M", "Singular masculine"], ["SG", "F", "Singular feminine"], ["PL", "M", "Plural masculine"], ["PL", "F", "Plural feminine"]]
    : [["SG", "", "Singular"], ["PL", "", "Plural"]];
  const rowsByKey = new Map(generated.rows.map((row) => [`${row.case}|${row.number}|${row.gender || ""}`, row]));
  return `
    <div class="grammar-matrix-wrap">
      <table class="grammar-matrix noun-matrix">
        <thead><tr><th>Case and use</th>${columns.map(([, , label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead>
        <tbody>${order.map((code) => {
          const [label, help] = caseGuide(code);
          return `<tr><th><strong>${escapeHtml(label)}</strong><small>${escapeHtml(help)}</small></th>${columns.map(([number, gender]) => `<td>${formCell(rowsByKey.get(`${code}|${number}|${gender}`))}</td>`).join("")}</tr>`;
        }).join("")}</tbody>
      </table>
    </div>
  `;
}

function renderAdjectiveForms(generated) {
  const rowsByKey = new Map(generated.rows.map((row) => [`${row.case}|${row.number}|${row.gender}`, row]));
  const rows = [["NOM", "Basic / nominative", "the basic form"], ["OBL", "Oblique", "used outside the basic case form"]];
  const columns = [["SG", "M", "Singular masculine"], ["SG", "F", "Singular feminine"], ["PL", "M", "Plural masculine"], ["PL", "F", "Plural feminine"]];
  return `
    <div class="grammar-matrix-wrap">
      <table class="grammar-matrix adjective-matrix">
        <thead><tr><th>Use</th>${columns.map(([, , label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(([code, label, help]) => {
          return `<tr><th><strong>${escapeHtml(label)}</strong><small>${escapeHtml(help)}</small></th>${columns.map(([number, gender]) => `<td>${formCell(rowsByKey.get(`${code}|${number}|${gender}`))}</td>`).join("")}</tr>`;
        }).join("")}</tbody>
      </table>
    </div>
  `;
}

function renderGrammarPrimer(kind) {
  const content = {
    verb_conjugation: [
      ["Person", "I, you, we, and they select different verb forms."],
      ["Tense", "Present, future, and past locate the action in time."],
      ["Aspect", "Non-perfective and perfective present different views of the action."],
    ],
    verb_exist: [
      ["Person", "The verb ‘to be’ changes with the person."],
      ["Positive / negative", "Some third-person negative forms are recorded separately."],
      ["Tense", "The table records present and past forms."],
    ],
    noun_declension: [
      ["Number", "Singular means one; plural means more than one."],
      ["Case", "A noun’s form changes according to its role in the sentence."],
      ["Gender / class", "The workbook’s noun class determines which endings are used."],
    ],
    adjective_declension: [
      ["Agreement", "An adjective changes to match the noun it describes."],
      ["Gender & number", "Masculine/feminine and singular/plural select the form."],
      ["Basic / oblique", "The oblique form is used beyond the basic subject form."],
    ],
  }[kind] || [];
  return `<div class="grammar-primer">${content.map(([title, text]) => `<div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>`).join("")}</div>`;
}

function renderForms(entry) {
  const generated = generateForms(entry);
  const morphology = entry.morphology || {};
  if (!generated) {
    if (!morphology.kind) {
      return `<section class="panel-card forms-panel"><h3>No grammar table</h3><p class="panel-note">This word class has no generated paradigm in the current dictionary model.</p></section>`;
    }
    return `<section class="panel-card forms-panel"><h3>Grammar</h3><p class="fallback-note">No generated forms are available yet. Paradigm: ${escapeHtml(morphology.source_paradigm || morphology.paradigm || "none")}.</p></section>`;
  }

  const title = {
    adjective_declension: "How this adjective changes",
    noun_declension: "How this noun changes",
    verb_conjugation: "Conjugation",
    verb_exist: "Conjugation",
  }[generated.kind] || "Forms";
  const table = generated.kind === "noun_declension"
    ? renderNounForms(generated)
    : generated.kind === "adjective_declension"
      ? renderAdjectiveForms(generated)
      : renderVerbForms(generated);

  return `
    <section class="panel-card forms-panel learner-grammar">
      <div class="panel-heading">
        <div><p class="eyebrow">Grammar made practical</p><h3>${escapeHtml(title)}</h3></div>
        <p>${generated.rows.length} forms · ${state.spelling.toUpperCase()}</p>
      </div>
      ${renderGrammarPrimer(generated.kind)}
      ${table}
      <div class="provisional-banner"><strong>Generated preview</strong><span>Built from Professor Halwachs’s paradigm ${escapeHtml(generated.paradigm)}. The structure comes from the source workbook; the assembled words still need linguistic review.</span></div>
      <details class="technical-details">
        <summary>Technical derivation and raw paradigm</summary>
        ${renderGenerationExplanation(entry, generated)}
        <div class="forms-table-wrap">
          <table class="forms-table"><thead><tr><th>Form</th><th>Grammar codes</th></tr></thead><tbody>
            ${generated.rows.map((row) => `<tr><td>${escapeHtml(row.form)}</td><td>${escapeHtml(row.code)}</td></tr>`).join("")}
          </tbody></table>
        </div>
      </details>
    </section>
  `;
}

function renderGenerationExplanation(entry, generated) {
  const lemma = entry.lemma || {};
  const raw = lemma[state.spelling] || lemma.int || lemma.deu || "";
  const stem = stemFromLemma(raw);
  const hasHyphen = raw.includes("-");
  const sourceParadigm = entry.morphology?.source_paradigm;
  const aliasNote = sourceParadigm
    ? `<li>The workbook uses paradigm <strong>${escapeHtml(sourceParadigm)}</strong>; the pipeline resolves it to <strong>${escapeHtml(generated.paradigm)}</strong> so it can match the paradigm table.</li>`
    : "";
  const irregularNote = generated.paradigm.includes("IRR")
    ? "<li>This is marked as an irregular paradigm. The table supplies forms directly; the viewer does not treat those cells as ordinary endings.</li>"
    : "";

  return `
      <ul>
        <li>The source lemma is <strong>${escapeHtml(raw || "unknown")}</strong>.</li>
        ${hasHyphen ? `<li>The internal hyphen marks the stem boundary. The displayed stem is <strong>${escapeHtml(stem)}</strong>.</li>` : `<li>No internal hyphen is present, so the displayed lemma is used as the stem.</li>`}
        <li>The paradigm table supplies the forms or endings for <strong>${escapeHtml(generated.paradigm)}</strong>.</li>
        <li>The generated form column combines the stem with the table value when the table value is an ending.</li>
        ${aliasNote}
        ${irregularNote}
      </ul>
  `;
}

function prepareSearchEntries(entries) {
  return entries.map((entry) => ({
    ...entry,
    _search: buildSearchText(entry),
  }));
}

function buildWordFamilies(entries) {
  const families = new Map();
  for (const entry of entries) {
    for (const spelling of ["int", "deu"]) {
      const value = entry[`base_${spelling}`];
      if (!value) continue;
      const key = normalizeSearch(`${spelling}:${value}`);
      if (!families.has(key)) families.set(key, []);
      families.get(key).push(entry.id);
    }
  }
  return families;
}

function buildLemmaIndex(entries) {
  const index = new Map();
  for (const entry of entries) {
    for (const spelling of ["int", "deu"]) {
      const value = entry[`roman_${spelling}`];
      if (!value) continue;
      const key = normalizeSearch(`${spelling}:${value}`);
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(entry.id);
    }
  }
  return index;
}

function familyData(entry) {
  const base = entry.details?.base || {};
  const ownLemma = entryDisplayLemma(entry);
  const baseValue = base[state.spelling] || base.int || base.deu || ownLemma;
  const baseSpelling = base[state.spelling]
    ? state.spelling
    : (base.int ? "int" : (base.deu ? "deu" : state.spelling));
  const key = normalizeSearch(`${baseSpelling}:${baseValue}`);
  const rootId = (state.lemmasBySpelling.get(key) || [])[0] || null;
  const ids = [...new Set([rootId, ...(state.wordFamilies.get(key) || [])].filter(Boolean))];
  const related = ids
    .map((id) => state.searchEntriesById.get(id))
    .filter(Boolean)
    .filter((item) => item.id !== rootId);

  if (!related.length && !base.int && !base.deu) return null;
  return { baseValue, rootId, related };
}

function renderFamilyNode(item, className = "") {
  if (!item) return "";
  return `
    <button type="button" class="family-node ${className}" data-entry-id="${escapeHtml(item.id)}">
      <strong>${escapeHtml(displayLemma(item))}</strong>
      <small>${escapeHtml(labelOnly(item.word_class_label || item.word_class || "Entry"))}</small>
    </button>
  `;
}

function renderWordFamily(entry) {
  const family = familyData(entry);
  if (!family) {
    return `<section class="panel-card family-panel"><h3>No linked word family</h3><p class="panel-note">This entry has no Base relationship in the current workbook.</p></section>`;
  }

  const rootEntry = family.rootId ? state.searchEntriesById.get(family.rootId) : null;
  const visible = family.related.slice(0, 14);
  const rootMarkup = rootEntry
    ? renderFamilyNode(rootEntry, `root${rootEntry.id === entry.id ? " selected" : ""}`)
    : `<div class="family-node root"><strong>${escapeHtml(family.baseValue)}</strong><small>Recorded base</small></div>`;


  return `
    <section class="panel-card family-panel">
      <div class="panel-heading">
        <h3>Word family</h3>
        <p>${family.related.length} linked ${family.related.length === 1 ? "entry" : "entries"}</p>
      </div>
      <p class="family-intro">The workbook groups these entries under the recorded base <strong>${escapeHtml(family.baseValue)}</strong>. Select a node to move through the family.</p>
      <div class="family-map" aria-label="Word family hierarchy">
        <div class="family-root-wrap">${rootMarkup}</div>
        <div class="family-trunk" aria-hidden="true"></div>
        <div class="family-branches">
          ${visible.map((item) => renderFamilyNode(item, item.id === entry.id ? "selected" : "")).join("")}
        </div>
        ${family.related.length > visible.length ? `<p class="family-overflow">Showing ${visible.length} of ${family.related.length} linked entries.</p>` : ""}
      </div>
    </section>
  `;
}

function meaningMatchRank(entry, query, rawQuery) {
  let best = 0;
  for (const meaning of [...(entry.de || []), ...(entry.en || [])]) {
    const cased = normalizeSearchCase(meaning);
    const normalized = cased.toLowerCase();
    if (cased === rawQuery) best = Math.max(best, 130);
    else if (normalized === query) best = Math.max(best, 125);
    else if (normalized.split(/[^\p{L}\p{N}]+/u).includes(query)) best = Math.max(best, 90);
    else if (normalized.startsWith(query)) best = Math.max(best, 75);
    else if (normalized.includes(query)) best = Math.max(best, 50);
  }
  return best;
}

function rankEntry(entry, query, rawQuery) {
  if (!query) return 1;
  const lemma = normalizeSearch(displayLemma(entry));
  const raw = normalizeSearch(
    state.spelling === "deu" ? entry.raw_roman_deu : entry.raw_roman_int,
  );
  if (lemma === query || raw === query) return 150;
  const meaningRank = meaningMatchRank(entry, query, rawQuery);
  const lemmaRank = lemma.startsWith(query) || raw.startsWith(query)
    ? 120
    : (lemma.includes(query) || raw.includes(query) ? 100 : 0);
  const metadataRank = entry._search.includes(query) ? 20 : 0;
  return Math.max(meaningRank, lemmaRank, metadataRank);
}

function updateFilteredEntries() {
  const query = normalizeSearch(state.query);
  const rawQuery = normalizeSearchCase(state.query);
  const hasTypeFilter = state.wordClassFilter !== "all";
  const eligible = hasTypeFilter
    ? state.searchEntries.filter((entry) => wordTypeGroup(entry).key === state.wordClassFilter)
    : state.searchEntries;

  if (!query && !hasTypeFilter) {
    state.totalMatches = state.searchEntries.length;
    state.matchTypeCounts = state.wordTypeCounts;
    state.matchGroupOrder = WORD_TYPE_GROUPS.map((group) => group.key);
    state.filteredEntries = [];
    return;
  }

  const ranked = eligible
    .map((entry) => ({ entry, rank: rankEntry(entry, query, rawQuery) }))
    .filter((item) => item.rank > 0)
    .sort((a, b) => b.rank - a.rank || displayLemma(a.entry).localeCompare(displayLemma(b.entry)));
  state.totalMatches = ranked.length;
  state.matchTypeCounts = countWordTypes(ranked.map((item) => item.entry));
  state.matchGroupOrder = [...new Set(ranked.map((item) => wordTypeGroup(item.entry).key))];
  state.filteredEntries = ranked.slice(0, MAX_RESULTS).map((item) => item.entry);
}

function renderWordClassFilters() {
  const visibleGroups = WORD_TYPE_GROUPS.filter((group) => (state.wordTypeCounts.get(group.key) || 0) > 0);
  els.wordClassFilters.innerHTML = [
    { key: "all", label: "All types", count: state.searchEntries.length },
    ...visibleGroups.map((group) => ({ ...group, count: state.wordTypeCounts.get(group.key) || 0 })),
  ].map((item) => {
    const active = item.key === state.wordClassFilter;
    return `<button type="button" class="word-type-filter${active ? " active" : ""}" data-word-class="${escapeHtml(item.key)}" aria-pressed="${active}"><span>${escapeHtml(item.label)}</span><small>${item.count.toLocaleString()}</small></button>`;
  }).join("");
}

function renderWordTypeIndex() {
  const items = [
    { key: "all", label: "All words", description: "The complete alphabetical word list", count: state.searchEntries.length, href: `word-list.html?spelling=${encodeURIComponent(state.spelling)}&meaning=${encodeURIComponent(state.language)}` },
    { key: "grammar-guide", label: "Grammar guide", description: "Cases, conjugation, agreement, and notation", count: "Guide", href: "grammar.html" },
    ...WORD_TYPE_GROUPS.filter((group) => (state.wordTypeCounts.get(group.key) || 0) > 0)
      .map((group) => ({ ...group, count: state.wordTypeCounts.get(group.key) || 0 })),
  ];
  return `
    <section class="word-type-index entry-word-type-index" aria-labelledby="word-type-index-title">
      <div class="word-type-index-heading">
        <p class="eyebrow">Keep exploring</p>
        <h2 id="word-type-index-title">Explore the whole dictionary</h2>
        <p>Open the ordered word list, or start with a kind of word.</p>
      </div>
      <div class="word-type-cards">
        ${items.map((item) => `
          <a class="word-type-card" href="${escapeHtml(item.href || `word-list.html?type=${encodeURIComponent(item.key)}&spelling=${encodeURIComponent(state.spelling)}&meaning=${encodeURIComponent(state.language)}`)}">
            <span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></span>
            <b>${typeof item.count === "number" ? item.count.toLocaleString() : escapeHtml(item.count)}</b>
          </a>
        `).join("")}
      </div>
    </section>
  `;
}

function renderResultButton(entry) {
  const active = entry.id === state.selectedId ? " active" : "";
  const alternate = alternateSearchLemma(entry);
  return `
    <button type="button" class="result-button${active}" data-entry-id="${escapeHtml(entry.id)}">
      <span class="result-lemma">${escapeHtml(displayLemma(entry))}</span>
      <span class="result-class">${escapeHtml(wordClassLabel(entry))}</span>
      ${alternate ? `<span class="result-alternate">${state.spelling === "int" ? "DEU" : "INT"} · ${escapeHtml(alternate)}</span>` : ""}
      <span class="result-meaning">${escapeHtml(displayMeaning(entry))}</span>
    </button>
  `;
}

function renderResults() {
  renderWordClassFilters();
  const query = normalizeSearch(state.query);
  const hasTypeFilter = state.wordClassFilter !== "all";
  if (document.body) document.body.dataset.searchState = query || hasTypeFilter ? "active" : "idle";

  if (!query && !hasTypeFilter) {
    els.resultMeta.textContent = "Search 12,525 entries or choose a word type";
    els.results.innerHTML = `<div class="result-empty"><strong>Start anywhere.</strong><span>Search for a word or meaning, choose a type, or use Surprise me.</span></div>`;
    return;
  }

  const type = WORD_TYPE_GROUPS.find((group) => group.key === state.wordClassFilter);
  els.resultMeta.textContent = query
    ? `${state.totalMatches.toLocaleString()} match${state.totalMatches === 1 ? "" : "es"}${state.totalMatches > MAX_RESULTS ? ` · ${MAX_RESULTS} shown` : ""} · ordered by relevance`
    : `${state.totalMatches.toLocaleString()} ${type?.label.toLowerCase() || "entries"}${state.totalMatches > MAX_RESULTS ? ` · ${MAX_RESULTS} shown` : ""}`;

  if (!state.filteredEntries.length) {
    els.results.innerHTML = `<div class="result-empty"><strong>No matching entries.</strong><span>Try a broader spelling, meaning, or word type.</span></div>`;
    return;
  }

  const orderedGroups = state.matchGroupOrder
    .map((key) => WORD_TYPE_GROUPS.find((group) => group.key === key))
    .filter(Boolean);
  const bestMatches = query ? state.filteredEntries.slice(0, 8) : [];
  const bestIds = new Set(bestMatches.map((entry) => entry.id));
  const bestMarkup = bestMatches.length ? `
    <section class="result-group best-match-group">
      <div class="result-group-heading"><h2>Best matches</h2><span>${bestMatches.length}</span></div>
      <div class="result-grid">${bestMatches.map(renderResultButton).join("")}</div>
    </section>
  ` : "";
  const groupedMarkup = orderedGroups.map((group) => {
    const entries = state.filteredEntries.filter((entry) => !bestIds.has(entry.id) && wordTypeGroup(entry).key === group.key);
    if (!entries.length) return "";
    const total = state.matchTypeCounts.get(group.key) || entries.length;
    return `
      <section class="result-group">
        <div class="result-group-heading"><h2>${escapeHtml(group.label)}</h2><span>${total.toLocaleString()}</span></div>
        <div class="result-grid">${entries.map(renderResultButton).join("")}</div>
      </section>
    `;
  }).join("");
  els.results.innerHTML = `${bestMarkup}${groupedMarkup}`;
}

function field(label, value) {
  if (!value) return "";
  return `
    <div class="field">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `;
}

function linkedField(label, value, url) {
  if (!value) return "";
  let safeUrl = "";
  try {
    const parsed = new URL(url);
    if (["http:", "https:"].includes(parsed.protocol)) safeUrl = parsed.href;
  } catch {
    // Invalid or unsupported source links remain visible as plain text.
  }
  if (!safeUrl) return field(label, value);
  return `
    <div class="field">
      <dt>${escapeHtml(label)}</dt>
      <dd><a href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a></dd>
    </div>
  `;
}

function pairFields(label, value) {
  if (!value) return "";
  const parts = [];
  if (value.int) parts.push(field(`${label} INT`, value.int));
  if (value.deu) parts.push(field(`${label} DEU`, value.deu));
  return parts.join("");
}

function lemmaSupplements(details) {
  const items = [
    ["composition", spellingValue(details.composition)],
    ["variation", spellingValue(details.variation)],
    ["reconstruction", spellingValue(details.reconstruction)],
  ].filter(([, value]) => value);
  if (!items.length) return "";
  return `[${items.map(([label, value]) => `${label}: ${value}`).join("; ")}]`;
}

function structureNode(label, value) {
  if (!value) return "";
  return `<div class="structure-node"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`;
}

function renderWordStructure(entry) {
  const details = entry.details || {};
  const title = entryDisplayLemma(entry);
  const upstream = [
    structureNode("Base", spellingValue(details.base)),
    structureNode("Composition", spellingValue(details.composition)),
    structureNode("Reconstructed form", spellingValue(details.reconstruction)),
  ].filter(Boolean);
  const variation = spellingValue(details.variation);

  if (!upstream.length && !variation) {
    return `<section class="panel-card structure-panel"><h3>Word structure</h3><p class="panel-note">No composition, variation, reconstruction, or base relationship is recorded for this entry.</p></section>`;
  }

  return `
    <section class="panel-card structure-panel">
      <h3>Word structure</h3>
      <p class="panel-note">Relationships recorded directly in the workbook.</p>
      <div class="structure-map" aria-label="Word structure hierarchy">
        ${upstream.join("")}
        ${upstream.length ? `<div class="structure-connector" aria-hidden="true"></div>` : ""}
        <div class="structure-node current"><strong>Current lemma</strong><span>${escapeHtml(title)}</span></div>
        ${variation ? `<div class="structure-connector" aria-hidden="true"></div>${structureNode("Variation", variation)}` : ""}
      </div>
    </section>
  `;
}

function sourceLink(value, url) {
  if (!value) return "";
  try {
    const parsed = new URL(url);
    if (["http:", "https:"].includes(parsed.protocol)) {
      return `<a href="${escapeHtml(parsed.href)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`;
    }
  } catch {
    // Source remains readable when no valid external link exists.
  }
  return escapeHtml(value);
}

function renderSource(entry) {
  const source = entry.details?.source || {};
  const sourceType = source.source_1 ? labelWithCode(source.source_1) : "";
  const sourceValue = state.spelling === "deu"
    ? (source.source_2_deu || source.source_2_int)
    : (source.source_2_int || source.source_2_deu);
  const sourceUrl = state.spelling === "deu"
    ? (source.source_2_deu_url || source.source_2_int_url)
    : (source.source_2_int_url || source.source_2_deu_url);

  if (!sourceType && !sourceValue) {
    return `<section class="panel-card source-panel"><h3>Source</h3><p class="panel-note">No source information is recorded for this entry.</p></section>`;
  }
  return `
    <section class="panel-card source-panel">
      <h3>Source</h3>
      <div class="source-content">
        <p class="source-bracket">[${sourceType ? `<strong>${escapeHtml(sourceType)}</strong>` : ""}${sourceType && sourceValue ? " · " : ""}${sourceLink(sourceValue, sourceUrl)}]</p>
      </div>
    </section>
  `;
}

function wordClassGuide(entry) {
  const grammar = entry.grammar || {};
  const code = grammar.word_class_1;
  const base = {
    V: ["Verb", "describes an action, event, or state"],
    N: ["Noun", "names a person, place, thing, or idea"],
    ADJ: ["Adjective", "describes a noun and changes to agree with it"],
  }[code] || [labelOnly(labelWithCode(code)) || "Entry", "this word class has no learner summary yet"];
  const detail = code === "N" && grammar.flexion_1
    ? `${labelOnly(labelWithCode(grammar.flexion_1))} noun class`
    : grammar.word_class_2
      ? labelOnly(labelWithCode(grammar.word_class_2))
      : "";
  return { code, title: base[0], description: base[1], detail };
}

function keyFormRows(generated) {
  if (!generated) return [];
  if (["verb_conjugation", "verb_exist"].includes(generated.kind)) {
    const present = generated.rows.filter((row) => row.tense === "PRS" && row.polarity !== "NEG" && (!row.aspect || row.aspect === "NPFV"));
    return (present.length ? present : generated.rows.slice(0, 6)).map((row) => ({
      label: personGuide(row.person_number)[0],
      form: row.form,
    }));
  }
  if (generated.kind === "noun_declension") {
    return generated.rows
      .filter((row) => row.case === "NOM")
      .map((row) => ({
        label: `${row.number === "SG" ? "one · singular" : "many · plural"}${row.gender ? ` · ${row.gender === "M" ? "masculine" : "feminine"}` : ""}`,
        form: row.form,
      }));
  }
  if (generated.kind === "adjective_declension") {
    return generated.rows
      .filter((row) => row.case === "NOM")
      .map((row) => ({
        label: `${row.number === "SG" ? "singular" : "plural"} · ${row.gender === "M" ? "masculine" : "feminine"}`,
        form: row.form,
      }));
  }
  return [];
}

function grammarViewLabel(entry) {
  const kind = entry.morphology?.kind;
  if (["verb_conjugation", "verb_exist"].includes(kind)) return "Conjugation";
  if (["noun_declension", "adjective_declension"].includes(kind)) return "Declension";
  return "Grammar";
}

function renderGrammarSnapshot(entry, { compact = false } = {}) {
  const guide = wordClassGuide(entry);
  const generated = generateForms(entry);
  const forms = keyFormRows(generated);
  return `
    <section class="panel-card grammar-snapshot${compact ? " compact" : ""}">
      <div class="grammar-summary">
        <p class="eyebrow">Grammar at a glance</p>
        <h3>${escapeHtml(guide.title)}</h3>
        <p>${escapeHtml(guide.description)}${guide.detail ? ` · <strong>${escapeHtml(guide.detail)}</strong>` : ""}</p>
      </div>
      ${forms.length ? `
        <div class="key-forms" aria-label="Useful forms">
          ${forms.map((item) => `<div><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.form)}</strong></div>`).join("")}
        </div>
        <button type="button" class="text-action" data-entry-view="forms">See the full ${escapeHtml(grammarViewLabel(entry).toLowerCase())} →</button>
      ` : `<p class="panel-note">No generated grammar forms are available for this word.</p>`}
    </section>
  `;
}

function renderMeaningPanel(entry) {
  const meanings = entryMeanings(entry);
  return `
    <section class="panel-card meaning-panel">
      <div class="panel-heading">
        <h3>${state.language === "de" ? "German meanings" : "English meanings"}</h3>
        <p>${meanings.values.length} ${meanings.values.length === 1 ? "sense" : "senses"}</p>
      </div>
      ${meanings.values.length
        ? `<ol class="meaning-list">${meanings.values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`
        : `<p class="panel-note">No meaning available.</p>`}
      ${meanings.fallback ? `<p class="fallback-note">${state.language === "en" ? "German shown because English is missing." : "English shown because German is missing."}</p>` : ""}
    </section>
  `;
}

function renderOverview(entry) {
  if (state.edition === "compact") {
    return `<div class="compact-overview">${renderMeaningPanel(entry)}${renderGrammarSnapshot(entry, { compact: true })}</div>`;
  }
  if (state.edition === "learner") {
    return `<div class="learner-overview">${renderMeaningPanel(entry)}${renderGrammarSnapshot(entry)}</div><div class="overview-grid">${renderSource(entry)}</div>`;
  }
  return `${renderMeaningPanel(entry)}<div class="overview-grid">${renderWordStructure(entry)}${renderSource(entry)}</div>`;
}

function renderDetails(entry) {
  const grammar = entry.grammar || {};
  const details = entry.details || {};
  const flexionLabels = grammarFieldLabels(grammar.word_class_1);
  const grammarFields = [
    field("Word class", labelWithCode(grammar.word_class_1)),
    field("Subclass", labelWithCode(grammar.word_class_2)),
    field(flexionLabels.flexion1, labelWithCode(grammar.flexion_1)),
    field(flexionLabels.flexion2Int, grammar.flexion_2_int ? `[${grammar.flexion_2_int}]` : ""),
    field(flexionLabels.flexion2Deu, grammar.flexion_2_deu ? `[${grammar.flexion_2_deu}]` : ""),
    field(flexionLabels.flexion3Int, grammar.flexion_3_int ? `[${grammar.flexion_3_int}]` : ""),
    field(flexionLabels.flexion3Deu, grammar.flexion_3_deu ? `[${grammar.flexion_3_deu}]` : ""),
  ].join("");
  const editorialFields = [
    pairFields("Composition", details.composition),
    pairFields("Variation", details.variation),
    pairFields("Reconstruction", details.reconstruction),
    pairFields("Base", details.base),
    field("Source type", labelWithCode(details.source?.source_1)),
    linkedField("Source 2 INT", details.source?.source_2_int, details.source?.source_2_int_url),
    linkedField("Source 2 DEU", details.source?.source_2_deu, details.source?.source_2_deu_url),
    field("Paradigm (internal)", grammar.paradigm),
    field("Resolved paradigm", entry.morphology?.source_paradigm ? entry.morphology.paradigm : ""),
    field("Domain (internal)", labelWithCode(grammar.domain)),
    field("Workbook row", entry.source?.row),
  ].join("");

  return `
    <section class="panel-card details-panel">
      <div class="details-group"><h3>Grammar</h3><dl class="definition-grid">${grammarFields}</dl></div>
      <div class="details-group"><h3>Editorial metadata</h3><dl class="definition-grid">${editorialFields}</dl></div>
    </section>
  `;
}

function availableEntryViews(entry) {
  const views = [{ id: "overview", label: "Entry" }];
  if (entry.morphology?.kind) views.push({ id: "forms", label: grammarViewLabel(entry), provisional: true });
  if (familyData(entry)) views.push({ id: "family", label: "Word family" });
  views.push({ id: "details", label: "Details" });
  return views;
}

function renderEntryView(entry) {
  if (state.entryView === "family") return renderWordFamily(entry);
  if (state.entryView === "forms") return renderForms(entry);
  if (state.entryView === "details") return renderDetails(entry);
  return renderOverview(entry);
}

function renderEntry() {
  const entry = state.entriesById.get(state.selectedId);
  const browseFooter = state.edition === "compact" ? renderWordTypeIndex() : "";
  if (!entry) {
    els.entryPane.innerHTML = `<div class="empty-state"><p class="section-label">12,525 Roman entries</p><h2>Find your way into the language.</h2><p>Search a Roman word, German or English meaning; or let the dictionary surprise you.</p></div>${browseFooter}`;
    return;
  }

  const grammar = entry.grammar || {};
  const details = entry.details || {};
  const title = entry.lemma?.[`display_${state.spelling}`] || rawLemma(entry) || "Untitled entry";
  const alternate = state.spelling === "deu"
    ? entry.lemma?.display_int || entry.lemma?.int
    : entry.lemma?.display_deu || entry.lemma?.deu;
  const views = availableEntryViews(entry);
  if (!views.some((view) => view.id === state.entryView)) state.entryView = "overview";
  const supplements = lemmaSupplements(details);

  els.entryPane.innerHTML = `
    <article class="entry-article">
      <header class="entry-masthead">
        <div>
          <p class="entry-overline">Roman entry · ${state.spelling.toUpperCase()} spelling</p>
          <h2 class="entry-title">${escapeHtml(title)}</h2>
          ${alternate && alternate !== title ? `<p class="entry-alternate">${state.spelling === "int" ? "DEU" : "INT"} · ${escapeHtml(alternate)}</p>` : ""}
          ${supplements ? `<p class="lemma-supplements">${escapeHtml(supplements)}</p>` : ""}
        </div>
        <div class="grammar-stack">
          ${grammar.word_class_1 ? `<span class="grammar-pill">${escapeHtml(WORD_CLASS_LABELS[grammar.word_class_1] || labelOnly(labelWithCode(grammar.word_class_1)))}</span>` : ""}
          ${grammar.word_class_2 ? `<span class="grammar-pill">${escapeHtml(labelOnly(labelWithCode(grammar.word_class_2)))}</span>` : ""}
          ${grammar.flexion_1 ? `<span class="grammar-pill">${escapeHtml(labelOnly(labelWithCode(grammar.flexion_1)))}</span>` : ""}
        </div>
      </header>

      <nav class="entry-tabs" aria-label="Entry views">
        ${views.map((view) => `<button type="button" class="entry-tab${view.id === state.entryView ? " active" : ""}" data-entry-view="${view.id}" aria-pressed="${view.id === state.entryView}">${escapeHtml(view.label)}${view.provisional ? ` <span class="provisional-dot" aria-label="provisional">●</span>` : ""}</button>`).join("")}
      </nav>
      <div class="entry-view">${renderEntryView(entry)}</div>
    </article>
    ${browseFooter}
  `;
}

function storedPreference(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The URL still preserves the current choice when storage is unavailable.
  }
}

function applyUrlState() {
  const params = new URL(window.location.href).searchParams;
  const spelling = params.get("spelling") || storedPreference("roman-spelling", "int");
  const language = params.get("meaning") || storedPreference("roman-meaning", "de");
  const edition = params.get("edition") || storedPreference("roman-layout-v2", "compact");
  state.spelling = ["int", "deu"].includes(spelling) ? spelling : "int";
  state.language = ["de", "en"].includes(language) ? language : "de";
  state.edition = ["learner", "compact", "explorer"].includes(edition) ? edition : "compact";
  state.query = params.get("q") || "";
  const wordClassFilter = params.get("type") || "all";
  state.wordClassFilter = ["all", ...WORD_TYPE_GROUPS.map((group) => group.key)].includes(wordClassFilter)
    ? wordClassFilter
    : "all";
  state.entryView = ["overview", "family", "forms", "details"].includes(params.get("view"))
    ? params.get("view")
    : "overview";
  state.selectedId = params.get("entry") || state.selectedId;
  if (state.selectedId && !state.searchEntriesById.has(state.selectedId)) {
    state.selectedId = null;
  }
  els.search.value = state.query;
  updateControlButtons();
}

function syncUrl() {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  state.query ? params.set("q", state.query) : params.delete("q");
  state.wordClassFilter === "all" ? params.delete("type") : params.set("type", state.wordClassFilter);
  state.selectedId ? params.set("entry", state.selectedId) : params.delete("entry");
  params.set("spelling", state.spelling);
  params.set("meaning", state.language);
  params.set("edition", state.edition);
  state.entryView === "overview" ? params.delete("view") : params.set("view", state.entryView);
  history.replaceState(null, "", url);
}

function updateControlButtons() {
  if (els.editionSelect) els.editionSelect.value = state.edition;
  if (document.body) document.body.dataset.edition = state.edition;
  els.spellingButtons.forEach((button) => {
    const active = button.dataset.spelling === state.spelling;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  els.languageButtons.forEach((button) => {
    const active = button.dataset.language === state.language;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

async function ensureEntryLoaded(id) {
  if (!id || state.entriesById.has(id)) return state.entriesById.get(id);
  const searchEntry = state.searchEntriesById.get(id);
  const chunkId = searchEntry?.chunk;
  const chunk = state.entryManifest.chunks?.[chunkId];
  if (!chunk) throw new Error(`Entry data chunk is missing for ${id}.`);

  if (!state.entryChunks.has(chunkId)) {
    const request = fetch(`data/processed/${chunk.file}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load ${chunk.file}.`);
        return response.json();
      })
      .then((entries) => {
        entries.forEach((entry) => state.entriesById.set(entry.id, entry));
        return entries;
      })
      .catch((error) => {
        state.entryChunks.delete(chunkId);
        throw error;
      });
    state.entryChunks.set(chunkId, request);
  }

  await state.entryChunks.get(chunkId);
  return state.entriesById.get(id);
}

async function renderSelectedEntry() {
  const selectedId = state.selectedId;
  if (!selectedId) {
    renderEntry();
    return;
  }
  if (!state.entriesById.has(selectedId)) {
    els.entryPane.setAttribute("aria-busy", "true");
    els.entryPane.innerHTML = `
      <div class="empty-state loading-state">
        <h2>Loading entry…</h2>
      </div>
    `;
  }
  try {
    await ensureEntryLoaded(selectedId);
    if (state.selectedId === selectedId) {
      els.entryPane.setAttribute("aria-busy", "false");
      renderEntry();
    }
  } catch (error) {
    if (state.selectedId === selectedId) {
      els.entryPane.setAttribute("aria-busy", "false");
      els.entryPane.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`;
    }
  }
}

function render({ updateUrl = true } = {}) {
  updateFilteredEntries();
  renderResults();
  void renderSelectedEntry();
  if (updateUrl) syncUrl();
}

function selectEntry(id, entryView = "overview") {
  state.selectedId = id;
  state.entryView = entryView;
  render();
}

async function loadData() {
  const responses = await Promise.all([
    fetch(DATA_URLS.manifest),
    fetch(DATA_URLS.search),
    fetch(DATA_URLS.references),
    fetch(DATA_URLS.paradigmModel),
  ]);
  if (responses.some((response) => !response.ok)) {
    throw new Error("Could not load processed dictionary JSON.");
  }
  const [entryManifest, searchEntries, references, paradigmModel] = await Promise.all(
    responses.map((response) => response.json()),
  );
  state.entryManifest = entryManifest;
  state.searchEntries = prepareSearchEntries(searchEntries);
  state.searchEntriesById = new Map(state.searchEntries.map((entry) => [entry.id, entry]));
  state.wordTypeCounts = countWordTypes(state.searchEntries);
  state.wordFamilies = buildWordFamilies(state.searchEntries);
  state.lemmasBySpelling = buildLemmaIndex(state.searchEntries);
  state.references = references;
  state.paradigmModel = paradigmModel;
  applyUrlState();
  els.status.textContent = `${entryManifest.entry_count.toLocaleString()} entries indexed · details load on demand`;
  render();
}

els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

els.results.addEventListener("click", (event) => {
  const wordClassButton = event.target.closest("[data-word-class]");
  if (wordClassButton) {
    state.wordClassFilter = wordClassButton.dataset.wordClass;
    render();
    return;
  }
  const button = event.target.closest("[data-entry-id]");
  if (button) selectEntry(button.dataset.entryId, "overview");
});

els.wordClassFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-word-class]");
  if (!button) return;
  state.wordClassFilter = button.dataset.wordClass;
  render();
});

els.entryPane.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-entry-view]");
  if (viewButton) {
    state.entryView = viewButton.dataset.entryView;
    renderEntry();
    syncUrl();
    return;
  }
  const button = event.target.closest("[data-entry-id]");
  if (button) selectEntry(button.dataset.entryId, state.entryView === "family" ? "family" : "overview");
});

els.randomEntry.addEventListener("click", () => {
  const randomIndex = Math.floor(Math.random() * state.searchEntries.length);
  const entry = state.searchEntries[randomIndex];
  if (!entry) return;
  state.query = "";
  state.wordClassFilter = "all";
  els.search.value = "";
  selectEntry(entry.id, "overview");
});

els.editionSelect?.addEventListener("change", (event) => {
  state.edition = event.target.value;
  if (state.edition === "compact") state.wordClassFilter = "all";
  savePreference("roman-layout-v2", state.edition);
  updateControlButtons();
  render();
});

els.spellingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.spelling = button.dataset.spelling;
    savePreference("roman-spelling", state.spelling);
    updateControlButtons();
    render();
  });
});

els.languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.language = button.dataset.language;
    savePreference("roman-meaning", state.language);
    updateControlButtons();
    render();
  });
});

window.addEventListener("popstate", () => {
  applyUrlState();
  render({ updateUrl: false });
});

loadData().catch((error) => {
  els.status.textContent = "Data could not be loaded";
  els.entryPane.innerHTML = `
    <div class="error-state">
      ${escapeHtml(error.message)}
    </div>
  `;
});
