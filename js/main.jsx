import React from 'react';
import { createRoot } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css';
import '../css/base.css';
import '../css/ui.css';
import '../css/map.css';
import { initSpaceEffects } from './core/spaceEffects.js';
import { createMapStyle, MAP_VIEW_OPTIONS } from './config/mapStyle.js';
import { ZoomVisibilityManager } from './core/ZoomVisibilityManager.js';
import { stopOrbit } from './core/cameraOrbit.js';
import { customLayer } from './core/ThreeModelLayer.js';
import { addMarkers } from './ui/markerLayer.js';
import { initDrawTools } from './ui/drawTools.js';
import { initTerrain } from './ui/terrainToggle.js';
import { MapInterface } from './ui/MapInterface.jsx';

const map = new maplibregl.Map({container: 'map', style: createMapStyle(), ...MAP_VIEW_OPTIONS }); // initializes the map

initSpaceEffects(map);

const zoomVisibility = new ZoomVisibilityManager(map);

// initializes the UI
addMarkers(map, zoomVisibility);
const draw = initDrawTools(map);
initTerrain(map);

createRoot(document.getElementById('root')).render(
  <MapInterface map={map} draw={draw} />
);


// any manual drag takes control back from the auto-orbit
map.on('dragstart', stopOrbit);

map.on('style.load', () => {
  if (!map.getLayer('3d-model')) {
    map.addLayer(customLayer);
  }
});

