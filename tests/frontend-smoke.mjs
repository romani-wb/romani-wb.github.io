import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";


const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

class ClassList {
  toggle() {}
}

class ElementStub {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.classList = new ClassList();
    this.listeners = new Map();
    this.attributes = new Map();
    this.innerHTML = "";
    this.textContent = "";
    this.value = "";
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  getAttribute(name) {
    return this.attributes.get(name) || "";
  }
}

const elements = new Map([
  ["#data-status", new ElementStub()],
  ["#search-input", new ElementStub()],
  ["#results", new ElementStub()],
  ["#result-meta", new ElementStub()],
  ["#entry-pane", new ElementStub()],
  ["#random-entry", new ElementStub()],
  ["#edition-select", new ElementStub()],
  ["#word-class-filters", new ElementStub()],
  ["#index-type-filters", new ElementStub()],
  ["#alphabet-filter", new ElementStub()],
  ["#index-status", new ElementStub()],
  ["#dictionary-index-list", new ElementStub()],
  ["#load-more-index", new ElementStub()],
  ["#dictionary-index-sentinel", new ElementStub()],
]);
const spellingButtons = [new ElementStub({ spelling: "int" }), new ElementStub({ spelling: "deu" })];
const languageButtons = [new ElementStub({ language: "de" }), new ElementStub({ language: "en" })];
const uiLanguageButtons = [new ElementStub({ uiLanguage: "de" }), new ElementStub({ uiLanguage: "en" })];

globalThis.document = {
  documentElement: { lang: "" },
  body: { dataset: {} },
  querySelector: (selector) => elements.get(selector),
  querySelectorAll: (selector) => {
    if (selector === "[data-spelling]") return spellingButtons;
    if (selector === "[data-language]") return languageButtons;
    if (selector === "[data-ui-language]") return uiLanguageButtons;
    return [];
  },
};

const startUrl = new URL(
  "http://localhost/dictionary.html?entry=g04363_b4e42bdd&q=habrin&spelling=deu&meaning=en&edition=explorer",
);
globalThis.window = {
  location: { href: startUrl.href },
  addEventListener() {},
};
globalThis.history = {
  replaceState(_state, _title, url) {
    window.location.href = String(url);
  },
};
globalThis.localStorage = {
  getItem() { return null; },
  setItem() {},
};

const requested = [];
globalThis.fetch = async (url) => {
  requested.push(String(url));
  try {
    const data = await readFile(resolve(root, String(url)), "utf8");
    return { ok: true, json: async () => JSON.parse(data) };
  } catch {
    return { ok: false, json: async () => ({}) };
  }
};

await import(`${pathToFileURL(resolve(root, "app.js")).href}?smoke=1`);
const wordTypes = await import(`${pathToFileURL(resolve(root, "word-types.js")).href}?smoke=1`);
const explore = await import(`${pathToFileURL(resolve(root, "explore.js")).href}?smoke=1`);

const deadline = Date.now() + 10_000;
while (!/entries indexed|Einträge indexiert/.test(elements.get("#data-status").textContent)) {
  if (Date.now() > deadline) throw new Error("Application data load timed out.");
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 10));
}
while (elements.get("#entry-pane").attributes.get("aria-busy") !== "false") {
  if (Date.now() > deadline) throw new Error("Entry chunk load timed out.");
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 10));
}

assert(requested.includes("data/processed/entries_manifest.json"));
assert(requested.includes("data/processed/entries/entries-008.json"));
assert(!requested.includes("data/processed/entries.json"));
assert.match(elements.get("#entry-pane").innerHTML, /habrínav/);
assert.match(elements.get("#entry-pane").innerHTML, /Englische Bedeutungen/);
assert.match(elements.get("#entry-pane").innerHTML, /Wortstruktur/);
assert.match(elements.get("#entry-pane").innerHTML, /https:\/\/de\.langenscheidt\.com/);
assert.match(elements.get("#dictionary-index-list").innerHTML, /dictionary-index-row/);
assert.match(elements.get("#index-status").textContent, /Eintr/);
assert.equal(elements.get("#search-input").value, "habrin");
assert.match(window.location.href, /entry=g04363_b4e42bdd/);
assert.equal(document.body.dataset.edition, "explorer");
assert.match(elements.get("#results").innerHTML, /top-results/);
assert.doesNotMatch(elements.get("#results").innerHTML, /Best matches/);
assert.match(elements.get("#results").innerHTML, />Verb</);

elements.get("#search-input").listeners.get("input")({ target: { value: "essen" } });
const essenResults = elements.get("#results").innerHTML;
assert.ok(essenResults.indexOf("g04511_54bad702") < essenResults.indexOf("g00701_c18b7ebf"));
assert.ok(essenResults.indexOf("g04348_a1364d4b") < essenResults.indexOf("g00701_c18b7ebf"));
assert.match(essenResults, /class="result-grid top-results">\s*<button[^>]*data-entry-id="g04511_54bad702"/);
assert.doesNotMatch(essenResults, /Best matches/);
assert.match(elements.get("#result-meta").textContent, /Relevanz/);

elements.get("#entry-pane").listeners.get("click")({
  target: {
    closest(selector) {
      return selector === "[data-entry-view]" ? { dataset: { entryView: "forms" } } : null;
    },
  },
});
assert.match(elements.get("#entry-pane").innerHTML, /Generierte Formen/);
assert.match(elements.get("#entry-pane").innerHTML, /I chatter/);
assert.match(elements.get("#entry-pane").innerHTML, /you chatter/);
assert.match(elements.get("#entry-pane").innerHTML, /he\/she\/it chatters/);
assert.match(window.location.href, /view=forms/);

elements.get("#edition-select").listeners.get("change")({ target: { value: "learner" } });
assert.equal(document.body.dataset.edition, "learner");
assert.match(window.location.href, /edition=learner/);
assert.match(elements.get("#entry-pane").innerHTML, /Generierte Formen/);
assert.match(elements.get("#entry-pane").innerHTML, /Konjugation/);

elements.get("#search-input").listeners.get("input")({ target: { value: "" } });
assert.match(elements.get("#results").innerHTML, /Suche starten/);
assert.doesNotMatch(elements.get("#result-meta").textContent, /first 80/i);

elements.get("#word-class-filters").listeners.get("click")({
  target: {
    closest(selector) {
      return selector === "[data-word-class]" ? { dataset: { wordClass: "nouns" } } : null;
    },
  },
});
assert.match(elements.get("#result-meta").textContent, /substantive/);
assert.match(elements.get("#results").innerHTML, /Substantive/);
assert.match(window.location.href, /type=nouns/);

elements.get("#results").listeners.get("click")({
  target: {
    closest(selector) {
      return selector === "[data-entry-id]" ? { dataset: { entryId: "g00054_e15132ad" } } : null;
    },
  },
});
while (elements.get("#entry-pane").attributes.get("aria-busy") !== "false") {
  if (Date.now() > deadline) throw new Error("Mixed-gender noun entry timed out.");
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 10));
}
elements.get("#entry-pane").listeners.get("click")({
  target: {
    closest(selector) {
      return selector === "[data-entry-view]" ? { dataset: { entryView: "forms" } } : null;
    },
  },
});
assert.match(elements.get("#entry-pane").innerHTML, /Singular maskulin/);
assert.match(elements.get("#entry-pane").innerHTML, /Singular feminin/);
assert.match(elements.get("#entry-pane").innerHTML, /Plural feminin/);
elements.get("#edition-select").listeners.get("change")({ target: { value: "compact" } });
assert.doesNotMatch(elements.get("#entry-pane").innerHTML, /Explore the whole dictionary/);
assert.doesNotMatch(elements.get("#entry-pane").innerHTML, /Keep exploring/);
assert.equal(wordTypes.wordClassLabel("PTCLV"), "Particle verb");
assert.equal(wordTypes.wordClassLabel("PTCLV", "de"), "Partikelverb");
assert.equal(wordTypes.wordTypeGroup("PTCLV").key, "verbs");

const familyFixture = [
  { id: "base", roman_int: "kerav", roman_deu: "kerav", base_int: "kerav", base_deu: "kerav", word_class: "V" },
  { id: "derived", roman_int: "arkerípe", roman_deu: "arkeripe", base_int: "kerav", base_deu: "kerav", word_class: "N" },
  { id: "other", roman_int: "kher", roman_deu: "kher", base_int: "kher", base_deu: "kher", word_class: "N" },
];
const familyIndex = explore.buildFamilyIndex(familyFixture);
assert.equal(familyIndex.size, 2);
assert.equal(familyIndex.get("kerav").entries.length, 2);
const familyLayout = explore.createNetworkLayout(familyIndex.get("kerav"));
assert.equal(familyLayout.entries.length, 2);
assert.equal(familyLayout.groups.length, 2);
assert.equal(familyLayout.edges.length, 4);
const atlasFixture = explore.createAtlasFamilies(familyIndex, 5);
assert.equal(atlasFixture.length, 1);
assert.equal(atlasFixture[0].family.key, "kerav");
assert.equal(atlasFixture[0].dominantType, "nouns");
const atlasFixtureLayout = explore.createAtlasLayout(atlasFixture, 600, 500);
assert.equal(atlasFixtureLayout.nodes.length, 1);
assert.equal(atlasFixtureLayout.clusters.length, 1);
const ribbonFixtureLayout = explore.createRibbonLayout(familyIndex.get("kerav"));
assert.equal(ribbonFixtureLayout.entries.length, 2);
assert.equal(ribbonFixtureLayout.groups.length, 2);
assert.equal(ribbonFixtureLayout.edges.length, 4);
const ringFixtureLayout = explore.createRingLayout(familyIndex.get("kerav"));
assert.equal(ringFixtureLayout.entries.length, 2);
assert.equal(ringFixtureLayout.groups.length, 2);
const comparisonFixture = explore.createComparisonModel(familyIndex.get("kerav"), familyIndex.get("kher"));
assert.equal(comparisonFixture.primaryTotal, 2);
assert.equal(comparisonFixture.secondaryTotal, 1);
assert.equal(comparisonFixture.sizeDifference, -1);
assert.equal(comparisonFixture.rows.length, 2);
const searchEntries = JSON.parse(await readFile(resolve(root, "data/processed/entries_search.json"), "utf8"));
const realFamilyIndex = explore.buildFamilyIndex(searchEntries);
assert.equal(realFamilyIndex.size, 3113);
assert.equal([...realFamilyIndex.values()].filter((family) => family.entries.length > 1).length, 2664);
const realAtlasFamilies = explore.createAtlasFamilies(realFamilyIndex);
assert(realAtlasFamilies.length > 200 && realAtlasFamilies.length <= 294);
assert(realAtlasFamilies.every((item) => item.family.entries.length > 1));
const realAtlasLayout = explore.createAtlasLayout(realAtlasFamilies, 1000, 650);
assert.equal(realAtlasLayout.nodes.length, realAtlasFamilies.length);
assert(realAtlasLayout.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y) && node.radius > 0));
const realLandscapeFamilies = explore.createAtlasFamilies(realFamilyIndex, Number.MAX_SAFE_INTEGER);
assert.equal(realLandscapeFamilies.length, 2664);
const realLandscapeLayout = explore.createLandscapeLayout(realLandscapeFamilies, 1000, 650);
assert.equal(realLandscapeLayout.nodes.length, 2664);
assert(realLandscapeLayout.lanes.length >= 5);

const homeHtml = await readFile(resolve(root, "index.html"), "utf8");
const dictionaryHtml = await readFile(resolve(root, "dictionary.html"), "utf8");
const wordListHtml = await readFile(resolve(root, "word-list.html"), "utf8");
const grammarHtml = await readFile(resolve(root, "grammar.html"), "utf8");
const exploreHtml = await readFile(resolve(root, "explore.html"), "utf8");
const imprintHtml = await readFile(resolve(root, "imprint.html"), "utf8");
const homeCss = await readFile(resolve(root, "styles.css"), "utf8");
const dictionaryCss = await readFile(resolve(root, "dictionary.css"), "utf8");
const siteFooterCss = await readFile(resolve(root, "site-footer.css"), "utf8");
const referenceCss = await readFile(resolve(root, "reference.css"), "utf8");
const appJs = await readFile(resolve(root, "app.js"), "utf8");
const siteI18n = await readFile(resolve(root, "site-i18n.js"), "utf8");
const pagesWorkflow = await readFile(resolve(root, ".github/workflows/pages.yml"), "utf8");
assert.match(homeHtml, /href="dictionary\.html"/);
assert.match(homeHtml, /href="explore\.html"/);
assert.match(homeHtml, /class="story-brand"/);
assert.match(homeHtml, /class="hero-logo"/);
assert.match(homeHtml, /assets\/romani-project\/RP_Logo\.svg/);
assert(!homeHtml.includes("app.js"));
assert.match(homeCss, /BDOGrotesk-Regular\.otf/);
assert.match(homeCss, /--blue: #1b68d2/);
assert.doesNotMatch(homeCss, /radial-gradient/);
assert.doesNotMatch(homeHtml, /class="hero-r"|class="orbit/);
for (const html of [homeHtml, dictionaryHtml, grammarHtml, exploreHtml, imprintHtml]) {
  assert.match(html, /site-footer\.css/);
  assert.match(html, /class="site-footer"/);
  assert.match(html, /data-i18n="footer\.minorityPromotion"/);
  assert.match(html, /BKA_Logo_deu\.svg/);
  assert.match(html, /href="imprint\.html"/);
}
assert.match(dictionaryHtml, /src="app\.js"/);
assert.match(dictionaryHtml, /id="edition-select"/);
assert.match(dictionaryHtml, /data-i18n="dictionary.layoutFocus"/);
assert.match(dictionaryHtml, /data-i18n="dictionary.layoutBrowse"/);
assert.match(dictionaryHtml, /value="compact" selected/);
assert.match(dictionaryHtml, /data-i18n="dictionary.layoutSplit"/);
assert.match(dictionaryHtml, /id="dictionary-index"/);
assert.match(dictionaryHtml, /data-i18n="dictionary.indexHeading"/);
assert.match(dictionaryHtml, /assets\/romani-project\/RP_Logo\.svg/);
assert.doesNotMatch(dictionaryHtml, /href="word-list\.html"/);
assert.match(dictionaryHtml, /href="grammar\.html"/);
assert.match(dictionaryHtml, /href="explore\.html"/);
assert.doesNotMatch(dictionaryHtml, /Compare views/);
assert.match(dictionaryCss, /BDOGrotesk-Regular\.otf/);
assert.match(dictionaryCss, /--blue: #1b68d2/);
assert.match(siteFooterCss, /site-footer-bka/);
assert.match(siteFooterCss, /html\[lang="en"\] \.site-footer-bka \.footer-logo-en/);
assert.doesNotMatch(elements.get("#entry-pane").innerHTML, /New here/);
assert.match(wordListHtml, /dictionary\.html#dictionary-index/);
assert.match(wordListHtml, /window\.location\.replace/);
assert.doesNotMatch(wordListHtml, /word-list\.js/);
assert.match(imprintHtml, /data-i18n="imprint\.heading"/);
assert.match(imprintHtml, /Akademie Graz/);
assert.match(imprintHtml, /Roma Service/);
assert.match(imprintHtml, /Romano Centro/);
assert.match(imprintHtml, /Valentin Edelsbrunner/);
assert.doesNotMatch(imprintHtml, /Design:\s*[^<]+/);
assert.match(grammarHtml, /data-i18n="grammar.structureHeading"/);
assert.match(grammarHtml, /data-i18n="grammar.formsHeading"/);
assert.match(grammarHtml, /data-i18n="grammar.codesHeading"/);
assert.match(grammarHtml, /href="explore\.html"/);
assert.match(appJs, /from "\.\/site-i18n\.js"/);
assert.match(homeHtml, /site-i18n\.js/);
assert.match(siteI18n, /"grammar\.generatedText"/);
const declaredI18nKeys = new Set([...siteI18n.matchAll(/"([^"]+)":/g)].map((match) => match[1]));
const usedI18nKeys = [...new Set([homeHtml, dictionaryHtml, wordListHtml, grammarHtml, exploreHtml, imprintHtml].flatMap((html) => (
  [...html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map((match) => match[1])
)))].sort();
assert.deepEqual(usedI18nKeys.filter((key) => !declaredI18nKeys.has(key)), []);
assert.match(pagesWorkflow, /site-i18n\.js _site\//);
assert.doesNotMatch(pagesWorkflow, /word-list\.js/);
assert.match(pagesWorkflow, /assets\/romani-project/);
assert.match(pagesWorkflow, /imprint\.html/);
assert.match(pagesWorkflow, /site-footer\.css/);
assert.match(pagesWorkflow, /BKA_Logo_deu\.svg/);
assert.match(exploreHtml, /id="family-network"/);
assert.match(exploreHtml, /id="family-atlas"/);
assert.match(exploreHtml, /data-explore-view="atlas"/);
assert.match(exploreHtml, /data-explore-view="family"/);
assert.match(exploreHtml, /data-explore-view="ribbons"/);
assert.match(exploreHtml, /data-explore-view="rings"/);
assert.match(exploreHtml, /data-explore-view="landscape"/);
assert.match(exploreHtml, /data-explore-view="compare"/);
assert.match(exploreHtml, /data-use-view="compare"/);
assert.match(exploreHtml, /data-network-labels/);
assert.match(exploreHtml, /src="explore\.js"/);
assert.match(exploreHtml, /data-i18n="explore.recordedBases"/);
assert.match(referenceCss, /Grammar is intentionally a plain working reference/);
assert.match(referenceCss, /\.grammar-page \.cheat-card[^}]*box-shadow: none/);
await assert.rejects(readFile(resolve(root, "dictionary-lab.html"), "utf8"));

console.log("Frontend smoke test passed: localized dictionary layouts, unified alphabetical index, Grammar reference, Explore lab, deep links, and lazy loading are functional.");
