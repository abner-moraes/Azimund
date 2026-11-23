// modo servidor: as mesmas operações do localFiles, so que via API REST (/api/projetos)

import { getSessionUser } from '../session.js';
import { bestAttempt, saveAttempt } from '../attemptStorage.js';
const baseUrl = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
async function request(path, method = 'GET', body) {
  let response;
  try {
    response = await fetch(`${baseUrl}/api/projetos${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw {
      codigo: 'FALHA_REDE',
      mensagem: 'O servidor está indisponível tente novamente',
    };
  }
  const data = response.status === 204 ? {} : await response.json().catch(() => null);
  if (!response.ok || data === null)
    throw {
      codigo: data?.codigo || 'ERRO_HTTP',
      mensagem: data?.mensagem || `Servidor indisponível (${response.status}).`,
    };
  return data;
}
export const http = {
  capabilities: {
    localCopies: false,
  },
  listPublicProjects: () => request(''),
  listMyProjects: () => request('/minhas'),
  findProjectByCode: (code) => request(`/codigo/${encodeURIComponent(code)}`),
  loadProjectJson: (id) => request(`/${id}/json`),
  loadProjectGeojson: (id) => request(`/${id}/geojson`),
  createProject: (data) => request('', 'POST', data),
  saveProject: (id, data) => request(`/${id}`, 'PUT', data),
  deleteProject: (id) => request(`/${id}`, 'DELETE'),
  // com conta, o servidor (MySQL) acha o usuário pela sessão; visitante fica so no navegador
  getBestAttempt: async (id) =>
    getSessionUser()
      ? (await request(`/${id}/tentativas/melhor`)).melhor
      : bestAttempt(null, id),
  async submitAttempt(id, data) {
    const guest = !getSessionUser();
    const result = await request(`/${id}/tentativas`, 'POST', data);
    if (guest)
      result.salvamento = saveAttempt(null, { idProjeto: id, resultado: result });
    return result;
  },
  recordView: (id) => request(`/${id}/visualizacoes`, 'POST'),
};
