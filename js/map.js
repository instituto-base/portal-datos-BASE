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
  'https://tile.gbif.org/3857/omt/{z}/{x}/{y}@1x.png?style=gbif-classic',
  {
    attribution: '&copy; GBIF'
  }
).addTo(map);


// ====== CAPA DENSIDAD ======
L.tileLayer(
  'https://tile.gbif.org/3857/omt/{z}/{x}/{y}@1x.png?srs=EPSG:3031&bin=hex&hexPerTile=97&publishingOrg=29ef4f00-20db-41f8-b1ad-b5fd3c557c38&style=iNaturalist.poly',
  {
    tileSize: 512,
    opacity: 0.8,
    noWrap: true
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

function getTaxonomicGroups(data) {
  if (!data.facets || data.facets.length === 0) return {};

  const counts = data.facets[0].counts;

  const kingdoms = {
    "1": "Animalia",
    "5": "Fungi",
    "6": "Plantae",
    "2": "Bacteria",
    "3": "Archaea",
    "4": "Chromista",
    "7": "Protozoa",
    "8": "Viruses"
  };

  const result = {};

  counts.forEach(item => {
    const kingdomName = kingdoms[item.name];
    if (kingdomName) {
      result[kingdomName] = item.count;
    }
  });

  return result;
}

async function loadStats() {
const url = `https://api.gbif.org/v1/occurrence/search?publishingOrg=${publishingOrg}&limit=0&facet=KINGDOM_KEY`;

  const response = await fetch(url);
  const data = await response.json();

  // TOTAL
  document.getElementById("total").textContent =
    data.count.toLocaleString();

  // GRUPOS
  const groups = getTaxonomicGroups(data);

  if (Object.keys(groups).length === 0) {
    console.log("No hay grupos taxonómicos");
    return;
  }

  const labels = Object.keys(groups);
  const counts = Object.values(groups);

  new Chart(document.getElementById("taxaChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        data: counts
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
