import { BASEMAP_TILE_SOURCES } from '../api/basemaps.js';

// THE MAPLIBRE MAGIC
export const MAP_STYLE = {
  version: 8,
  projection: {
    type: 'globe'
  },
  sources: {
    satellite: BASEMAP_TILE_SOURCES.satellite,
    'eox-terrain': BASEMAP_TILE_SOURCES['eox-terrain'],
    'eox-terrain-light': BASEMAP_TILE_SOURCES['eox-terrain-light']
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite'
    },
    {
      id: 'eox-terrain',
      type: 'raster',
      source: 'eox-terrain',
      layout: { visibility: 'none' }
    },
    {
      id: 'eox-terrain-light',
      type: 'raster',
      source: 'eox-terrain-light',
      layout: { visibility: 'none' }
    }
  ],
  sky: {
    // https://maplibre.org/maplibre-gl-js/docs/examples/sky-fog-terrain/
    'sky-color': '#02040a',
    'horizon-color': '#52749a',
    'fog-color': '#172738',
    'sky-horizon-blend': 0.5,
    'horizon-fog-blend': 0.6,
    'fog-ground-blend': 0.85,
    'atmosphere-blend': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 0.7,
      5, 0.85,
      7, 0
    ]
  },
  light: {
    anchor: 'map',
    position: [100, 90, 180]
  }
};



/*
POSIÇÃO INICIAL DO GLOBO

obs:
center: [60, 25] = centrado no Velho Mundo
center: [-80, 15] = centrado nas Américas
*/
export const MAP_VIEW_OPTIONS = {
  zoom: 2,
  center: [60, 25],
  maxPitch: 89,
  pitch: 0,
  canvasContextAttributes:{antialias: true}
};
