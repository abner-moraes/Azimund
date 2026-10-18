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
    'atmosphere-blend': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 0.8,
      5, 1.0,
      7, 0
    ]
  },
  light: {
    anchor: 'map',
    position: [15, 90, 180]
  }
};



// posição inicial do mapa e td mais (MUDAR)
export const MAP_VIEW_OPTIONS = {
  zoom: 3.5,
  center: [30, 40],
  maxPitch: 89,
  pitch: 11,
  canvasContextAttributes:{antialias: true}
};
