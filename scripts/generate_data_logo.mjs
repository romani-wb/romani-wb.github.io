import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));

const entries = readJson("data/processed/entries_search.json");
const summary = readJson("data/processed/summary.json");
const manifest = readJson("data/processed/entries_manifest.json");
const validation = readJson("data/processed/reports/validation_summary.json");

const colors = {
  nouns: "#286759",
  verbs: "#b26933",
  adjectives: "#3e6d8c",
  adverbs: "#887640",
  function: "#925262",
  other: "#68736e",
};

const groupLabels = {
  nouns: "nouns and names",
  verbs: "verbs and verb particles",
  adjectives: "adjectives",
  adverbs: "adverbs",
  function: "function words",
  other: "other / source anomaly",
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripMarks(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function firstAsciiLetter(value) {
  for (const char of stripMarks(value)) {
    if (char >= "a" && char <= "z") return char;
  }
  return "";
}

function classGroup(wordClass) {
  if (wordClass === "N" || wordClass === "NP") return "nouns";
  if (wordClass === "V" || wordClass === "VP" || wordClass === "PTCLV" || wordClass === "PREFV") return "verbs";
  if (wordClass === "ADJ") return "adjectives";
  if (wordClass === "ADV") return "adverbs";
  if (["ART", "CONJ", "INTERJ", "NUM", "PREF", "PREP", "PRON", "PTCL"].includes(wordClass)) return "function";
  return "other";
}

function hashRatio(value) {
  let hash = 2166136261;
  const input = String(value);
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

const initialBuckets = new Map();
const initialCounts = new Map();
const groupCounts = new Map(Object.keys(colors).map((key) => [key, 0]));

for (const entry of entries) {
  const initial = firstAsciiLetter(entry.roman_int);
  const group = classGroup(entry.word_class);
  initialCounts.set(initial, (initialCounts.get(initial) || 0) + 1);
  groupCounts.set(group, (groupCounts.get(group) || 0) + 1);
  if (!initialBuckets.has(initial)) initialBuckets.set(initial, []);
  initialBuckets.get(initial).push(entry);
}

const wordmark = ["R", "O", "M", "A", "N", "-", "V", "P"];
const letterInitials = wordmark.filter((char) => char !== "-").map((char) => char.toLowerCase());
const maxLetterCount = Math.max(...letterInitials.map((initial) => initialCounts.get(initial) || 0));

const letterBoxes = [];
let cursorX = 54;
for (const char of wordmark) {
  const width = char === "-" ? 58 : 118;
  letterBoxes.push({ char, x: cursorX, y: 54, width, height: 150 });
  cursorX += width + (char === "-" ? 15 : 11);
}

function letterMaskDefs() {
  return letterBoxes
    .filter((box) => box.char !== "-")
    .map((box, index) => {
      const cx = box.x + box.width / 2;
      return `<mask id="letter-mask-${index}" maskUnits="userSpaceOnUse" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}">
      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="black"/>
      <text x="${cx}" y="${box.y + 124}" text-anchor="middle" class="logo-letter-mask">${box.char}</text>
    </mask>`;
    })
    .join("\n    ");
}

function letterHeatmap(box, index) {
  const initial = box.char.toLowerCase();
  const bucket = initialBuckets.get(initial) || [];
  const count = initialCounts.get(initial) || 0;
  const density = 0.36 + 0.64 * (count / maxLetterCount);
  const cell = 7;
  const gap = 2;
  const cols = Math.floor(box.width / (cell + gap));
  const rows = Math.floor(box.height / (cell + gap));
  const xOffset = box.x + (box.width - cols * (cell + gap) + gap) / 2;
  const yOffset = box.y + (box.height - rows * (cell + gap) + gap) / 2;
  const rects = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const key = `${initial}:${row}:${col}`;
      const active = hashRatio(`${key}:active`) < density;
      const entryIndex = bucket.length ? Math.floor(hashRatio(`${key}:entry`) * bucket.length) : 0;
      const entry = bucket[entryIndex];
      const group = entry ? classGroup(entry.word_class) : "other";
      const fill = active ? colors[group] : "#ded8cc";
      const opacity = active
        ? (0.58 + 0.34 * hashRatio(`${key}:opacity`)).toFixed(3)
        : "0.22";
      const radius = active ? 1.4 : 0.8;
      rects.push(`<rect x="${(xOffset + col * (cell + gap)).toFixed(1)}" y="${(yOffset + row * (cell + gap)).toFixed(1)}" width="${cell}" height="${cell}" rx="${radius}" fill="${fill}" opacity="${opacity}"/>`);
    }
  }

  return `<g mask="url(#letter-mask-${index})">${rects.join("\n      ")}</g>
    <text x="${box.x + box.width / 2}" y="${box.y + 124}" text-anchor="middle" class="logo-letter-outline">${box.char}</text>
    <text x="${box.x + box.width / 2}" y="${box.y + 173}" text-anchor="middle" class="initial-count">${box.char} ${count.toLocaleString("en-US")}</text>`;
}

function columnHyphen(box) {
  const cols = 21;
  const cell = 5;
  const gap = 2;
  const startX = box.x + (box.width - cols * (cell + gap) + gap) / 2;
  const rects = [];
  for (let index = 0; index < 42; index += 1) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const fill = index % 3 === 0 ? "#174f42" : index % 3 === 1 ? "#b26933" : "#3e6d8c";
    rects.push(`<rect x="${startX + col * (cell + gap)}" y="${box.y + 60 + row * (cell + gap)}" width="${cell}" height="${cell}" rx="1" fill="${fill}" opacity="0.82"/>`);
  }
  return `<g aria-label="42 source columns encoded as the hyphen">${rects.join("\n      ")}</g>
    <text x="${box.x + box.width / 2}" y="${box.y + 173}" text-anchor="middle" class="initial-count">42 cols</text>`;
}

function groupLegend() {
  const total = entries.length;
  const groups = Object.keys(colors);
  return groups
    .map((group, index) => {
      const x = 54 + index * 154;
      const count = groupCounts.get(group) || 0;
      const pct = ((count / total) * 100).toFixed(1);
      return `<g transform="translate(${x} 259)">
      <rect width="12" height="12" rx="2" fill="${colors[group]}"/>
      <text x="18" y="10" class="legend-label">${escapeXml(groupLabels[group])}</text>
      <text x="18" y="25" class="legend-count">${count.toLocaleString("en-US")} / ${pct}%</text>
    </g>`;
    })
    .join("\n    ");
}

function chunkStripe() {
  const chunks = Object.entries(manifest.chunks);
  const startX = 54;
  const startY = 326;
  const width = 32;
  const gap = 4;
  return chunks
    .map(([chunkId, chunk], index) => {
      const ratio = chunk.count / manifest.chunk_size;
      const height = Math.max(6, Math.round(14 * ratio));
      const fill = index % 2 === 0 ? "#174f42" : "#d9ad70";
      return `<rect x="${startX + index * (width + gap)}" y="${startY + 16 - height}" width="${width}" height="${height}" rx="2" fill="${fill}" opacity="0.72"><title>chunk ${chunkId}: ${chunk.count} entries, rows ${chunk.first_source_row}-${chunk.last_source_row}</title></rect>`;
    })
    .join("\n    ");
}

const generatedCoveragePct = ((summary.entries_with_generated_forms / summary.glossary_entries) * 100).toFixed(1);
const chunkCount = Object.keys(manifest.chunks).length;
const validationText = `${validation.counts_by_severity.error} errors, ${validation.counts_by_severity.warning} warnings, ${validation.counts_by_severity.info} info`;

const body = letterBoxes
  .map((box, visibleIndex) => (box.char === "-" ? columnHyphen(box) : letterHeatmap(box, letterBoxes.slice(0, visibleIndex + 1).filter((item) => item.char !== "-").length - 1)))
  .join("\n    ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 372" role="img" aria-labelledby="title desc">
  <title id="title">Roman-VP data heatmap logo concept</title>
  <desc id="desc">Each letter is filled with heatmap tiles sampled from Roman dictionary entries beginning with that letter. Tile color encodes broad word class. The hyphen encodes the 42 logical workbook columns.</desc>
  <defs>
    <style>
      .logo-letter-mask { font-family: "Arial Black", "Inter", system-ui, sans-serif; font-size: 142px; font-weight: 900; letter-spacing: 0; fill: white; }
      .logo-letter-outline { font-family: "Arial Black", "Inter", system-ui, sans-serif; font-size: 142px; font-weight: 900; letter-spacing: 0; fill: none; stroke: #17211e; stroke-width: 1.4; opacity: .52; pointer-events: none; }
      .initial-count { fill: #5f665f; font-family: "Inter", system-ui, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
      .logo-subtitle { fill: #17211e; font-family: "Inter", system-ui, sans-serif; font-size: 13px; font-weight: 850; letter-spacing: .13em; text-transform: uppercase; }
      .data-note { fill: #646961; font-family: "Inter", system-ui, sans-serif; font-size: 11px; font-weight: 650; }
      .legend-label { fill: #17211e; font-family: "Inter", system-ui, sans-serif; font-size: 10px; font-weight: 800; }
      .legend-count { fill: #646961; font-family: "Inter", system-ui, sans-serif; font-size: 9px; font-weight: 700; }
      .stripe-label { fill: #646961; font-family: "Inter", system-ui, sans-serif; font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    </style>
    ${letterMaskDefs()}
  </defs>
  <text x="54" y="31" class="logo-subtitle">Roman-VP / data heatmap prototype</text>
  <text x="985" y="31" text-anchor="end" class="data-note">${summary.glossary_entries.toLocaleString("en-US")} entries / ${summary.entries_with_generated_forms.toLocaleString("en-US")} generated-form records (${generatedCoveragePct}%)</text>
  <g>
    ${body}
  </g>
  <g aria-label="Word class legend">
    ${groupLegend()}
  </g>
  <text x="54" y="315" class="stripe-label">${chunkCount} deterministic 500-entry chunks</text>
  <text x="985" y="315" text-anchor="end" class="stripe-label">Current validation: ${escapeXml(validationText)}</text>
  <g aria-label="Entry chunk stripe">
    ${chunkStripe()}
  </g>
</svg>
`;

const outputPath = path.join(repoRoot, "assets", "roman-vp-data-logo.svg");
fs.writeFileSync(outputPath, svg, "utf8");
console.log(path.relative(repoRoot, outputPath));
