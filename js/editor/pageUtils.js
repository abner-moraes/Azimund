// funções puras do editor de páginas (câmera, páginas novas, alternativas)
import { getProjectType, CAMERA_DURATION } from '../api/projectContract.js';
import { LIMITS } from '../config/limits.js';

// alternativas usam letras como id (a, b, c...), no máximo LIMITS.maxChoices
const CHOICE_LETTERS = 'abcdefghij'.slice(0, LIMITS.maxChoices);

export const choiceLetter = (index) => CHOICE_LETTERS[index] || String(index + 1);

export const defaultChoices = () =>
  Array.from({ length: 4 }, (_, index) => ({ id: CHOICE_LETTERS[index], texto: '' }));

// primeira letra livre; alternativas antigas podem ter id em UUID, por isso não usa so o tamanho
export function newChoice(alternativas) {
  const used = new Set(alternativas.map((choice) => choice.id));
  const id =
    [...CHOICE_LETTERS].find((letter) => !used.has(letter)) || crypto.randomUUID();
  return { id, texto: '' };
}

export function readMapCamera(map) {
  return {
    centro: map.getCenter().toArray(),
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
    duracaoMs: CAMERA_DURATION,
  };
}

// renumera os títulos das questões e recalcula o tipo do projeto a cada mudança
export function updateProjectPages(project) {
  let questionNumber = 0;
  const pages = project.paginas.map((page) =>
    page.tipo === 'questao' ? { ...page, titulo: `Questão ${++questionNumber}` } : page,
  );
  const updated = { ...project, paginas: pages };
  return { ...updated, tipo: getProjectType(updated) };
}

export function createPage(type, camera) {
  return {
    id: crypto.randomUUID(),
    tipo: type,
    titulo: type === 'conteudo' ? 'Página sem título' : 'Questão',
    texto: '',
    featureIds: [],
    camera,
    ...(type === 'questao'
      ? {
          questao: {
            formato: 'multipla_escolha',
            enunciado: '',
            alternativas: defaultChoices(),
            respostaCorreta: null,
            comentarioErro: '',
          },
        }
      : {}),
  };
}

export function focusFeature(map, feature) {
  const positions = [];
  function collect(coordinates) {
    if (typeof coordinates[0] === 'number') positions.push(coordinates);
    else coordinates.forEach(collect);
  }
  collect(feature.geometry.coordinates);
  const center = [0, 1].map(
    (axis) =>
      positions.reduce((sum, position) => sum + position[axis], 0) / positions.length,
  );
  map.flyTo({ center, zoom: Math.max(map.getZoom(), 9), duration: 900 });
}
