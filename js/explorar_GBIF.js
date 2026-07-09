/* ==========================================================
   explorar_GBIF.js — Explorador de Ocurrencias GBIF
   Instituto Milenio BASE
   ==========================================================
   Combina en el mapa:
     1) Ocurrencias publicadas por el instituto (publishingOrg)
     2) Ocurrencias de datasets externos específicos (datasetKey),
        definidos en data/datasets_externos_ocurrencias.csv

   Además construye la sección "Sobre el explorador" con la lista
   de datasets utilizados, su DOI y la institución publicadora.
   ========================================================== */

// CONFIGURACIÓN
const GBIF_PUBLISHING_ORG = "29ef4f00-20db-41f8-b1ad-b5fd3c557c38";
const EXTERNAL_DATASETS_CSV = "data/datasets_externos_ocurrencias.csv";
const PAGE_LIMIT = 300;

// =======================
// 🗺️ MAPA
// =======================
const map = L.map('map').setView([-60, -50], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: ' <a href="https://www.openstreetmap.org/">OpenStreetMap</a> |  <a href="https://www.gbif.org/">GBIF</a>'
}).addTo(map);

// =======================
// 🔥 CLUSTER estilo GBIF (sin números)
// =======================
const markers = L.markerClusterGroup({
  chunkedLoading: true,
  maxClusterRadius: 50,
  disableClusteringAtZoom: 8,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  iconCreateFunction: function (cluster) {
    const count = cluster.getChildCount();
    let size = 30;
    let color = "rgba(255,120,0,0.6)";
    if (count > 100) {
      size = 40;
      color = "rgba(255,80,0,0.7)";
    }
    if (count > 500) {
      size = 50;
      color = "rgba(200,0,0,0.7)";
    }
    return L.divIcon({
      html: `<div style="
        background: ${color};
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
      "></div>`,
      className: 'cluster-custom',
      iconSize: [size, size]
    });
  }
});
map.addLayer(markers);

// =======================
// 📦 DATOS
// =======================
let todosLosDatos = [];

function crearMarker(r, color = "#ff7800") {
  return L.circleMarker(
    [r.decimalLatitude, r.decimalLongitude],
    {
      radius: 4,
      color: color,
      fillColor: color,
      fillOpacity: 0.7
    }
  ).bindPopup(`
    <strong>${r.scientificName || "Sin nombre"}</strong><br>
    ${r.family || ""}<br>
    ${r.locality || ""}<br>
  <a href="https://www.gbif.org/occurrence/${r.key}" target="_blank" > Ver en GBIF 🡥
  </a>
  `);
}

// =======================
// 📊 PROGRESO DE CARGA
// =======================
const progresoEl = document.getElementById("progreso-carga");
let fuentesTotales = 0;
let fuentesCompletas = 0;

function actualizarProgreso() {
  if (!progresoEl) return;
  const cargando = fuentesCompletas < fuentesTotales;
  const totalTexto = todosLosDatos.length.toLocaleString(
    document.documentElement.lang === "en" ? "en-GB" : "es-CL"
  );
  const label = t("explorer_ocurrencias_cargadas");
  progresoEl.innerHTML = cargando
    ? `<span class="progreso-spinner"></span> ${totalTexto} ${label}`
    : `<span class="progreso-check">✔</span> ${totalTexto} ${label}`;
}

// =======================
// 🌍 CARGA GBIF (paginada, por publishingOrg o por datasetKey)
// =======================
const baseURL = 'https://api.gbif.org/v1/occurrence/search';

function cargarOcurrenciasPorParametro(paramName, paramValue) {
  return new Promise((resolve) => {
    function pagina(offset) {
      const url = `${baseURL}?${paramName}=${paramValue}&limit=${PAGE_LIMIT}&offset=${offset}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          todosLosDatos = todosLosDatos.concat(data.results);
          const nuevos = data.results
            .filter((r) => r.decimalLatitude && r.decimalLongitude)
            .map((r) => crearMarker(r));
          markers.addLayers(nuevos);
          actualizarProgreso();

          if (!data.endOfRecords) {
            pagina(offset + PAGE_LIMIT);
          } else {
            resolve();
          }
        })
        .catch((err) => {
          console.error(`Error cargando ocurrencias (${paramName}=${paramValue}):`, err);
          resolve(); // no bloquear las demás fuentes por un error puntual
        });
    }
    pagina(0);
  });
}

async function cargarTodasLasFuentes(datasetKeysExternos) {
  const fuentes = [
    { param: "publishingOrg", value: GBIF_PUBLISHING_ORG },
    ...datasetKeysExternos.map((key) => ({ param: "datasetKey", value: key })),
  ];

  fuentesTotales = fuentes.length;
  fuentesCompletas = 0;
  actualizarProgreso();

  await Promise.all(
    fuentes.map((f) =>
      cargarOcurrenciasPorParametro(f.param, f.value).then(() => {
        fuentesCompletas++;
        actualizarProgreso();
      })
    )
  );
}

// =======================
// 📄 CSV de datasets externos
// =======================
function parseCSVSimple(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(1); // descarta encabezado
}

async function obtenerDatasetKeysExternos() {
  try {
    const res = await fetch(EXTERNAL_DATASETS_CSV);
    const text = await res.text();
    return parseCSVSimple(text);
  } catch (err) {
    console.error("Error cargando el CSV de datasets externos:", err);
    return [];
  }
}

// =======================
// 🏛️ SECCIÓN "SOBRE EL EXPLORADOR"
// =======================
const orgCache = new Map(); // orgKey -> nombre institución

async function obtenerNombreOrganizacion(orgKey) {
  if (!orgKey) return "";
  if (orgCache.has(orgKey)) return orgCache.get(orgKey);
  try {
    const res = await fetch(`https://api.gbif.org/v1/organization/${orgKey}`);
    const data = await res.json();
    const nombre = data.title || orgKey;
    orgCache.set(orgKey, nombre);
    return nombre;
  } catch (err) {
    console.error(`Error obteniendo organización ${orgKey}:`, err);
    return orgKey;
  }
}

async function obtenerDatasetsDelInstituto() {
  try {
    const res = await fetch(
      `https://api.gbif.org/v1/dataset/search?publishingOrg=${GBIF_PUBLISHING_ORG}&limit=200`
    );
    const data = await res.json();
    const nombreInstituto = await obtenerNombreOrganizacion(GBIF_PUBLISHING_ORG);
    return (data.results || [])
      // Los checklists no aportan registros de ocurrencia geolocalizados (no
      // tienen un "punto" en el mapa), así que no tiene sentido listarlos aquí:
      // esta sección describe los datasets que sí alimentan el mapa (eventos
      // de muestreo y ocurrencias).
      .filter((d) => d.type !== "CHECKLIST")
      .map((d) => ({
        title: d.title,
        doi: d.doi || "",
        institucion: nombreInstituto,
        url: `https://www.gbif.org/dataset/${d.key}`,
      }));
  } catch (err) {
    console.error("Error obteniendo datasets del instituto:", err);
    return [];
  }
}

// Trae el detalle de un dataset externo una sola vez (se reutiliza tanto para
// decidir si se cargan sus ocurrencias en el mapa, como para la tabla de la
// sección "Sobre el explorador" — así no se pide el mismo dataset dos veces).
async function obtenerDetalleDatasetExterno(key) {
  try {
    const res = await fetch(`https://api.gbif.org/v1/dataset/${key}`);
    const d = await res.json();
    const institucion = await obtenerNombreOrganizacion(d.publishingOrganizationKey);
    return {
      key,
      type: d.type,
      title: d.title,
      doi: d.doi || "",
      institucion,
      url: `https://www.gbif.org/dataset/${key}`,
    };
  } catch (err) {
    console.error(`Error obteniendo dataset externo ${key}:`, err);
    return null;
  }
}

async function obtenerDetallesDatasetsExternos(datasetKeys) {
  const detalles = await Promise.all(datasetKeys.map(obtenerDetalleDatasetExterno));
  return detalles.filter(Boolean);
}

function renderizarInfoDatasets(datasets) {
  const container = document.getElementById("info-datasets-lista");
  if (!container) return;

  if (datasets.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <table class="info-datasets-table">
      <thead>
        <tr>
          <th data-i18n="explorer_tabla_dataset">Dataset</th>
          <th data-i18n="explorer_tabla_institucion">Institución</th>
          <th data-i18n="explorer_tabla_doi">DOI</th>
        </tr>
      </thead>
      <tbody>
        ${datasets
          .map(
            (d) => `
          <tr>
            <td><a href="${d.url}" target="_blank" rel="noopener">${d.title}</a></td>
            <td>${d.institucion}</td>
            <td>${
              d.doi
                ? `<a href="https://doi.org/${d.doi}" target="_blank" rel="noopener">${d.doi}</a>`
                : "—"
            }</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
  applyTranslations(getCurrentLang());
}

async function cargarInfoDatasets(detallesExternos) {
  const propios = await obtenerDatasetsDelInstituto();
  const externos = detallesExternos
    .filter((d) => d.type !== "CHECKLIST")
    .map(({ title, doi, institucion, url }) => ({ title, doi, institucion, url }));
  renderizarInfoDatasets([...propios, ...externos]);
}

// =======================
// 🔍 BUSQUEDA
// =======================
const estado = document.getElementById("estado");

// Guarda el último resultado de búsqueda para poder re-traducir su texto
// cuando el usuario cambia de idioma, sin tener que repetir la búsqueda.
let ultimoEstadoBusqueda = null; // null = sin búsqueda activa | { count } | "sin-resultados"

function actualizarTextoEstado() {
  if (ultimoEstadoBusqueda === null) {
    estado.innerHTML = "";
  } else if (ultimoEstadoBusqueda === "sin-resultados") {
    estado.innerHTML = t("explorer_sin_resultados");
  } else {
    estado.innerHTML = `${ultimoEstadoBusqueda.count} ${t("explorer_resultados")}`;
  }
}

function filtrarDatos(texto) {
  const filtro = texto.toLowerCase();
  markers.clearLayers();
  const filtrados = todosLosDatos.filter(r =>
    (r.scientificName || "").toLowerCase().includes(filtro) ||
    (r.genus || "").toLowerCase().includes(filtro) ||
    (r.family || "").toLowerCase().includes(filtro) ||
    (r.order || "").toLowerCase().includes(filtro) ||
    (r.class || "").toLowerCase().includes(filtro) ||
    (r.phylum || "").toLowerCase().includes(filtro) ||
    (r.kingdom || "").toLowerCase().includes(filtro)
  );
  if (filtrados.length === 0) {
    ultimoEstadoBusqueda = "sin-resultados";
    actualizarTextoEstado();
    return;
  }
  ultimoEstadoBusqueda = { count: filtrados.length };
  actualizarTextoEstado();
  const nuevos = filtrados
    .filter(r => r.decimalLatitude && r.decimalLongitude)
    .map(r => crearMarker(r, "#2c7be5")); // 🔵 color distinto
  markers.addLayers(nuevos);
}

document.addEventListener("language:changed", actualizarTextoEstado);

// botón buscar
document.getElementById("btnBuscar").addEventListener("click", () => {
  const texto = document.getElementById("buscador").value;
  filtrarDatos(texto);
});

// ENTER para buscar
document.getElementById("buscador").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("btnBuscar").click();
  }
});

// =======================
// 💡 SUGERENCIAS GBIF
// =======================
const sugerenciasDiv = document.getElementById("sugerencias");
let timeout;
document.getElementById("buscador").addEventListener("input", (e) => {
  clearTimeout(timeout);
  const query = e.target.value;
  if (query.length < 3) {
    sugerenciasDiv.innerHTML = "";
    return;
  }
  timeout = setTimeout(() => {
    fetch(`https://api.gbif.org/v1/species/suggest?q=${query}`)
      .then(res => res.json())
      .then(data => {
        sugerenciasDiv.innerHTML = "";
        data.slice(0, 5).forEach(item => {
          const div = document.createElement("div");
          div.className = "item-sugerencia";
          div.innerText = item.canonicalName || item.scientificName;
          div.onclick = () => {
            document.getElementById("buscador").value = div.innerText;
            sugerenciasDiv.innerHTML = "";
            filtrarDatos(div.innerText);
          };
          sugerenciasDiv.appendChild(div);
        });
      });
  }, 300);
});

// Limpiar busqueda
document.getElementById("btnLimpiar").addEventListener("click", () => {
  document.getElementById("buscador").value = "";
  ultimoEstadoBusqueda = null;
  estado.innerHTML = "";
  sugerenciasDiv.innerHTML = "";
  markers.clearLayers();
  const todos = todosLosDatos
    .filter(r => r.decimalLatitude && r.decimalLongitude)
    .map(r => crearMarker(r));
  markers.addLayers(todos);
});

// =======================
// 🚀 INICIO
// =======================
(async function init() {
  const datasetKeysExternos = await obtenerDatasetKeysExternos();
  const detallesExternos = await obtenerDetallesDatasetsExternos(datasetKeysExternos);

  // Los checklists no tienen registros de ocurrencia geolocalizados, así que
  // no se pide su data al mapa (solo eventos de muestreo y ocurrencias).
  const keysParaOcurrencias = detallesExternos
    .filter((d) => d.type !== "CHECKLIST")
    .map((d) => d.key);

  cargarTodasLasFuentes(keysParaOcurrencias); // no se espera: el mapa se va llenando progresivamente
  cargarInfoDatasets(detallesExternos);
})();
