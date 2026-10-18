import { TERRAIN_SOURCE } from '../api/terrain.js';

// Adds the elevation source and enables 3D terrain once the style is ready.
export function initTerrain(map) {
  map.on('style.load', () => {
    if (!map.getSource('terrain')) {
      map.addSource('terrain', TERRAIN_SOURCE);
    }
    map.setTerrain({
      source: 'terrain',
      exaggeration: 1.5
    });
  });
}
