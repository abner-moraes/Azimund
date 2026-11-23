// pacote .azmd = um ZIP com outra extensão, manifest.json + atividade_<id>.json + atividade_<id>.geojson
// criar: buildManifest monta a etiqueta, strToU8 vira bytes e zipSync zipa tudo na memória
// ler: confere extensão/tamanho, descompacta so os .json/.geojson e devolve os 3 já em objeto
// a validação do conteúdo fica no projectsService.importProjectPackage
// fflate é importado so quando alguém exporta/importa, pra não pesar no carregamento
import { LIMITS } from '../../config/limits.js';
import { getProjectType, megabytes } from '../projectContract.js';

export const AZMD_EXTENSION = '.azmd';
const AZMD_FORMAT = 'azimund-atividade';
const MANIFEST_FILE = 'manifest.json';

const SIZE_ERROR = {
  codigo: 'LIMITE',
  mensagem: `O pacote excede o limite de ${megabytes(LIMITS.fileBytes)} MB.`,
};
const INVALID_PACKAGE = {
  codigo: 'DADOS_INVALIDOS',
  mensagem: 'O arquivo .azmd está corrompido ou não é um pacote do Azimund.',
};

export const azmdFileName = (id) => `atividade_${id}${AZMD_EXTENSION}`;

function dataFileNames(id) {
  return {
    projeto: `atividade_${id}.json`,
    geojson: `atividade_${id}.geojson`,
  };
}

function buildManifest(json, geojson, exportedBy = null) {
  const questions = json.paginas.filter((page) => page.tipo === 'questao').length;
  return {
    formato: AZMD_FORMAT,
    // Versão do formato do pacote
    versaoFormato: 1,
    arquivos: dataFileNames(json.idProjeto),
    projeto: {
      id: json.idProjeto,
      codigo: json.codigo,
      titulo: json.titulo,
      tipo: getProjectType(json),
      cor: json.cor,
    },
    criadoPor: { id: json.autor.id, nome: json.autor.nome },
    exportadoPor: exportedBy ? { id: exportedBy.id, nome: exportedBy.nome } : null,
    horarioCriado: json.horarioCriado || null,
    horarioModificado: json.horarioModificado || null,
    horarioExportado: new Date().toISOString(),
    posicao: { lng: json.ancora.lng, lat: json.ancora.lat },
    totalPaginas: json.paginas.length,
    totalQuestoes: questions,
    totalObjetos: geojson.features.length,
  };
}

export async function createAzmdPackage({ json, geojson, exportedBy }) {
  const { zipSync, strToU8 } = await import('fflate');
  const manifest = buildManifest(json, geojson, exportedBy);
  const text = (value) => strToU8(JSON.stringify(value, null, 2));
  return zipSync({
    [MANIFEST_FILE]: text(manifest),
    [manifest.arquivos.projeto]: text(json),
    [manifest.arquivos.geojson]: text(geojson),
  });
}

// Compara só o nome dos arquivos
const baseName = (path) => path.split('/').pop().toLowerCase();

export async function readAzmdPackage(file) {
  if (!file || !file.name.toLowerCase().endsWith(AZMD_EXTENSION))
    throw { codigo: 'ARQUIVO_INVALIDO', mensagem: 'Escolha um arquivo .azmd.' };
  if (file.size > LIMITS.fileBytes) throw SIZE_ERROR;

  const { unzipSync, strFromU8 } = await import('fflate');
  let entries;
  try {
    entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter(entry) {
        // roda ANTES de descompactar cada arquivo, originalSize é o tamanho final (evita zip bomb)
        if (entry.originalSize > LIMITS.fileBytes) throw SIZE_ERROR;
        return /\.(geo)?json$/i.test(entry.name);
      },
    });
  } catch (error) {
    throw error?.codigo ? error : INVALID_PACKAGE;
  }

  const names = Object.keys(entries);
  const parse = (name) => {
    try {
      return JSON.parse(strFromU8(entries[name]));
    } catch {
      throw { ...INVALID_PACKAGE, mensagem: `${baseName(name)}: JSON inválido` };
    }
  };
  const byName = (wanted) =>
    typeof wanted === 'string'
      ? names.find((name) => baseName(name) === baseName(wanted))
      : undefined;

  const manifestName = byName(MANIFEST_FILE);
  if (!manifestName)
    throw { ...INVALID_PACKAGE, mensagem: 'A atividade não tem manifest.' };
  const manifest = parse(manifestName);
  if (manifest?.formato !== AZMD_FORMAT) throw INVALID_PACKAGE;

  // se o manifest não citar os nomes, pega o primeiro .json (fora o manifest) e o primeiro .geojson
  const projectName =
    byName(manifest.arquivos?.projeto) ||
    names.find((name) => /\.json$/i.test(name) && name !== manifestName);
  const geojsonName =
    byName(manifest.arquivos?.geojson) ||
    names.find((name) => /\.geojson$/i.test(name));
  if (!projectName || !geojsonName)
    throw {
      ...INVALID_PACKAGE,
      mensagem: 'O pacote precisa conter o JSON do projeto e o GeoJSON',
    };

  return { manifest, json: parse(projectName), geojson: parse(geojsonName) };
}
