import React from 'react';
import { IconButton } from '../../common/IconButton.jsx';

const TOOLS = [
  ['select', 'seleção / vértices', 'ads_click'],
  ['point', 'ponto', 'location_on'],
  ['text', 'texto', 'text_fields'],
  ['linestring', 'linha', 'polyline'],
  ['shapes', 'formas', 'shapes'],
  ['freehand', 'desenho livre', 'gesture'],
  ['open-file', 'abrir geojson', 'attach_file'],
  ['undo', 'desfazer', 'undo'],
  ['redo', 'refazer', 'redo'],
  ['settings', 'configurações', 'settings'],
];

export function EditorToolbar({ draft, drawing, pages, onTool }) {
  function disabled(name) {
    return (
      !draft.project ||
      draft.loading ||
      (pages.view === 'pages' && !pages.editing) ||
      (name === 'undo' && !drawing.history.canUndo) ||
      (name === 'redo' && !drawing.history.canRedo)
    );
  }
  return (
    <div className="editor-tools" role="toolbar" aria-label="ferramentas de edição">
      <IconButton
        name="add_location_alt"
        label={draft.project ? 'reposicionar pino da atividade' : 'pino da atividade'}
        active={drawing.tool === 'ancora'}
        disabled={!drawing.ready || draft.loading}
        onClick={() => onTool('ancora')}
      />

      <div className="toolbar-divider" />
      {TOOLS.map(([name, label, icon]) => (
        <IconButton
          key={name}
          name={icon}
          label={label}
          active={drawing.tool === name}
          disabled={disabled(name)}
          onClick={() => onTool(name)}
        />
      ))}
    </div>
  );
}
