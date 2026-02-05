// Proyección Antártica EPSG:3031
const crs3031 = new L.Proj.CRS(
  'EPSG:3031',
  '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
  {
    resolutions: [
      8192, 4096, 2048, 1024, 512,
      256, 128, 64, 32, 16, 8
    ],
    origin: [-4194304, 4194304]
  }
);

// Mapa
const map = L.map('map', {
  crs: crs3031,
  center: [-75, 0],
  zoom: 1
});

// Fondo simple (puedes cambiarlo luego)
L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '© OpenStreetMap' }
).addTo(map);

// API GBIF
const gbifURL =
  'https://api.gbif.org/v1/occurrence/search' +
  '?publisherKey=29ef4f00-20db-41f8-b1ad-b5fd3c557c38' +
  '&decimalLatitude=-90,-60' +
  '&limit=300';

fetch(gbifURL)
  .then(r => r.json())
  .then(data => {
    data.results.forEach(o => {
      if (o.decimalLatitude && o.decimalLongitude) {
        L.circleMarker(
          [o.decimalLatitude, o.decimalLongitude],
          { radius: 3 }
        )
        .bindPopup(`
          <strong>${o.scientificName || 'Sin nombre'}</strong><br>
          ${o.locality || ''}<br>
          ${o.eventDate || ''}
        `)
        .addTo(map);
      }
    });
  });
