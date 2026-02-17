var pixel_ratio = parseInt(window.devicePixelRatio) || 1;

var max_zoom = 16;
var tile_size = 512;

var extent = 12367396.2185; // To the Equator
var resolutions = Array(max_zoom + 1).fill().map((_, i) => ( extent / tile_size / Math.pow(2, i-1) ));

var crs = new L.Proj.CRS(
	'EPSG:3031',
	"+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
	{
		origin: [-extent, extent],
		projectedBounds: L.bounds(L.point(-extent, extent), L.point(extent, -extent)),
		resolutions: resolutions
	}
);

var map = L.map('map', {
	crs: crs,
}).setView([-90, 166.666667], 1.5);

L.tileLayer('https://tile.gbif.org/3031/omt/{z}/{x}/{y}@{r}x.png?style=gbif-classic'.replace('{r}', pixel_ratio), {
	tileSize: 512
}).addTo(map);


  // 4. Carga de datos (Igual que antes)
L.tileLayer(
'https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@2x.png?srs=EPSG:3031&bin=hex&hexPerTile=97&publishingOrg=29ef4f00-20db-41f8-b1ad-b5fd3c557c38&style=iNaturalist.poly'
    .replace('{r}', pixel_ratio),
  {
    tileSize: 512,
    opacity: 0.8
  }
).addTo(map);
