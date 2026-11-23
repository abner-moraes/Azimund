import { useState } from 'react';
import { LIMITS } from '../../../config/limits.js';
import { createPage, readMapCamera } from '../../../editor/pageUtils.js';

export function usePageEditor({ map, project, updateProject, initialPage }) {
  const [pageIndex, setPageIndex] = useState(initialPage);
  const [view, setView] = useState(initialPage >= 0 ? 'pages' : 'objects');
  const [editing, setEditing] = useState(true);
  const page = project?.paginas[pageIndex];

  function changePage(index) {
    setPageIndex(index);
    setView('pages');
  }

  function addPage(type) {
    if (!project || project.paginas.length >= LIMITS.pages) return;
    const newPage = createPage(type, readMapCamera(map));
    updateProject((current) => ({
      ...current,
      paginas: [...current.paginas, newPage],
    }));
    changePage(project.paginas.length);
    setEditing(true);
  }

  function updatePage(value) {
    updateProject((current) => ({
      ...current,
      paginas: current.paginas.map((page, index) =>
        index === pageIndex ? value : page,
      ),
    }));
  }

  function movePage(direction) {
    const nextIndex = pageIndex + direction;
    if (nextIndex < 0 || nextIndex >= project.paginas.length) return;
    const pages = [...project.paginas];
    [pages[pageIndex], pages[nextIndex]] = [pages[nextIndex], pages[pageIndex]];
    updateProject({ ...project, paginas: pages });
    setPageIndex(nextIndex);
  }

  function removePage() {
    updateProject((current) => ({
      ...current,
      paginas: current.paginas.filter((_, index) => index !== pageIndex),
    }));
    setPageIndex(Math.min(pageIndex - 1, project.paginas.length - 2));
  }

  function setPageBasemap(value) {
    // "Padrão" apaga a chave em vez de salvar mapaBase vazio
    const withBasemap = (item) => {
      const next = { ...item, mapaBase: value };
      if (!value) delete next.mapaBase;
      return next;
    };
    if (pageIndex < 0) updateProject((current) => withBasemap(current));
    else updatePage(withBasemap(page));
  }
  function setFeatureVisibility(id, visible) {
    const featureIds = visible
      ? [...new Set([...page.featureIds, id])]
      : page.featureIds.filter((featureId) => featureId !== id);
    updatePage({ ...page, featureIds });
  }

  return {
    page,
    pageIndex,
    view,
    setView,
    editing,
    setEditing,
    changePage,
    addPage,
    updatePage,
    movePage,
    removePage,
    setFeatureVisibility,
    setPageBasemap,
    captureCamera: () => updatePage({ ...page, camera: readMapCamera(map) }),
  };
}
