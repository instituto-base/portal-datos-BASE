// ===============================
// 1️⃣ Proyección Polar EPSG:3031
// ===============================

const crs3031 = new L.Proj.CRS(
  'EPSG:3031',
  '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 ' +
  '+x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
  {
    resolutions: [
      8192, 4096, 2048, 1024, 512,
      256, 128, 64, 32, 16, 8, 4
    ],
    origin: [-4194304, 4194304]
  }
);

// ===============================
// 2️⃣ Crear mapa polar
// ===============================

const map = L.map('map', {
  crs: crs3031,
  center: [-75, 0],
  zoom: 1,
  minZoom: 1
});

// ⚠️ Fondo simple (sin tiles incompatibles)
L.rectangle(
  [[-90, -180], [-50, 180]],
  {
    color: "#e0f3f8",
    weight: 0,
    fillOpacity: 0.6
  }
).addTo(map);

// ===============================
// 3️⃣ Cargar TODAS las ocurrencias
// ===============================

const publisherKey = "29ef4f00-20db-41f8-b1ad-b5fd3c557c38";

const limit = 300;
let offset = 0;
let total = 1;

async function loadAllOccurrences() {

  while (offset < total) {

    const url =
      `https://api.gbif.org/v1/occurrence/search` +
      `?publisherKey=${publisherKey}` +
      `&hasCoordinate=true` +
      `&limit=${limit}` +
      `&offset=${offset}`;

    const response = await fetch(url);
    const data = await response.json();

    total = data.count;

    console.log(`Cargando ${offset} de ${total}`);

    data.results.forEach(o => {
      if (o.decimalLatitude && o.decimalLongitude) {

        L.circleMarker(
          [o.decimalLatitude, o.decimalLongitude],
          {
            radius: 3,
            color: "#003049",
            fillOpacity: 0.7
          }
        )
        .bindPopup(`
          <strong>${o.scientificName || "Sin nombre"}</strong><br>
          ${o.country || ""}<br>
          ${o.eventDate || ""}
        `)
        .addTo(map);
      }
    });

    offset += limit;
  }

  console.log("Carga completa");
}

loadAllOccurrences();

