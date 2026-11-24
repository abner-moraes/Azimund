import React from 'react';
import { createRoot } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import '../css/base.css';
import '../css/ui.css';
import '../css/ui-panels.css';
import '../css/map.css';
import { initSpaceEffects } from './core/spaceEffects.js';
import { createMapStyle, MAP_VIEW_OPTIONS } from './config/mapStyle.js';
import { initModels3d } from './core/models3dToggle.js';
import { readPreferences } from './config/preferences.js';
import { addMarkers } from './ui/markerLayer.js';

import { initTerrain } from './ui/terrainToggle.js';
import { MapInterface } from './ui/MapInterface.jsx';

const map = new maplibregl.Map({
  container: 'map',
  style: createMapStyle(),
  ...MAP_VIEW_OPTIONS,
});

// a atribuição do maplibre abre expandida; fecha ela assim que aparece pela 1a vez
function collapseAttribution() {
  const box = map.getContainer().querySelector('.maplibregl-ctrl-attrib');
  if (!box?.classList.contains('maplibregl-compact-show')) return;
  box.classList.remove('maplibregl-compact-show');
  box.removeAttribute('open');
  map.off('sourcedata', collapseAttribution);
  map.off('styledata', collapseAttribution);
}
map.on('sourcedata', collapseAttribution);
map.on('styledata', collapseAttribution);

initSpaceEffects(map);

const markerLayer = addMarkers(map);

initTerrain(map);

createRoot(document.getElementById('root')).render(
  <MapInterface map={map} markerLayer={markerLayer} />,
);

initModels3d(map, readPreferences().models3d);
