// Connects the React options to the layers already defined in config/mapStyle.js.
const BASEMAP_LAYERS = {
  satellite: 'satellite',
  terrain: 'eox-terrain', 'terrain-light': 'eox-terrain-light'
};

export function setBasemap(map, key) {
  const activeLayerId = BASEMAP_LAYERS[key];
  Object.values(BASEMAP_LAYERS).forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', layerId === activeLayerId ? 'visible' : 'none');
    }
  });
}
