// motor de desenho do editor em cima do terra-draw (https://terradraw.io/)
// objetos grandes demais ou inválidos ficam numa camada nativa somente leitura
import {
  TerraDraw,
  TerraDrawPointMode,
  TerraDrawLineStringMode,
  TerraDrawPolygonMode,
  TerraDrawRectangleMode,
  TerraDrawCircleMode,
  TerraDrawFreehandMode,
  TerraDrawSelectMode,
} from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import { SnapshotHistory } from './SnapshotHistory.js';
import { getFeatureMode, isOversized } from '../api/adapters/geojsonImport.js';
import { readThemeColor } from '../config/theme.js';
import { createActivityLayer } from '../ui/activityLayer.js';

const numberProperty = (prop, defaultValue) => (f) =>
  f.properties[prop] ?? defaultValue;
const POINT_SIZES = { small: 5, medium: 8, large: 12 };

// estilos montados na criação do motor pq a cor padrão vem do vars.css
function createStyles() {
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
function prepareFeature(f) {
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
function cleanFeature(f) {
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
export function createDrawingEngine(map, { onChange, onSelect, onError }) {
  let suspended = null; // snapshot guardado enquanto mostra so uma página (draw parado)
  let mute = false; // ignora os eventos que o próprio load() dispara
  let readonly = [];
  let readonlyIds = new Set();
  let nativeLayer = null;
  let timer;
  let disposed = false;
  const styles = createStyles();
  const history = new SnapshotHistory({
    type: 'FeatureCollection',
    features: [],
  });
  const flags = {};
  for (const name of [
    'point',
    'linestring',
    'polygon',
    'rectangle',
    'circle',
    'freehand',
  ])
    flags[name] = {
      feature: {
        draggable: true,
        coordinates: {
          draggable: true,
          midpoints: true,
          deletable: true,
        },
      },
    };
  const draw = new TerraDraw({
    idStrategy: {
      getId: () => crypto.randomUUID(),
      isValidId: (id) => typeof id === 'string' && id.length > 0,
    },
    adapter: new TerraDrawMapLibreGLAdapter({
      map,
      coordinatePrecision: 7,
    }),
    modes: [
      new TerraDrawSelectMode({
        flags,
        styles: styles.selected,
      }),
      new TerraDrawPointMode({ styles: styles.point }),
      new TerraDrawLineStringMode({ styles: styles.line }),
      new TerraDrawPolygonMode({ styles: styles.polygon }),
      new TerraDrawRectangleMode({ styles: styles.polygon }),
      new TerraDrawCircleMode({ styles: styles.polygon, segments: 64 }),
      new TerraDrawFreehandMode({ styles: styles.polygon }),
    ],
  });
  draw.start();
  draw.setMode('select');
  const snapshot = () =>
    suspended
      ? structuredClone(suspended)
      : {
          type: 'FeatureCollection',
          features: [
            ...draw
              .getSnapshot()
              .filter(
                (f) =>
                  !f.properties.selectionPoint &&
                  !f.properties.midPoint &&
                  !f.properties.currentlyDrawing,
              )
              .map(cleanFeature),
            ...structuredClone(readonly),
          ],
        };
  // textos e extrusões 3D o terra-draw não desenha, então vão numa camada nativa auxiliar
  function nativeLabels(data) {
    nativeLayer?.remove();
    const features = [
      ...readonly,
      ...data.features.filter(
        (f) =>
          !readonlyIds.has(f.id) && (f.properties?.label || f.properties?.altura > 0),
      ),
    ];
    nativeLayer = createActivityLayer(
      map,
      {
        type: 'FeatureCollection',
        features,
      },
      {
        prefix: 'editor-aux',
      },
    );
    nativeLayer.show({
      featureIds: features.map((f) => f.id),
    });
  }
  // grande demais: o histórico recomeça em vez de guardar cópias pesadas
  function record(data) {
    if (isOversized(data.features)) history.reset(data);
    else history.push(data);
  }
  function notify(shouldRecord = true) {
    if (mute || disposed) return;
    const data = snapshot();
    if (shouldRecord) record(data);
    nativeLabels(data);
    onChange(data, {
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      readOnlyIds: [...readonlyIds],
    });
  }
  // espera o usuário parar de arrastar (350ms) antes de salvar no histórico
  function settled() {
    clearTimeout(timer);
    timer = setTimeout(() => notify(), 350);
  }
  draw.on('change', settled);
  draw.on('finish', () => {
    clearTimeout(timer);
    notify();
  });
  draw.on('select', (id) => onSelect(String(id)));
  draw.on('deselect', () => onSelect(null));
  function load(data, { record: shouldRecord = false, reset = false } = {}) {
    mute = true;
    clearTimeout(timer);
    draw.setMode('select');
    draw.clear();
    const oversized = isOversized(data.features);
    readonly = oversized ? structuredClone(data.features) : [];
    readonlyIds = new Set(readonly.map((f) => f.id));
    if (!oversized) {
      const features = data.features.map(prepareFeature);
      const result = draw.addFeatures(features);
      const invalidFeatures = result
        .map((r, i) => (r.valid ? null : features[i]))
        .filter(Boolean);
      if (invalidFeatures.length) {
        readonly = invalidFeatures.map(cleanFeature);
        readonlyIds = new Set(readonly.map((f) => f.id));
        onError?.({
          mensagem: `${invalidFeatures.length} objeto(s) mantidos em camada somente leitura.`,
        });
      }
    }
    mute = false;
    if (reset) history.reset(data);
    if (shouldRecord) record(data);
    notify(false);
  }
  return {
    load,
    setMode(mode) {
      draw.setMode(mode === 'text' ? 'point' : mode);
    },
    select(id) {
      if (readonlyIds.has(id)) {
        onSelect(id);
        return;
      }
      draw.setMode('select');
      draw.selectFeature(id);
    },
    properties(id, props) {
      if (readonlyIds.has(id)) return;
      draw.updateFeatureProperties(id, props);
      settled();
    },
    remove(id) {
      if (readonlyIds.has(id)) {
        readonly = readonly.filter((f) => f.id !== id);
        readonlyIds.delete(id);
      } else draw.removeFeatures([id]);
      notify();
    },
    undo() {
      const value = history.undo();
      if (value) load(value);
    },
    redo() {
      const value = history.redo();
      if (value) load(value);
    },
    showPage(ids) {
      if (!suspended) {
        suspended = snapshot();
        mute = true;
        clearTimeout(timer);
        draw.stop();
        mute = false;
      }
      nativeLayer?.remove();
      nativeLayer = createActivityLayer(map, suspended, {
        prefix: 'editor-aux',
      });
      nativeLayer.show({ featureIds: ids });
    },
    resume() {
      if (suspended) {
        const data = suspended;
        suspended = null;
        mute = true;
        draw.start();
        mute = false;
        load(data);
      }
    },
    dispose() {
      disposed = true;
      clearTimeout(timer);
      nativeLayer?.remove();
      if (draw.enabled) draw.stop();
    },
  };
}
