export const BASEMAP_TILE_SOURCES = {
  satellite: {
    type: 'raster',
    tiles: [
      'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
    ],
    tileSize: 256,
    maxzoom: 14,
    attribution:
      'EOxCloudless © <a href="https://cloudless.eox.at" target="_blank" rel="noopener noreferrer">EOX</a> (Contains modified Copernicus Sentinel data 2020)',
  },
  'eox-terrain': {
    type: 'raster',
    tiles: [
      'https://tiles.maps.eox.at/wmts/1.0.0/terrain_3857/default/g/{z}/{y}/{x}.jpg',
    ],
    tileSize: 256,
  },
  'eox-terrain-light': {
    type: 'raster',
    tiles: [
      'https://tiles.maps.eox.at/wmts/1.0.0/terrain-light_3857/default/g/{z}/{y}/{x}.jpg',
    ],
    tileSize: 256,
  },
};

// the API calls from https://maps.eox.at/
