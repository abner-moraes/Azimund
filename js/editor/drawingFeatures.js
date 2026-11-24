// estilos do terra-draw e conversão das features (projeto <-> terra-draw)
// separado do drawingEngine.js pra deixar os arquivos menores
import { getFeatureMode } from '../api/adapters/geojsonImport.js';
import { readThemeColor } from '../config/theme.js';

const numberProperty = (prop, defaultValue) => (f) =>
  f.properties[prop] ?? defaultValue;
const POINT_SIZES = { small: 5, medium: 8, large: 12 };

// estilos montados na criação do motor pq a cor padrão vem do vars.css
export function createStyles() {
  const mint = readThemeColor('--color-general-mint');
  const color = (prop) => (f) => f.properties[prop] || mint;
  return {
    polygon: {
      fillColor: color('fill'),
      fillOpacity: numberProperty('fill-opacity', 0.25),
      outlineColor: color('stroke'),
      outlineWidth: numberProperty('stroke-width', 2),
      outlineOpacity: numberProperty('stroke-opacity', 1),
    },
    // ponto com texto não desenha bolinha, so o rótulo (camada nativa)
    point: {
      pointColor: color('marker-color'),
      pointWidth: (f) =>
        f.properties.label ? 0 : POINT_SIZES[f.properties['marker-size']] || 8,
    },
    line: {
      lineStringColor: color('stroke'),
      lineStringWidth: numberProperty('stroke-width', 2),
      lineStringOpacity: numberProperty('stroke-opacity', 1),
    },
    selected: {
      selectedPolygonColor: color('fill'),
      selectedPolygonFillOpacity: numberProperty('fill-opacity', 0.25),
      selectedPolygonOutlineColor: color('stroke'),
      selectedPolygonOutlineWidth: numberProperty('stroke-width', 2),
      selectedLineStringColor: color('stroke'),
      selectedLineStringWidth: numberProperty('stroke-width', 2),
      selectedPointColor: color('marker-color'),
    },
  };
}

// terra-draw precisa de properties.mode; o projeto salva em properties.modo
export function prepareFeature(f) {
  const copy = structuredClone(f);
  copy.properties ||= {};
  copy.properties.modo ||= getFeatureMode(copy);
  copy.properties.mode =
    copy.geometry.type === 'Point'
      ? 'point'
      : copy.geometry.type === 'LineString'
        ? 'linestring'
        : 'polygon';
  return copy;
}
// tira as marcações internas do terra-draw antes de salvar; círculo ganha centro e raio em metros
export function cleanFeature(f) {
  const result = structuredClone(f);
  const p = result.properties;
  p.modo ||= p.mode;
  for (const name of [
    'selected',
    'selectionPoint',
    'midPoint',
    'coordinatePoint',
    'currentlyDrawing',
    'closingPoint',
    'snappingPoint',
    'edited',
    'mode',
  ])
    delete p[name];
  if (p.modo === 'circle' && result.geometry.type === 'Polygon') {
    const ring = result.geometry.coordinates[0].slice(0, -1);
    const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length,
      lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
    p.center = [lng, lat];
    // 111320 m ≈ 1 grau de latitude; na longitude encolhe com o cos da latitude
    const dx = (ring[0][0] - lng) * 111320 * Math.cos((lat * Math.PI) / 180),
      dy = (ring[0][1] - lat) * 111320;
    p.radius = Math.hypot(dx, dy);
  }
  return result;
}
