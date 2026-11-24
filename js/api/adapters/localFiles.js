// modo local, le os arquivos publicados em public/data e sobrepõe as cópias de trabalho
// salvas no IndexedDB (localCopies.js); a leitura/busca fica em localCatalog.js
import {
  clone,
  toIndexItem,
  emptyFeatureCollection,
  gradeAttempt,
  isQuestionComplete,
  toRespostasJson,
} from '../projectContract.js';
import { getSessionUser, requireSessionUser } from '../session.js';
import * as copyStore from './localCopies.js';
import { saveAttempt, bestAttempt } from '../attemptStorage.js';
import { readThemeColor } from '../../config/theme.js';
import {
  fetchDataFile,
  loadPublishedIndex,
  findWorkingCopy,
  loadCatalogJson as loadJson,
  listCatalog,
} from './localCatalog.js';
async function saveProject(id, { json, geojson }) {
  const user = requireSessionUser();
  const previousProject = await loadJson(id);
  if (previousProject.autor.id !== user.id)
    throw {
      codigo: 'SEM_PERMISSAO',
      mensagem: 'Somente o autor pode editar esta atividade.',
    };
  const data = {
    ...clone(json),
    idProjeto: id,
    codigo: previousProject.codigo,
    autor: previousProject.autor,
    horarioCriado: previousProject.horarioCriado || new Date().toISOString(),
    horarioModificado: new Date().toISOString(),
  };
  data.tipo = toIndexItem(data).tipo;
  await copyStore.putCopy({
    chave: `${user.id}:${id}`,
    owner: user.id,
    json: data,
    geojson: clone(geojson),
  });
  return clone(data);
}
async function createProjectUnlocked(ancora) {
  const user = requireSessionUser();
  const publishedProjects = await loadPublishedIndex();
  const copies = await copyStore.getAllCopies();
  const ids = [
    ...publishedProjects.map((item) => item.id),
    ...copies.map((copy) => copy.json.idProjeto),
  ];
  const lastKnownId = ids.reduce((a, b) => (BigInt(b) > a ? BigInt(b) : a), 0n);
  const id = await copyStore.reserveProjectId(lastKnownId);
  const codes = new Set([
    ...publishedProjects.map((item) => item.codigo),
    ...copies.map((copy) => copy.json.codigo),
  ]);
  let code;
  do {
    const n = crypto.getRandomValues(new Uint32Array(1))[0];
    code = String(100000 + (n % 900000));
  } while (codes.has(code));
  const timestamp = new Date().toISOString();
  const json = {
    idProjeto: id,
    codigo: code,
    titulo: `Projeto sem título (${id})`,
    descricao: '',
    cor: readThemeColor('--color-general-mint'),
    tipo: 'RASCUNHO',
    ancora,
    autor: { id: user.id, nome: user.nome },
    paginas: [],
    horarioCriado: timestamp,
    horarioModificado: timestamp,
  };
  await copyStore.putCopy({
    chave: `${user.id}:${id}`,
    owner: user.id,
    json,
    geojson: emptyFeatureCollection(),
  });
  return { id, codigo: code };
}
export const localFiles = {
  capabilities: {
    localCopies: true,
  },
  // lista completa (todas as contas deste navegador); o mapa filtra no projectsService
  listPublicProjects: listCatalog,
  async listMyProjects() {
    const user = requireSessionUser();
    return (await listCatalog()).filter((item) => item.autor.id === user.id);
  },
  // busca pelo código em todas as atividades, com conta ou sem conta
  async findProjectByCode(code) {
    return (await listCatalog()).find((item) => item.codigo === code) || null;
  },
  loadProjectJson: loadJson,
  async loadProjectGeojson(id) {
    const copy = await findWorkingCopy(id);
    if (copy?.excluido)
      throw {
        codigo: 'NAO_ENCONTRADO',
        mensagem: 'Atividade excluída.',
      };
    return copy ? clone(copy.geojson) : fetchDataFile(`atividade_${id}.geojson`);
  },
  async createProject({ ancora }) {
    // o lock evita que duas abas criem projeto ao mesmo tempo e peguem o mesmo id/código
    if (navigator.locks)
      return navigator.locks.request('azimund-criar-projeto', () =>
        createProjectUnlocked(ancora),
      );
    return createProjectUnlocked(ancora);
  },
  saveProject,

  async deleteProject(id) {
    const user = requireSessionUser();
    const json = await loadJson(id);
    if (json.autor.id !== user.id)
      throw {
        codigo: 'SEM_PERMISSAO',
        mensagem: 'Somente o autor pode excluir.',
      };
    await copyStore.putCopy({
      chave: `${user.id}:${id}`,
      owner: user.id,
      json,
      excluido: true,
    });
    return {
      excluido: true,
    };
  },
  async discardLocalCopy(id) {
    const user = requireSessionUser();
    await copyStore.deleteCopy(user.id, id);
  },
  getBestAttempt: (id) => bestAttempt(getSessionUser(), id),
  async submitAttempt(id, { respostas: answers = {} } = {}) {
    const json = await loadJson(id);
    const result = gradeAttempt(json, answers);
    const user = getSessionUser();
    const questions = json.paginas.filter(
      (item) => item.tipo === 'questao' && isQuestionComplete(item),
    );
    if (result.total !== questions.length) return result;
    return {
      ...result,
      salvamento: saveAttempt(user, {
        idProjeto: id,
        tituloProjeto: json.titulo,
        // mesmo formato da coluna Tentativa.respostas do back-end
        respostas: toRespostasJson(result),
        resultado: result,
      }),
    };
  },
  // visualizações so são contadas no servidor
  async recordView() {
    return { registrada: false };
  },
};
