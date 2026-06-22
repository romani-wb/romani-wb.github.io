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
]);
const spellingButtons = [new ElementStub({ spelling: "int" }), new ElementStub({ spelling: "deu" })];
const languageButtons = [new ElementStub({ language: "de" }), new ElementStub({ language: "en" })];

globalThis.document = {
  body: { dataset: {} },
  querySelector: (selector) => elements.get(selector),
  querySelectorAll: (selector) => (
    selector === "[data-spelling]" ? spellingButtons : languageButtons
  ),
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
while (!elements.get("#data-status").textContent.includes("entries indexed")) {
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
assert.match(elements.get("#entry-pane").innerHTML, /English meanings/);
assert.match(elements.get("#entry-pane").innerHTML, /Word structure/);
assert.match(elements.get("#entry-pane").innerHTML, /https:\/\/de\.langenscheidt\.com/);
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
assert.match(elements.get("#result-meta").textContent, /ordered by relevance/);

elements.get("#entry-pane").listeners.get("click")({
  target: {
    closest(selector) {
      return selector === "[data-entry-view]" ? { dataset: { entryView: "forms" } } : null;
    },
  },
});
assert.match(elements.get("#entry-pane").innerHTML, /Generated preview/);
assert.match(window.location.href, /view=forms/);

elements.get("#edition-select").listeners.get("change")({ target: { value: "learner" } });
assert.equal(document.body.dataset.edition, "learner");
assert.match(window.location.href, /edition=learner/);
assert.match(elements.get("#entry-pane").innerHTML, /Grammar made practical/);
assert.match(elements.get("#entry-pane").innerHTML, /Conjugation/);

elements.get("#search-input").listeners.get("input")({ target: { value: "" } });
assert.match(elements.get("#results").innerHTML, /Start anywhere/);
assert.doesNotMatch(elements.get("#result-meta").textContent, /first 80/i);

elements.get("#word-class-filters").listeners.get("click")({
  target: {
    closest(selector) {
      return selector === "[data-word-class]" ? { dataset: { wordClass: "nouns" } } : null;
    },
  },
});
assert.match(elements.get("#result-meta").textContent, /nouns/);
assert.match(elements.get("#results").innerHTML, /Nouns/);
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
assert.match(elements.get("#entry-pane").innerHTML, /Singular masculine/);
assert.match(elements.get("#entry-pane").innerHTML, /Singular feminine/);
assert.match(elements.get("#entry-pane").innerHTML, /Plural feminine/);
elements.get("#edition-select").listeners.get("change")({ target: { value: "compact" } });
const footerDeadline = Date.now() + 2_000;
while (!elements.get("#entry-pane").innerHTML.includes("Explore the whole dictionary")) {
  if (Date.now() > footerDeadline) throw new Error("Browse footer render timed out.");
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 10));
}
assert.match(elements.get("#entry-pane").innerHTML, /Explore the whole dictionary/);
assert.match(elements.get("#entry-pane").innerHTML, /word-list\.html\?type=nouns/);
assert.match(elements.get("#entry-pane").innerHTML, /href="grammar\.html"/);
assert.match(elements.get("#entry-pane").innerHTML, /href="explore\.html\?spelling=(?:int|deu)&amp;meaning=en"/);
assert.equal(wordTypes.wordClassLabel("PTCLV"), "Particle verb");
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
assert.match(homeHtml, /href="dictionary\.html"/);
assert.match(homeHtml, /href="explore\.html"/);
assert(!homeHtml.includes("app.js"));
assert.match(dictionaryHtml, /src="app\.js"/);
assert.match(dictionaryHtml, /id="edition-select"/);
assert.match(dictionaryHtml, />Focus</);
assert.match(dictionaryHtml, />Browse</);
assert.match(dictionaryHtml, /value="compact" selected/);
assert.match(dictionaryHtml, />Split</);
assert.match(dictionaryHtml, /href="word-list\.html"/);
assert.match(dictionaryHtml, /href="grammar\.html"/);
assert.match(dictionaryHtml, /href="explore\.html"/);
assert.doesNotMatch(dictionaryHtml, /Compare views/);
assert.doesNotMatch(elements.get("#entry-pane").innerHTML, /New here/);
assert.match(wordListHtml, /Every recorded word/);
assert.match(wordListHtml, /src="word-list\.js"/);
assert.match(grammarHtml, /Noun cases/);
assert.match(grammarHtml, /Verb forms/);
assert.match(grammarHtml, /Adjective agreement/);
assert.match(wordListHtml, /href="explore\.html"/);
assert.match(grammarHtml, /href="explore\.html"/);
assert.match(exploreHtml, /id="family-network"/);
assert.match(exploreHtml, /id="family-atlas"/);
assert.match(exploreHtml, /data-explore-view="atlas"/);
assert.match(exploreHtml, /data-explore-view="family"/);
assert.match(exploreHtml, /data-explore-view="ribbons"/);
assert.match(exploreHtml, /data-explore-view="rings"/);
assert.match(exploreHtml, /data-explore-view="landscape"/);
assert.match(exploreHtml, /data-network-labels/);
assert.match(exploreHtml, /src="explore\.js"/);
assert.match(exploreHtml, /Recorded base/);
await assert.rejects(readFile(resolve(root, "dictionary-lab.html"), "utf8"));

console.log("Frontend smoke test passed: dictionary layouts, Word list, Grammar guide, five-view Explore lab, deep links, and lazy loading are functional.");
