// camadas nativas que desenham os objetos de uma atividade (no jogo e de apoio no editor)
import { readThemeColor } from '../config/theme.js';
import { CAMERA_DURATION } from '../api/projectContract.js';

export function createActivityLayer(map, geojson, { prefix = 'atividade' } = {}) {
  const SOURCE = `${prefix}-features`;
  const LAYERS = ['fill', 'outline', 'line', 'point', 'label', 'extrusion'].map(
    (name) => `${prefix}-${name}`,
  );
  const mint = readThemeColor('--color-general-mint');
  const ivory = readThemeColor('--color-tertiary-ivory');
  const navy = readThemeColor('--color-general-navy');
  // o id vai pra properties pq o filtro das camadas não consegue ler o feature.id
  const data = {
    ...geojson,
    features: geojson.features.map(({ id, ...feature }) => ({
      ...feature,
      properties: { ...feature.properties, _azimundId: id },
    })),
  };
  let ids = [];
  const geometry = (type) => ['==', ['geometry-type'], type];
  const selected = () => ['in', ['get', '_azimundId'], ['literal', ids]];
  const filters = [
    geometry('Polygon'),
    geometry('Polygon'),
    geometry('LineString'),
    ['all', geometry('Point'), ['==', ['coalesce', ['get', 'label'], ''], '']],
    ['all', geometry('Point'), ['!=', ['coalesce', ['get', 'label'], ''], '']],
    ['all', geometry('Polygon'), ['>', ['coalesce', ['get', 'altura'], 0], 0]],
  ];

  function install() {
    if (!map.getSource(SOURCE))
      map.addSource(SOURCE, { type: 'geojson', data, promoteId: '_azimundId' });
    const layers = [
      {
        id: LAYERS[0],
        type: 'fill',
        paint: {
          'fill-color': ['coalesce', ['get', 'fill'], mint],
          'fill-opacity': ['coalesce', ['get', 'fill-opacity'], 0.2],
        },
      },
      {
        id: LAYERS[1],
        type: 'line',
        paint: {
          'line-color': ['coalesce', ['get', 'stroke'], mint],
          'line-width': ['coalesce', ['get', 'stroke-width'], 2],
          'line-opacity': ['coalesce', ['get', 'stroke-opacity'], 1],
        },
      },
      {
        id: LAYERS[2],
        type: 'line',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['coalesce', ['get', 'stroke'], mint],
          'line-width': ['coalesce', ['get', 'stroke-width'], 3],
          'line-opacity': ['coalesce', ['get', 'stroke-opacity'], 1],
        },
      },
      {
        id: LAYERS[3],
        type: 'circle',
        paint: {
          'circle-color': ['coalesce', ['get', 'marker-color'], mint],
          'circle-radius': [
            'match',
            ['get', 'marker-size'],
            'small',
            5,
            'large',
            12,
            8,
          ],
          'circle-stroke-color': ivory,
          'circle-stroke-width': 2,
        },
      },
      {
        id: LAYERS[4],
        type: 'symbol',
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['literal', ['DM Sans Variable', 'Arial', 'sans-serif']],
          'text-size': ['coalesce', ['get', 'label-size'], 16],
          'text-allow-overlap': true,
          'text-max-width': 14,
        },
        paint: {
          'text-color': ['coalesce', ['get', 'label-color'], ivory],
          'text-halo-color': navy,
          'text-halo-width': 2,
        },
      },
      {
        id: LAYERS[5],
        type: 'fill-extrusion',
        paint: {
          'fill-extrusion-color': ['coalesce', ['get', 'fill'], mint],
          'fill-extrusion-height': ['coalesce', ['get', 'altura'], 0],
          'fill-extrusion-opacity': 0.7,
        },
      },
    ];
    layers.forEach((layer, i) => {
      if (!map.getLayer(layer.id))
        map.addLayer({
          ...layer,
          source: SOURCE,
          filter: ['all', selected(), filters[i]],
        });
    });
  }

  function show(page) {
    ids = page.featureIds || [];
    install();
    LAYERS.forEach((id, i) => map.setFilter(id, ['all', selected(), filters[i]]));
    if (page.camera) flyToPage(map, page.camera);
  }

  map.on('style.load', install);
  install();
  return {
    show,
    remove() {
      map.off('style.load', install);
      [...LAYERS].reverse().forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource(SOURCE)) map.removeSource(SOURCE);
    },
  };
}

// reserva o espaço do painel da esquerda pra câmera centralizar no que sobra do mapa
function panelPadding() {
  const panel = document.getElementById('activity-panel');
  return {
    left: Math.ceil(panel?.getBoundingClientRect().right || 396) + 24,
    right: 100,
    top: 32,
    bottom: 32,
  };
}

export function flyToPage(map, camera) {
  map.flyTo({
    center: camera.centro,
    zoom: camera.zoom,
    pitch: camera.pitch,
    bearing: camera.bearing,
    duration: camera.duracaoMs ?? CAMERA_DURATION,
    padding: panelPadding(),
    retainPadding: false,
  });
}
