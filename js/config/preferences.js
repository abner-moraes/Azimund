// preferências deste navegador, lidas antes do React montar (terreno e modelos 3D já entram certos)
import { readStored, writeStored } from './storage.js';

const STORAGE_KEY = 'azimund-preferencias';

export const TERRAIN_EXAGGERATION = Object.freeze({
  min: 0,
  max: 5,
  step: 0.5,
  default: 2.5,
});

const DEFAULTS = Object.freeze({
  terrainExaggeration: TERRAIN_EXAGGERATION.default,
  // camada Three.js começa desligada
  models3d: false,
});

function sanitize(stored) {
  const value = Number(stored?.terrainExaggeration);
  const validExaggeration =
    Number.isFinite(value) &&
    value >= TERRAIN_EXAGGERATION.min &&
    value <= TERRAIN_EXAGGERATION.max;
  return {
    terrainExaggeration: validExaggeration ? value : DEFAULTS.terrainExaggeration,
    models3d:
      typeof stored?.models3d === 'boolean' ? stored.models3d : DEFAULTS.models3d,
  };
}

// valor salvo inválido ou ausente volta pro padrão
export function readPreferences() {
  return sanitize(readStored(STORAGE_KEY));
}

export function savePreference(key, value) {
  const next = sanitize({ ...readPreferences(), [key]: value });
  writeStored(STORAGE_KEY, next);
  return next;
}
