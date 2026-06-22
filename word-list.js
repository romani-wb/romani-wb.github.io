import { WORD_TYPE_GROUPS, wordClassLabel, wordTypeGroup } from "./word-types.js";

const DATA_URL = "data/processed/entries_search.json";
const PAGE_SIZE = 240;
const collator = new Intl.Collator("de", { sensitivity: "base" });

const state = {
  entries: [],
  filtered: [],
  query: "",
  type: "all",
  letter: "all",
  spelling: "int",
  language: "en",
  rendered: 0,
};

const els = {
  search: document.querySelector("#word-list-search"),
  typeFilters: document.querySelector("#index-type-filters"),
  alphabet: document.querySelector("#alphabet-filter"),
  status: document.querySelector("#index-status"),
  list: document.querySelector("#word-list"),
  more: document.querySelector("#load-more"),
  sentinel: document.querySelector("#word-list-sentinel"),
  spellingButtons: document.querySelectorAll("[data-index-spelling]"),
  languageButtons: document.querySelectorAll("[data-index-language]"),
};

function normalizeSearch(value) {
  return String(value || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function displayLemma(entry) {
  return entry[`roman_${state.spelling}`] || entry.roman_int || entry.roman_deu || "Untitled entry";
}

function alternateLemma(entry) {
  const alternate = state.spelling === "int" ? entry.roman_deu : entry.roman_int;
  return alternate && alternate !== displayLemma(entry) ? alternate : "";
}

function displayMeaning(entry) {
  const values = entry[state.language] || [];
  const fallback = entry[state.language === "en" ? "de" : "en"] || [];
  return (values.length ? values : fallback).filter(Boolean).join("; ");
}

function letterKey(entry) {
  const first = normalizeSearch(displayLemma(entry)).charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

function entrySearch(entry) {
  return normalizeSearch([
    entry.roman_int,
    entry.roman_deu,
    ...(entry.de || []),
    ...(entry.en || []),
    wordClassLabel(entry),
  ].join(" "));
}

function applyUrlState() {
  const params = new URL(window.location.href).searchParams;
  state.query = params.get("q") || "";
  state.type = ["all", ...WORD_TYPE_GROUPS.map((group) => group.key)].includes(params.get("type")) ? params.get("type") : "all";
  state.letter = /^[A-Z]$/.test(params.get("letter") || "") ? params.get("letter") : "all";
  state.spelling = ["int", "deu"].includes(params.get("spelling")) ? params.get("spelling") : "int";
  state.language = ["de", "en"].includes(params.get("meaning")) ? params.get("meaning") : "en";
  els.search.value = state.query;
}

function syncUrl() {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  state.query ? params.set("q", state.query) : params.delete("q");
  state.type === "all" ? params.delete("type") : params.set("type", state.type);
  state.letter === "all" ? params.delete("letter") : params.set("letter", state.letter);
  params.set("spelling", state.spelling);
  params.set("meaning", state.language);
  history.replaceState(null, "", url);
}

function renderControls() {
  const counts = new Map(WORD_TYPE_GROUPS.map((group) => [group.key, 0]));
  state.entries.forEach((entry) => {
    const key = wordTypeGroup(entry).key;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const types = [{ key: "all", label: "All", count: state.entries.length }, ...WORD_TYPE_GROUPS.map((group) => ({ ...group, count: counts.get(group.key) || 0 }))];
  els.typeFilters.innerHTML = types.map((type) => `<button type="button" data-index-type="${escapeHtml(type.key)}" class="index-filter${type.key === state.type ? " active" : ""}" aria-pressed="${type.key === state.type}">${escapeHtml(type.label)} <small>${type.count.toLocaleString()}</small></button>`).join("");
  els.alphabet.innerHTML = ["all", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((letter) => `<button type="button" data-index-letter="${letter}" class="letter-filter${letter === state.letter ? " active" : ""}" aria-pressed="${letter === state.letter}">${letter === "all" ? "All letters" : letter}</button>`).join("");
  els.spellingButtons.forEach((button) => {
    const active = button.dataset.indexSpelling === state.spelling;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  els.languageButtons.forEach((button) => {
    const active = button.dataset.indexLanguage === state.language;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function applyFilters() {
  const query = normalizeSearch(state.query);
  state.filtered = state.entries
    .filter((entry) => state.type === "all" || wordTypeGroup(entry).key === state.type)
    .filter((entry) => state.letter === "all" || letterKey(entry) === state.letter)
    .filter((entry) => !query || entry._search.includes(query))
    .sort((a, b) => collator.compare(displayLemma(a), displayLemma(b)));
  renderList(true);
  renderControls();
  syncUrl();
}

function entryMarkup(entry) {
  const alternate = alternateLemma(entry);
  const href = `dictionary.html?entry=${encodeURIComponent(entry.id)}&spelling=${encodeURIComponent(state.spelling)}&meaning=${encodeURIComponent(state.language)}&edition=compact`;
  return `<a class="word-index-row" href="${href}"><span class="word-index-lemma"><strong>${escapeHtml(displayLemma(entry))}</strong>${alternate ? `<small>${state.spelling === "int" ? "DEU" : "INT"} · ${escapeHtml(alternate)}</small>` : ""}</span><span class="word-index-type">${escapeHtml(wordClassLabel(entry))}</span><span class="word-index-meaning">${escapeHtml(displayMeaning(entry))}</span><span class="word-index-arrow" aria-hidden="true">→</span></a>`;
}

function renderList(reset = false) {
  if (reset) {
    state.rendered = 0;
    els.list.innerHTML = "";
  }
  const batch = state.filtered.slice(state.rendered, state.rendered + PAGE_SIZE);
  for (const entry of batch) {
    const letter = letterKey(entry);
    let group = els.list.lastElementChild;
    if (!group || group.dataset.letter !== letter) {
      els.list.insertAdjacentHTML("beforeend", `<section class="word-list-group" data-letter="${letter}"><h2>${letter}</h2><div></div></section>`);
      group = els.list.lastElementChild;
    }
    group.querySelector("div").insertAdjacentHTML("beforeend", entryMarkup(entry));
  }
  state.rendered += batch.length;
  const remaining = state.filtered.length - state.rendered;
  els.status.textContent = state.filtered.length
    ? `Showing ${state.rendered.toLocaleString()} of ${state.filtered.length.toLocaleString()} matching entries`
    : "No entries match these filters";
  els.more.hidden = remaining <= 0;
  els.more.textContent = remaining > 0 ? `Load ${Math.min(PAGE_SIZE, remaining).toLocaleString()} more words` : "All matching words loaded";
  els.sentinel.hidden = state.filtered.length === 0;
  if (!state.filtered.length) els.list.innerHTML = `<div class="index-empty"><strong>No matching words.</strong><span>Try another spelling, meaning, letter, or word type.</span></div>`;
}

els.search.addEventListener("input", (event) => { state.query = event.target.value; applyFilters(); });
els.typeFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-index-type]");
  if (!button) return;
  state.type = button.dataset.indexType;
  applyFilters();
});
els.alphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-index-letter]");
  if (!button) return;
  state.letter = button.dataset.indexLetter;
  applyFilters();
});
els.spellingButtons.forEach((button) => button.addEventListener("click", () => { state.spelling = button.dataset.indexSpelling; applyFilters(); }));
els.languageButtons.forEach((button) => button.addEventListener("click", () => { state.language = button.dataset.indexLanguage; applyFilters(); }));
els.more.addEventListener("click", () => renderList());
window.addEventListener("popstate", () => { applyUrlState(); applyFilters(); });

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting) && state.rendered < state.filtered.length) renderList();
  }, { rootMargin: "500px" });
  observer.observe(els.sentinel);
}

fetch(DATA_URL)
  .then((response) => {
    if (!response.ok) throw new Error("Could not load the word list.");
    return response.json();
  })
  .then((entries) => {
    state.entries = entries.map((entry) => ({ ...entry, _search: entrySearch(entry) }));
    applyUrlState();
    applyFilters();
  })
  .catch((error) => {
    els.status.textContent = error.message;
    els.list.innerHTML = `<div class="index-empty"><strong>The word list could not be loaded.</strong></div>`;
  });
