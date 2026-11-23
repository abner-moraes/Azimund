// porta de entrada dos dados, valida tudo e repassa pro adaptador (local ou http)
// tbm cria/le o pacote .azmd (exportProjectPackage / importProjectPackage)
import { getSessionUser, requireSessionUser, isProjectAuthor } from './session.js';
import { localFiles } from './adapters/localFiles.js';
import { http } from './adapters/http.js';
import {
  importGeojson,
  exportGeojson,
  downloadFile,
} from './adapters/fileTransfers.js';
import {
  createAzmdPackage,
  readAzmdPackage,
  azmdFileName,
} from './adapters/azmdPackage.js';
import { LIMITS } from '../config/limits.js';
import {
  validateProjectJson,
  validateGeojson,
  validateAncora,
  assertNumericId,
  assertPageFeatures,
  clone,
  megabytes,
  normalizeProjectJson,
  TEAM_AUTHOR_ID,
} from './projectContract.js';
export { getProjectType, isQuestionComplete } from './projectContract.js';
export { setSessionUser, getSessionUser, isProjectAuthor } from './session.js';
export { importGeojson, exportGeojson };

const adapter = import.meta.env?.VITE_API_MODE === 'http' ? http : localFiles;
export const capabilities = adapter.capabilities;

// avisa as telas (lista de projetos, marcadores) quando algo foi criado/salvo/excluido
const events = new EventTarget();
export function subscribeToProjects(fn) {
  events.addEventListener('change', fn);
  return () => events.removeEventListener('change', fn);
}
const changed = () => events.dispatchEvent(new Event('change'));

async function callAdapter(method, ...args) {
  try {
    return await adapter[method](...args);
  } catch (error) {
    throw error?.codigo
      ? error
      : {
          codigo: 'FALHA_REDE',
          mensagem: error?.message || 'Não foi possível concluir a operação.',
        };
  }
}

export async function listPublicProjects() {
  const items = await callAdapter('listPublicProjects');
  return getSessionUser()
    ? items
    : items.filter((item) => String(item.autor?.id) === TEAM_AUTHOR_ID);
}
export const getBestAttempt = (id) => callAdapter('getBestAttempt', id);
export const listMyProjects = () => callAdapter('listMyProjects');
export async function findProjectByCode(code) {
  if (!/^\d{6}$/.test(code))
    throw {
      codigo: 'CODIGO_INVALIDO',
      mensagem: 'digite um código de 6 dígitos.',
    };
  return callAdapter('findProjectByCode', code);
}
export async function loadProjectJson(id) {
  assertNumericId(id);
  const data = await callAdapter('loadProjectJson', id);
  validateProjectJson(data);
  return data;
}
export async function loadProjectGeojson(id) {
  assertNumericId(id);
  const data = await callAdapter('loadProjectGeojson', id);
  validateGeojson(data);
  return data;
}
export async function createProject(data) {
  validateAncora(data.ancora);
  const result = await callAdapter('createProject', data);
  changed();
  return result;
}
export async function saveProject(id, data) {
  assertNumericId(id);
  validateProjectJson(data.json);
  validateGeojson(data.geojson);
  if (data.json.idProjeto !== id)
    throw {
      codigo: 'DADOS_INVALIDOS',
      mensagem: 'idProjeto não corresponde ao projeto',
    };
  assertPageFeatures(data.json, data.geojson);
  if (new Blob([JSON.stringify(data.geojson)]).size > LIMITS.fileBytes)
    throw {
      codigo: 'LIMITE',
      mensagem: `GeoJSON excede ${megabytes(LIMITS.fileBytes)} MB`,
    };
  const result = await callAdapter('saveProject', id, clone(data));
  changed();
  return result;
}
export async function deleteProject(id) {
  assertNumericId(id);
  const result = await callAdapter('deleteProject', id);
  changed();
  return result;
}
export async function discardLocalCopy(id) {
  const result = await callAdapter('discardLocalCopy', id);
  changed();
  return result;
}
export const submitAttempt = (id, data) => callAdapter('submitAttempt', id, data);
export const recordView = (id) => callAdapter('recordView', id);

// EXPORTAÇÃO .azmd
// le o projeto, confere o autor, zipa (azmdPackage) e baixa atividade_<id>.azmd
export async function exportProjectPackage(id) {
  const user = requireSessionUser();
  const [json, geojson] = await Promise.all([
    loadProjectJson(id),
    loadProjectGeojson(id),
  ]);
  if (!isProjectAuthor(json))
    throw {
      codigo: 'SEM_PERMISSAO',
      mensagem: 'Somente o autor pode baixar os arquivos.',
    };
  const bytes = await createAzmdPackage({ json, geojson, exportedBy: user });
  downloadFile(bytes, azmdFileName(id), 'application/octet-stream'); // octet-stream n deixa o navegador trocar .azmd por .zip
}

// IMPORTAÇÃO .azmd
// valida tudo ANTES de criar, depois cria com novo id e código e qm importa vira autor
export async function importProjectPackage(file) {
  const user = requireSessionUser();
  const { json: raw, geojson } = await readAzmdPackage(file);
  let content;
  try {
    validateAncora(raw?.ancora);
    content = normalizeProjectJson(raw, null); // preenche câmeras/featureIds/texto que faltarem
    delete content.excluido;
    // id, código e autor provisórios so pra validar, os reais vem do createProject
    validateProjectJson({
      ...content,
      idProjeto: '1',
      codigo: '100000',
      autor: { id: user.id, nome: user.nome },
    });
    validateGeojson(geojson);
    assertPageFeatures(content, geojson);
  } catch (error) {
    // estrutura mt fora do formato quebra antes das validações (TypeError)
    throw error?.codigo
      ? error
      : { codigo: 'DADOS_INVALIDOS', mensagem: 'o projeto é inválido' };
  }

  const created = await createProject({ ancora: content.ancora });
  try {
    const fresh = await loadProjectJson(created.id);
    await saveProject(created.id, {
      json: {
        ...content,
        idProjeto: created.id,
        codigo: fresh.codigo,
        autor: fresh.autor,
        horarioCriado: fresh.horarioCriado,
      },
      geojson,
    });
  } catch (error) {
    await deleteProject(created.id).catch(() => {}); // se salvar falhar não deixa um projeto vazio pra trás
    throw error;
  }
  return created;
}
