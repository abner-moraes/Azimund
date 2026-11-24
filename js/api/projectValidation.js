// validação dos arquivos do projeto (JSON das páginas e GeoJSON dos objetos)
import { LIMITS } from '../config/limits.js';
import { BASEMAP_KEYS } from '../config/basemapOptions.js';
import { invalidField, assertNumericId, isImageUrl, megabytes } from './projectContract.js';

function assertString(value, path) {
  if (typeof value !== 'string') {
    invalidField(path, 'texto obrigatório');
  }
}

function assertNumber(value, path, min = -Infinity, max = Infinity) {
  if (!Number.isFinite(value) || value < min || value > max) {
    invalidField(path);
  }
}

// mapaBase é opcional ja q sem ele a página usa o mapa base escolhido pelo visitante
function assertBasemap(value, path) {
  if (value !== undefined && !BASEMAP_KEYS.includes(value)) {
    invalidField(path, 'mapa base desconhecido');
  }
}

export function validateAncora(value) {
  assertNumber(value?.lng, 'ancora.lng', -180, 180);
  assertNumber(value?.lat, 'ancora.lat', -90, 90);
}

// Validação do projeto completo, incluindo páginas e features do GeoJSON
export function validateProjectJson(json) {
  assertNumericId(json?.idProjeto, 'idProjeto');
  assertString(json.titulo, 'titulo');
  assertString(json.descricao, 'descricao');
  validateAncora(json.ancora);
  if (!/^\d{6}$/.test(json.codigo)) {
    invalidField('codigo', 'informe 6 dígitos');
  }
  if (!/^#[\da-f]{6}$/i.test(json.cor)) {
    invalidField('cor', 'use #RRGGBB');
  }
  assertBasemap(json.mapaBase, 'mapaBase');
  assertNumericId(json.autor?.id, 'autor.id');
  assertString(json.autor?.nome, 'autor.nome');
  if (!Array.isArray(json.paginas) || json.paginas.length > LIMITS.pages) {
    invalidField('paginas', `máximo de ${LIMITS.pages} páginas`);
  }
  const ids = new Set();
  json.paginas.forEach((page, index) => {
    const path = `paginas[${index}]`;
    if (!page || typeof page !== 'object' || Array.isArray(page)) {
      invalidField(path, 'página inválida');
    }
    assertString(page.id, `${path}.id`);
    if (!page.id || ids.has(page.id)) {
      invalidField(`${path}.id`);
    }
    ids.add(page.id);
    if (!['conteudo', 'questao'].includes(page.tipo)) {
      invalidField(`${path}.tipo`);
    }
    assertBasemap(page.mapaBase, `${path}.mapaBase`);
    assertString(page.titulo, `${path}.titulo`);
    assertString(page.texto, `${path}.texto`);
    if (
      !Array.isArray(page.featureIds) ||
      page.featureIds.some((id) => typeof id !== 'string')
    ) {
      invalidField(`${path}.featureIds`);
    }
    const camera = page.camera;
    if (!Array.isArray(camera?.centro) || camera.centro.length !== 2) {
      invalidField(`${path}.camera.centro`);
    }
    assertNumber(camera.centro[0], `${path}.camera.centro[0]`, -180, 180);
    assertNumber(camera.centro[1], `${path}.camera.centro[1]`, -90, 90);
    assertNumber(camera.zoom, `${path}.camera.zoom`, 0, 22);
    assertNumber(camera.pitch, `${path}.camera.pitch`, 0, 85);
    assertNumber(camera.bearing, `${path}.camera.bearing`);
    assertNumber(camera.duracaoMs, `${path}.camera.duracaoMs`, 0, 60000);
    if (page.imagem && !isImageUrl(page.imagem)) {
      invalidField(`${path}.imagem`, 'use URL http ou https');
    }
    if (page.tipo !== 'questao') {
      return;
    }
    const question = page.questao;
    assertString(question?.enunciado, `${path}.questao.enunciado`);
    if (question.imagem && !isImageUrl(question.imagem)) {
      invalidField(`${path}.questao.imagem`, 'use URL http ou https');
    }
    if (question.formato === 'multipla_escolha') {
      if (
        !Array.isArray(question.alternativas) ||
        question.alternativas.length < LIMITS.minChoices ||
        question.alternativas.length > LIMITS.maxChoices
      ) {
        invalidField(
          `${path}.questao.alternativas`,
          `informe de ${LIMITS.minChoices} a ${LIMITS.maxChoices} alternativas`,
        );
      }
      const seenIds = new Set();
      question.alternativas.forEach((alternative, alternativeIndex) => {
        if (!alternative || typeof alternative !== 'object') {
          invalidField(`${path}.questao.alternativas[${alternativeIndex}]`);
        }
        const alternativePath = `${path}.questao.alternativas[${alternativeIndex}]`;
        assertString(alternative.id, `${alternativePath}.id`);
        assertString(alternative.texto, `${alternativePath}.texto`);
        if (!alternative.id || seenIds.has(alternative.id)) {
          invalidField(`${alternativePath}.id`);
        }
        seenIds.add(alternative.id);
      });
      if (
        question.respostaCorreta != null &&
        !question.alternativas.some(
          (alternative) => alternative.id === question.respostaCorreta,
        )
      ) {
        invalidField(`${path}.questao.respostaCorreta`);
      }
    } else if (question.formato === 'verdadeiro_falso') {
      if (
        question.respostaCorreta != null &&
        typeof question.respostaCorreta !== 'boolean'
      ) {
        invalidField(`${path}.questao.respostaCorreta`);
      }
      if (question.alternativas !== undefined) {
        invalidField(`${path}.questao.alternativas`, 'V/F não admite alternativas');
      }
    } else {
      invalidField(`${path}.questao.formato`);
    }
    if (question.comentarioErro !== undefined) {
      assertString(question.comentarioErro, `${path}.questao.comentarioErro`);
    }
  });
  if (new Blob([JSON.stringify(json)]).size > LIMITS.fileBytes) {
    invalidField('json', `limite de ${megabytes(LIMITS.fileBytes)} MB`);
  }
}

// so aceita coordenadas lng/lat (WGS84) usado tbm pelo import antes de normalizar
export function assertWgs84(data) {
  if (data?.crs && !/4326|CRS84/i.test(JSON.stringify(data.crs))) {
    invalidField('geojson.crs', 'use WGS84 / EPSG:4326');
  }
}

// todo featureId das páginas precisa existir no GeoJSON
export function assertPageFeatures(json, geojson) {
  const ids = new Set(geojson.features.map((feature) => feature.id));
  json.paginas.forEach((page, index) => {
    if (page.featureIds.some((id) => !ids.has(id))) {
      invalidField(`paginas[${index}].featureIds`, 'objeto inexistente');
    }
  });
}

export function validateGeojson(data) {
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    invalidField('geojson', 'use FeatureCollection');
  }
  assertWgs84(data);
  const ids = new Set();
  const coord = (coordinates, path) => {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      invalidField(path);
    }
    assertNumber(coordinates[0], `${path}[0]`, -180, 180);
    assertNumber(coordinates[1], `${path}[1]`, -90, 90);
    if (coordinates[2] !== undefined) {
      assertNumber(coordinates[2], `${path}[2]`);
    }
  };
  const line = (values, path, isRing = false) => {
    if (!Array.isArray(values) || values.length < (isRing ? 4 : 2)) {
      invalidField(path);
    }
    values.forEach((coordinates, index) => {
      coord(coordinates, `${path}[${index}]`);
    });
    if (isRing && JSON.stringify(values[0]) !== JSON.stringify(values.at(-1))) {
      invalidField(path, 'anel não fechado');
    }
  };
  const polygon = (values, path) => {
    if (!Array.isArray(values) || !values.length) {
      invalidField(path);
    }
    values.forEach((ring, index) => {
      line(ring, `${path}[${index}]`, true);
    });
  };
  data.features.forEach((feature, index) => {
    const path = `features[${index}]`;
    if (!feature || typeof feature !== 'object') {
      invalidField(path, 'feature inválida');
    }
    if (
      feature.type !== 'Feature' ||
      typeof feature.id !== 'string' ||
      !feature.id ||
      ids.has(feature.id)
    ) {
      invalidField(`${path}.id`, 'id único em string obrigatório');
    }
    ids.add(feature.id);
    const geometry = feature.geometry;
    const coordinates = geometry?.coordinates;
    if (geometry?.type === 'Point') {
      coord(coordinates, path);
    } else if (geometry?.type === 'LineString') {
      line(coordinates, path);
    } else if (geometry?.type === 'Polygon') {
      polygon(coordinates, path);
    } else if (
      ['MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(geometry?.type)
    ) {
      if (!Array.isArray(coordinates) || !coordinates.length) {
        invalidField(path);
      }
      coordinates.forEach((value) => {
        if (geometry.type === 'MultiPoint') {
          coord(value, path);
        } else if (geometry.type === 'MultiLineString') {
          line(value, path);
        } else {
          polygon(value, path);
        }
      });
    } else {
      invalidField(`${path}.geometry.type`);
    }
    if (
      feature.properties != null &&
      (typeof feature.properties !== 'object' || Array.isArray(feature.properties))
    ) {
      invalidField(`${path}.properties`);
    }
    const properties = feature.properties || {};
    for (const key of ['stroke', 'fill', 'marker-color', 'label-color']) {
      if (properties[key] !== undefined && !/^#[\da-f]{6}$/i.test(properties[key])) {
        invalidField(`${path}.properties.${key}`);
      }
    }
    for (const key of ['stroke-opacity', 'fill-opacity']) {
      if (properties[key] !== undefined) {
        assertNumber(properties[key], `${path}.properties.${key}`, 0, 1);
      }
    }
    for (const key of ['stroke-width', 'label-size', 'radius', 'altura']) {
      if (properties[key] !== undefined) {
        assertNumber(properties[key], `${path}.properties.${key}`, 0);
      }
    }
  });
}
