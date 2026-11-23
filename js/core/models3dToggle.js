// liga/desliga a camada Three.js dos modelos GLTF (Configurações, desligado por padrão)
import { customLayer } from './ThreeModelLayer.js';
import { isMapReady } from '../config/mapStyle.js';
let enabled = false;

function sync(map) {
  if (!isMapReady(map)) return; // antes do estilo carregar não da pra mexer em camadas
  const present = !!map.getLayer(customLayer.id);
  if (enabled && !present) map.addLayer(customLayer);
  else if (!enabled && present) map.removeLayer(customLayer.id);
}

export function initModels3d(map, initiallyEnabled) {
  enabled = initiallyEnabled;
  map.on('style.load', () => sync(map)); // style.load refaz o estilo inteiro, a camada precisa voltar
  sync(map);
}

export function setModels3dEnabled(map, value) {
  enabled = value;
  sync(map);
}
