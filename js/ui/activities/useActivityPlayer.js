// estado do jogador de atividades: seleção, carregamento, páginas, respostas e envio
import { useEffect, useRef, useState } from 'react';
import {
  loadProjectJson,
  loadProjectGeojson,
  submitAttempt,
  getProjectType,
  isQuestionComplete,
  recordView,
} from '../../api/projectsService.js';
import { defaultCamera } from '../../api/projectContract.js';
import { createActivityLayer, flyToPage } from '../activityLayer.js';
import { useProjectMarkers } from './useProjectMarkers.js';
import { applyPageBasemap, restoreUserBasemap } from '../basemapSwitcher.js';

// fases em que sair pede confirmação (tem resposta que seria perdida)
const IN_PROGRESS = new Set(['playing', 'submitting', 'submit-error']);
// no resumo a câmera fica um pouco mais perto e inclinada que a padrão das páginas
const SUMMARY_CAMERA = { zoom: 10.5, pitch: 35 };

export function useActivityPlayer({
  map,
  markerLayer,
  onOpen,
  onPlayingChange,
  openRequest,
}) {
  const [selection, setSelection] = useState(null);
  const [project, setProject] = useState(null);
  const [phase, setPhase] = useState('globe');
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [exitRequested, setExitRequested] = useState(false);
  const layer = useRef(null);
  const request = useRef(0); // token: respostas de carregamentos antigos são ignoradas
  const returnView = useRef(null);
  const confirmedAnswers = useRef({});
  const submitting = useRef(false);
  const heading = useRef(null);
  const pages =
    project?.paginas.filter(
      (page) => page.tipo !== 'questao' || isQuestionComplete(page),
    ) || [];
  const page = pages[pageIndex];
  const hasQuestions =
    project && ['ATIVIDADE', 'AULA'].includes(getProjectType(project));
  const inProgress = IN_PROGRESS.has(phase);
  const markers = useProjectMarkers({
    map,
    markerLayer,
    selection,
    project,
    phase,
    inProgress,
    onSelect: selectProject,
    onPlayingChange,
  });

  useEffect(() => {
    if (openRequest?.item) selectProject(openRequest.item);
  }, [openRequest]);
  useEffect(
    () => () => {
      request.current += 1;
      layer.current?.remove();
    },
    [map],
  );
  useEffect(() => {
    if (phase === 'playing' && page) layer.current?.show(page);
    heading.current?.focus({ preventScroll: true });
  }, [phase, pageIndex, page]);
  useEffect(() => {
    if (!project)
      restoreUserBasemap(map); // sem atividade: mapa do usuário, com atividade: o da capa/página
    else
      applyPageBasemap(
        map,
        phase === 'playing' && page ? page.mapaBase : project.mapaBase,
      );
  }, [map, project, phase, page]);
  useEffect(() => () => restoreUserBasemap(map), [map]);
  useEffect(() => {
    function handleEscape(event) {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        document.querySelector('dialog[open]')
      )
        return;
      if (selection) {
        event.preventDefault();
        exit();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  });

  function clearLayer() {
    layer.current?.remove();
    layer.current = null;
  }
  function resetAttempt() {
    confirmedAnswers.current = {};
    setAnswers({});
    setPageIndex(0);
    setSelectedAnswer(null);
    setResult(null);
    submitting.current = false;
  }

  async function selectProject(item) {
    if (inProgress) return;
    if (!selection)
      returnView.current = {
        center: map.getCenter().toArray(),
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      };
    const token = ++request.current;
    clearLayer();
    resetAttempt();
    setSelection(item);
    setProject(null);
    setError(null);
    setExitRequested(false);
    setPhase('loading-json');
    onOpen();
    const loading = loadProjectJson(item.id);
    flyToPage(map, defaultCamera(item.ancora, SUMMARY_CAMERA));
    try {
      const project = await loading;
      if (token !== request.current) return;
      setProject(project);
      setPhase('summary');
      recordView(item.id).catch(() => {});
      if (
        project.ancora.lng !== item.ancora.lng ||
        project.ancora.lat !== item.ancora.lat
      )
        flyToPage(map, defaultCamera(project.ancora, SUMMARY_CAMERA));
    } catch (error) {
      if (token === request.current) {
        setError(error);
        setPhase('json-error');
      }
    }
  }

  async function start() {
    if (!project || !pages.length) return;
    setExitRequested(false);
    setError(null);
    setPhase('loading-map');
    const token = ++request.current;
    try {
      const data = await loadProjectGeojson(project.idProjeto);
      await document.fonts.load('16px "DM Sans Variable"'); // os rótulos do mapa usam essa fonte
      if (token !== request.current) return;
      clearLayer();
      layer.current = createActivityLayer(map, data);
      setPhase('playing');
    } catch (error) {
      if (token !== request.current) return;
      clearLayer();
      setError(
        error?.codigo
          ? error
          : {
              codigo: 'MAPA_INDISPONIVEL',
              mensagem: 'Não foi possível preparar o mapa. Tente novamente.',
            },
      );
      setPhase('map-error');
    }
  }

  async function complete() {
    if (submitting.current) return;
    submitting.current = true;
    setPhase('submitting');
    setError(null);
    const token = ++request.current;
    try {
      const result = await submitAttempt(project.idProjeto, {
        respostas: confirmedAnswers.current,
      });
      if (token !== request.current) return;
      clearLayer();
      setResult(result);
      setPhase(hasQuestions ? 'result' : 'complete');
    } catch (error) {
      if (token === request.current) {
        setError(error);
        setPhase('submit-error');
      }
    } finally {
      if (token === request.current) submitting.current = false;
    }
  }

  function next() {
    if (page.tipo === 'questao') {
      if (selectedAnswer === null) return;
      if (!Object.hasOwn(confirmedAnswers.current, page.id)) {
        confirmedAnswers.current = {
          ...confirmedAnswers.current,
          [page.id]: selectedAnswer,
        };
        setAnswers(confirmedAnswers.current);
      }
    }
    if (pageIndex < pages.length - 1) {
      setPageIndex(pageIndex + 1);
      setSelectedAnswer(null);
    } else complete();
  }

  function returnToGlobe() {
    request.current += 1;
    clearLayer();
    const id = selection?.id;
    setExitRequested(false);
    markerLayer.clearReveal();
    setSelection(null);
    setProject(null);
    setPhase('globe');
    setError(null);
    resetAttempt();
    map.stop();
    map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
    if (returnView.current)
      map.flyTo({ ...returnView.current, duration: 1800, retainPadding: false });
    requestAnimationFrame(() => markerLayer.focus(id));
  }
  function exit() {
    if (hasQuestions && inProgress) setExitRequested(true);
    else returnToGlobe();
  }
  function retry() {
    if (phase === 'json-error') selectProject(selection);
    else if (phase === 'map-error') start();
    else complete();
  }

  return {
    ...markers,
    selection,
    project,
    phase,
    error,
    page,
    pages,
    pageIndex,
    selectedAnswer,
    setSelectedAnswer,
    answers,
    result,
    heading,
    hasQuestions,
    exitRequested,
    setExitRequested,
    start,
    next,
    previous: () => setPageIndex(pageIndex - 1),
    exit,
    returnToGlobe,
    retry,
    confirmed: !!page && Object.hasOwn(answers, page.id),
  };
}
