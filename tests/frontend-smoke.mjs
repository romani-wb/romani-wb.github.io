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
]);
const spellingButtons = [new ElementStub({ spelling: "int" }), new ElementStub({ spelling: "deu" })];
const languageButtons = [new ElementStub({ language: "de" }), new ElementStub({ language: "en" })];

globalThis.document = {
  querySelector: (selector) => elements.get(selector),
  querySelectorAll: (selector) => (
    selector === "[data-spelling]" ? spellingButtons : languageButtons
  ),
};

const startUrl = new URL(
  "http://localhost/?entry=g04363_b4e42bdd&q=habrin&spelling=deu&meaning=en",
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
assert.match(elements.get("#entry-pane").innerHTML, /Provisional/);
assert.match(elements.get("#entry-pane").innerHTML, /https:\/\/de\.langenscheidt\.com/);
assert.equal(elements.get("#search-input").value, "habrin");
assert.match(window.location.href, /entry=g04363_b4e42bdd/);

console.log("Frontend smoke test passed: deep link and lazy chunk loading are functional.");
