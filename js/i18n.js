/* ==========================================================
   i18n.js — Motor de traducción ES/EN para el Portal de Datos
   Instituto Milenio BASE
   ==========================================================
   Cómo funciona:
   - Cada texto traducible en el HTML lleva un atributo data-i18n="clave".
   - Si el texto contiene HTML (links, <strong>, etc.) se usa
     data-i18n-html="clave" en vez de data-i18n.
   - Para placeholders de inputs se usa data-i18n-placeholder="clave".
   - El idioma elegido se guarda en localStorage y se aplica
     automáticamente en cada página al cargar.
   ========================================================== */

const translations = {
  es: {
    // Navegación / header
    nav_inicio: "Inicio",
    nav_datasets: "Datasets",
    nav_mapa: "Explorar Registros GBIF",
    site_title: "Portal de Datos Instituto Milenio BASE",

    // Títulos de pestaña (<title>)
    page_title_index: "Inicio - Portal de Datos BASE",
    page_title_datasets: "Datasets del Instituto",
    page_title_map: "Explorador Registros GBIF",

    // index.html — texto de introducción
    intro1:
      "El Instituto Milenio Biodiversidad de Ecosistemas Antárticos y Subantárticos (BASE) investiga el pasado, presente y futuro de la biodiversidad antártica y subantártica: el destino de una biota única, en un mundo cambiante que ha sido afectado dramáticamente por el cambio climático. A su vez, busca que el conocimiento generado por el equipo de investigadores que constituyen BASE, sea utilizado en la toma de decisiones de políticas públicas.",
    intro2:
      "Consideramos que la calidad de los datos debe estar asociada a una serie de medidas destinadas a garantizar que estos puedan procesarse, compartirse y conservarse para asegurar que los conjuntos de datos sean comprensibles (y utilizables) de forma independiente por la comunidad, de modo que puedan entenderse sin necesidad de la ayuda de los expertos que los produjeron. En este contexto, el Instituto Milenio BASE adopta un firme compromiso con la generación de datos FAIR (Localizables, Accesibles, Interoperables y Reutilizables); conformando la Unidad de Gestión de Datos Científicos, encargada de poner nuestros datos, metadatos y scripts a disposición en portales de acceso abierto.",
    intro3_html:
      'Esta plataforma tiene por objetivos compilar y visualizar los datasets publicados por el instituto en las plataformas <a href="https://www.gbif.org/publisher/29ef4f00-20db-41f8-b1ad-b5fd3c557c38" target="_blank"><strong>GBIF</strong></a> y <a href="https://zenodo.org/communities/institutobase/" target="_blank"><strong>Zenodo</strong></a>, asegurando el acceso a los datos generados por nuestros investigadores, además de promover la colaboración y reproducibilidad científica.',
    intro4_html:
      'Puedes revisar todas las publicaciones en nuestra página principal <a href="https://institutobase.cl/publicaciones-cientificas/" target="_blank">Publicaciones Científicas - Instituto Milenio BASE</a>',

    total_registros_title: "Total de registros GBIF",
    registros_phylum_title: "Ocurrencias por Phylum / División",
    cargando: "Cargando...",
    explorar_todos_registros: "Explorar todos los registros biológicos →",

    // index.html — sección de datasets recientes
    recent_titulo: "Últimos datasets publicados",
    recent_ver_todos: "Explorar todos los datasets →",
    recent_sin_datos: "No se encontraron datasets recientes.",

    // datasets.html (catálogo unificado)
    catalog_title: "Catálogo de Datasets",
    catalog_search_placeholder: "Buscar por título o descripción...",
    catalog_filter_categoria: "Categoría",
    catalog_filter_fuente: "Fuente",
    catalog_filter_orden: "Ordenar por",
    catalog_filtros_toggle: "Filtros",
    catalog_orden_fecha_desc: "Más recientes primero",
    catalog_orden_fecha_asc: "Más antiguos primero",
    catalog_orden_titulo: "Título (A-Z)",
    catalog_resultados: "datasets encontrados",
    catalog_sin_resultados: "No se encontraron datasets con esos filtros.",
    catalog_ver_dataset: "Ver dataset →",
    catalog_cargando: "Cargando catálogo de datasets...",

    // map.html
    buscador_placeholder: "Buscar taxón...",
    btn_limpiar: "Limpiar",
    explorer_ocurrencias_cargadas: "ocurrencias cargadas",
    explorer_info_titulo: "Sobre el explorador",
    explorer_info_texto:
      "Este mapa reúne los registros de ocurrencia publicados por el Instituto Milenio BASE, junto con datasets de otras instituciones con las que colaboran nuestros investigadores en el estudio de la biodiversidad antártica y subantártica. A continuación se listan los datasets utilizados, su DOI y la institución que los publicó.",
    explorer_tabla_dataset: "Dataset",
    explorer_tabla_institucion: "Institución",
    explorer_tabla_doi: "DOI",
    explorer_resultados: "resultados",
    explorer_sin_resultados: "Sin resultados",
    explorer_bajar_info: "Ir a \"Sobre el explorador\"",

    // footer (todas las páginas)
    footer_enlaces: "Enlaces de interés",
    footer_gbif: "GBIF",
    footer_zenodo: "Zenodo",
    footer_instituto: "Instituto Milenio BASE",
    footer_copyright: "© 2026 Instituto Milenio BASE",
  },

  en: {
    // Navigation / header
    nav_inicio: "Home",
    nav_datasets: "Datasets",
    nav_mapa: "Explore GBIF Records",
    site_title: "BASE Millennium Institute Data Portal",

    // Tab titles (<title>)
    page_title_index: "Home - BASE Data Portal",
    page_title_datasets: "Institute Datasets",
    page_title_map: "GBIF Records Explorer",

    // index.html — intro text
    intro1:
      "The BASE Millennium Institute Biodiversity of Antarctic and Sub-Antarctic Ecosystems investigates the past, present, and future of Antarctic and sub-Antarctic biodiversity: the fate of a unique biota in a changing world that has been dramatically affected by climate change. It also seeks to ensure that the knowledge generated by BASE's research team is used in public policy decision-making.",
    intro2:
      "We believe that data quality must be linked to a set of measures aimed at ensuring that data can be processed, shared, and preserved so that datasets are understandable (and usable) independently by the community, without needing help from the experts who produced them. In this context, the BASE Millennium Institute holds a strong commitment to generating FAIR data (Findable, Accessible, Interoperable, and Reusable), forming the Scientific Data Management Unit, responsible for making our data, metadata, and scripts available on open access portals.",
    intro3_html:
      'This platform aims to compile and visualize the datasets published by the institute on the <a href="https://www.gbif.org/publisher/29ef4f00-20db-41f8-b1ad-b5fd3c557c38" target="_blank"><strong>GBIF</strong></a> and <a href="https://zenodo.org/communities/institutobase/" target="_blank"><strong>Zenodo</strong></a> platforms, ensuring access to the data generated by our researchers, while promoting scientific collaboration and reproducibility.',
    intro4_html:
      'You can review all publications on our main page <a href="https://institutobase.cl/publicaciones-cientificas/" target="_blank">Scientific Publications - BASE Millennium Institute</a>',

    total_registros_title: "Total GBIF Records",
    registros_phylum_title: "Occurrences by Phylum / Division",
    cargando: "Loading...",
    explorar_todos_registros: "Explore all biological records →",

    // index.html — recent datasets section
    recent_titulo: "Latest published datasets",
    recent_ver_todos: "Explore all datasets →",
    recent_sin_datos: "No recent datasets found.",

    // datasets.html (unified catalog)
    catalog_title: "Dataset Catalog",
    catalog_search_placeholder: "Search by title or description...",
    catalog_filter_categoria: "Category",
    catalog_filter_fuente: "Source",
    catalog_filter_orden: "Sort by",
    catalog_filtros_toggle: "Filters",
    catalog_orden_fecha_desc: "Newest first",
    catalog_orden_fecha_asc: "Oldest first",
    catalog_orden_titulo: "Title (A-Z)",
    catalog_resultados: "datasets found",
    catalog_sin_resultados: "No datasets found with those filters.",
    catalog_ver_dataset: "View dataset →",
    catalog_cargando: "Loading dataset catalog...",

    // map.html
    buscador_placeholder: "Search taxon...",
    btn_limpiar: "Clear",
    explorer_ocurrencias_cargadas: "occurrences loaded",
    explorer_info_titulo: "About this explorer",
    explorer_info_texto:
      "This map compiles occurrence records published by the BASE Millennium Institute, together with datasets from other institutions that collaborate with our researchers in the study of Antarctic and sub-Antarctic biodiversity. Below is the list of datasets used, their DOI, and the publishing institution.",
    explorer_tabla_dataset: "Dataset",
    explorer_tabla_institucion: "Institution",
    explorer_tabla_doi: "DOI",
    explorer_resultados: "results",
    explorer_sin_resultados: "No results",
    explorer_bajar_info: "Go to \"About this explorer\"",

    // footer (all pages)
    footer_enlaces: "Useful links",
    footer_gbif: "GBIF",
    footer_zenodo: "Zenodo",
    footer_instituto: "BASE Millennium Institute",
    footer_copyright: "© 2026 BASE Millennium Institute",
  },
};

const SUPPORTED_LANGS = ["es", "en"];
const STORAGE_KEY = "portal_base_lang";

function getCurrentLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  // Si no hay preferencia guardada, usar el idioma del navegador si es inglés
  const browserLang = (navigator.language || "es").slice(0, 2);
  return browserLang === "en" ? "en" : "es";
}

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  localStorage.setItem(STORAGE_KEY, lang);
  applyTranslations(lang);
  // Avisa a otros scripts (ej. dataset-catalog.js) que el idioma cambió,
  // para que puedan volver a renderizar textos que no son data-i18n
  // (categorías, fuentes, etc. que vienen de datos, no de atributos HTML).
  // La traducción de categorías/fuentes vive en dataset-catalog.js
  // (translateCategory / translateSource, expuestas en window) para
  // no duplicar el diccionario en dos archivos.
  document.dispatchEvent(new CustomEvent("language:changed", { detail: lang }));
}

function t(key, lang) {
  lang = lang || getCurrentLang();
  return (translations[lang] && translations[lang][key]) || key;
}

function applyTranslations(lang) {
  const dict = translations[lang] || translations.es;

  // Texto plano
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  // HTML (párrafos con links, <strong>, etc.)
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (dict[key]) el.innerHTML = dict[key];
  });

  // Placeholders de inputs
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.setAttribute("placeholder", dict[key]);
  });

  // Atributo title (tooltips)
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (dict[key]) el.setAttribute("title", dict[key]);
  });

  // Título de la pestaña del navegador
  const titleKey = document.body.getAttribute("data-i18n-page-title");
  if (titleKey && dict[titleKey]) document.title = dict[titleKey];

  // Atributo lang del documento
  document.documentElement.setAttribute("lang", lang);

  // Selector de idioma (dropdown)
  const langSelect = document.getElementById("lang-select");
  if (langSelect) langSelect.value = lang;
}

document.addEventListener("DOMContentLoaded", () => {
  applyTranslations(getCurrentLang());

  const langSelect = document.getElementById("lang-select");
  if (langSelect) {
    langSelect.addEventListener("change", () => setLang(langSelect.value));
  }
});
