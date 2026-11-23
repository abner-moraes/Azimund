// esquema de abrir GeoJSON, confirmar, aplicar, e o exportar GeoJSON

import { useRef, useState } from 'react';
import { clone } from '../../../api/projectContract.js';
import { importGeojson, exportGeojson } from '../../../api/projectsService.js';

export function useEditorFiles({ draft, drawing, setDialog }) {
  const { id, geojson, setError, setNotice } = draft;
  const fileInput = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [progress, setProgress] = useState(null);

  async function openFile(file) {
    setProgress(0);
    setError(null);
    try {
      setPendingImport(await importGeojson(file, setProgress));
      setDialog('import');
    } catch (error) {
      setError(error);
    } finally {
      setProgress(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function applyImport(replace) {
    const imported = clone(pendingImport.geojson);
    const ids = new Set(replace ? [] : geojson.features.map((feature) => feature.id));
    for (const feature of imported.features) {
      if (ids.has(feature.id)) feature.id = crypto.randomUUID();
      ids.add(feature.id);
    }
    const data = replace
      ? imported
      : {
          type: 'FeatureCollection',
          features: [...geojson.features, ...imported.features],
        };
    drawing.engine.current?.load(data, {
      record: !pendingImport.readOnly,
      reset: pendingImport.readOnly,
    });
    setNotice(pendingImport.warnings.join(' '));
    setDialog(null);
    setPendingImport(null);
    drawing.setSelected(null);
  }
  function exportFile(selectionOnly = false) {
    exportGeojson(geojson, id, selectionOnly ? drawing.selected : null);
    setDialog(null);
  }

  return {
    fileInput,
    pendingImport,
    progress,
    openFile,
    applyImport,
    exportFile,
    cancelImport: () => {
      setPendingImport(null);
      setDialog(null);
    },
  };
}
