// lembra qual projeto o usuário editava por conta
// "ultimo" reabre ao clicar em Editar, "ativo" reabre o editor sozinho depois de recarregar a página
import { readStored, writeStored } from '../../config/storage.js';

const lastKey = (userId) => `azimund-editor-${userId}`;
const activeKey = (userId) => `azimund-editor-ativo-${userId}`;
// ids são texto, valores antigos foram salvos crus e o JSON.parse vira número
const asId = (value) => (value == null ? null : String(value));

export const readLastProject = (userId) =>
  userId ? asId(readStored(lastKey(userId))) : null;
export const readActiveProject = (userId) =>
  userId ? asId(readStored(activeKey(userId))) : null;

export function rememberProject(userId, id) {
  if (!userId) return;
  writeStored(lastKey(userId), id);
  writeStored(activeKey(userId), id);
}

export const setActiveProject = (userId, id) =>
  userId && writeStored(activeKey(userId), id || null);

export const forgetLastProject = (userId) =>
  userId && writeStored(lastKey(userId), null);
