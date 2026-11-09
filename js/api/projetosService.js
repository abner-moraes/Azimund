import { salvarTentativa } from './tentativasStorage.js';

// Adaptador estático: somente este módulo conhece o gabarito e corrige tentativas.
const cache = new Map();
const base = import.meta.env?.BASE_URL || '/';
const copiar = (value) => structuredClone(value);
const esperar = () =>
  new Promise((resolve) => setTimeout(resolve, 150 + Math.floor(Math.random() * 251)));
const objeto = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function falhar(caminho, motivo = 'campo obrigatório ou valor inválido') {
  throw { codigo: 'DADOS_INVALIDOS', mensagem: `${caminho}: ${motivo}.` };
}

function texto(value, caminho, vazio = false) {
  if (typeof value !== 'string' || (!vazio && !value.trim())) falhar(caminho);
}

function numero(value, caminho, min = -Infinity, max = Infinity) {
  if (!Number.isFinite(value) || value < min || value > max) falhar(caminho);
}

function idNumerico(value, caminho) {
  if (typeof value !== 'string' || !/^\d+$/.test(value))
    falhar(caminho, 'use uma string numérica, preservando os zeros');
}

function coordenada(value, caminho) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 3)
    falhar(caminho, 'use [longitude, latitude] em WGS84');
  numero(value[0], `${caminho}[0]`, -180, 180);
  numero(value[1], `${caminho}[1]`, -90, 90);
  if (value.length === 3) numero(value[2], `${caminho}[2]`);
}

function ancora(value, caminho) {
  if (!objeto(value)) falhar(caminho);
  numero(value.lng, `${caminho}.lng`, -180, 180);
  numero(value.lat, `${caminho}.lat`, -90, 90);
}

function unicos(values, caminho, atributo) {
  const vistos = new Set();
  values.forEach((value, i) => {
    const campo = `${caminho}[${i}]${atributo ? `.${atributo}` : ''}`;
    texto(value, campo);
    if (vistos.has(value)) falhar(campo, 'id repetido');
    vistos.add(value);
  });
}

function validarIndice(data) {
  if (!Array.isArray(data)) falhar('projetos', 'o índice deve ser uma lista');
  unicos(
    data.map((item) => item?.id),
    'projetos',
    'id',
  );
  data.forEach((item, i) => {
    const p = `projetos[${i}]`;
    idNumerico(item.id, `${p}.id`);
    if (!['ATIVIDADE', 'APRESENTACAO'].includes(item.tipo)) falhar(`${p}.tipo`);
    texto(item.titulo, `${p}.titulo`);
    texto(item.miniatura, `${p}.miniatura`, true);
    // Imagens de autores também devem ser servidas pela própria aplicação.
    if (
      item.miniatura &&
      (/^[a-z][a-z\d+.-]*:|^\/\//i.test(item.miniatura) || item.miniatura.includes('..'))
    )
      falhar(`${p}.miniatura`, 'use um caminho local');
    ancora(item.ancora, `${p}.ancora`);
    if (!objeto(item.autor)) falhar(`${p}.autor`);
    idNumerico(item.autor.id, `${p}.autor.id`);
    texto(item.autor.nome, `${p}.autor.nome`);
  });
}

function validarConteudo(data, id) {
  if (!objeto(data)) falhar('projeto');
  idNumerico(data.idProjeto, 'idProjeto');
  if (data.idProjeto !== id) falhar('idProjeto', 'não corresponde ao nome do arquivo');
  texto(data.titulo, 'titulo');
  texto(data.descricao, 'descricao');
  ancora(data.ancora, 'ancora');
  if (!Array.isArray(data.paginas) || !data.paginas.length)
    falhar('paginas', 'informe ao menos uma página');
  unicos(
    data.paginas.map((page) => page?.id),
    'paginas',
    'id',
  );
  data.paginas.forEach((page, i) => {
    const p = `paginas[${i}]`;
    if (!['conteudo', 'questao'].includes(page.tipo)) falhar(`${p}.tipo`);
    texto(page.titulo, `${p}.titulo`);
    texto(page.texto, `${p}.texto`, true);
    if (page.featureIds !== undefined) {
      if (!Array.isArray(page.featureIds)) falhar(`${p}.featureIds`);
      unicos(page.featureIds, `${p}.featureIds`);
    }
    if (page.camera !== undefined) {
      const c = page.camera;
      if (!objeto(c)) falhar(`${p}.camera`);
      coordenada(c.centro, `${p}.camera.centro`);
      if (c.centro.length !== 2)
        falhar(`${p}.camera.centro`, 'use apenas longitude e latitude');
      numero(c.zoom, `${p}.camera.zoom`, 0, 22);
      numero(c.pitch, `${p}.camera.pitch`, 0, 85);
      numero(c.bearing, `${p}.camera.bearing`);
      if (c.duracaoMs !== undefined)
        numero(c.duracaoMs, `${p}.camera.duracaoMs`, 0, 60000);
    }
    if (page.tipo !== 'questao') return;
    const q = page.questao;
    if (!objeto(q)) falhar(`${p}.questao`);
    texto(q.enunciado, `${p}.questao.enunciado`);
    if (q.comentarioErro !== undefined)
      texto(q.comentarioErro, `${p}.questao.comentarioErro`, true);
    if (q.formato === 'multipla_escolha') {
      if (
        !Array.isArray(q.alternativas) ||
        q.alternativas.length < 2 ||
        q.alternativas.length > 6
      )
        falhar(`${p}.questao.alternativas`, 'informe de 2 a 6 alternativas');
      unicos(
        q.alternativas.map((option) => option?.id),
        `${p}.questao.alternativas`,
        'id',
      );
      q.alternativas.forEach((option, j) =>
        texto(option.texto, `${p}.questao.alternativas[${j}].texto`),
      );
      if (
        typeof q.respostaCorreta !== 'string' ||
        !q.alternativas.some((option) => option.id === q.respostaCorreta)
      )
        falhar(`${p}.questao.respostaCorreta`, 'deve identificar uma alternativa');
    } else if (q.formato === 'verdadeiro_falso') {
      if (typeof q.respostaCorreta !== 'boolean')
        falhar(`${p}.questao.respostaCorreta`, 'use true ou false');
      if (q.alternativas !== undefined)
        falhar(`${p}.questao.alternativas`, 'V/F não admite alternativas');
    } else falhar(`${p}.questao.formato`);
  });
}

function validarGeometria(geometry, caminho) {
  if (!objeto(geometry)) falhar(caminho);
  const c = geometry.coordinates;
  const lista = (value, p, min, validar) => {
    if (!Array.isArray(value) || value.length < min) falhar(p);
    value.forEach((item, i) => validar(item, `${p}[${i}]`));
  };
  const linha = (value, p) => lista(value, p, 2, coordenada);
  const anel = (value, p) => {
    lista(value, p, 4, coordenada);
    if (JSON.stringify(value[0]) !== JSON.stringify(value.at(-1)))
      falhar(p, 'o anel deve ser fechado');
  };
  const poligono = (value, p) => lista(value, p, 1, anel);
  const p = `${caminho}.coordinates`;
  switch (geometry.type) {
    case 'Point':
      coordenada(c, p);
      break;
    case 'MultiPoint':
      lista(c, p, 1, coordenada);
      break;
    case 'LineString':
      linha(c, p);
      break;
    case 'MultiLineString':
      lista(c, p, 1, linha);
      break;
    case 'Polygon':
      poligono(c, p);
      break;
    case 'MultiPolygon':
      lista(c, p, 1, poligono);
      break;
    default:
      falhar(`${caminho}.type`, 'geometria 2D não suportada');
  }
}

function validarGeojson(data, projeto) {
  if (!objeto(data) || data.type !== 'FeatureCollection')
    falhar('geojson.type', 'use FeatureCollection');
  if (data.crs !== undefined)
    falhar('geojson.crs', 'use coordenadas WGS84 sem CRS legado');
  if (!Array.isArray(data.features)) falhar('features');
  unicos(
    data.features.map((feature) => feature?.id),
    'features',
    'id',
  );
  data.features.forEach((feature, i) => {
    const p = `features[${i}]`;
    if (feature.type !== 'Feature') falhar(`${p}.type`);
    validarGeometria(feature.geometry, `${p}.geometry`);
    if (feature.properties !== null && !objeto(feature.properties))
      falhar(`${p}.properties`);
    const properties = feature.properties || {};
    ['titulo', 'label'].forEach((key) => {
      if (properties[key] !== undefined)
        texto(properties[key], `${p}.properties.${key}`, true);
    });
    ['stroke', 'fill', 'marker-color', 'label-color'].forEach((key) => {
      if (
        properties[key] !== undefined &&
        (typeof properties[key] !== 'string' || !/^#[\da-f]{6}$/i.test(properties[key]))
      )
        falhar(`${p}.properties.${key}`, 'use uma cor #RRGGBB');
    });
    ['stroke-opacity', 'fill-opacity'].forEach((key) => {
      if (properties[key] !== undefined)
        numero(properties[key], `${p}.properties.${key}`, 0, 1);
    });
    if (properties['stroke-width'] !== undefined)
      numero(properties['stroke-width'], `${p}.properties.stroke-width`, 0, 50);
    if (properties['label-size'] !== undefined)
      numero(properties['label-size'], `${p}.properties.label-size`, 8, 64);
    if (
      properties['marker-size'] !== undefined &&
      !['small', 'medium', 'large'].includes(properties['marker-size'])
    )
      falhar(`${p}.properties.marker-size`);
  });
  const ids = new Set(data.features.map((feature) => feature.id));
  projeto.paginas.forEach((page, i) =>
    (page.featureIds || []).forEach((id, j) => {
      if (!ids.has(id))
        falhar(`paginas[${i}].featureIds[${j}]`, `feature "${id}" inexistente`);
    }),
  );
}

async function lerArquivo(arquivo, validar) {
  if (!cache.has(arquivo)) {
    const promise = (async () => {
      const response = await fetch(`${base}data/${arquivo}`, { cache: 'no-store' });
      if (!response.ok)
        throw {
          codigo: response.status === 404 ? 'NAO_ENCONTRADO' : 'FALHA_REDE',
          mensagem: `Não foi possível abrir ${arquivo}.`,
        };
      let data;
      try {
        data = await response.json();
      } catch {
        throw { codigo: 'JSON_INVALIDO', mensagem: `${arquivo}: JSON malformado.` };
      }
      validar(data);
      return data;
    })();
    cache.set(arquivo, promise);
    // Falhas não ficam em cache: Tentar de novo efetivamente busca de novo.
    promise.catch(() => {
      if (cache.get(arquivo) === promise) cache.delete(arquivo);
    });
  }
  return cache.get(arquivo);
}

async function executar(acao) {
  await esperar();
  try {
    return await acao();
  } catch (error) {
    const padronizado = error?.codigo
      ? error
      : {
          codigo: 'FALHA_REDE',
          mensagem: 'Não foi possível carregar os dados. Tente novamente.',
        };
    console.error(`[projetosService] ${padronizado.codigo}: ${padronizado.mensagem}`);
    throw padronizado;
  }
}

function conteudoOriginal(id) {
  idNumerico(id, 'id');
  return lerArquivo(`atividade_${id}.json`, (data) => validarConteudo(data, id));
}

export function derivarTipo(projeto) {
  return projeto.paginas.some((page) => page.tipo === 'questao')
    ? 'ATIVIDADE'
    : 'APRESENTACAO';
}

export function listarPublicos() {
  return executar(async () => copiar(await lerArquivo('projetos.json', validarIndice)));
}

export function carregarJson(id) {
  return executar(async () => {
    const projeto = copiar(await conteudoOriginal(id));
    // O contrato completo é validado antes de gerar a projeção pública da UI.
    projeto.paginas.forEach((page) => {
      if (!page.questao) return;
      delete page.questao.respostaCorreta;
      delete page.questao.comentarioErro;
    });
    return projeto;
  });
}

export function carregarGeojson(id) {
  return executar(async () => {
    const projeto = await conteudoOriginal(id);
    return copiar(
      await lerArquivo(`atividade_${id}.geojson`, (data) =>
        validarGeojson(data, projeto),
      ),
    );
  });
}

export function enviarTentativa(id, tentativa = {}) {
  return executar(async () => {
    const projeto = await conteudoOriginal(id);
    if (!objeto(tentativa)) falhar('tentativa');
    const { respostas, nomeAnonimo, usuario } = tentativa;
    if (!objeto(respostas)) falhar('respostas');
    if (nomeAnonimo !== undefined) {
      texto(nomeAnonimo, 'nomeAnonimo');
      if (nomeAnonimo.trim().length > 80)
        falhar('nomeAnonimo', 'máximo de 80 caracteres');
    }
    if (usuario !== undefined) {
      if (!objeto(usuario)) falhar('usuario');
      texto(usuario.nome, 'usuario.nome');
      texto(usuario.email, 'usuario.email');
      if (usuario.id !== undefined) idNumerico(usuario.id, 'usuario.id');
    }
    const questoes = projeto.paginas.filter((page) => page.tipo === 'questao');
    const erros = [];
    let acertos = 0;
    let total = 0;
    questoes.forEach((page) => {
      const q = page.questao;
      const resposta = Object.hasOwn(respostas, page.id) ? respostas[page.id] : undefined;
      const valida =
        q.formato === 'verdadeiro_falso'
          ? typeof resposta === 'boolean'
          : q.alternativas.some((option) => option.id === resposta);
      if (!valida) {
        console.warn(`[projetosService] Questão incompleta ignorada: ${page.id}`);
        return;
      }
      total += 1;
      if (resposta === q.respostaCorreta) acertos += 1;
      else erros.push({ paginaId: page.id, comentario: q.comentarioErro || '' });
    });
    const resultado = { acertos, total, erros };
    if (!usuario) return resultado; // Compatibilidade com chamadas antigas do adaptador.
    const completa = questoes.length > 0 && total === questoes.length;
    return {
      ...resultado,
      salvamento: completa
        ? salvarTentativa(usuario, {
            idProjeto: projeto.idProjeto,
            tituloProjeto: projeto.titulo,
            respostas: Object.fromEntries(
              questoes.map((page) => [page.id, respostas[page.id]]),
            ),
            resultado,
          })
        : { salva: false, mensagem: 'A tentativa incompleta não foi salva.' },
    };
  });
}
