var pixel_ratio = parseInt(window.devicePixelRatio) || 1;
var max_zoom = 16;
var tile_size = 512;
var extent = 12367396.2185;
var resolutions = Array(max_zoom + 1)
  .fill()
  .map((_, i) => (extent / tile_size / Math.pow(2, i - 1)));
var crs = new L.Proj.CRS(
  'EPSG:3031',
  "+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
  {
    origin: [-extent, extent],
    projectedBounds: L.bounds(
      L.point(-extent, extent),
      L.point(extent, -extent)
    ),
    resolutions: resolutions
  }
);
var map = L.map('map', {
  crs: crs,
  minZoom: 1,   // clave para evitar error 400
  maxZoom: 16,
  zoomSnap: 1,
  zoomDelta: 1
}).setView([-82, 0], 1);
// ====== CAPA BASE ======
L.tileLayer(
  'https://tile.gbif.org/3031/omt/{z}/{x}/{y}@' + pixel_ratio + 'x.png?style=osm-bright',
  {
    tileSize: 512,
    noWrap: true
  }
).addTo(map);
// ====== CAPA DENSIDAD ======
L.tileLayer(
  'https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@' + pixel_ratio + 'x.png?srs=EPSG:3031&bin=hex&hexPerTile=97&publishingOrg=29ef4f00-20db-41f8-b1ad-b5fd3c557c38&style=iNaturalist.poly',
  {
    tileSize: 512,
    opacity: 0.8,
    noWrap: true,
    attribution: 'GBIF; <a href="https://www.gbif.org">GBIF</a>'
  }
).addTo(map);
setTimeout(function() {
  map.invalidateSize();
}, 200);
// ============================
// ESTADÍSTICAS GBIF
// ============================
const publishingOrg = "29ef4f00-20db-41f8-b1ad-b5fd3c557c38";

async function getTotalOccurrences() {
  const url = `https://api.gbif.org/v1/occurrence/search?publishingOrg=${publishingOrg}&limit=0`;
  const response = await fetch(url);
  const data = await response.json();
  return data.count;
}

// A diferencia del Reino (que tiene un set fijo y pequeño de 8 valores conocidos
// de antemano: Animalia, Plantae, Fungi, etc.), los Phylum/División son muchos
// y varían según los datos, así que sus nombres no se pueden dejar "hardcodeados":
// GBIF solo entrega el taxonKey en el facet, y hay que resolver el nombre real
// consultando la especie/rango correspondiente en la API de GBIF.
//
// Nota: en GBIF (y en Darwin Core en general) no existe un campo separado para
// "División" (el término usado tradicionalmente en botánica). Tanto animales
// como plantas, hongos, etc. usan el mismo rango "Phylum" en la taxonomía de
// GBIF, por eso este gráfico agrupa ambos conceptos bajo un solo facet.
async function getPhylumNames(counts) {
  const resultados = await Promise.all(
    counts.map(async (item) => {
      try {
        const res = await fetch(`https://api.gbif.org/v1/species/${item.name}`);
        const data = await res.json();
        return {
          name: data.canonicalName || data.scientificName || item.name,
          count: item.count,
        };
      } catch (err) {
        console.error(`Error obteniendo nombre del phylum ${item.name}:`, err);
        return { name: item.name, count: item.count };
      }
    })
  );
  return resultados;
}

async function loadStats() {
  // facetLimit=15 para traer más phyla/divisiones que el default de GBIF (10)
  const url = `https://api.gbif.org/v1/occurrence/search?publishingOrg=${publishingOrg}&limit=0&facet=PHYLUM_KEY&facetLimit=15`;
  const response = await fetch(url);
  const data = await response.json();

  // TOTAL
  const totalEl = document.getElementById("total");
  totalEl.textContent = data.count.toLocaleString();
  // 👇 FIX: sin esto, al cambiar de idioma i18n.js vuelve a escribir "Cargando..."
  // sobre este elemento porque seguía teniendo el atributo data-i18n="cargando".
  totalEl.removeAttribute("data-i18n");

  // GRUPOS (Phylum / División)
  if (!data.facets || data.facets.length === 0 || data.facets[0].counts.length === 0) {
    console.log("No hay datos de phylum/división");
    return;
  }

  const counts = data.facets[0].counts;
  const grupos = await getPhylumNames(counts);

  const labels = grupos.map((g) => g.name);
  const valores = grupos.map((g) => g.count);

  new Chart(document.getElementById("taxaChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        data: valores
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}
loadStats();
