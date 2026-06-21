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
  references: {},
  paradigmModel: {},
  filteredEntries: [],
  selectedId: null,
  spelling: "int",
  language: "de",
  query: "",
};

const els = {
  status: document.querySelector("#data-status"),
  search: document.querySelector("#search-input"),
  results: document.querySelector("#results"),
  resultMeta: document.querySelector("#result-meta"),
  entryPane: document.querySelector("#entry-pane"),
  spellingButtons: document.querySelectorAll("[data-spelling]"),
  languageButtons: document.querySelectorAll("[data-language]"),
};

const MAX_RESULTS = 80;

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
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
      form: kind === "verb_exist"
        ? row[`form_${spelling}`] || row.form_int
        : combineStemAndEnding(stem, row.ending || ""),
    })),
  };
}

function renderForms(entry) {
  const generated = generateForms(entry);
  const morphology = entry.morphology || {};
  if (!generated) {
    if (!morphology.kind) return "";
    return `
      <details class="entry-section forms-disclosure">
        <summary>Forms <span class="provisional-badge">Provisional</span></summary>
        <p class="fallback-note">No generated forms available for this entry yet. Paradigm: ${escapeHtml(morphology.source_paradigm || morphology.paradigm || "none")}.</p>
      </details>
    `;
  }

  const title = {
    adjective_declension: "Adjective declension",
    noun_declension: "Noun declension",
    verb_conjugation: "Verb conjugation",
    verb_exist: "Verb forms",
  }[generated.kind] || "Forms";

  return `
    <details class="entry-section forms-disclosure">
      <summary>${escapeHtml(title)} <span class="provisional-badge">Provisional</span></summary>
      <p class="form-note">Generated from paradigm ${escapeHtml(generated.paradigm)} using the ${state.spelling.toUpperCase()} spelling. These forms have not yet passed linguistic review.</p>
      ${renderGenerationExplanation(entry, generated)}
      <div class="form-table-wrap">
        <table class="form-table">
          <thead>
            <tr>
              <th>Form</th>
              <th>Grammar</th>
              <th>Explanation</th>
              <th>Code</th>
              <th>Ending</th>
            </tr>
          </thead>
          <tbody>
            ${generated.rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.form)}</td>
                <td>${escapeHtml(row.label || row.code)}</td>
                <td>${escapeHtml(row.explanation)}</td>
                <td>${escapeHtml(row.code)}</td>
                <td>${escapeHtml(row.ending)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </details>
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
    <details class="generation-note">
      <summary>How these forms were generated</summary>
      <ul>
        <li>The source lemma is <strong>${escapeHtml(raw || "unknown")}</strong>.</li>
        ${hasHyphen ? `<li>The internal hyphen marks the stem boundary. The displayed stem is <strong>${escapeHtml(stem)}</strong>.</li>` : `<li>No internal hyphen is present, so the displayed lemma is used as the stem.</li>`}
        <li>The paradigm table supplies the forms or endings for <strong>${escapeHtml(generated.paradigm)}</strong>.</li>
        <li>The generated form column combines the stem with the table value when the table value is an ending.</li>
        ${aliasNote}
        ${irregularNote}
      </ul>
    </details>
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

function renderWordFamily(entry) {
  const base = entry.details?.base || {};
  const baseValue = base[state.spelling] || base.int || base.deu;
  if (!baseValue) return "";

  const baseSpelling = base[state.spelling] ? state.spelling : (base.int ? "int" : "deu");
  const key = normalizeSearch(`${baseSpelling}:${baseValue}`);
  const related = (state.wordFamilies.get(key) || [])
    .map((id) => state.searchEntriesById.get(id))
    .filter(Boolean)
    .filter((item) => item.id !== entry.id)
    .slice(0, 60);

  if (!related.length) return "";

  return `
    <section class="entry-section">
      <h3>Word family</h3>
      <p class="form-note">Base: ${escapeHtml(baseValue)}</p>
      <div class="related-list">
        ${related.map((item) => `
          <button type="button" class="related-entry" data-entry-id="${escapeHtml(item.id)}">
            <span>${escapeHtml(entryDisplayLemma(item))}</span>
            <small>${escapeHtml(labelOnly(labelWithCode(item.grammar?.word_class_1)))}</small>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function rankEntry(entry, query) {
  if (!query) return 1;
  const lemma = normalizeSearch(displayLemma(entry));
  const raw = normalizeSearch(
    state.spelling === "deu" ? entry.raw_roman_deu : entry.raw_roman_int,
  );
  if (lemma === query || raw === query) return 100;
  if (lemma.startsWith(query) || raw.startsWith(query)) return 80;
  if (lemma.includes(query) || raw.includes(query)) return 60;
  if (entry._search.includes(query)) return 20;
  return 0;
}

function updateFilteredEntries() {
  const query = normalizeSearch(state.query);
  if (!query) {
    state.filteredEntries = state.searchEntries.slice(0, MAX_RESULTS);
    const selected = state.searchEntriesById.get(state.selectedId);
    if (selected && !state.filteredEntries.some((entry) => entry.id === selected.id)) {
      state.filteredEntries = [selected, ...state.filteredEntries.slice(0, MAX_RESULTS - 1)];
    }
    if (!state.selectedId && state.filteredEntries.length) {
      state.selectedId = state.filteredEntries[0].id;
    }
    return;
  }

  state.filteredEntries = state.searchEntries
    .map((entry) => ({ entry, rank: rankEntry(entry, query) }))
    .filter((item) => item.rank > 0)
    .sort((a, b) => b.rank - a.rank || displayLemma(a.entry).localeCompare(displayLemma(b.entry)))
    .slice(0, MAX_RESULTS)
    .map((item) => item.entry);

  const selectedStillVisible = state.filteredEntries.some((entry) => entry.id === state.selectedId);
  if (!selectedStillVisible) {
    state.selectedId = state.filteredEntries[0]?.id || null;
  }
}

function renderResults() {
  const total = state.filteredEntries.length;
  els.resultMeta.textContent = state.query
    ? `${total} result${total === 1 ? "" : "s"} shown`
    : `Showing first ${Math.min(MAX_RESULTS, state.searchEntries.length)} entries`;

  els.results.innerHTML = state.filteredEntries
    .map((entry) => {
      const active = entry.id === state.selectedId ? " active" : "";
      return `
        <li>
          <button type="button" class="result-button${active}" data-entry-id="${escapeHtml(entry.id)}">
            <span class="result-lemma">${escapeHtml(displayLemma(entry))}</span>
            ${entry.word_class ? `<span class="result-class">${escapeHtml(entry.word_class)}</span>` : ""}
            <span class="result-meaning">${escapeHtml(displayMeaning(entry))}</span>
          </button>
        </li>
      `;
    })
    .join("");
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

function renderEntry() {
  const entry = state.entriesById.get(state.selectedId);
  if (!entry) {
    els.entryPane.innerHTML = `
      <div class="empty-state">
        <h2>Select an entry</h2>
        <p>Search results will appear on the left.</p>
      </div>
    `;
    return;
  }

  const grammar = entry.grammar || {};
  const details = entry.details || {};
  const meanings = entryMeanings(entry);
  const title = entry.lemma?.[`display_${state.spelling}`] || rawLemma(entry) || "Untitled entry";
  const alternate = state.spelling === "deu"
    ? entry.lemma?.display_int || entry.lemma?.int
    : entry.lemma?.display_deu || entry.lemma?.deu;
  const flexionLabels = grammarFieldLabels(grammar.word_class_1);
  const grammarFields = [
    field("Word class", labelWithCode(grammar.word_class_1)),
    field("Subclass", labelWithCode(grammar.word_class_2)),
    field(flexionLabels.flexion1, labelWithCode(grammar.flexion_1)),
    field(flexionLabels.flexion2Int, grammar.flexion_2_int),
    field(flexionLabels.flexion2Deu, grammar.flexion_2_deu),
    field(flexionLabels.flexion3Int, grammar.flexion_3_int),
    field(flexionLabels.flexion3Deu, grammar.flexion_3_deu),
  ].join("");
  const detailFields = [
    pairFields("Composition", details.composition),
    pairFields("Variation", details.variation),
    pairFields("Reconstruction", details.reconstruction),
    pairFields("Base", details.base),
    field("Source type", labelWithCode(details.source?.source_1)),
    linkedField("Source 2 INT", details.source?.source_2_int, details.source?.source_2_int_url),
    linkedField("Source 2 DEU", details.source?.source_2_deu, details.source?.source_2_deu_url),
    field("Paradigm", grammar.paradigm),
    field("Resolved paradigm", entry.morphology?.source_paradigm ? entry.morphology.paradigm : ""),
    field("Domain", labelWithCode(grammar.domain)),
    field("Workbook row", entry.source?.row),
  ].join("");

  els.entryPane.innerHTML = `
    <article>
      <header class="entry-header">
        <div>
          <h2 class="entry-title">${escapeHtml(title)}</h2>
          ${alternate && alternate !== title ? `<p class="entry-subtitle">${escapeHtml(alternate)}</p>` : ""}
          <p class="source-note">Workbook row ${escapeHtml(entry.source?.row || "")}</p>
        </div>
        <div class="entry-badges">
          ${grammar.word_class_1 ? `<span class="badge">${escapeHtml(labelOnly(labelWithCode(grammar.word_class_1)))}</span>` : ""}
          ${grammar.word_class_2 ? `<span class="badge">${escapeHtml(labelOnly(labelWithCode(grammar.word_class_2)))}</span>` : ""}
        </div>
      </header>

      <section class="entry-section">
        <h3>Meanings</h3>
        ${
          meanings.values.length
            ? `<ol class="meaning-list">${meanings.values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`
            : `<p>No meaning available.</p>`
        }
        ${
          meanings.fallback
            ? `<p class="fallback-note">${state.language === "en" ? "German shown because English is missing." : "English shown because German is missing."}</p>`
            : ""
        }
      </section>

      ${renderForms(entry)}
      ${renderWordFamily(entry)}

      ${grammarFields ? `
        <section class="entry-section">
          <h3>Grammar</h3>
          <dl class="definition-grid">${grammarFields}</dl>
        </section>
      ` : ""}

      ${detailFields ? `
        <details class="entry-section">
          <summary>Details</summary>
          <dl class="definition-grid">${detailFields}</dl>
        </details>
      ` : ""}
    </article>
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
  state.spelling = ["int", "deu"].includes(spelling) ? spelling : "int";
  state.language = ["de", "en"].includes(language) ? language : "de";
  state.query = params.get("q") || "";
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
  state.selectedId ? params.set("entry", state.selectedId) : params.delete("entry");
  params.set("spelling", state.spelling);
  params.set("meaning", state.language);
  history.replaceState(null, "", url);
}

function updateControlButtons() {
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

function selectEntry(id) {
  state.selectedId = id;
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
  state.wordFamilies = buildWordFamilies(state.searchEntries);
  state.references = references;
  state.paradigmModel = paradigmModel;
  applyUrlState();
  state.selectedId ||= state.searchEntries[0]?.id || null;
  els.status.textContent = `${entryManifest.entry_count.toLocaleString()} entries indexed · details load on demand`;
  render();
}

els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

els.results.addEventListener("click", (event) => {
  const button = event.target.closest("[data-entry-id]");
  if (button) selectEntry(button.dataset.entryId);
});

els.entryPane.addEventListener("click", (event) => {
  const button = event.target.closest("[data-entry-id]");
  if (button) selectEntry(button.dataset.entryId);
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
