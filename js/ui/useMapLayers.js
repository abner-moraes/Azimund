// estado de "Camadas do mapa": detalhes, projeção, mapa base, exagero do terreno e modelos 3D
import { useEffect, useState } from 'react';
import { setContextVisibility } from '../config/mapOverlays.js';
import { readPreferences, savePreference } from '../config/preferences.js';
import { getUserBasemap, setUserBasemap } from './basemapSwitcher.js';
import { setTerrainExaggeration } from './terrainToggle.js';
import { setModels3dEnabled } from '../core/models3dToggle.js';
import { isMapReady } from '../config/mapStyle.js';
import { readStored, writeStored } from '../config/storage.js';

const CONTEXT_KEY = 'azimund-map-context';
const NO_CONTEXT = { labels: false, boundaries: false, roads: false };

export function useMapLayers(map) {
  const [mapReady, setMapReady] = useState(() => isMapReady(map));
  const [contextVisibility, setContext] = useState(() =>
    readStored(CONTEXT_KEY, NO_CONTEXT),
  );
  const [basemap, setActiveBasemap] = useState(getUserBasemap);
  const [projection, setActiveProjection] = useState('globe');
  const [terrainExaggeration, setExaggeration] = useState(
    () => readPreferences().terrainExaggeration,
  );
  const [models3d, setModels3d] = useState(() => readPreferences().models3d);

  useEffect(() => {
    const ready = () => setMapReady(true);
    map.on('style.load', ready);
    return () => map.off('style.load', ready);
  }, [map]);

  useEffect(() => {
    if (!mapReady) return;
    setContextVisibility(map, contextVisibility);
    writeStored(CONTEXT_KEY, contextVisibility);
  }, [map, mapReady, contextVisibility]);

  return {
    mapReady,
    contextVisibility,
    changeContext: (key, checked) =>
      setContext((previous) => ({ ...previous, [key]: checked })),
    projection,
    changeProjection(event) {
      map.setProjection({ type: event.target.value });
      setActiveProjection(event.target.value);
    },
    basemap,
    changeBasemap(value) {
      setUserBasemap(map, value);
      setActiveBasemap(value);
    },
    terrainExaggeration,
    changeTerrainExaggeration(value) {
      setTerrainExaggeration(map, value);
      setExaggeration(savePreference('terrainExaggeration', value).terrainExaggeration);
    },
    models3d,
    changeModels3d(enabled) {
      setModels3dEnabled(map, enabled);
      setModels3d(savePreference('models3d', enabled).models3d);
    },
  };
}
