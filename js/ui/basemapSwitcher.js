// mapa base do usuário x mapa base de cada página da atividade
import { BASEMAP_KEYS, DEFAULT_BASEMAP } from '../config/basemapOptions.js';

// opção do dropdown -> id da camada em config/mapStyle.js
const BASEMAP_LAYERS = {
  'satellite-2025': 'satellite-2025',
  'satellite-2020': 'satellite-2020',
  terrain: 'eox-terrain',
  'terrain-light': 'eox-terrain-light',
};

let userBasemap = DEFAULT_BASEMAP;

function setBasemap(map, key) {
  const activeLayerId = BASEMAP_LAYERS[key];
  Object.values(BASEMAP_LAYERS).forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(
        layerId,
        'visibility',
        layerId === activeLayerId ? 'visible' : 'none',
      );
    }
  });
}

export const getUserBasemap = () => userBasemap;

// escolha do "Camadas do mapa", vale qd a página deixou "Padrão"
export function setUserBasemap(map, key) {
  if (!BASEMAP_KEYS.includes(key)) return;
  userBasemap = key;
  setBasemap(map, key);
}

// página com mapa base próprio usa o dela, senão volta pro do usuário
export function applyPageBasemap(map, key) {
  setBasemap(map, BASEMAP_KEYS.includes(key) ? key : userBasemap);
}

export const restoreUserBasemap = (map) => setBasemap(map, userBasemap);
