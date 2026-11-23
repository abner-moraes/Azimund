import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { readThemeColor } from './theme.js';

// PMTiles reads only the requested tiles through HTTP Range requests.
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

const OVERLAY_GROUPS = {
  labels: ['context-places', 'context-water', 'context-pois'],
  boundaries: ['context-boundaries'],
  roads: ['context-roads', 'context-road-names', 'context-neighbourhoods'],
};

export const contextSource = {
  type: 'vector',
  url: `pmtiles://${import.meta.env.VITE_PROTOMAPS_URL || 'https://data.source.coop/protomaps/openstreetmap/v4.pmtiles'}`,
  attribution:
    '<a href="https://protomaps.com">Protomaps</a> - <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
};

const name = ['coalesce', ['get', 'name:pt'], ['get', 'name'], ['get', 'name:en'], ''];
// as camadas sao montadas numa funcao pq as cores vem do vars.css (precisa do CSS ja carregado)
function label(textPaint, id, sourceLayer, minzoom, filter, extra = {}) {
  return {
    id,
    type: 'symbol',
    source: 'map-context',
    'source-layer': sourceLayer,
    minzoom,
    filter: [
      'all',
      ...(filter ? [filter] : []),
      ['<=', ['coalesce', ['get', 'min_zoom'], 0], ['zoom']],
    ],
    layout: {
      visibility: 'none',
      'text-field': name,
      'text-font': ['DM Sans Variable'],
      'text-size': 13,
      'text-max-width': 9,
      ...extra,
    },
    paint: textPaint,
  };
}
export function createContextLayers() {
  const textPaint = {
    'text-color': readThemeColor('--color-tertiary-ivory'),
    'text-halo-color': readThemeColor('--color-general-slate'),
    'text-halo-width': 1.5,
  };
  return [
    {
      id: 'context-roads',
      type: 'line',
      source: 'map-context',
      'source-layer': 'roads',
      minzoom: 6,
      filter: ['!=', ['get', 'kind'], 'rail'],
      layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': readThemeColor('--color-tertiary-road'),
        'line-opacity': 0.75,
        'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 14, 2, 18, 5],
      },
    },
    {
      id: 'context-boundaries',
      type: 'line',
      source: 'map-context',
      'source-layer': 'boundaries',
      layout: { visibility: 'none' },
      paint: {
        'line-color': readThemeColor('--color-tertiary-ivory'),
        'line-opacity': 0.8,
        'line-dasharray': [4, 2],
        'line-width': ['match', ['get', 'kind'], 'country', 1.7, 0.8],
      },
    },
    label(textPaint, 'context-road-names', 'roads', 12, null, {
      'symbol-placement': 'line',
      'text-size': 11,
    }),
    label(textPaint, 'context-water', 'water', 5, ['has', 'name'], { 'text-size': 12 }),
    label(textPaint, 'context-pois', 'pois', 15, ['has', 'name'], { 'text-size': 11 }),
    label(textPaint, 'context-neighbourhoods', 'places', 11, [
      'in',
      ['get', 'kind'],
      ['literal', ['neighbourhood', 'macrohood']],
    ]),
    label(
      textPaint,
      'context-places',
      'places',
      0,
      ['in', ['get', 'kind'], ['literal', ['country', 'region', 'locality']]],
      {
        'text-size': ['match', ['get', 'kind'], 'country', 18, 'region', 14, 13],
        'text-padding': 12,
      },
    ),
  ];
}

export function setContextVisibility(map, visibility) {
  for (const [group, ids] of Object.entries(OVERLAY_GROUPS)) {
    for (const id of ids) {
      if (map.getLayer(id))
        map.setLayoutProperty(id, 'visibility', visibility[group] ? 'visible' : 'none');
    }
  }
}
