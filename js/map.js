// Crear mapa Leaflet
const map = L.map('map').setView([0, 0], 2);

// Capa base OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// API GBIF sin restricciones geográficas
const gbifURL =
  'https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@2x.png?srs=EPSG:3031&bin=hex&hexPerTile=97&publishingOrg=29ef4f00-20db-41f8-b1ad-b5fd3c557c38&style=iNaturalist.poly;

// Cargar ocurrencias
fetch(gbifURL)
  .then(res => res.json())
  .then(data => {
    data.results.forEach(o => {
      if (o.decimalLatitude && o.decimalLongitude) {
        L.circleMarker(
          [o.decimalLatitude, o.decimalLongitude],
          {
            radius: 5,
            color: '#003049',
            fillOpacity: 0.7
          }
        ).bindPopup(`
          <strong>${o.scientificName || 'Sin nombre científico'}</strong><br>
          ${o.locality || ''}<br>
          ${o.eventDate || ''}
        `).addTo(map);
      }
    });
  })
  .catch(error => console.error('Error con GBIF API:', error));
