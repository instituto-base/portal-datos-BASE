// =======================
// 🗺️ MAPA
// =======================
const map = L.map('map').setView([-60, -50], 3);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
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

// =======================
// 🌍 CARGA GBIF
// =======================
const baseURL = 'https://api.gbif.org/v1/occurrence/search';
let offset = 0;
const limit = 300;

function crearMarker(r, color="#ff7800") {
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
    ${r.locality || ""}
  `);
}

function cargarDatos() {
  const url = `${baseURL}?publishingOrg=29ef4f00-20db-41f8-b1ad-b5fd3c557c38&limit=${limit}&offset=${offset}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {

      todosLosDatos = todosLosDatos.concat(data.results);

      const nuevos = data.results
        .filter(r => r.decimalLatitude && r.decimalLongitude)
        .map(r => crearMarker(r));

      markers.addLayers(nuevos);

      if (!data.endOfRecords) {
        offset += limit;
        cargarDatos();
      }
    });
}

cargarDatos();

// =======================
// 🔍 BUSQUEDA
// =======================
const estado = document.getElementById("estado");

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
    estado.innerHTML = "❌ Sin resultados";
    return;
  }

  estado.innerHTML = `🔎 ${filtrados.length} resultados`;

  const nuevos = filtrados
    .filter(r => r.decimalLatitude && r.decimalLongitude)
    .map(r => crearMarker(r, "#2c7be5")); // 🔵 color distinto

  markers.addLayers(nuevos);
}

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
