import React, { useState } from 'react';
import { ProjectPanel } from '../projects/ProjectPanel.jsx';
import { useEditorProject } from './hooks/useEditorProject.js';
import { usePageEditor } from './hooks/usePageEditor.js';
import { useEditorMap } from './hooks/useEditorMap.js';
import { useEditorFiles } from './hooks/useEditorFiles.js';
import { EditorHeader } from './components/EditorHeader.jsx';
import { EditorSidebar } from './components/EditorSidebar.jsx';
import { EditorToolbar } from './components/EditorToolbar.jsx';
import { EditorPageControls } from './components/EditorPageControls.jsx';
import { EditorDialogs } from './components/EditorDialogs.jsx';
import '../../../css/editor.css';

export function ActivityEditor({
  map,
  initialId = null,
  initialPage = -1,
  onClose,
  onOpenProject,
}) {
  const draft = useEditorProject({ map, initialId, onClose, onOpenProject });
  const pages = usePageEditor({
    map,
    project: draft.project,
    updateProject: draft.updateProject,
    initialPage,
  });
  const drawing = useEditorMap({ map, draft, pages });
  const [dialog, setDialog] = useState(null);
  const files = useEditorFiles({ draft, drawing, setDialog });

  function handleTool(tool) {
    draft.setError(null);
    switch (tool) {
      case 'shapes':
        setDialog(dialog === 'shapes' ? null : 'shapes');
        break;
      case 'settings':
        setDialog('settings');
        break;
      case 'open-file':
        files.fileInput.current.click();
        break;
      case 'export-file':
        setDialog('export');
        break;
      case 'undo':
        drawing.engine.current?.undo();
        break;
      case 'redo':
        drawing.engine.current?.redo();
        break;
      default:
        drawing.chooseTool(tool);
    }
  }

  return (
    <div
      className={`editor-workspace ${pages.view === 'pages' ? 'editor-pages-view' : ''}`}
    >
      <EditorHeader draft={draft} pages={pages} />
      {pages.view === 'objects' && (
        <EditorSidebar draft={draft} drawing={drawing} pages={pages} />
      )}
      {pages.view === 'pages' && draft.project && (
        <ProjectPanel
          project={draft.project}
          page={pages.page || null}
          pageIndex={pages.pageIndex}
          editing={pages.editing}
          isAuthor
          showBanner={false}
          onToggleEdit={() => pages.setEditing(!pages.editing)}
          onChange={pages.updatePage}
          onProjectChange={draft.updateProject}
          footer={
            <EditorPageControls
              project={draft.project}
              pages={pages}
              onDelete={() => setDialog('delete-page')}
            />
          }
        />
      )}
      <EditorToolbar
        draft={draft}
        drawing={drawing}
        pages={pages}
        onTool={handleTool}
      />
      <input
        type="file"
        ref={files.fileInput}
        hidden
        accept=".geojson,.json"
        onChange={(event) => files.openFile(event.target.files[0])}
      />
      {files.progress !== null && (
        <div className="editor-notice" role="status">
          Importando GeoJSON... {files.progress}%
          <progress max={100} value={files.progress} />
        </div>
      )}
      {draft.notice && (
        <div className="editor-notice" role="status">
          {draft.notice}
          <button
            type="button"
            className="text-button"
            onClick={() => draft.setNotice('')}
          >
            Fechar
          </button>
        </div>
      )}
      {draft.error && (
        <div className="editor-notice error" role="alert">
          {draft.error.mensagem || draft.error.message}
          <button
            type="button"
            className="text-button"
            onClick={() => draft.setError(null)}
          >
            Fechar
          </button>
        </div>
      )}
      <EditorDialogs
        dialog={dialog}
        setDialog={setDialog}
        draft={draft}
        drawing={drawing}
        pages={pages}
        files={files}
        onTool={handleTool}
      />
    </div>
  );
}
