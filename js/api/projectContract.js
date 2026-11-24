//BACK END
// formato dos arquivos do projeto (JSON + GeoJSON), valores padrão e correção de respostas
import { LIMITS } from '../config/limits.js';
import { readThemeColor } from '../config/theme.js';
// a validação dos arquivos fica em projectValidation.js

// autor das atividades oficiais ("Equipe Azimund")
// visitantes so veem essas no globo
export const TEAM_AUTHOR_ID = '101';

export const CAMERA_DURATION = 2500;

export const emptyFeatureCollection = () => ({
  type: 'FeatureCollection',
  features: [],
});

export const clone = (value) => structuredClone(value);

export function invalidField(field, message = 'valor inválido') {
  throw {
    codigo: 'DADOS_INVALIDOS',
    mensagem: `${field}: ${message}.`,
  };
}

export function assertNumericId(id, field = 'id') {
  if (typeof id !== 'string' || !/^\d+$/.test(id)) {
    invalidField(field, 'use uma string numérica');
  }
}

export function isImageUrl(url) {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

export function getProjectType(json) {
  const pages = json.paginas || [];
  if (!pages.length) {
    return 'RASCUNHO';
  }
  const questionCount = pages.filter((page) => page.tipo === 'questao').length;
  if (!questionCount) {
    return 'APRESENTACAO';
  }
  if (questionCount === pages.length) {
    return 'ATIVIDADE';
  }
  return 'AULA';
}

export function isQuestionComplete(page) {
  const question = page.questao;
  if (!question?.enunciado?.trim()) {
    return false;
  }
  if (question.formato === 'verdadeiro_falso') {
    return typeof question.respostaCorreta === 'boolean';
  }
  return (
    Array.isArray(question.alternativas) &&
    question.alternativas.length >= LIMITS.minChoices &&
    question.alternativas.every((alternative) => alternative.texto?.trim()) &&
    question.alternativas.some(
      (alternative) => alternative.id === question.respostaCorreta,
    )
  );
}

// câmera padrão de página nova
// overrides troca so o que precisar (ex: zoom do player)
export function defaultCamera(ancora, overrides = {}) {
  return {
    centro: [ancora.lng, ancora.lat],
    zoom: 10,
    pitch: 25,
    bearing: 0,
    duracaoMs: CAMERA_DURATION,
    ...overrides,
  };
}

export const megabytes = (bytes) => bytes / 1024 / 1024;


export function normalizeProjectJson(data, item) {
  const json = clone(data);
  json.codigo ||= item?.codigo;
  json.cor ||= item?.cor || readThemeColor('--color-general-mint');
  json.autor ||= item?.autor;
  json.paginas ||= [];
  json.paginas.forEach((page) => {
    page.featureIds ||= [];
    page.camera = {
      ...defaultCamera(json.ancora),
      ...page.camera,
    };
    page.texto ??= '';
  });
  json.tipo = getProjectType(json);
  return json;
}

export function toIndexItem(json) {
  return {
    id: json.idProjeto,
    codigo: json.codigo,
    tipo: getProjectType(json),
    titulo: json.titulo,
    cor: json.cor,
    ancora: clone(json.ancora),
    autor: clone(json.autor),
    horarioModificado: json.horarioModificado || json.horarioCriado || '',
  };
}

//entrada do back: formato da coluna Projeto.propriedades
// COLUNA Projeto.propriedades (JSON) no MySQL
// junta a cor do marcador e a âncora (lat/lng) num objeto só:
// { "cor": "#A7E59E", "ancora": { "lat": -29.96, "lng": -51.27 } }
// no front tudo continua usando json.cor e json.ancora; a troca acontece so no adaptador http
export function toPropriedades({ cor, ancora }) {
  return {
    cor,
    ancora: { lat: ancora.lat, lng: ancora.lng },
  };
}

// faz o caminho inverso: o que vem do servidor com "propriedades" vira cor/ancora de novo
export function fromPropriedades(data) {
  if (!data?.propriedades) return data;
  const { propriedades, ...rest } = data;
  return {
    ...rest,
    cor: propriedades.cor,
    ancora: { lng: propriedades.ancora.lng, lat: propriedades.ancora.lat },
  };
}

// troca cor/ancora soltos por "propriedades" antes de mandar pro servidor
export function withPropriedades(data) {
  const { cor, ancora, ...rest } = data;
  return { ...rest, propriedades: toPropriedades({ cor, ancora }) };
}

//entrada do back: formato da coluna Tentativa.respostas
// COLUNA Tentativa.respostas (JSON) no MySQL
// acertos e erros juntos num json só, uma entrada por questão:
// { "acertos": 1, "total": 2, "questoes": [ { paginaId, resposta, correta, comentario? } ] }
export function toRespostasJson(result) {
  return {
    acertos: result.acertos,
    total: result.total,
    questoes: result.questoes,
  };
}

export function gradeAttempt(json, answers) {
  let correct = 0;
  let total = 0;
  const errors = [];
  const questions = [];
  json.paginas
    .filter((page) => page.tipo === 'questao')
    .forEach((page) => {
      if (!isQuestionComplete(page)) {
        console.warn(`Questão incompleta ignorada: ${page.id}`);
        return;
      }
      const question = page.questao;
      const answer = answers[page.id];
      const valid =
        question.formato === 'verdadeiro_falso'
          ? typeof answer === 'boolean'
          : question.alternativas.some((alternative) => alternative.id === answer);
      if (!valid) {
        console.warn(`Resposta incompleta ignorada: ${page.id}`);
        return;
      }
      total++;
      if (answer === question.respostaCorreta) {
        correct++;
        questions.push({ paginaId: page.id, resposta: answer, correta: true });
      } else {
        const comentario = question.comentarioErro || '';
        errors.push({ paginaId: page.id, comentario });
        questions.push({ paginaId: page.id, resposta: answer, correta: false, comentario });
      }
    });
  return {
    acertos: correct,
    total,
    erros: errors, // usado pela tela de resultado
    questoes: questions, // acertos + erros juntos (vai pro back-end em "respostas")
  };
}
