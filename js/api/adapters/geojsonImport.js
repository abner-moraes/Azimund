// converte um GeoJSON externo pro formato do editor (FeatureCollection WGS84, ids únicos, properties.modo)
import { validateGeojson, invalidField, assertWgs84 } from '../projectContract.js';
import { LIMITS } from '../../config/limits.js';
// qual ferramenta do editor reabre o objeto ('mode' é o nome que o terra-draw usa)
export function getFeatureMode(feature) {
  const geometry = feature.geometry?.type;
  const mode = feature.properties?.modo || feature.properties?.mode;
  if (
    ['point', 'linestring', 'polygon', 'rectangle', 'circle', 'freehand'].includes(mode)
  )
    return mode;
  return geometry === 'Point'
    ? 'point'
    : geometry === 'LineString'
      ? 'linestring'
      : 'polygon';
}
// conta vértices descendo pelos arrays até achar um par [lng, lat]
function countVertices(features) {
  const count = (coords) =>
    Array.isArray(coords)
      ? typeof coords[0] === 'number'
        ? 1
        : coords.reduce((sum, c) => sum + count(c), 0)
      : 0;
  return features.reduce((sum, f) => sum + count(f.geometry?.coordinates), 0);
}

// grande demais pro terra-draw editar: vira camada nativa somente leitura
export function isOversized(features) {
  return (
    features.length > LIMITS.editableFeatures ||
    countVertices(features) > LIMITS.editableVertices
  );
}
export function normalizeGeojson(data) {
  if (data?.type === 'Feature')
    data = {
      type: 'FeatureCollection',
      features: [data],
    };
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features))
    invalidField('geojson', 'use uma FeatureCollection');
  assertWgs84(data); // checa aqui pq a coleção nova abaixo não leva o crs
  const features = [],
    warnings = [],
    ids = new Set();
  let ignoredCollections = 0;
  for (const f of data.features) {
    if (f.geometry?.type === 'GeometryCollection') {
      ignoredCollections++;
      continue;
    }
    const geometry = f.geometry;
    if (!geometry) invalidField('geometry', 'geometria ausente');
    // Multi* vira várias features simples (ids "<id>-1", "<id>-2"...), o editor edita uma geometria por objeto
    const multi = geometry.type.startsWith('Multi');
    const parts = multi ? geometry.coordinates : [geometry.coordinates];
    const type = multi ? geometry.type.slice(5) : geometry.type;
    for (const [i, coordinates] of parts.entries()) {
      let id =
        f.id == null ? crypto.randomUUID() : `${f.id}${multi ? `-${i + 1}` : ''}`;
      if (ids.has(id)) id = crypto.randomUUID();
      ids.add(id);
      const feature = {
        type: 'Feature',
        id,
        geometry: {
          type,
          coordinates,
        },
        properties: {
          ...(f.properties || {}),
        },
      };
      feature.properties.modo = getFeatureMode(feature);
      features.push(feature);
    }
  }
  if (ignoredCollections)
    warnings.push(`${ignoredCollections} GeometryCollection ignorada(s).`);
  const geojson = {
    type: 'FeatureCollection',
    features,
  };
  validateGeojson(geojson);
  const readOnly = isOversized(features);
  if (readOnly)
    warnings.push(
      'Importação grande: camada nativa do mapa somente leitura. Histórico reiniciado.',
    );
  return { geojson, warnings, readOnly };
}
