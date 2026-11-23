import { useEffect, useRef, useState } from 'react';
import * as projects from '../../../api/projectsService.js';
import { getProjectType } from '../../../api/projectContract.js';
import { createDrawingEngine } from '../../../editor/drawingEngine.js';
import { focusFeature } from '../../../editor/pageUtils.js';
import { addAncora } from '../../markerLayer.js';
import { flyToPage } from '../../activityLayer.js';
import { applyPageBasemap, restoreUserBasemap } from '../../basemapSwitcher.js';
import { isMapReady } from '../../../config/mapStyle.js';
import { readThemeColor } from '../../../config/theme.js';
import pinoUrl from '../pino.svg';

// "12 22" é a ponta do pino no SVG 24x24
const ANCORA_CURSOR = `url("${pinoUrl}") 12 22, crosshair`;

export function useEditorMap({ map, draft, pages }) {
  const {
    id,
    project,
    geojson,
    updateProject,
    setGeojson,
    loading,
    setLoading,
    setId,
    setError,
    setNotice,
  } = draft;
  const { page, pageIndex, view, editing } = pages;
  const engine = useRef(null);
  const current = useRef(null);
  const creating = useRef(false);
  const [ready, setReady] = useState(() => isMapReady(map));
  const [tool, setTool] = useState('select');
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState({});
  // ref com os valores atuais pros callbacks do terra-draw
  current.current = { geojson, project, pageIndex, tool };
  const feature = geojson.features.find((feature) => feature.id === selected);
  const readOnly = history.readOnlyIds?.includes(selected) || false;

  useEffect(() => {
    const previous = map.getProjection?.()?.type || 'globe';
    function handleLoad() {
      map.setProjection({ type: 'mercator' });
      setReady(true);
    }
    if (isMapReady(map)) handleLoad();
    map.on('style.load', handleLoad);
    return () => {
      map.off('style.load', handleLoad);
      map.getCanvas().style.cursor = '';
      map.setProjection({ type: previous });
    };
  }, [map]);

  useEffect(() => {
    if (!project || !ready || loading) return;
    try {
      const drawing = createDrawingEngine(map, {
        onChange(data, history) {
          const previous = current.current;
          const ids = new Set(data.features.map((feature) => feature.id));
          const previousIds = new Set(
            previous.geojson.features.map((feature) => feature.id),
          );
          const added = data.features.filter((feature) => !previousIds.has(feature.id));
          if (previous.tool === 'text') {
            for (const feature of added) {
              if (feature.geometry.type === 'Point' && !feature.properties.label)
                drawing.properties(feature.id, {
                  label: 'Texto',
                  'label-size': 18,
                  'label-color': readThemeColor('--color-primary-cosmic-latte'),
                  modo: 'texto',
                });
            }
          }
          setGeojson(data);
          setHistory(history);
          // objeto novo entra na página aberta e objeto apagado sai de todas
          if (
            added.length ||
            previous.geojson.features.some((feature) => !ids.has(feature.id))
          ) {
            updateProject((project) => ({
              ...project,
              paginas: project.paginas.map((page, index) => ({
                ...page,
                featureIds: [
                  ...page.featureIds.filter((id) => ids.has(id)),
                  ...(index === previous.pageIndex
                    ? added.map((feature) => feature.id)
                    : []),
                ],
              })),
            }));
          }
        },
        onSelect: setSelected,
        onError: (error) => setNotice(error.mensagem),
      });
      engine.current = drawing;
      drawing.load(current.current.geojson, { reset: true });
    } catch (error) {
      setError({
        mensagem: `Não foi possível iniciar as ferramentas: ${error.message || error.mensagem}`,
      });
    }
    return () => {
      engine.current?.dispose();
      engine.current = null;
    };
  }, [id, ready, loading, map]);

  useEffect(() => {
    if (!project || !ready) return;
    const marker = addAncora(map, project.ancora, {
      cor: project.cor,
      tipo: getProjectType(project),
      draggable: true,
      onDrag: (ancora) => updateProject((project) => ({ ...project, ancora })),
    });
    return () => marker.remove();
  }, [
    project?.ancora?.lng,
    project?.ancora?.lat,
    project?.cor,
    project?.tipo,
    ready,
    map,
  ]);

  useEffect(() => {
    if (tool !== 'ancora') return;
    const canvas = map.getCanvas();
    canvas.style.cursor = ANCORA_CURSOR;
    // caso sem projeto o clique cria um, com projeto so move a âncora
    async function handleClick(event) {
      if (creating.current) return;
      const ancora = { lng: event.lngLat.lng, lat: event.lngLat.lat };
      if (current.current.project) updateProject((project) => ({ ...project, ancora }));
      else {
        creating.current = true;
        setLoading(true);
        setError(null);
        try {
          const result = await projects.createProject({ ancora });
          setId(result.id);
        } catch (error) {
          setError(error);
          setLoading(false);
        } finally {
          creating.current = false;
        }
      }
      setTool('select');
    }
    function handleEscape(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setTool('select');
      }
    }
    map.on('click', handleClick);
    document.addEventListener('keydown', handleEscape, true);
    return () => {
      map.off('click', handleClick);
      document.removeEventListener('keydown', handleEscape, true);
      canvas.style.cursor = '';
    };
  }, [tool, map]);

  useEffect(() => {
    if (!ready || view !== 'pages') return;
    applyPageBasemap(map, pageIndex < 0 ? project?.mapaBase : page?.mapaBase);
  }, [ready, view, pageIndex, page?.mapaBase, project?.mapaBase, map]);
  useEffect(() => () => restoreUserBasemap(map), [map]);

  useEffect(() => {
    if (page?.camera) flyToPage(map, page.camera);
    setSelected(null);
  }, [page?.id, map]);
  useEffect(() => {
    if (!engine.current || loading) return;
    if (view === 'pages' && !editing) engine.current.showPage(page?.featureIds || []);
    else engine.current.resume();
  }, [view, editing, pageIndex, loading, ready, id]);

  function updateProperties(patch) {
    if (!selected || readOnly) return;
    engine.current?.properties(selected, patch);
    setGeojson((geojson) => ({
      ...geojson,
      features: geojson.features.map((feature) =>
        feature.id === selected
          ? { ...feature, properties: { ...feature.properties, ...patch } }
          : feature,
      ),
    }));
  }
  function selectFeature(feature) {
    engine.current?.select(feature.id);
    setSelected(feature.id);
    focusFeature(map, feature);
  }
  function removeFeature(id) {
    engine.current?.remove(id);
    if (selected === id) setSelected(null);
  }
  function chooseTool(tool) {
    setTool(tool);
    engine.current?.setMode(tool === 'ancora' ? 'select' : tool);
  }

  return {
    engine,
    ready,
    tool,
    selected,
    setSelected,
    history,
    feature,
    readOnly,
    updateProperties,
    selectFeature,
    removeFeature,
    chooseTool,
    renameFeature: (id, title) => engine.current?.properties(id, { titulo: title }),
  };
}
