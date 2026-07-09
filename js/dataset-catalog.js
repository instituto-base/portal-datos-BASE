/* ==========================================================
   dataset-catalog.js — Catálogo unificado de datasets
   Instituto Milenio BASE
   ==========================================================
   Combina, en una sola vista con buscador y filtros:
     1) Datasets publicados en GBIF (API pública)
     2) Datasets publicados en la comunidad Zenodo del instituto (API pública)
     3) Datasets publicados de forma independiente en Figshare / Dryad /
        Zenodo (fuera de la comunidad) — definidos en data/otrosdataset_portal.csv,
        enriquecidos automáticamente con descripción y fecha vía DataCite API.

   CONFIGURACIÓN
   ---------------------------------------------------------- */
const GBIF_PUBLISHING_ORG = "29ef4f00-20db-41f8-b1ad-b5fd3c557c38";
const ZENODO_COMMUNITY = "institutobase";
const CSV_PATH = "data/otrosdataset_portal.csv";

// Categorías oficiales del portal (deben calzar con las del CSV)
const CATEGORIES = [
  "Presencia de especies",
  "Físicoquimica",
  "Ambientales",
  "Checklist",
  "Flujo de trabajo", // fusiona lo que antes era "Otros | Flujos de trabajo"
  "Genéticos",
  "Fisiología",
  "Rasgos morfológicos", // antes "Otros | Rasgos morfológicos"
  "Morfométricos",
  "Scripts",
  "Por clasificar", // bucket para lo que no calza con ninguna categoría anterior
];

// Traducción de etiquetas para mostrar en inglés cuando el idioma activo es "en".
// El valor guardado internamente (para filtrar y comparar con el CSV) sigue
// siendo siempre el texto en español de CATEGORIES; esto solo afecta lo que se
// muestra en pantalla.
const CATEGORY_TRANSLATIONS = {
  "Presencia de especies": "Species occurrence",
  "Físicoquimica": "Physicochemical",
  "Ambientales": "Environmental",
  "Checklist": "Checklist",
  "Flujo de trabajo": "Workflow",
  "Genéticos": "Genetic",
  "Fisiología": "Physiology",
  "Rasgos morfológicos": "Morphological traits",
  "Morfométricos": "Morphometric",
  "Scripts": "Scripts",
  "Por clasificar": "Unclassified",
};

const SOURCE_TRANSLATIONS = {
  Otro: "Other",
};

function translateCategory(cat) {
  const lang = getCurrentLang();
  if (lang === "en" && CATEGORY_TRANSLATIONS[cat]) return CATEGORY_TRANSLATIONS[cat];
  return cat;
}

function translateSource(src) {
  const lang = getCurrentLang();
  if (lang === "en" && SOURCE_TRANSLATIONS[src]) return SOURCE_TRANSLATIONS[src];
  return src;
}

// Se exponen para que otras páginas (ej. recent-datasets.js en index.html)
// puedan mostrar las mismas etiquetas traducidas sin duplicar el diccionario.
window.translateCategory = translateCategory;
window.translateSource = translateSource;

// Mapeo del campo "type" de GBIF a una categoría del portal.
// Ajusta aquí si agregas datasets de otros tipos.
const GBIF_TYPE_TO_CATEGORY = {
  OCCURRENCE: "Presencia de especies",
  SAMPLING_EVENT: "Presencia de especies",
  CHECKLIST: "Checklist",
  METADATA: "Por clasificar",
};

/* ==========================================================
   UTILIDADES
   ========================================================== */

// Parser simple de CSV que soporta campos entre comillas con comas internas.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n" || char === "\r") {
        if (field.length || row.length) {
          row.push(field);
          rows.push(row);
        }
        field = "";
        row = [];
        // saltar \r\n
        if (char === "\r" && next === "\n") i++;
      } else {
        field += char;
      }
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift().map((h) => h.trim().toLowerCase());
  return rows
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => {
      const obj = {};
      headers.forEach((h, idx) => (obj[h] = (r[idx] || "").trim()));
      return obj;
    });
}

function detectSourceFromDoi(doi) {
  const d = doi.toLowerCase();
  if (d.includes("figshare")) return "Figshare";
  if (d.includes("dryad")) return "Dryad";
  if (d.includes("zenodo")) return "Zenodo";
  return "Otro";
}

function stripDoiPrefix(doi) {
  return doi.replace(/^https?:\/\/doi\.org\//i, "").trim();
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return div.textContent || div.innerText || "";
}

// Intenta encontrar una categoría del portal dentro de una lista de keywords.
function matchCategoryFromKeywords(keywords) {
  if (!keywords || !keywords.length) return "Por clasificar";
  const joined = keywords.join(" ").toLowerCase();
  const found = CATEGORIES.find(
    (cat) => cat !== "Por clasificar" && joined.includes(cat.toLowerCase())
  );
  return found || "Por clasificar";
}

// Vocabulario de respaldo: si el título/descripción/keywords contienen alguno
// de estos términos, se asigna la categoría asociada. Se evalúa en orden,
// así que términos más específicos deben ir primero.
// Para agregar nuevos términos, solo suma la palabra (en minúscula) al arreglo correspondiente.
const CATEGORY_VOCABULARY = [
  {
    category: "Genéticos",
    terms: [
      "genbank", "ncbi", "genoma", "genome", "genómic", "genomic",
      "secuencia", "sequence", "dna", "rna", "vcf", "snp", "genotype", "genotipo",
    ],
  },
  {
    category: "Fisiología",
    terms: ["fisiología", "physiology", "metabólic", "metabolic", "hormona", "hormone", "inmune", "stress",
      "responses", "response"
    ],
  },
  {
    category: "Morfométricos",
    terms: ["morfométric", "morphometric", "morfometría", "body size", "tamaño corporal"],
  },
  {
    category: "Físicoquimica",
    terms: ["fisicoquímic", "physicochemical", "salinidad", "salinity", "conductividad", "conductivity", " ph "],
  },
  {
    category: "Ambientales",
    terms: ["ambiental", "environmental", "temperatura", "temperature", "clima", "climate"],
  },
  {
    category: "Checklist",
    terms: ["checklist", "lista de especies", "species list", "listado taxonómico", "taxonomic list"],
  },
  {
    category: "Flujo de trabajo",
    terms: ["workflow", "flujo de trabajo", "protocolo", "protocol", "metodología", "methodology"],
  },
  {
    category: "Scripts",
    terms: ["script", "código", "software", "r package", "paquete de r", "python"],
  },
  {
    category: "Presencia de especies",
    terms: ["occurrence", "ocurrencia", "presencia", "presence", "distribution", "distribución", "avistamiento", "sighting", "tracking", "gps"],
  },
];

function matchCategoryFromVocabulary(text) {
  if (!text) return "Por clasificar";
  const lower = ` ${text.toLowerCase()} `;
  for (const entry of CATEGORY_VOCABULARY) {
    if (entry.terms.some((term) => lower.includes(term))) {
      return entry.category;
    }
  }
  return "Por clasificar";
}

// Decide la categoría de un dataset de Zenodo combinando keywords y,
// si no hay match, el vocabulario aplicado sobre título + descripción.
function resolveZenodoCategory(meta) {
  if (meta.resource_type?.type === "software") return "Scripts";

  const byKeywords = matchCategoryFromKeywords(meta.keywords);
  if (byKeywords !== "Por clasificar") return byKeywords;

  const combinedText = `${meta.title || ""} ${stripHtml(meta.description)} ${(meta.keywords || []).join(" ")}`;
  return matchCategoryFromVocabulary(combinedText);
}

// Tipos de registro de Zenodo que se excluyen por completo del catálogo
// (no son datasets: son libros, pósters o presentaciones).
function isExcludedZenodoRecord(meta) {
  const type = meta.resource_type?.type;
  const subtype = meta.resource_type?.subtype;
  if (type === "poster" || type === "presentation") return true;
  if (type === "publication" && subtype === "book") return true;
  return false;
}

/* ==========================================================
   NORMALIZACIÓN DE FUENTES
   Cada dataset se transforma a un objeto común:
   { id, title, description, doi, url, source, category, date }
   ========================================================== */

async function fetchGBIFDatasets() {
  try {
    const res = await fetch(
      `https://api.gbif.org/v1/dataset/search?publishingOrg=${GBIF_PUBLISHING_ORG}&limit=200`
    );
    const data = await res.json();
    return (data.results || []).map((d) => ({
      id: `gbif-${d.key}`,
      title: d.title,
      description: d.description || "",
      doi: d.doi || "",
      url: `https://www.gbif.org/dataset/${d.key}`,
      source: "GBIF",
      category: GBIF_TYPE_TO_CATEGORY[d.type] || "Por clasificar",
      date: d.pubDate || d.created || null,
    }));
  } catch (err) {
    console.error("Error cargando datasets de GBIF:", err);
    return [];
  }
}

async function fetchZenodoDatasets() {
  const PAGE_SIZE = 25; // límite máximo sin autenticación en la API de Zenodo
  const MAX_PAGES = 20; // salvaguarda: hasta 500 registros
  let allHits = [];

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(
        `https://zenodo.org/api/records/?communities=${ZENODO_COMMUNITY}&size=${PAGE_SIZE}&page=${page}`
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error(`Error cargando página ${page} de Zenodo (status ${res.status}):`, errBody);
        break;
      }

      const data = await res.json();
      const hits = data.hits?.hits || [];
      allHits = allHits.concat(hits);

      // Si esta página trajo menos resultados que el tamaño pedido, ya no hay más páginas.
      if (hits.length < PAGE_SIZE) break;
    }
  } catch (err) {
    console.error("Error cargando datasets de Zenodo:", err);
  }

  return allHits
    .filter((d) => !isExcludedZenodoRecord(d.metadata || {}))
    .map((d) => {
      const meta = d.metadata || {};
      return {
        id: `zenodo-${d.id}`,
        title: meta.title,
        description: stripHtml(meta.description),
        doi: meta.doi || "",
        url: `https://doi.org/${meta.doi}`,
        source: "Zenodo",
        category: resolveZenodoCategory(meta),
        date: meta.publication_date || null,
      };
    });
}

// Enriquecer un DOI con descripción/fecha desde la API pública de DataCite.
async function fetchDataciteMetadata(doi) {
  try {
    const res = await fetch(`https://api.datacite.org/dois/${encodeURIComponent(doi)}`);
    if (!res.ok) return null;
    const json = await res.json();
    const attrs = json.data?.attributes;
    if (!attrs) return null;
    return {
      title: attrs.titles?.[0]?.title || null,
      description: attrs.descriptions?.[0]?.description || "",
      date: attrs.dates?.find((d) => d.dateType === "Issued")?.date || attrs.publicationYear || null,
    };
  } catch (err) {
    console.warn(`No se pudo enriquecer el DOI ${doi} con DataCite:`, err);
    return null;
  }
}

async function fetchCSVDatasets() {
  let rows;
  try {
    const res = await fetch(CSV_PATH);
    const text = await res.text();
    rows = parseCSV(text);
  } catch (err) {
    console.error("Error cargando el CSV de otros portales:", err);
    return [];
  }

  const enriched = await Promise.all(
    rows.map(async (row, idx) => {
      const doiClean = stripDoiPrefix(row.doi);
      const meta = await fetchDataciteMetadata(doiClean);
      return {
        id: `csv-${idx}-${doiClean}`,
        title: (meta && meta.title) || row.titulo,
        description: (meta && meta.description) || "",
        doi: doiClean,
        url: `https://doi.org/${doiClean}`,
        source: detectSourceFromDoi(row.doi),
        category: CATEGORIES.includes(row.categoria) ? row.categoria : "Por clasificar",
        date: (meta && meta.date) || null,
      };
    })
  );

  return enriched;
}

/* ==========================================================
   ESTADO Y RENDERIZADO
   ========================================================== */

let allDatasets = [];
let activeFilters = {
  query: "",
  categories: new Set(),
  sources: new Set(),
  sort: "date-desc", // date-desc | date-asc | title-asc
};

const PAGE_SIZE = 12;
let currentPage = 1;
let currentFilteredResults = [];

function normalizeDateForSort(date) {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(date) {
  const d = normalizeDateForSort(date);
  if (!d) return "";
  return d.toLocaleDateString(document.documentElement.lang === "en" ? "en-GB" : "es-CL", {
    year: "numeric",
    month: "short",
  });
}

function applyFilters() {
  const q = activeFilters.query.trim().toLowerCase();

  let result = allDatasets.filter((d) => {
    const matchesQuery =
      !q ||
      d.title?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q);

    const matchesCategory =
      activeFilters.categories.size === 0 || activeFilters.categories.has(d.category);

    const matchesSource =
      activeFilters.sources.size === 0 || activeFilters.sources.has(d.source);

    return matchesQuery && matchesCategory && matchesSource;
  });

  result = result.slice().sort((a, b) => {
    if (activeFilters.sort === "title-asc") {
      return (a.title || "").localeCompare(b.title || "");
    }
    const dateA = normalizeDateForSort(a.date);
    const dateB = normalizeDateForSort(b.date);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1; // sin fecha al final
    if (!dateB) return -1;
    return activeFilters.sort === "date-asc" ? dateA - dateB : dateB - dateA;
  });

  currentFilteredResults = result;
  currentPage = 1; // cualquier cambio de búsqueda/filtro/orden vuelve a la página 1
  renderCurrentPage();
}

function renderCurrentPage() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = currentFilteredResults.slice(start, start + PAGE_SIZE);

  renderResults(pageItems);
  updateResultCount(currentFilteredResults.length);
  renderPagination();
}

function renderPagination() {
  const container = document.getElementById("catalog-pagination");
  if (!container) return;

  const totalPages = Math.ceil(currentFilteredResults.length / PAGE_SIZE);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <button id="pg-prev" class="pg-btn" ${currentPage === 1 ? "disabled" : ""}>‹</button>
    <span class="pg-info">${currentPage} / ${totalPages}</span>
    <button id="pg-next" class="pg-btn" ${currentPage === totalPages ? "disabled" : ""}>›</button>
  `;

  document.getElementById("pg-prev")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPage();
      scrollToResultsTop();
    }
  });

  document.getElementById("pg-next")?.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPage();
      scrollToResultsTop();
    }
  });
}

function scrollToResultsTop() {
  document.getElementById("catalog-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function sourceBadgeClass(source) {
  return `badge badge-source badge-${source.toLowerCase()}`;
}

function renderResults(list) {
  const container = document.getElementById("catalog-results");
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<p class="catalog-empty" data-i18n="catalog_sin_resultados">No se encontraron datasets con esos filtros.</p>`;
    applyTranslations(getCurrentLang());
    return;
  }

  container.innerHTML = list
    .map(
      (d) => `
    <article class="dataset-card">
      <div class="dataset-card-header">
        <span class="${sourceBadgeClass(d.source)}">${translateSource(d.source)}</span>
        <span class="badge badge-category">${translateCategory(d.category)}</span>
      </div>
      <h3>${d.title || "(Sin título)"}</h3>
      ${d.description ? `<p class="dataset-desc">${truncate(d.description, 220)}</p>` : ""}
      <div class="dataset-card-footer">
        ${d.date ? `<span class="dataset-date">${formatDate(d.date)}</span>` : ""}
        ${
          d.url
            ? `<a href="${d.url}" target="_blank" rel="noopener" data-i18n="catalog_ver_dataset">Ver dataset →</a>`
            : ""
        }
      </div>
    </article>
  `
    )
    .join("");

  applyTranslations(getCurrentLang());
}

function truncate(text, max) {
  if (!text || text.length <= max) return text;
  return text.slice(0, max).trim() + "…";
}

function updateResultCount(n) {
  const el = document.getElementById("catalog-result-count");
  if (el) el.textContent = n;
}

/* ==========================================================
   UI: filtros dinámicos
   ========================================================== */

function buildFilterUI() {
  const categoryContainer = document.getElementById("filter-categorias");
  const sourceContainer = document.getElementById("filter-fuentes");

  if (categoryContainer) {
    categoryContainer.innerHTML = CATEGORIES.map(
      (cat) => `
      <label class="filter-checkbox">
        <input type="checkbox" value="${cat}" data-filter="category">
        <span class="filter-label" data-raw="${cat}">${translateCategory(cat)}</span>
      </label>`
    ).join("");
  }

  const sources = ["GBIF", "Zenodo", "Figshare", "Dryad", "Otro"];
  if (sourceContainer) {
    sourceContainer.innerHTML = sources
      .map(
        (src) => `
      <label class="filter-checkbox">
        <input type="checkbox" value="${src}" data-filter="source">
        <span class="filter-label" data-raw="${src}">${translateSource(src)}</span>
      </label>`
      )
      .join("");
  }

  document.querySelectorAll('input[data-filter="category"]').forEach((cb) => {
    cb.addEventListener("change", () => {
      cb.checked ? activeFilters.categories.add(cb.value) : activeFilters.categories.delete(cb.value);
      applyFilters();
    });
  });

  document.querySelectorAll('input[data-filter="source"]').forEach((cb) => {
    cb.addEventListener("change", () => {
      cb.checked ? activeFilters.sources.add(cb.value) : activeFilters.sources.delete(cb.value);
      applyFilters();
    });
  });

  const searchInput = document.getElementById("catalog-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      activeFilters.query = searchInput.value;
      applyFilters();
    });
  }

  const sortSelect = document.getElementById("catalog-sort");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      activeFilters.sort = sortSelect.value;
      applyFilters();
    });
  }
}

// Al cambiar de idioma, solo actualiza el TEXTO de las etiquetas de filtro
// (no reconstruye los checkboxes), así no se pierden los filtros ya marcados.
function refreshFilterLabels() {
  document.querySelectorAll('#filter-categorias .filter-label').forEach((span) => {
    span.textContent = translateCategory(span.getAttribute("data-raw"));
  });
  document.querySelectorAll('#filter-fuentes .filter-label').forEach((span) => {
    span.textContent = translateSource(span.getAttribute("data-raw"));
  });
}

document.addEventListener("language:changed", () => {
  refreshFilterLabels();
  // Vuelve a pintar la página actual para traducir categorías/fuentes en las tarjetas.
  if (currentFilteredResults.length || allDatasets.length) {
    renderCurrentPage();
  }
});

/* ==========================================================
   INIT
   ========================================================== */

async function initCatalog() {
  buildFilterUI();

  const [gbif, zenodo, csv] = await Promise.all([
    fetchGBIFDatasets(),
    fetchZenodoDatasets(),
    fetchCSVDatasets(),
  ]);

  allDatasets = [...gbif, ...zenodo, ...csv];

  // Permite que otras páginas (ej. index.html, sección "últimos datasets")
  // reutilicen esta misma carga combinada sin duplicar la lógica de fetch.
  document.dispatchEvent(new CustomEvent("datasets:loaded", { detail: allDatasets }));

  applyFilters();
}

document.addEventListener("DOMContentLoaded", initCatalog);
