//BACK END
// modo servidor, q as mesmas operações do localFiles, so que via API REST (/api/projetos)

import { getSessionUser } from '../session.js';
import { bestAttempt, saveAttempt } from '../attemptStorage.js';
import {
  fromPropriedades,
  toPropriedades,
  withPropriedades,
  gradeAttempt,
  toRespostasJson,
} from '../projectContract.js';
import { readThemeColor } from '../../config/theme.js';
//entrada do back: endereço do Spring vem do VITE_API_BASE_URL
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
      mensagem: 'O servidor está indisponível. Tente novamente.',
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
// o servidor guarda cor + âncora juntos em Projeto.propriedades (JSON);
// aqui desfaz isso pra o resto do front continuar usando item.cor / item.ancora
const unpackList = (items) => items.map(fromPropriedades);
const loadJson = async (id) => fromPropriedades(await request(`/${id}/json`));

//entrada do back: rotas de /api/projetos (listar, criar, salvar, excluir, tentativas e visualizações)
//entrada do back: estas rotas tem q responder SEM sessão (visitante deslogado) e pra qualquer conta:
//   GET /api/projetos/codigo/{codigo}  -> SELECT em Projeto pelo codigo, sem filtrar pelo autor (null/404 se não achar)
//   GET /api/projetos/{id}/json        -> SELECT em Projeto pelo id_projeto, sem filtrar pelo autor
//   GET /api/projetos/{id}/geojson     -> idem
//   POST /api/projetos/{id}/tentativas -> visitante pode enviar (id_usuario NULL na Tentativa)
// so salvar/excluir (PUT/DELETE) conferem se a sessão é do autor
// GET /api/projetos pode mandar tudo, o projectsService filtra o mapa (Equipe Azimund + do próprio usuário)
export const http = {
  capabilities: {
    localCopies: false,
  },
  listPublicProjects: async () => unpackList(await request('')),
  listMyProjects: async () => unpackList(await request('/minhas')),
  // código q não existe (404 / NAO_ENCONTRADO) vira null, ai a tela mostra "Nenhuma atividade com este código"
  async findProjectByCode(code) {
    try {
      return fromPropriedades(await request(`/codigo/${encodeURIComponent(code)}`));
    } catch (error) {
      if (error.codigo === 'NAO_ENCONTRADO') return null;
      throw error;
    }
  },
  loadProjectJson: loadJson,
  loadProjectGeojson: (id) => request(`/${id}/geojson`),
  createProject: ({ ancora }) =>
    request('', 'POST', {
      propriedades: toPropriedades({
        cor: readThemeColor('--color-general-mint'),
        ancora,
      }),
    }),
  saveProject: async (id, { json, geojson }) =>
    fromPropriedades(
      await request(`/${id}`, 'PUT', { json: withPropriedades(json), geojson }),
    ),
  deleteProject: (id) => request(`/${id}`, 'DELETE'),
  // com conta, o servidor (MySQL) acha o usuário pela sessão; visitante fica so no navegador
  getBestAttempt: async (id) =>
    getSessionUser()
      ? (await request(`/${id}/tentativas/melhor`)).melhor
      : bestAttempt(null, id),
  // manda acertos e erros juntos em "respostas" (coluna Tentativa.respostas)
  async submitAttempt(id, { respostas: answers = {} } = {}) {
    const guest = !getSessionUser();
    const result = gradeAttempt(await loadJson(id), answers);
    const saved = await request(`/${id}/tentativas`, 'POST', {
      respostas: toRespostasJson(result),
    });
    const merged = { ...result, ...saved };
    if (guest)
      merged.salvamento = saveAttempt(null, { idProjeto: id, resultado: result });
    return merged;
  },
  recordView: (id) => request(`/${id}/visualizacoes`, 'POST'),
};
