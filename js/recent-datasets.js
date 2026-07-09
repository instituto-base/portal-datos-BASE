/* ==========================================================
   recent-datasets.js — Sección "Últimos datasets publicados"
   (index.html)
   ==========================================================
   Escucha el evento "datasets:loaded" que emite dataset-catalog.js
   una vez que combinó GBIF + Zenodo + el CSV de otros portales,
   y muestra los 2 más recientes según su fecha.
   ========================================================== */

function truncateRecentText(text, max) {
  if (!text || text.length <= max) return text;
  return text.slice(0, max).trim() + "…";
}

function formatRecentDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(document.documentElement.lang === "en" ? "en-GB" : "es-CL", {
    year: "numeric",
    month: "short",
  });
}

let ultimaListaRecientes = [];

function renderRecentDatasets(list) {
  ultimaListaRecientes = list;
  const container = document.getElementById("recent-datasets-list");
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<p data-i18n="recent_sin_datos">No se encontraron datasets recientes.</p>`;
    applyTranslations(getCurrentLang());
    return;
  }

  container.innerHTML = list
    .map(
      (d) => `
    <article class="dataset-card">
      <div class="dataset-card-header">
        <span class="badge badge-source badge-${d.source.toLowerCase()}">${translateSource(d.source)}</span>
        <span class="badge badge-category">${translateCategory(d.category)}</span>
      </div>
      <h3>${d.title || "(Sin título)"}</h3>
      ${d.description ? `<p class="dataset-desc">${truncateRecentText(d.description, 200)}</p>` : ""}
      <div class="dataset-card-footer">
        ${d.date ? `<span class="dataset-date">${formatRecentDate(d.date)}</span>` : ""}
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

document.addEventListener("language:changed", () => {
  if (ultimaListaRecientes.length) renderRecentDatasets(ultimaListaRecientes);
});

document.addEventListener("datasets:loaded", (e) => {
  const datasets = e.detail || [];
  const conFecha = datasets.filter((d) => d.date && !isNaN(new Date(d.date).getTime()));
  conFecha.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderRecentDatasets(conFecha.slice(0, 2));
});
