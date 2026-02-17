// 1. Configuración de la proyección Antártica (EPSG:3031)
const epsg3031 = new L.Proj.CRS('EPSG:3031',
    '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs',
    {
        resolutions: [8192, 4096, 2048, 1024, 512, 256, 128], // Niveles de zoom
        origin: [-12367396.2185, 12367396.2185] // Extensión polar oficial para GBIF tiles
    }
);

// 2. Inicializar el mapa
const map = L.map('map', {
    crs: epsg3031,
    center: [-90, 0], // Polo Sur
    zoom: 0,
    minZoom: 0,
    maxZoom: 6
});

// 3. Capa Base de GBIF (Mapa físico antártico)
L.tileLayer('https://tile.gbif.org/3031/omt/{z}/{x}/{y}@1x.png?style=gbif-light', {
    attribution: '&copy; <a href="https://www.gbif.org/">GBIF</a>'
}).addTo(map);

// 4. Capa de Ocurrencias Filtrada (Ad-hoc)
// Filtro: publishingOrg=29ef4f00-20db-41f8-b1ad-b5fd3c557c38
const publishingOrg = '29ef4f00-20db-41f8-b1ad-b5fd3c557c38';
const occurrenceUrl = `https://api.gbif.org/v2/map/occurrence/adhoc/{z}/{x}/{y}@1x.png?srs=EPSG:3031&publishingOrg=${publishingOrg}&style=purpleHeat.point`;

L.tileLayer(occurrenceUrl, {
    attribution: 'Datos de ocurrencia &copy; GBIF',
    opacity: 0.8
}).addTo(map);

// 5. Función opcional: Obtener conteo real desde la API de GBIF
fetch(`https://api.gbif.org/v1/occurrence/search?publishingOrg=${publishingOrg}&limit=0`)
    .then(response => response.json())
    .then(data => {
        document.getElementById('stats').innerText = `${data.count.toLocaleString()} registros encontrados para esta organización.`;
    })
    .catch(err => console.error("Error cargando estadísticas:", err));
