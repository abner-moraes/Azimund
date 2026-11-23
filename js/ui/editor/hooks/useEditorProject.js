// carrega o projeto do editor, guarda o rascunho e salva sozinho (autoSaveQueue)
// publish baixa o .azmd e openProject troca pra outro projeto
import { useEffect, useRef, useState } from 'react';
import * as projects from '../../../api/projectsService.js';
import { defaultCamera, emptyFeatureCollection } from '../../../api/projectContract.js';
import { createAutoSaveQueue } from '../../../editor/autoSaveQueue.js';
import { updateProjectPages } from '../../../editor/pageUtils.js';
import { flyToPage } from '../../activityLayer.js';
import { forgetLastProject, rememberProject } from '../editorSession.js';

export function useEditorProject({ map, initialId, onClose, onOpenProject }) {
  const [id, setId] = useState(initialId);
  const [project, setProject] = useState(null);
  const [geojson, setGeojson] = useState(emptyFeatureCollection);
  const [loading, setLoading] = useState(!!initialId);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState({ state: 'saved' });
  const [notice, setNotice] = useState('');
  const baseline = useRef(null); // JSON do que veio do servidor, pra n salvar algo q n mudou
  const saveQueue = useRef(null);

  function updateProject(value) {
    setProject((current) =>
      updateProjectPages(typeof value === 'function' ? value(current) : value),
    );
  }

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([projects.loadProjectJson(id), projects.loadProjectGeojson(id)])
      .then(([json, data]) => {
        if (cancelled) return;
        if (!projects.isProjectAuthor(json))
          throw {
            codigo: 'SEM_PERMISSAO',
            mensagem: 'Somente o autor pode editar este projeto.',
          };
        baseline.current = JSON.stringify({ json, geojson: data });
        setProject(json);
        if (json.horarioModificado)
          setStatus({ state: 'saved', savedAt: new Date(json.horarioModificado) });
        setGeojson(data);
        setLoading(false);
        rememberProject(projects.getSessionUser()?.id, id);
        flyToPage(map, defaultCamera(json.ancora));
      })
      .catch((error) => {
        if (!cancelled) {
          setError(error);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, map]);

  useEffect(() => {
    if (!id) return;
    const queue = createAutoSaveQueue(
      (data) => projects.saveProject(id, data),
      setStatus,
    );
    saveQueue.current = queue;
    const flush = () => queue.flush().catch(setError);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    // fechando a aba com algo pendente tenta salvar e pede confirmação do navegador
    const handleUnload = (event) => {
      if (queue.pending) {
        flush();
        event.preventDefault();
        event.returnValue = '';
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
      queue
        .flush()
        .catch(() => {})
        .finally(() => queue.dispose());
      saveQueue.current = null;
    };
  }, [id]);

  useEffect(() => {
    if (!project || !saveQueue.current || loading) return;
    const data = { json: project, geojson };
    if (JSON.stringify(data) !== baseline.current) saveQueue.current.schedule(data);
  }, [project, geojson, loading]);

  async function afterSave(action) {
    try {
      await saveQueue.current?.flush();
      await action();
    } catch (error) {
      setError(error);
    }
  }
  function leave() {
    return afterSave(onClose);
  }
  function publish() {
    return afterSave(async () => {
      await projects.exportProjectPackage(id);
      setNotice(`Arquivo atividade_${id}.azmd baixado.`);
    });
  }
  // salva o projeto atual antes de abrir outro
  function openProject(nextId) {
    return afterSave(() => onOpenProject?.(nextId));
  }
  function removeProject(discard = false) {
    return afterSave(async () => {
      if (discard) await projects.discardLocalCopy(id);
      else await projects.deleteProject(id);
      forgetLastProject(projects.getSessionUser()?.id);
      onClose();
    });
  }

  return {
    id,
    setId,
    project,
    updateProject,
    geojson,
    setGeojson,
    loading,
    setLoading,
    error,
    setError,
    status,
    notice,
    setNotice,
    leave,
    publish,
    openProject,
    removeProject,
    retrySave: () => saveQueue.current?.retry(),
  };
}
