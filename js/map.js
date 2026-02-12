// Definir CRS polar
const southPolarCRS = new L.Proj.CRS(
  "EPSG:3031",
  "+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 " +
  "+k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
  {
    origin: [-4194304, 4194304],
    resolutions: [
      8192, 4096, 2048, 1024, 512,
      256, 128, 64, 32, 16, 8, 4
    ]
  }
);

// Crear mapa
const map = L.map("map", {
  crs: southPolarCRS,
  center: [-75, 0],
  zoom: 2,
  minZoom: 1
});

// 🧊 Base map polar (EOX Antarctic Mosaic)
L.tileLayer(
  "https://tiles.maps.eox.at/wmts/1.0.0/antarctic_4326/default/{z}/{y}/{x}.jpg",
  {
    tileSize: 256,
    attribution: "EOX Antarctic Mosaic"
  }
).addTo(map);

// ==============================
// Cargar ocurrencias GBIF
// ==============================

const publisherKey = "29ef4f00-20db-41f8-b1ad-b5fd3c557c38";
const limit = 300;
let offset = 0;
let total = 1;

async function loadOccurrences() {

  while (offset < total) {

    const url =
      `https://api.gbif.org/v1/occurrence/search` +
      `?publisherKey=${publisherKey}` +
      `&hasCoordinate=true` +
      `&limit=${limit}` +
      `&offset=${offset}`;

    const res = await fetch(url);
    const data = await res.json();

    total = data.count;

    data.results.forEach(o => {
      L.circleMarker(
        [o.decimalLatitude, o.decimalLongitude],
        {
          radius: 3,
          color: "#d62828",
          fillOpacity: 0.7
        }
      ).addTo(map);
    });

    offset += limit;
  }

  console.log("Carga completa");
}

loadOccurrences();


