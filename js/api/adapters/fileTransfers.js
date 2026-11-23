// troca de arquivos entre navegador e pc
// downloadFile: usado pelo GeoJSON e pelo .azmd
// importGeojson: le o geojson escolhido no editor (acima de LIMITS.workerBytes usa o geojson.worker.js)
// exportGeojson: baixa todos os objetos, ou so o selecionado
import { LIMITS } from '../../config/limits.js';
import { megabytes } from '../projectContract.js';
import { normalizeGeojson } from './geojsonImport.js';
export function downloadFile(bytes, fileName, mimeType = 'application/geo+json') {
  const url = URL.createObjectURL(
    new Blob([bytes], {
      type: mimeType,
    }),
  );
  // a URL blob: aponta pros bytes na memória; o <a download> invisível baixa com o nome certo
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000); // libera a memória depois do download começar
}
export async function importGeojson(file, onProgress = () => {}) {
  if (!file || !/\.(geojson|json)$/i.test(file.name))
    throw {
      codigo: 'ARQUIVO_INVALIDO',
      mensagem: 'Escolha um arquivo .geojson ou .json.',
    };
  if (file.size > LIMITS.fileBytes)
    throw {
      codigo: 'LIMITE',
      mensagem: `O arquivo excede o limite de ${megabytes(LIMITS.fileBytes)} MB.`,
    };
  onProgress(5);
  if (file.size > LIMITS.workerBytes)
    return new Promise((resolve, reject) => {
      // arquivo grande vai pro worker pra não travar a tela; ele manda o progresso por mensagem
      const worker = new Worker(new URL('./geojson.worker.js', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = ({ data }) => {
        if (data.progress) onProgress(data.progress);
        if (data.result) {
          worker.terminate();
          onProgress(100);
          resolve(data.result);
        }
        if (data.error) {
          worker.terminate();
          reject(data.error);
        }
      };
      worker.onerror = () => {
        worker.terminate();
        reject({
          codigo: 'DADOS_INVALIDOS',
          mensagem: 'Não foi possível processar o arquivo.',
        });
      };
      worker.postMessage(file);
    });
  try {
    const result = normalizeGeojson(JSON.parse(await file.text()));
    onProgress(100);
    return result;
  } catch (error) {
    throw error.codigo
      ? error
      : {
          codigo: 'DADOS_INVALIDOS',
          mensagem: 'O arquivo não contém GeoJSON válido.',
        };
  }
}
export function exportGeojson(geojson, id = 'projeto', selectedId = null) {
  const data = selectedId
    ? {
        ...geojson,
        features: geojson.features.filter((f) => f.id === selectedId),
      }
    : geojson;
  downloadFile(
    JSON.stringify(data, null, 2),
    `atividade_${id}${selectedId ? '_selecao' : ''}.geojson`,
  );
}
