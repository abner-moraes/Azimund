//BACK END
// catálogo do modo local: arquivos publicados em public/data + cópias de trabalho do IndexedDB
// qualquer pessoa (com conta, sem conta ou outra conta) acha uma atividade pelo id ou código
// o mapa é que filtra o que aparece (projectsService.listPublicProjects)
import { normalizeProjectJson, toIndexItem } from '../projectContract.js';
import { getSessionUser } from '../session.js';
import * as copyStore from './localCopies.js';

const baseUrl = import.meta.env?.BASE_URL || '/';

export async function fetchDataFile(fileName) {
  let response;
  try {
    response = await fetch(`${baseUrl}data/${fileName}`, {
      cache: 'no-store',
    });
  } catch {
    throw {
      codigo: 'FALHA_REDE',
      mensagem: 'Não foi possível ler os arquivos de dados.',
    };
  }
  if (!response.ok)
    throw {
      codigo: 'NAO_ENCONTRADO',
      mensagem: `Arquivo não encontrado: ${fileName}.`,
    };
  try {
    return await response.json();
  } catch {
    throw {
      codigo: 'DADOS_INVALIDOS',
      mensagem: `${fileName}: JSON inválido.`,
    };
  }
}

export async function loadPublishedIndex() {
  const data = await fetchDataFile('projetos.json');
  if (!Array.isArray(data))
    throw {
      codigo: 'DADOS_INVALIDOS',
      mensagem: 'projetos.json deve ser uma lista.',
    };
  return data;
}

// copias ficam no IndexedDB como "<idDoAutor>:<idDoProjeto>"
// procura a cópia do usuário logado primeiro e depois a de qualquer autor
// (o id é reservado em sequência no navegador, então so o autor tem cópia daquele id)
//entrada do back no servidor é um SELECT em Projeto pelo id_projeto, sem filtrar pelo autor
export async function findWorkingCopy(id) {
  const user = getSessionUser();
  if (user) {
    const own = await copyStore.getCopy(user.id, id);
    if (own) return own;
  }
  const copies = await copyStore.getAllCopies();
  return copies.find((copy) => copy.json?.idProjeto === id) || null;
}

export async function loadCatalogJson(id) {
  const record = await findWorkingCopy(id);
  if (record?.excluido)
    throw {
      codigo: 'NAO_ENCONTRADO',
      mensagem: 'Atividade excluída nesta cópia local.',
    };
  if (record) return structuredClone(record.json);
  const item = (await loadPublishedIndex()).find((item) => item.id === id);
  if (!item)
    throw {
      codigo: 'NAO_ENCONTRADO',
      mensagem: 'Atividade não encontrada.',
    };
  return normalizeProjectJson(await fetchDataFile(`atividade_${id}.json`), item);
}

// publicadas + cópias de todos os autores deste navegador
// cópia excluida tira a atividade da lista pra todo mundo
//entrada do back: GET /api/projetos (lista completa, o front filtra o que vai pro mapa)
export async function listCatalog() {
  const items = new Map((await loadPublishedIndex()).map((item) => [item.id, item]));
  for (const copy of await copyStore.getAllCopies())
    copy.excluido
      ? items.delete(copy.json.idProjeto)
      : items.set(copy.json.idProjeto, toIndexItem(copy.json));
  return [...items.values()];
}
