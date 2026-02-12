console.log("Leaflet:", L);
console.log("Proj4Leaflet:", L.Proj);
// Definir CRS polar
const crs3031 = new L.Proj.CRS(
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
  crs: crs3031,
  center: [-75, 0],
  zoom: 2
});

// =============================
// 1️⃣ Base OMT Polar de GBIF
// =============================
L.tileLayer(
  "https://tile.gbif.org/3031/omt/{z}/{x}/{y}@2x.png?style=gbif-middle",
  {
    tileSize: 256,
    attribution: "© GBIF"
  }
).addTo(map);

// =============================
// 2️⃣ Densidad del instituto
// =============================
L.tileLayer(
  "https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@2x.png" +
  "?srs=EPSG:3031" +
  "&bin=hex" +
  "&hexPerTile=86" +
  "&publishingOrg=29ef4f00-20db-41f8-b1ad-b5fd3c557c38" +
  "&style=classic.poly",
  {
    tileSize: 256,
    opacity: 0.8,
    attribution: "GBIF occurrence density"
  }
).addTo(map);
