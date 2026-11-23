import { contextSource, createContextLayers } from './mapOverlays.js';
import { BASEMAP_TILE_SOURCES } from '../api/basemaps.js';
import { readThemeColor } from './theme.js';

// estilo inteiro do mapa: fontes de tiles, camadas base e o ceu/neblina do globo
export function createMapStyle() {
  return {
    version: 8,
    projection: {
      type: 'globe',
    },
    sources: {
      'map-context': contextSource,
      'satellite-2025': BASEMAP_TILE_SOURCES['satellite-2025'],
      'satellite-2020': BASEMAP_TILE_SOURCES['satellite-2020'],
      'eox-terrain': BASEMAP_TILE_SOURCES['eox-terrain'],
      'eox-terrain-light': BASEMAP_TILE_SOURCES['eox-terrain-light'],
    },
    layers: [
      {
        id: 'satellite-2025',
        type: 'raster',
        source: 'satellite-2025',
      },
      {
        id: 'satellite-2020',
        type: 'raster',
        source: 'satellite-2020',
        layout: { visibility: 'none' },
      },
      {
        id: 'eox-terrain',
        type: 'raster',
        source: 'eox-terrain',
        layout: { visibility: 'none' },
      },
      {
        id: 'eox-terrain-light',
        type: 'raster',
        source: 'eox-terrain-light',
        layout: { visibility: 'none' },
      },
      ...createContextLayers(),
    ],
    sky: {
      // https://maplibre.org/maplibre-gl-js/docs/examples/sky-fog-terrain/
      'sky-color': readThemeColor('--color-tertiary-space'),
      'horizon-color': readThemeColor('--color-tertiary-horizon'),
      'fog-color': readThemeColor('--color-tertiary-fog'),
      'sky-horizon-blend': 0.5,
      'horizon-fog-blend': 0.6,
      'fog-ground-blend': 0.85,
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.7, 5, 0.85, 7, 0],
    },
    light: {
      anchor: 'map',
      position: [100, 90, 180],
    },
  };
}

// posição inicial do globo (atual so ta no RS)
// center: [60, 25] = Eurafrásia, center: [-80, 15] = Américas
export const MAP_VIEW_OPTIONS = {
  zoom: 6,
  center: [-52.5, -30],
  maxPitch: 89.9,
  pitch: 45,
  bearing: -25,
  canvasContextAttributes: { antialias: true },
  attributionControl: { compact: true },
};

// 'satellite-2025' é a primeira camada do estilo: se ela existe, o estilo ja carregou
// (map.isStyleLoaded() fica false enquanto tiles carregam, por isso não serve aqui)
export const isMapReady = (map) => !!map.getLayer('satellite-2025');
