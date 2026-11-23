// lista de projetos públicos -> marcadores do globo, e o pino da atividade aberta no resumo
import { useEffect, useRef, useState } from 'react';
import { listPublicProjects, subscribeToProjects } from '../../api/projectsService.js';
import { addAncora } from '../markerLayer.js';
import { isMapReady } from '../../config/mapStyle.js';

const HIDDEN_MARKER_PHASES = new Set([
  'loading-map',
  'map-error',
  'result',
  'complete',
]);
const SUMMARY_PHASES = new Set(['loading-json', 'json-error', 'summary']);

export function useProjectMarkers({
  map,
  markerLayer,
  selection,
  project,
  phase,
  inProgress,
  onSelect,
  onPlayingChange,
}) {
  const [index, setIndex] = useState({ loading: true, items: [], error: null });
  const [mapReady, setMapReady] = useState(() => isMapReady(map));
  const request = useRef(0);
  // ref pra o clique no marcador sempre chamar o onSelect mais novo sem reinscrever
  const selectHandler = useRef(onSelect);
  selectHandler.current = onSelect;

  async function reload() {
    const token = ++request.current;
    setIndex({ loading: true, items: [], error: null });
    try {
      const items = await listPublicProjects();
      if (token === request.current) setIndex({ loading: false, items, error: null });
    } catch (error) {
      if (token === request.current) setIndex({ loading: false, items: [], error });
    }
  }

  useEffect(() => {
    reload();
    const unsubscribe = subscribeToProjects(reload);
    const handleLoad = () => setMapReady(true);
    map.on('style.load', handleLoad);
    return () => {
      unsubscribe();
      request.current += 1;
      map.off('style.load', handleLoad);
    };
  }, [map]);
  useEffect(
    () => markerLayer.onSelect((item) => selectHandler.current(item)),
    [markerLayer],
  );
  useEffect(() => {
    if (!index.loading && !index.error) markerLayer.setProjects(index.items);
  }, [markerLayer, index]);
  useEffect(() => {
    const playing = inProgress || HIDDEN_MARKER_PHASES.has(phase);
    markerLayer.setVisible(!playing);
    markerLayer.setSelected(selection?.id || null);
    onPlayingChange(playing);
  }, [phase, inProgress, selection, markerLayer, onPlayingChange]);
  useEffect(() => {
    if (!selection || !mapReady || !SUMMARY_PHASES.has(phase)) return;
    const pin = addAncora(map, project?.ancora || selection.ancora);
    return () => pin.remove();
  }, [map, mapReady, selection, project, phase]);

  return { index, reload };
}
