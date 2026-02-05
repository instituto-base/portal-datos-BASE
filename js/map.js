// Crear mapa centrado en Antártica
const map = L.map('map').setView([-75, 0], 3);

// Capa base OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// API GBIF – solo ocurrencias del instituto
const gbifURL =
  'https://api.gbif.org/v1/occurrence/search' +
  '?publisherKey=29ef4f00-20db-41f8-b1ad-b5fd3c557c38' +
  '&decimalLatitude=-90,-60' +
  '&limit=300';

// Cargar ocurrencias
fetch(gbifURL)
  .then(res => res.json())
  .then(data => {
    data.results.forEach(o => {
      if (o.decimalLatitude && o.decimalLongitude) {

        L.circleMarker(
          [o.decimalLatitude, o.decimalLongitude],
          {
            radius: 4,
            color: '#003049',
            fillOpacity: 0.7
          }
        )
        .bindPopup(`
          <strong>${o.scientificName || 'Sin nombre científico'}</strong><br>
          ${o.locality || 'Sin localidad'}<br>
          ${o.eventDate || ''}
        `)
        .addTo(map);
      }
    });
  })
  .catch(err => console.error('Error GBIF:', err));
