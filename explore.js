import { WORD_TYPE_GROUPS, wordClassLabel, wordTypeGroup } from "./word-types.js";

const DATA_URL = "data/processed/entries_search.json";
const VIEWBOX = { width: 1000, height: 650 };
const ATLAS_FAMILIES_PER_TYPE = 42;
const TYPE_COLORS = {
  nouns: "#286759",
  verbs: "#b26933",
  adjectives: "#3e6d8c",
  adverbs: "#887640",
  phrases: "#76598a",
  grammar: "#925262",
  other: "#68736e",
};

export function normalizeFamilyKey(value) {
  return String(value || "").normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function normalizeSearch(value) {
  return normalizeFamilyKey(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function buildFamilyIndex(entries) {
  const families = new Map();
  entries.forEach((entry) => {
    const key = normalizeFamilyKey(entry.base_int || entry.roman_int || entry.base_deu || entry.roman_deu);
    if (!key) return;
    if (!families.has(key)) {
      families.set(key, {
        key,
        base_int: entry.base_int || entry.roman_int,
        base_deu: entry.base_deu || entry.roman_deu,
        entries: [],
      });
    }
    families.get(key).entries.push(entry);
  });
  return families;
}

export function createNetworkLayout(family, activeType = "all") {
  const entries = family.entries.filter((entry) => activeType === "all" || wordTypeGroup(entry).key === activeType);
  const groups = WORD_TYPE_GROUPS
    .map((definition) => ({ ...definition, entries: entries.filter((entry) => wordTypeGroup(entry).key === definition.key) }))
    .filter((group) => group.entries.length);
  const root = { x: VIEWBOX.width / 2, y: VIEWBOX.height / 2 };
  const weightTotal = groups.reduce((sum, group) => sum + Math.max(3, group.entries.length), 0) || 1;
  let angleCursor = -Math.PI / 2;
  const nodes = [];
  const edges = [];

  groups.forEach((group) => {
    const sector = Math.PI * 2 * Math.max(3, group.entries.length) / weightTotal;
    const centerAngle = angleCursor + sector / 2;
    const hub = {
      id: `type:${group.key}`,
      kind: "type",
      group: group.key,
      label: group.label,
      count: group.entries.length,
      x: root.x + Math.cos(centerAngle) * 128,
      y: root.y + Math.sin(centerAngle) * 128,
    };
    nodes.push(hub);
    edges.push({ from: root, to: hub, kind: "type" });

    group.entries.forEach((entry, index) => {
      const ring = Math.floor(index / 18);
      const ringStart = ring * 18;
      const inRing = index - ringStart;
      const ringCount = Math.min(18, group.entries.length - ringStart);
      const padding = Math.min(.11, sector * .12);
      const entryAngle = ringCount === 1
        ? centerAngle
        : angleCursor + padding + (sector - padding * 2) * (inRing / (ringCount - 1));
      const radius = 220 + ring * 52;
      const node = {
        id: entry.id,
        kind: "entry",
        group: group.key,
        entry,
        x: root.x + Math.cos(entryAngle) * radius,
        y: root.y + Math.sin(entryAngle) * radius,
      };
      nodes.push(node);
      edges.push({ from: hub, to: node, kind: "entry" });
    });
    angleCursor += sector;
  });

  return { root, nodes, edges, groups, entries };
}

export function familyTypeProfile(family) {
  const counts = Object.fromEntries(WORD_TYPE_GROUPS.map((group) => [group.key, 0]));
  family.entries.forEach((entry) => {
    const key = wordTypeGroup(entry).key;
    counts[key] = (counts[key] || 0) + 1;
  });
  const dominantType = WORD_TYPE_GROUPS.reduce((best, group) => (
    counts[group.key] > counts[best] ? group.key : best
  ), WORD_TYPE_GROUPS[0].key);
  return { counts, dominantType };
}

export function createAtlasFamilies(families, perType = ATLAS_FAMILIES_PER_TYPE) {
  const source = families instanceof Map ? [...families.values()] : [...families];
  const grouped = new Map(WORD_TYPE_GROUPS.map((group) => [group.key, []]));
  source.filter((family) => family.entries.length > 1).forEach((family) => {
    const profile = familyTypeProfile(family);
    grouped.get(profile.dominantType).push({ family, ...profile });
  });
  return WORD_TYPE_GROUPS.flatMap((group) => grouped.get(group.key)
    .sort((a, b) => b.family.entries.length - a.family.entries.length || a.family.key.localeCompare(b.family.key))
    .slice(0, perType));
}

export function createAtlasLayout(atlasFamilies, width = 1000, height = 650) {
  const grouped = WORD_TYPE_GROUPS
    .map((group) => ({ ...group, families: atlasFamilies.filter((item) => item.dominantType === group.key) }))
    .filter((group) => group.families.length);
  const columns = grouped.length <= 1 ? 1 : grouped.length <= 4 ? 2 : 3;
  const rows = Math.ceil(grouped.length / columns);
  const outerX = Math.max(22, width * .035);
  const outerY = Math.max(28, height * .055);
  const cellWidth = (width - outerX * 2) / columns;
  const cellHeight = (height - outerY * 2) / rows;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const nodes = [];
  const clusters = [];

  grouped.forEach((group, groupIndex) => {
    const column = groupIndex % columns;
    const row = Math.floor(groupIndex / columns);
    const bounds = {
      x: outerX + column * cellWidth,
      y: outerY + row * cellHeight,
      width: cellWidth,
      height: cellHeight,
    };
    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 + 8 };
    const placed = [];
    clusters.push({ key: group.key, label: group.label, count: group.families.length, bounds, center });

    group.families.forEach((item, familyIndex) => {
      let radius = Math.min(20, 3.8 + Math.sqrt(item.family.entries.length) * 1.72);
      let position = null;
      for (let shrink = 0; shrink < 3 && !position; shrink += 1) {
        for (let attempt = 0; attempt < 1800; attempt += 1) {
          const distance = attempt === 0 ? 0 : Math.sqrt(attempt) * 4.05;
          const angle = (attempt + familyIndex * 7) * goldenAngle;
          const candidate = {
            x: center.x + Math.cos(angle) * distance,
            y: center.y + Math.sin(angle) * distance * .76,
          };
          const inside = candidate.x - radius >= bounds.x + 9
            && candidate.x + radius <= bounds.x + bounds.width - 9
            && candidate.y - radius >= bounds.y + 28
            && candidate.y + radius <= bounds.y + bounds.height - 8;
          const clear = placed.every((node) => Math.hypot(candidate.x - node.x, candidate.y - node.y) >= radius + node.radius + 2.2);
          if (inside && clear) {
            position = candidate;
            break;
          }
        }
        if (!position) radius *= .84;
      }
      if (!position) position = { x: center.x, y: center.y };
      const node = { ...item, group: group.key, radius, x: position.x, y: position.y };
      placed.push(node);
      nodes.push(node);
    });
  });

  return { nodes, clusters, width, height };
}

export function createRibbonLayout(family, activeType = "all", width = 1000, height = 650) {
  const entries = family.entries.filter((entry) => activeType === "all" || wordTypeGroup(entry).key === activeType);
  const groups = WORD_TYPE_GROUPS
    .map((definition) => ({ ...definition, entries: entries.filter((entry) => wordTypeGroup(entry).key === definition.key) }))
    .filter((group) => group.entries.length);
  const root = { x: 105, y: height / 2 };
  const weightTotal = groups.reduce((sum, group) => sum + Math.max(3, group.entries.length), 0) || 1;
  const availableHeight = height - 94;
  let cursor = 47;
  const nodes = [];
  const edges = [];

  groups.forEach((group) => {
    const bandHeight = availableHeight * Math.max(3, group.entries.length) / weightTotal;
    const hub = { id: `type:${group.key}`, kind: "type", group: group.key, label: group.label, count: group.entries.length, x: width * .42, y: cursor + bandHeight / 2, bandHeight };
    nodes.push(hub);
    edges.push({ from: root, to: hub, kind: "type", weight: group.entries.length });
    group.entries.forEach((entry, index) => {
      const spacing = bandHeight / Math.max(1, group.entries.length);
      const node = { id: entry.id, kind: "entry", group: group.key, entry, x: width * .79 + (index % 2) * 34, y: cursor + spacing * (index + .5) };
      nodes.push(node);
      edges.push({ from: hub, to: node, kind: "entry", weight: 1 });
    });
    cursor += bandHeight;
  });

  return { root, nodes, edges, groups, entries, width, height };
}

export function createRingLayout(family, activeType = "all") {
  const entries = family.entries.filter((entry) => activeType === "all" || wordTypeGroup(entry).key === activeType);
  const groups = WORD_TYPE_GROUPS
    .map((definition) => ({ ...definition, entries: entries.filter((entry) => wordTypeGroup(entry).key === definition.key) }))
    .filter((group) => group.entries.length);
  const total = entries.length || 1;
  let cursor = -Math.PI / 2;
  const groupArcs = [];
  const entryArcs = [];

  groups.forEach((group) => {
    const span = Math.PI * 2 * group.entries.length / total;
    const gap = Math.min(.025, span * .08);
    const groupArc = { group: group.key, label: group.label, count: group.entries.length, start: cursor + gap, end: cursor + span - gap };
    groupArcs.push(groupArc);
    group.entries.forEach((entry, index) => {
      const entrySpan = span / group.entries.length;
      const entryGap = Math.min(.012, entrySpan * .14);
      entryArcs.push({ group: group.key, entry, start: cursor + index * entrySpan + entryGap, end: cursor + (index + 1) * entrySpan - entryGap });
    });
    cursor += span;
  });

  return { groups: groupArcs, entries: entryArcs, total };
}

function stableFraction(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export function createLandscapeLayout(families, width = 1000, height = 650, activeType = "all") {
  const visible = families.filter((item) => activeType === "all" || item.dominantType === activeType);
  const groups = WORD_TYPE_GROUPS
    .map((group) => ({ ...group, families: visible.filter((item) => item.dominantType === group.key) }))
    .filter((group) => group.families.length);
  const margin = { top: 42, right: 27, bottom: 48, left: 88 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const laneHeight = innerHeight / Math.max(1, groups.length);
  const maxSize = Math.max(2, ...visible.map((item) => item.family.entries.length));
  const logMin = Math.log(2);
  const logMax = Math.log(maxSize);
  const xForSize = (size) => margin.left + ((Math.log(Math.max(2, size)) - logMin) / Math.max(.001, logMax - logMin)) * innerWidth;
  const lanes = [];
  const nodes = [];

  groups.forEach((group, index) => {
    const y = margin.top + laneHeight * (index + .5);
    lanes.push({ key: group.key, label: group.label, count: group.families.length, y, height: laneHeight });
    group.families.forEach((item) => {
      const jitter = (stableFraction(item.family.key) - .5) * laneHeight * .62;
      nodes.push({ ...item, group: group.key, x: xForSize(item.family.entries.length), y: y + jitter, radius: Math.min(7, 2.2 + Math.sqrt(item.family.entries.length) * .54) });
    });
  });

  const ticks = [2, 3, 5, 10, 20, 40, maxSize].filter((value, index, values) => value <= maxSize && values.indexOf(value) === index).map((value) => ({ value, x: xForSize(value) }));
  return { nodes, lanes, ticks, maxSize, width, height, margin };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function truncate(value, length = 18) {
  const text = String(value || "");
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function initExplorer() {
  const els = {
    stats: document.querySelector("#explore-stats"),
    search: document.querySelector("#family-search"),
    suggestions: document.querySelector("#family-suggestions"),
    random: document.querySelector("#random-family"),
    featured: document.querySelector("#featured-families"),
    viewSwitch: document.querySelector("#visualization-switch"),
    viewButtons: [...document.querySelectorAll("[data-explore-view]")],
    visualizationEyebrow: document.querySelector("#visualization-eyebrow"),
    title: document.querySelector("#family-title"),
    summary: document.querySelector("#family-summary"),
    typeFilters: document.querySelector("#type-filters"),
    atlas: document.querySelector("#family-atlas"),
    svg: document.querySelector("#family-network"),
    viewport: document.querySelector("#network-viewport"),
    description: document.querySelector("#network-description"),
    frame: document.querySelector("#network-frame"),
    tooltip: document.querySelector("#network-tooltip"),
    networkTools: document.querySelector("#network-tools"),
    networkHelp: document.querySelector("#network-help"),
    networkLegend: document.querySelector("#network-legend"),
    inspector: document.querySelector("#word-inspector"),
    membersSection: document.querySelector("#family-members"),
    members: document.querySelector("#member-grid"),
    memberStatus: document.querySelector("#member-status"),
    status: document.querySelector("#explore-status"),
    spellingButtons: [...document.querySelectorAll("[data-explore-spelling]")],
    languageButtons: [...document.querySelectorAll("[data-explore-language]")],
    zoomButtons: [...document.querySelectorAll("[data-network-zoom]")],
    labelButton: document.querySelector("[data-network-labels]"),
  };

  const collator = new Intl.Collator(["rom", "de", "en"], { sensitivity: "base" });
  const state = {
    entries: [],
    families: new Map(),
    featured: [],
    atlasFamilies: [],
    landscapeFamilies: [],
    canvasLayout: null,
    family: null,
    selectedId: null,
    activeType: "all",
    spelling: "int",
    language: "de",
    view: "atlas",
    showLabels: false,
    zoom: 1,
  };

  const displayLemma = (entry) => entry?.[state.spelling === "deu" ? "roman_deu" : "roman_int"] || entry?.roman_int || entry?.roman_deu || "—";
  const alternateLemma = (entry) => entry?.[state.spelling === "deu" ? "roman_int" : "roman_deu"] || "";
  const displayBase = (family = state.family) => family?.[state.spelling === "deu" ? "base_deu" : "base_int"] || family?.base_int || family?.base_deu || "—";
  const displayMeaning = (entry) => {
    const primary = entry?.[state.language] || [];
    const fallback = entry?.[state.language === "en" ? "de" : "en"] || [];
    return (primary.length ? primary : fallback).filter(Boolean).join("; ");
  };

  function applyUrlState() {
    const params = new URL(window.location.href).searchParams;
    state.spelling = ["int", "deu"].includes(params.get("spelling")) ? params.get("spelling") : "int";
    state.language = ["de", "en"].includes(params.get("meaning")) ? params.get("meaning") : "de";
    state.view = ["family", "ribbons", "rings", "landscape"].includes(params.get("view")) ? params.get("view") : "atlas";
    const requestedFamily = normalizeFamilyKey(params.get("family"));
    state.family = state.families.get(requestedFamily) || state.featured[0] || [...state.families.values()][0];
    const requestedEntry = params.get("entry");
    state.selectedId = state.family?.entries.some((entry) => entry.id === requestedEntry)
      ? requestedEntry
      : preferredEntry(state.family)?.id || null;
    const requestedType = params.get("type");
    state.activeType = ["all", ...WORD_TYPE_GROUPS.map((group) => group.key)].includes(requestedType) ? requestedType : "all";
    if (state.activeType !== "all" && wordTypeGroup(state.family?.entries.find((entry) => entry.id === state.selectedId)).key !== state.activeType) {
      state.selectedId = state.family?.entries.find((entry) => wordTypeGroup(entry).key === state.activeType)?.id || state.selectedId;
    }
  }

  function syncUrl() {
    if (!state.family) return;
    const url = new URL(window.location.href);
    url.searchParams.set("family", state.family.key);
    state.selectedId ? url.searchParams.set("entry", state.selectedId) : url.searchParams.delete("entry");
    state.activeType === "all" ? url.searchParams.delete("type") : url.searchParams.set("type", state.activeType);
    state.view === "atlas" ? url.searchParams.delete("view") : url.searchParams.set("view", state.view);
    url.searchParams.set("spelling", state.spelling);
    url.searchParams.set("meaning", state.language);
    history.replaceState(null, "", url);
  }

  function preferredEntry(family) {
    if (!family) return null;
    return family.entries.find((entry) => normalizeSearch(entry.roman_int) === normalizeSearch(family.base_int))
      || family.entries.find((entry) => normalizeSearch(entry.roman_deu) === normalizeSearch(family.base_deu))
      || family.entries[0];
  }

  function typeCounts(family = state.family) {
    const counts = new Map();
    family?.entries.forEach((entry) => {
      const key = wordTypeGroup(entry).key;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }

  function renderStats() {
    const multi = [...state.families.values()].filter((family) => family.entries.length > 1).length;
    const values = [state.entries.length, state.families.size, multi];
    [...els.stats.querySelectorAll("dt")].forEach((element, index) => { element.textContent = values[index].toLocaleString(); });
  }

  function renderFeatured() {
    els.featured.innerHTML = state.featured.slice(0, 10).map((family) => `
      <button class="featured-family${family.key === state.family?.key ? " active" : ""}" type="button" data-family-key="${escapeHtml(family.key)}">
        ${escapeHtml(displayBase(family))}<small>${family.entries.length} words</small>
      </button>
    `).join("");
  }

  function renderToggles() {
    els.spellingButtons.forEach((button) => {
      const active = button.dataset.exploreSpelling === state.spelling;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    els.languageButtons.forEach((button) => {
      const active = button.dataset.exploreLanguage === state.language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderViewSwitch() {
    els.viewButtons.forEach((button) => {
      const active = button.dataset.exploreView === state.view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderTypeFilters() {
    if (["atlas", "landscape"].includes(state.view)) {
      const corpusFamilies = state.view === "landscape" ? state.landscapeFamilies : state.atlasFamilies;
      const atlasCounts = new Map(WORD_TYPE_GROUPS.map((group) => [group.key, 0]));
      corpusFamilies.forEach((item) => atlasCounts.set(item.dominantType, (atlasCounts.get(item.dominantType) || 0) + 1));
      const filters = [{ key: "all", label: "All families", count: corpusFamilies.length }, ...WORD_TYPE_GROUPS
        .filter((group) => atlasCounts.get(group.key))
        .map((group) => ({ ...group, count: atlasCounts.get(group.key) }))];
      els.typeFilters.innerHTML = filters.map((filter) => `
        <button class="type-filter${state.activeType === filter.key ? " active" : ""}" type="button" data-type-key="${filter.key}" aria-pressed="${state.activeType === filter.key}" style="--type-color:${TYPE_COLORS[filter.key] || "#17211e"}">
          ${filter.key === "all" ? "" : "<i aria-hidden=\"true\"></i>"}${escapeHtml(filter.label)} · ${filter.count}
        </button>
      `).join("");
      return;
    }
    const counts = typeCounts();
    const filters = [{ key: "all", label: "All", count: state.family.entries.length }, ...WORD_TYPE_GROUPS
      .filter((group) => counts.has(group.key))
      .map((group) => ({ ...group, count: counts.get(group.key) }))];
    els.typeFilters.innerHTML = filters.map((filter) => `
      <button class="type-filter${state.activeType === filter.key ? " active" : ""}" type="button" data-type-key="${filter.key}" aria-pressed="${state.activeType === filter.key}" style="--type-color:${TYPE_COLORS[filter.key] || "#17211e"}">
        ${filter.key === "all" ? "" : "<i aria-hidden=\"true\"></i>"}${escapeHtml(filter.label)} · ${filter.count}
      </button>
    `).join("");
  }

  function renderAtlasInspector() {
    const profile = familyTypeProfile(state.family);
    const dominant = WORD_TYPE_GROUPS.find((group) => group.key === profile.dominantType);
    const composition = WORD_TYPE_GROUPS.filter((group) => profile.counts[group.key]).map((group) => `
      <span title="${escapeHtml(group.label)} · ${profile.counts[group.key]}" style="width:${(profile.counts[group.key] / state.family.entries.length) * 100}%;--type-color:${TYPE_COLORS[group.key]}"></span>
    `).join("");
    els.inspector.innerHTML = `
      <p class="eyebrow">Atlas selection</p>
      <h3 class="inspector-lemma">${escapeHtml(displayBase())}</h3>
      <p class="atlas-family-size">${state.family.entries.length.toLocaleString()} recorded entr${state.family.entries.length === 1 ? "y" : "ies"}</p>
      <div class="atlas-composition" aria-label="Family composition by word type">${composition}</div>
      <dl class="inspector-meta">
        <div><dt>Mostly</dt><dd>${escapeHtml(dominant?.label || "Other")}</dd></div>
        <div><dt>Word types</dt><dd>${Object.values(profile.counts).filter(Boolean).length}</dd></div>
        <div><dt>Atlas rule</dt><dd>Size = family entries</dd></div>
      </dl>
      <button class="atlas-open-family" type="button" data-open-family-web>Open this family web <span aria-hidden="true">→</span></button>
      <div class="atlas-reading-note"><strong>How to read the atlas</strong><span>Every bubble is a recorded base. Colour shows the most common word type in that family; larger bubbles contain more entries.</span></div>
    `;
  }

  function drawAtlas() {
    if (state.view !== "atlas" || els.atlas.hidden) return;
    const canvas = els.atlas;
    const width = Math.max(320, canvas.clientWidth || els.frame.clientWidth || 1000);
    const height = Math.max(470, canvas.clientHeight || 540);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const visibleFamilies = state.atlasFamilies.filter((item) => state.activeType === "all" || item.dominantType === state.activeType);
    state.canvasLayout = createAtlasLayout(visibleFamilies, width, height);

    state.canvasLayout.clusters.forEach((cluster) => {
      const color = TYPE_COLORS[cluster.key] || TYPE_COLORS.other;
      context.save();
      context.globalAlpha = .065;
      context.fillStyle = color;
      context.fillRect(cluster.bounds.x + 4, cluster.bounds.y + 3, cluster.bounds.width - 8, cluster.bounds.height - 6);
      context.restore();
      context.strokeStyle = "rgba(23,33,30,.08)";
      context.lineWidth = 1;
      context.strokeRect(cluster.bounds.x + 4.5, cluster.bounds.y + 3.5, cluster.bounds.width - 9, cluster.bounds.height - 7);
      context.fillStyle = color;
      context.font = "800 10px Inter, system-ui, sans-serif";
      context.textAlign = "left";
      context.textBaseline = "top";
      context.fillText(`${cluster.label.toUpperCase()} · ${cluster.count}`, cluster.bounds.x + 15, cluster.bounds.y + 12);
    });

    state.canvasLayout.nodes.forEach((node) => {
      const color = TYPE_COLORS[node.group] || TYPE_COLORS.other;
      const selected = node.family.key === state.family.key;
      context.save();
      context.beginPath();
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fillStyle = color;
      context.globalAlpha = selected ? 1 : .84;
      context.shadowColor = selected ? "rgba(166,106,37,.34)" : "rgba(23,33,30,.1)";
      context.shadowBlur = selected ? 12 : 4;
      context.fill();
      context.shadowBlur = 0;
      context.globalAlpha = 1;
      context.strokeStyle = selected ? "#a66a25" : "rgba(255,255,255,.9)";
      context.lineWidth = selected ? 4 : 1.5;
      context.stroke();
      if (node.radius >= 11.5) {
        context.fillStyle = "#fff";
        context.font = `${node.radius >= 15 ? 700 : 600} ${Math.max(7, Math.min(10, node.radius * .58))}px Georgia, serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(truncate(displayBase(node.family), node.radius >= 16 ? 9 : 6), node.x, node.y - 1.5);
        context.font = "700 6px Inter, system-ui, sans-serif";
        context.globalAlpha = .74;
        context.fillText(String(node.family.entries.length), node.x, node.y + 7);
      }
      context.restore();
    });
  }

  function drawLandscape() {
    if (state.view !== "landscape" || els.atlas.hidden) return;
    const canvas = els.atlas;
    const width = Math.max(320, canvas.clientWidth || els.frame.clientWidth || 1000);
    const height = Math.max(470, canvas.clientHeight || 540);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    state.canvasLayout = createLandscapeLayout(state.landscapeFamilies, width, height, state.activeType);

    state.canvasLayout.lanes.forEach((lane, index) => {
      const color = TYPE_COLORS[lane.key] || TYPE_COLORS.other;
      context.fillStyle = index % 2 ? "rgba(23,33,30,.018)" : "rgba(255,255,255,.42)";
      context.fillRect(state.canvasLayout.margin.left, lane.y - lane.height / 2, width - state.canvasLayout.margin.left - state.canvasLayout.margin.right, lane.height);
      context.strokeStyle = "rgba(23,33,30,.08)";
      context.beginPath();
      context.moveTo(state.canvasLayout.margin.left, lane.y + lane.height / 2);
      context.lineTo(width - state.canvasLayout.margin.right, lane.y + lane.height / 2);
      context.stroke();
      context.fillStyle = color;
      context.font = "800 9px Inter, system-ui, sans-serif";
      context.textAlign = "right";
      context.textBaseline = "middle";
      context.fillText(`${lane.label} · ${lane.count}`, state.canvasLayout.margin.left - 10, lane.y);
    });

    state.canvasLayout.ticks.forEach((tick) => {
      context.strokeStyle = "rgba(23,33,30,.1)";
      context.beginPath();
      context.moveTo(tick.x, state.canvasLayout.margin.top);
      context.lineTo(tick.x, height - state.canvasLayout.margin.bottom);
      context.stroke();
      context.fillStyle = "#67706b";
      context.font = "700 8px Inter, system-ui, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "top";
      context.fillText(String(tick.value), tick.x, height - state.canvasLayout.margin.bottom + 10);
    });
    context.fillStyle = "#67706b";
    context.font = "800 8px Inter, system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("ENTRIES IN RECORDED FAMILY · LOG SCALE", state.canvasLayout.margin.left + (width - state.canvasLayout.margin.left - state.canvasLayout.margin.right) / 2, height - 15);

    state.canvasLayout.nodes.forEach((node) => {
      const selected = node.family.key === state.family.key;
      context.save();
      context.beginPath();
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fillStyle = TYPE_COLORS[node.group] || TYPE_COLORS.other;
      context.globalAlpha = selected ? 1 : .38;
      context.fill();
      context.globalAlpha = 1;
      context.strokeStyle = selected ? "#a66a25" : "rgba(255,255,255,.55)";
      context.lineWidth = selected ? 3 : 1;
      context.stroke();
      context.restore();
    });
  }

  function drawCorpusChart() {
    if (state.view === "atlas") drawAtlas();
    if (state.view === "landscape") drawLandscape();
  }

  function renderAtlas() {
    els.atlas.hidden = false;
    els.svg.setAttribute("hidden", "");
    els.networkTools.hidden = true;
    els.membersSection.hidden = true;
    els.visualizationEyebrow.textContent = "Corpus overview";
    const visibleCount = state.atlasFamilies.filter((item) => state.activeType === "all" || item.dominantType === state.activeType).length;
    els.title.textContent = "Family atlas";
    els.summary.textContent = `${visibleCount.toLocaleString()} large multi-word families · grouped by dominant word type`;
    els.atlas.setAttribute("aria-label", `${visibleCount} large recorded word families. Bubble size represents entry count and colour represents dominant word type.`);
    els.networkHelp.textContent = "Hover to read a base. Select a bubble to open its family web.";
    els.networkLegend.innerHTML = `<span><i class="legend-atlas-size"></i> Size = family entries</span><span><i class="legend-type"></i> Colour = dominant word type</span><span><i class="legend-selected"></i> Current family</span>`;
    renderAtlasInspector();
    drawCorpusChart();
  }

  function renderLandscape() {
    els.atlas.hidden = false;
    els.svg.setAttribute("hidden", "");
    els.networkTools.hidden = true;
    els.membersSection.hidden = true;
    els.visualizationEyebrow.textContent = "Corpus distribution";
    const visibleCount = state.landscapeFamilies.filter((item) => state.activeType === "all" || item.dominantType === state.activeType).length;
    els.title.textContent = "Size landscape";
    els.summary.textContent = `${visibleCount.toLocaleString()} multi-word families · horizontal position shows family size`;
    els.atlas.setAttribute("aria-label", `${visibleCount} multi-word families arranged in word-type lanes by entry count.`);
    els.networkHelp.textContent = "Hover any dot to read the base. Select it to open the family web.";
    els.networkLegend.innerHTML = `<span><i class="legend-entry"></i> Dot = recorded family</span><span><i class="legend-type"></i> Lane = dominant word type</span><span><i class="legend-selected"></i> Current family</span>`;
    renderAtlasInspector();
    drawCorpusChart();
  }

  function curvedPath(from, to, bend = 16) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const middle = { x: (from.x + to.x) / 2 - dy / distance * bend, y: (from.y + to.y) / 2 + dx / distance * bend };
    return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${middle.x.toFixed(1)} ${middle.y.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
  }

  function ribbonPath(from, to) {
    const delta = (to.x - from.x) * .52;
    return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} C ${(from.x + delta).toFixed(1)} ${from.y.toFixed(1)}, ${(to.x - delta).toFixed(1)} ${to.y.toFixed(1)}, ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
  }

  function polarPoint(cx, cy, radius, angle) {
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  }

  function ringPath(cx, cy, innerRadius, outerRadius, start, end) {
    const outerStart = polarPoint(cx, cy, outerRadius, start);
    const outerEnd = polarPoint(cx, cy, outerRadius, end);
    const innerEnd = polarPoint(cx, cy, innerRadius, end);
    const innerStart = polarPoint(cx, cy, innerRadius, start);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)} A ${outerRadius} ${outerRadius} 0 ${large} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)} L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)} A ${innerRadius} ${innerRadius} 0 ${large} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)} Z`;
  }

  function prepareFamilyChart({ eyebrow, help, legend, labels = false }) {
    els.atlas.hidden = true;
    els.svg.removeAttribute("hidden");
    els.networkTools.hidden = false;
    els.labelButton.hidden = !labels;
    els.labelButton.setAttribute("aria-pressed", String(state.showLabels));
    els.membersSection.hidden = false;
    els.visualizationEyebrow.textContent = eyebrow;
    els.networkHelp.textContent = help;
    els.networkLegend.innerHTML = legend;
    els.svg.setAttribute("class", `${state.view}-chart${state.showLabels ? " labels-visible" : ""}`);
  }

  function bindSvgChartInteractions() {
    els.viewport.querySelectorAll("[data-network-entry]").forEach((node) => {
      const activate = (event) => {
        event.stopPropagation();
        selectEntry(node.dataset.networkEntry);
      };
      node.addEventListener("click", activate);
      if (node.tagName.toLowerCase() !== "button") node.addEventListener("keydown", (event) => {
        if (!["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        activate(event);
      });
    });
    els.viewport.querySelectorAll("[data-network-type]").forEach((node) => {
      const activate = (event) => {
        event.stopPropagation();
        setType(node.dataset.networkType);
      };
      node.addEventListener("click", activate);
      if (node.tagName.toLowerCase() !== "button") node.addEventListener("keydown", (event) => {
        if (!["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        activate(event);
      });
    });
  }

  function renderNetwork() {
    prepareFamilyChart({
      eyebrow: "Recorded base",
      help: "Select a dot to inspect a word. Select a type hub to isolate that branch.",
      legend: `<span><i class="legend-base"></i> Recorded base</span><span><i class="legend-type"></i> Word type hub</span><span><i class="legend-entry"></i> Dictionary entry</span>`,
      labels: true,
    });
    const layout = createNetworkLayout(state.family, state.activeType);
    const selected = state.family.entries.find((entry) => entry.id === state.selectedId);
    const selectedGroup = selected ? wordTypeGroup(selected).key : null;
    const base = displayBase();
    const haloMarkup = layout.nodes.filter((node) => node.kind === "type").map((node) => `<circle class="network-cluster-halo" cx="${node.x.toFixed(1)}" cy="${node.y.toFixed(1)}" r="${Math.min(84, 50 + Math.sqrt(node.count) * 5).toFixed(1)}" style="--type-color:${TYPE_COLORS[node.group] || TYPE_COLORS.other}"></circle>`).join("");
    const edgeMarkup = layout.edges.map((edge) => {
      const active = edge.kind === "entry" ? edge.to.id === state.selectedId : edge.to.group === selectedGroup;
      return `<path class="network-edge ${edge.kind}-edge${active ? " selected-edge" : ""}" d="${curvedPath(edge.from, edge.to, edge.kind === "type" ? 10 : 18)}"></path>`;
    }).join("");
    const nodeMarkup = layout.nodes.map((node) => {
      const color = TYPE_COLORS[node.group] || TYPE_COLORS.other;
      if (node.kind === "type") {
        return `<g class="network-node type-node" transform="translate(${node.x.toFixed(1)} ${node.y.toFixed(1)})" style="--type-color:${color}">
          <foreignObject x="-24" y="-24" width="48" height="48"><button xmlns="http://www.w3.org/1999/xhtml" class="network-dot type-dot" type="button" data-network-type="${node.group}" aria-label="Show ${escapeXml(node.label)} only">${node.count}</button></foreignObject>
          <text class="type-label" text-anchor="middle" y="37">${escapeXml(node.label)}</text>
        </g>`;
      }
      const lemma = displayLemma(node.entry);
      const isBase = normalizeFamilyKey(node.entry.roman_int) === state.family.key;
      const dotSize = isBase ? 22 : 16;
      return `<g class="network-node entry-node${node.entry.id === state.selectedId ? " selected" : ""}${isBase ? " base-entry" : ""}${selectedGroup && node.group !== selectedGroup ? " subdued" : ""}" transform="translate(${node.x.toFixed(1)} ${node.y.toFixed(1)})" style="--type-color:${color}">
        <foreignObject x="${-dotSize / 2}" y="${-dotSize / 2}" width="${dotSize}" height="${dotSize}"><button xmlns="http://www.w3.org/1999/xhtml" class="network-dot entry-dot" type="button" data-network-entry="${node.entry.id}" aria-label="Inspect ${escapeXml(lemma)}"></button></foreignObject>
        <text class="entry-label" text-anchor="middle" y="-13">${escapeXml(truncate(lemma))}</text>
      </g>`;
    }).join("");
    const rootMarkup = `<g class="network-node base-node" transform="translate(${layout.root.x} ${layout.root.y})"><circle r="49"></circle><text text-anchor="middle" dominant-baseline="central">${escapeXml(truncate(base, 13))}</text></g>`;
    els.viewport.innerHTML = `${haloMarkup}${edgeMarkup}${rootMarkup}${nodeMarkup}`;
    bindSvgChartInteractions();
    const typeLabel = state.activeType === "all" ? "all word types" : WORD_TYPE_GROUPS.find((group) => group.key === state.activeType)?.label.toLowerCase();
    els.description.textContent = `${layout.entries.length} entries sharing the recorded base ${base}, arranged through ${layout.groups.length} word-type branches. Showing ${typeLabel}.`;
    els.title.textContent = base;
    els.summary.textContent = `${state.family.entries.length.toLocaleString()} recorded entr${state.family.entries.length === 1 ? "y" : "ies"} · ${typeCounts().size} word type${typeCounts().size === 1 ? "" : "s"}`;
    applyZoom();
    if (selected && !layout.entries.some((entry) => entry.id === selected.id)) renderInspector(selected);
  }

  function renderRibbons() {
    prepareFamilyChart({
      eyebrow: "Formation flow",
      help: "Read left to right: recorded base, broad word type, then individual entries.",
      legend: `<span><i class="legend-base"></i> Recorded base</span><span><i class="legend-type"></i> Width = entries in type</span><span><i class="legend-entry"></i> Select an entry</span>`,
      labels: true,
    });
    const layout = createRibbonLayout(state.family, state.activeType, VIEWBOX.width, VIEWBOX.height);
    const base = displayBase();
    const selected = state.family.entries.find((entry) => entry.id === state.selectedId);
    const selectedGroup = selected ? wordTypeGroup(selected).key : null;
    const columns = `<g class="ribbon-columns"><text x="105" y="28" text-anchor="middle">BASE</text><text x="420" y="28" text-anchor="middle">WORD TYPE</text><text x="810" y="28" text-anchor="middle">DICTIONARY ENTRIES</text></g>`;
    const flows = layout.edges.map((edge) => {
      const group = edge.kind === "type" ? edge.to.group : edge.from.group;
      const active = edge.kind === "entry" ? edge.to.id === state.selectedId : edge.to.group === selectedGroup;
      const width = edge.kind === "type" ? Math.min(25, 3 + edge.weight * .75) : 1.4;
      return `<path class="ribbon-flow ${edge.kind}-flow${active ? " selected-edge" : ""}" d="${ribbonPath(edge.from, edge.to)}" style="--type-color:${TYPE_COLORS[group] || TYPE_COLORS.other};stroke-width:${width}"></path>`;
    }).join("");
    const nodes = layout.nodes.map((node) => {
      const color = TYPE_COLORS[node.group] || TYPE_COLORS.other;
      if (node.kind === "type") return `<g class="network-node type-node ribbon-type-node" transform="translate(${node.x.toFixed(1)} ${node.y.toFixed(1)})" style="--type-color:${color}"><foreignObject x="-24" y="-24" width="48" height="48"><button xmlns="http://www.w3.org/1999/xhtml" class="network-dot type-dot" type="button" data-network-type="${node.group}" aria-label="Show ${escapeXml(node.label)} only">${node.count}</button></foreignObject><text class="type-label" text-anchor="middle" y="37">${escapeXml(node.label)}</text></g>`;
      const lemma = displayLemma(node.entry);
      const isBase = normalizeSearch(node.entry.roman_int) === normalizeSearch(state.family.base_int);
      return `<g class="network-node entry-node ribbon-entry-node${node.entry.id === state.selectedId ? " selected" : ""}${isBase ? " base-entry" : ""}" transform="translate(${node.x.toFixed(1)} ${node.y.toFixed(1)})" style="--type-color:${color}"><foreignObject x="-8" y="-8" width="16" height="16"><button xmlns="http://www.w3.org/1999/xhtml" class="network-dot entry-dot" type="button" data-network-entry="${node.entry.id}" aria-label="Inspect ${escapeXml(lemma)}"></button></foreignObject><text class="entry-label ribbon-entry-label" x="13" y="3">${escapeXml(truncate(lemma, 24))}</text></g>`;
    }).join("");
    const root = `<g class="network-node base-node ribbon-base-node" transform="translate(${layout.root.x} ${layout.root.y})"><circle r="54"></circle><text text-anchor="middle" dominant-baseline="central">${escapeXml(truncate(base, 13))}</text></g>`;
    els.viewport.innerHTML = `${columns}${flows}${root}${nodes}`;
    bindSvgChartInteractions();
    els.title.textContent = base;
    els.summary.textContent = `${layout.entries.length} visible entries · ${layout.groups.length} type channel${layout.groups.length === 1 ? "" : "s"}`;
    els.description.textContent = `A left-to-right flow from the recorded base ${base} through broad word types to ${layout.entries.length} entries.`;
    applyZoom();
  }

  function renderRings() {
    prepareFamilyChart({
      eyebrow: "Family fingerprint",
      help: "The middle ring is word type; the outer ring is individual entries. Select any segment.",
      legend: `<span><i class="legend-base"></i> Centre = recorded base</span><span><i class="legend-type"></i> Middle = word type share</span><span><i class="legend-entry"></i> Outer = entries</span>`,
      labels: false,
    });
    const layout = createRingLayout(state.family, state.activeType);
    const base = displayBase();
    const center = { x: VIEWBOX.width / 2, y: VIEWBOX.height / 2 };
    const groupMarkup = layout.groups.map((arc) => {
      const color = TYPE_COLORS[arc.group] || TYPE_COLORS.other;
      const middle = (arc.start + arc.end) / 2;
      const label = polarPoint(center.x, center.y, 167, middle);
      return `<path class="ring-segment ring-type" tabindex="0" role="button" data-network-type="${arc.group}" aria-label="Show ${escapeXml(arc.label)} only" d="${ringPath(center.x, center.y, 104, 202, arc.start, arc.end)}" style="--type-color:${color}"></path><text class="ring-type-label" x="${label.x.toFixed(1)}" y="${label.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeXml(arc.label)} · ${arc.count}</text>`;
    }).join("");
    const entryMarkup = layout.entries.map((arc) => {
      const color = TYPE_COLORS[arc.group] || TYPE_COLORS.other;
      const selected = arc.entry.id === state.selectedId;
      const middle = (arc.start + arc.end) / 2;
      const label = polarPoint(center.x, center.y, 267, middle);
      return `<path class="ring-segment ring-entry${selected ? " selected" : ""}" tabindex="0" role="button" data-network-entry="${arc.entry.id}" aria-label="Inspect ${escapeXml(displayLemma(arc.entry))}" d="${ringPath(center.x, center.y, 214, 307, arc.start, arc.end)}" style="--type-color:${color}"></path>${selected ? `<text class="ring-selected-label" x="${label.x.toFixed(1)}" y="${label.y.toFixed(1)}" text-anchor="middle">${escapeXml(truncate(displayLemma(arc.entry), 18))}</text>` : ""}`;
    }).join("");
    const root = `<g class="network-node base-node ring-base-node" transform="translate(${center.x} ${center.y})"><circle r="83"></circle><text text-anchor="middle" dominant-baseline="central">${escapeXml(truncate(base, 13))}</text></g>`;
    els.viewport.innerHTML = `${groupMarkup}${entryMarkup}${root}`;
    bindSvgChartInteractions();
    els.title.textContent = base;
    els.summary.textContent = `${layout.total} visible entries · radial share by word type`;
    els.description.textContent = `A radial composition chart for the recorded base ${base}, with broad word types in the middle ring and entries in the outer ring.`;
    applyZoom();
  }

  function renderInspector(entry) {
    if (!entry) {
      els.inspector.innerHTML = `<p class="eyebrow">Selected word</p><div class="inspector-empty">Select any entry in the network or list.</div>`;
      return;
    }
    const group = wordTypeGroup(entry);
    const alternate = alternateLemma(entry);
    const href = `dictionary.html?entry=${encodeURIComponent(entry.id)}&spelling=${state.spelling}&meaning=${state.language}&edition=compact`;
    els.inspector.innerHTML = `
      <p class="eyebrow">Selected word</p>
      <h3 class="inspector-lemma">${escapeHtml(displayLemma(entry))}</h3>
      ${alternate && alternate !== displayLemma(entry) ? `<p class="inspector-alt">${state.spelling === "int" ? "DEU" : "INT"} · ${escapeHtml(alternate)}</p>` : ""}
      <p class="inspector-badge" style="--type-color:${TYPE_COLORS[group.key]}">${escapeHtml(wordClassLabel(entry))}</p>
      <p class="inspector-meaning">${escapeHtml(displayMeaning(entry) || "No meaning supplied.")}</p>
      <dl class="inspector-meta">
        <div><dt>Base</dt><dd>${escapeHtml(displayBase())}</dd></div>
        <div><dt>Family</dt><dd>${state.family.entries.length.toLocaleString()} entries</dd></div>
        <div><dt>Source row</dt><dd>${entry.source_row?.toLocaleString() || "—"}</dd></div>
      </dl>
      <a class="inspector-link" href="${href}">Open full dictionary entry <span aria-hidden="true">→</span></a>
    `;
  }

  function renderMembers() {
    const entries = state.family.entries
      .filter((entry) => state.activeType === "all" || wordTypeGroup(entry).key === state.activeType)
      .sort((a, b) => collator.compare(displayLemma(a), displayLemma(b)));
    els.memberStatus.textContent = `Showing ${entries.length.toLocaleString()} of ${state.family.entries.length.toLocaleString()} family entries`;
    els.members.innerHTML = entries.map((entry) => {
      const group = wordTypeGroup(entry);
      return `<button class="member-card${entry.id === state.selectedId ? " selected" : ""}" type="button" data-member-entry="${entry.id}" style="--type-color:${TYPE_COLORS[group.key]}">
        <strong>${escapeHtml(displayLemma(entry))}</strong><small>${escapeHtml(wordClassLabel(entry))}</small><span>${escapeHtml(displayMeaning(entry))}</span>
      </button>`;
    }).join("");
  }

  function renderFamilyVisualization() {
    if (state.view === "ribbons") renderRibbons();
    else if (state.view === "rings") renderRings();
    else renderNetwork();
  }

  function renderAll() {
    if (!state.family) return;
    renderFeatured();
    renderToggles();
    renderViewSwitch();
    renderTypeFilters();
    if (state.view === "atlas") renderAtlas();
    else if (state.view === "landscape") renderLandscape();
    else {
      renderFamilyVisualization();
      renderInspector(state.family.entries.find((entry) => entry.id === state.selectedId));
      renderMembers();
    }
    syncUrl();
  }

  function selectFamily(key, entryId = null) {
    const family = state.families.get(normalizeFamilyKey(key));
    if (!family) return;
    state.family = family;
    state.selectedId = family.entries.some((entry) => entry.id === entryId) ? entryId : preferredEntry(family)?.id || null;
    state.activeType = "all";
    state.view = "family";
    state.zoom = 1;
    els.tooltip.hidden = true;
    els.search.value = "";
    hideSuggestions();
    renderAll();
  }

  function selectEntry(id) {
    const entry = state.family.entries.find((candidate) => candidate.id === id);
    if (!entry) return;
    state.selectedId = id;
    renderFamilyVisualization();
    renderInspector(entry);
    renderMembers();
    syncUrl();
  }

  function setType(key) {
    state.activeType = key;
    els.tooltip.hidden = true;
    if (["atlas", "landscape"].includes(state.view)) {
      renderTypeFilters();
      if (state.view === "atlas") renderAtlas();
      else renderLandscape();
      syncUrl();
      return;
    }
    const selected = state.family.entries.find((entry) => entry.id === state.selectedId);
    if (key !== "all" && wordTypeGroup(selected).key !== key) {
      state.selectedId = state.family.entries.find((entry) => wordTypeGroup(entry).key === key)?.id || state.selectedId;
    }
    state.zoom = 1;
    renderTypeFilters();
    renderFamilyVisualization();
    renderInspector(state.family.entries.find((entry) => entry.id === state.selectedId));
    renderMembers();
    syncUrl();
  }

  function setView(view) {
    if (!["atlas", "family", "ribbons", "rings", "landscape"].includes(view) || state.view === view) return;
    state.view = view;
    state.activeType = "all";
    state.zoom = 1;
    els.tooltip.hidden = true;
    renderAll();
  }

  function searchMatches(query) {
    const normalized = normalizeSearch(query);
    if (!normalized) return [];
    return state.entries.map((entry) => {
      const lemma = normalizeSearch(displayLemma(entry));
      const alternate = normalizeSearch(alternateLemma(entry));
      const base = normalizeSearch(entry[state.spelling === "deu" ? "base_deu" : "base_int"]);
      const meaning = normalizeSearch([...(entry.de || []), ...(entry.en || [])].join(" "));
      let score = 0;
      if (lemma === normalized) score = 140;
      else if (base === normalized) score = 130;
      else if (lemma.startsWith(normalized)) score = 110;
      else if (base.startsWith(normalized)) score = 100;
      else if (alternate.includes(normalized)) score = 80;
      else if (lemma.includes(normalized)) score = 75;
      else if (meaning.includes(normalized)) score = 45;
      return { entry, score };
    }).filter((match) => match.score).sort((a, b) => b.score - a.score || collator.compare(displayLemma(a.entry), displayLemma(b.entry))).slice(0, 8);
  }

  function renderSuggestions() {
    const matches = searchMatches(els.search.value);
    if (!matches.length) {
      hideSuggestions();
      return;
    }
    els.suggestions.innerHTML = matches.map(({ entry }) => {
      const family = state.families.get(normalizeFamilyKey(entry.base_int || entry.roman_int));
      return `<button class="family-suggestion" type="button" role="option" data-suggestion-entry="${entry.id}" data-suggestion-family="${escapeHtml(family?.key || "")}">
        <strong>${escapeHtml(displayLemma(entry))}</strong><small>${family?.entries.length || 1} in family</small><span>${escapeHtml(displayMeaning(entry))}</span>
      </button>`;
    }).join("");
    els.suggestions.hidden = false;
    els.search.setAttribute("aria-expanded", "true");
  }

  function hideSuggestions() {
    els.suggestions.hidden = true;
    els.search.setAttribute("aria-expanded", "false");
  }

  function applyZoom() {
    const width = VIEWBOX.width / state.zoom;
    const height = VIEWBOX.height / state.zoom;
    els.svg.setAttribute("viewBox", `${(VIEWBOX.width - width) / 2} ${(VIEWBOX.height - height) / 2} ${width} ${height}`);
  }

  function showTooltip(entry, event) {
    els.tooltip.innerHTML = `<strong>${escapeHtml(displayLemma(entry))}</strong><span>${escapeHtml(wordClassLabel(entry))} · ${escapeHtml(displayMeaning(entry))}</span>`;
    const frame = els.frame.getBoundingClientRect();
    els.tooltip.style.left = `${Math.max(8, Math.min(frame.width - 270, event.clientX - frame.left + 12))}px`;
    els.tooltip.style.top = `${Math.max(8, Math.min(frame.height - 90, event.clientY - frame.top + 12))}px`;
    els.tooltip.hidden = false;
  }

  function atlasNodeAt(event) {
    if (!state.canvasLayout) return null;
    const bounds = els.atlas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    return [...state.canvasLayout.nodes].reverse().find((node) => Math.hypot(x - node.x, y - node.y) <= node.radius + 3) || null;
  }

  function showAtlasTooltip(node, event) {
    const group = WORD_TYPE_GROUPS.find((definition) => definition.key === node.dominantType);
    els.tooltip.innerHTML = `<strong>${escapeHtml(displayBase(node.family))}</strong><span>${node.family.entries.length.toLocaleString()} entries · mostly ${escapeHtml(group?.label || "Other")}</span>`;
    const frame = els.frame.getBoundingClientRect();
    els.tooltip.style.left = `${Math.max(8, Math.min(frame.width - 270, event.clientX - frame.left + 12))}px`;
    els.tooltip.style.top = `${Math.max(8, Math.min(frame.height - 90, event.clientY - frame.top + 12))}px`;
    els.tooltip.hidden = false;
  }

  els.search.addEventListener("input", renderSuggestions);
  els.search.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const match = searchMatches(els.search.value)[0];
    if (match) selectFamily(match.entry.base_int || match.entry.roman_int, match.entry.id);
  });
  els.suggestions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-suggestion-family]");
    if (button) selectFamily(button.dataset.suggestionFamily, button.dataset.suggestionEntry);
  });
  els.random.addEventListener("click", () => {
    const candidates = [...state.families.values()].filter((family) => family.entries.length >= 4);
    const family = candidates[Math.floor(Math.random() * candidates.length)];
    if (family) selectFamily(family.key);
  });
  els.featured.addEventListener("click", (event) => {
    const button = event.target.closest("[data-family-key]");
    if (button) selectFamily(button.dataset.familyKey);
  });
  els.viewSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-explore-view]");
    if (button) setView(button.dataset.exploreView);
  });
  els.typeFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-type-key]");
    if (button) setType(button.dataset.typeKey);
  });
  els.viewport.addEventListener("pointerover", (event) => {
    const node = event.target.closest("[data-network-entry]");
    const entry = node && state.family.entries.find((candidate) => candidate.id === node.dataset.networkEntry);
    if (entry) showTooltip(entry, event);
  });
  els.viewport.addEventListener("pointermove", (event) => {
    const node = event.target.closest("[data-network-entry]");
    const entry = node && state.family.entries.find((candidate) => candidate.id === node.dataset.networkEntry);
    if (!els.tooltip.hidden && entry) showTooltip(entry, event);
  });
  els.viewport.addEventListener("pointerout", (event) => {
    if (event.target.closest("[data-network-entry]")) els.tooltip.hidden = true;
  });
  els.atlas.addEventListener("pointermove", (event) => {
    const node = atlasNodeAt(event);
    els.atlas.style.cursor = node ? "pointer" : "default";
    if (node) showAtlasTooltip(node, event);
    else els.tooltip.hidden = true;
  });
  els.atlas.addEventListener("pointerleave", () => { els.tooltip.hidden = true; });
  els.atlas.addEventListener("click", (event) => {
    const node = atlasNodeAt(event);
    if (node) selectFamily(node.family.key);
  });
  els.inspector.addEventListener("click", (event) => {
    if (event.target.closest("[data-open-family-web]")) setView("family");
  });
  els.members.addEventListener("click", (event) => {
    const button = event.target.closest("[data-member-entry]");
    if (button) selectEntry(button.dataset.memberEntry);
  });
  els.spellingButtons.forEach((button) => button.addEventListener("click", () => { state.spelling = button.dataset.exploreSpelling; renderAll(); }));
  els.languageButtons.forEach((button) => button.addEventListener("click", () => { state.language = button.dataset.exploreLanguage; renderAll(); }));
  els.zoomButtons.forEach((button) => button.addEventListener("click", () => {
    const action = button.dataset.networkZoom;
    state.zoom = action === "reset" ? 1 : Math.max(.75, Math.min(1.8, state.zoom + (action === "in" ? .2 : -.2)));
    applyZoom();
  }));
  els.labelButton.addEventListener("click", () => {
    state.showLabels = !state.showLabels;
    renderFamilyVisualization();
    els.labelButton.setAttribute("aria-pressed", String(state.showLabels));
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".family-search-wrap")) hideSuggestions();
  });
  window.addEventListener("popstate", () => { applyUrlState(); renderAll(); });

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      if (["atlas", "landscape"].includes(state.view)) drawCorpusChart();
    }).observe(els.frame);
  }

  fetch(DATA_URL)
    .then((response) => {
      if (!response.ok) throw new Error("Could not load dictionary relationships.");
      return response.json();
    })
    .then((entries) => {
      state.entries = entries;
      state.families = buildFamilyIndex(entries);
      state.featured = [...state.families.values()].filter((family) => family.entries.length > 1).sort((a, b) => b.entries.length - a.entries.length || collator.compare(a.base_int, b.base_int));
      state.atlasFamilies = createAtlasFamilies(state.families);
      state.landscapeFamilies = createAtlasFamilies(state.families, Number.MAX_SAFE_INTEGER);
      applyUrlState();
      renderStats();
      renderAll();
      els.status.textContent = "Connections use the source workbook’s recorded base fields. Generated morphology and inferred semantic similarity are not used here.";
    })
    .catch((error) => {
      els.status.textContent = error.message;
      els.title.textContent = "The family map could not be loaded";
    });
}

if (typeof document !== "undefined" && document.querySelector("#family-network")) initExplorer();
