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
assert.match(elements.get("#results").innerHTML, /Verbs/);
assert.match(elements.get("#results").innerHTML, />Verb</);

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

const homeHtml = await readFile(resolve(root, "index.html"), "utf8");
const dictionaryHtml = await readFile(resolve(root, "dictionary.html"), "utf8");
assert.match(homeHtml, /href="dictionary\.html"/);
assert(!homeHtml.includes("app.js"));
assert.match(dictionaryHtml, /src="app\.js"/);
assert.match(dictionaryHtml, /id="edition-select"/);
assert.match(dictionaryHtml, />Focus</);
assert.match(dictionaryHtml, />Browse</);
assert.match(dictionaryHtml, />Split</);
assert.doesNotMatch(dictionaryHtml, /Compare views/);
assert.doesNotMatch(elements.get("#entry-pane").innerHTML, /New here/);
await assert.rejects(readFile(resolve(root, "dictionary-lab.html"), "utf8"));

console.log("Frontend smoke test passed: search-first layouts, word-type navigation, grammar views, deep links, and lazy loading are functional.");
