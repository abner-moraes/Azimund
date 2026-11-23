import { TERRAIN_SOURCE } from '../api/terrain.js';
import { readPreferences } from '../config/preferences.js';

export function initTerrain(map) {
  map.on('style.load', () => {
    if (!map.getSource('terrain')) {
      map.addSource('terrain', TERRAIN_SOURCE);
    }
    setTerrainExaggeration(map, readPreferences().terrainExaggeration);
  });
}

export function setTerrainExaggeration(map, exaggeration) {
  if (!map.getSource('terrain')) return;
  map.setTerrain(exaggeration > 0 ? { source: 'terrain', exaggeration } : null); // exagero 0 so desliga o relevo
}
