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
  };

  const collator = new Intl.Collator(["rom", "de", "en"], { sensitivity: "base" });
  const state = {
    entries: [],
    families: new Map(),
    featured: [],
    atlasFamilies: [],
    atlasLayout: null,
    family: null,
    selectedId: null,
    activeType: "all",
    spelling: "int",
    language: "de",
    view: "atlas",
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
    state.view = params.get("view") === "family" ? "family" : "atlas";
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
    if (state.view === "atlas") {
      const atlasCounts = new Map(WORD_TYPE_GROUPS.map((group) => [group.key, 0]));
      state.atlasFamilies.forEach((item) => atlasCounts.set(item.dominantType, (atlasCounts.get(item.dominantType) || 0) + 1));
      const filters = [{ key: "all", label: "All families", count: state.atlasFamilies.length }, ...WORD_TYPE_GROUPS
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
    state.atlasLayout = createAtlasLayout(visibleFamilies, width, height);

    state.atlasLayout.clusters.forEach((cluster) => {
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

    state.atlasLayout.nodes.forEach((node) => {
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
    drawAtlas();
  }

  function renderNetwork() {
    els.atlas.hidden = true;
    els.svg.removeAttribute("hidden");
    els.networkTools.hidden = false;
    els.membersSection.hidden = false;
    els.visualizationEyebrow.textContent = "Recorded base";
    els.networkHelp.textContent = "Select a dot to inspect a word. Select a type hub to isolate that branch.";
    els.networkLegend.innerHTML = `<span><i class="legend-base"></i> Recorded base</span><span><i class="legend-type"></i> Word type</span><span><i class="legend-entry"></i> Dictionary entry</span>`;
    const layout = createNetworkLayout(state.family, state.activeType);
    const selected = state.family.entries.find((entry) => entry.id === state.selectedId);
    const base = displayBase();
    const edgeMarkup = layout.edges.map((edge) => `<line class="network-edge ${edge.kind}-edge" x1="${edge.from.x.toFixed(1)}" y1="${edge.from.y.toFixed(1)}" x2="${edge.to.x.toFixed(1)}" y2="${edge.to.y.toFixed(1)}"></line>`).join("");
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
      return `<g class="network-node entry-node${node.entry.id === state.selectedId ? " selected" : ""}${isBase ? " base-entry" : ""}" transform="translate(${node.x.toFixed(1)} ${node.y.toFixed(1)})" style="--type-color:${color}">
        <foreignObject x="${-dotSize / 2}" y="${-dotSize / 2}" width="${dotSize}" height="${dotSize}"><button xmlns="http://www.w3.org/1999/xhtml" class="network-dot entry-dot" type="button" data-network-entry="${node.entry.id}" aria-label="Inspect ${escapeXml(lemma)}"></button></foreignObject>
        <text class="entry-label" text-anchor="middle" y="-13">${escapeXml(truncate(lemma))}</text>
      </g>`;
    }).join("");
    const rootMarkup = `<g class="network-node base-node" transform="translate(${layout.root.x} ${layout.root.y})"><circle r="49"></circle><text text-anchor="middle" dominant-baseline="central">${escapeXml(truncate(base, 13))}</text></g>`;
    els.viewport.innerHTML = `${edgeMarkup}${rootMarkup}${nodeMarkup}`;
    els.viewport.querySelectorAll("[data-network-entry]").forEach((node) => node.addEventListener("click", (event) => {
      event.stopPropagation();
      selectEntry(node.dataset.networkEntry);
    }));
    els.viewport.querySelectorAll("[data-network-type]").forEach((node) => node.addEventListener("click", (event) => {
      event.stopPropagation();
      setType(node.dataset.networkType);
    }));
    const typeLabel = state.activeType === "all" ? "all word types" : WORD_TYPE_GROUPS.find((group) => group.key === state.activeType)?.label.toLowerCase();
    els.description.textContent = `${layout.entries.length} entries sharing the recorded base ${base}, arranged through ${layout.groups.length} word-type branches. Showing ${typeLabel}.`;
    els.title.textContent = base;
    els.summary.textContent = `${state.family.entries.length.toLocaleString()} recorded entr${state.family.entries.length === 1 ? "y" : "ies"} · ${typeCounts().size} word type${typeCounts().size === 1 ? "" : "s"}`;
    applyZoom();
    if (selected && !layout.entries.some((entry) => entry.id === selected.id)) renderInspector(selected);
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

  function renderAll() {
    if (!state.family) return;
    renderFeatured();
    renderToggles();
    renderViewSwitch();
    renderTypeFilters();
    if (state.view === "atlas") {
      renderAtlas();
    } else {
      renderNetwork();
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
    renderNetwork();
    renderInspector(entry);
    renderMembers();
    syncUrl();
  }

  function setType(key) {
    state.activeType = key;
    els.tooltip.hidden = true;
    if (state.view === "atlas") {
      renderTypeFilters();
      renderAtlas();
      syncUrl();
      return;
    }
    const selected = state.family.entries.find((entry) => entry.id === state.selectedId);
    if (key !== "all" && wordTypeGroup(selected).key !== key) {
      state.selectedId = state.family.entries.find((entry) => wordTypeGroup(entry).key === key)?.id || state.selectedId;
    }
    state.zoom = 1;
    renderTypeFilters();
    renderNetwork();
    renderInspector(state.family.entries.find((entry) => entry.id === state.selectedId));
    renderMembers();
    syncUrl();
  }

  function setView(view) {
    if (!["atlas", "family"].includes(view) || state.view === view) return;
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
    if (!state.atlasLayout) return null;
    const bounds = els.atlas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    return [...state.atlasLayout.nodes].reverse().find((node) => Math.hypot(x - node.x, y - node.y) <= node.radius + 3) || null;
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
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".family-search-wrap")) hideSuggestions();
  });
  window.addEventListener("popstate", () => { applyUrlState(); renderAll(); });

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      if (state.view === "atlas") drawAtlas();
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
