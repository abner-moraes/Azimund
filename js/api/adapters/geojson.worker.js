// worker que roda normalizeGeojson fora da thread da UI p arquivos grandes
// devolve progresso/resultado por postMessage
import { normalizeGeojson } from './geojsonImport.js';
self.onmessage = async (event) => {
  try {
    self.postMessage({
      progress: 20,
    });
    const text = await event.data.text();
    self.postMessage({
      progress: 60,
    });
    const result = normalizeGeojson(JSON.parse(text));
    self.postMessage({
      result,
    });
  } catch (error) {
    self.postMessage({
      error: {
        codigo: error.codigo || 'DADOS_INVALIDOS',
        mensagem: error.mensagem || 'O arquivo não contém GeoJSON válido',
      },
    });
  }
};
