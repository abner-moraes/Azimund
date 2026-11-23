import React from 'react';
import { IconButton } from '../../common/IconButton.jsx';

const TOOLS = [
  ['select', 'Seleção / vértices', 'ads_click'],
  ['point', 'Ponto', 'location_on'],
  ['text', 'Texto', 'text_fields'],
  ['linestring', 'Linha', 'polyline'],
  ['shapes', 'Formas', 'shapes'],
  ['freehand', 'Desenho livre', 'gesture'],
  ['open-file', 'Abrir GeoJSON', 'attach_file'],
  ['undo', 'Desfazer', 'undo'],
  ['redo', 'Refazer', 'redo'],
  ['settings', 'Configurações', 'settings'],
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
    <div className="editor-tools" role="toolbar" aria-label="Ferramentas de edição">
      <IconButton
        name="add_location_alt"
        label={draft.project ? 'Reposicionar pino da atividade' : 'Pino da atividade'}
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
