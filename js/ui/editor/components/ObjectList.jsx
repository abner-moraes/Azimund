import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../../Icon.jsx';

function ObjectItem({
  feature,
  index,
  readOnly,
  page,
  onSelect,
  onRename,
  onRemove,
  onVisibilityChange,
}) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(feature.properties?.titulo || '');
  const clickTimer = useRef(null);
  useEffect(() => () => clearTimeout(clickTimer.current), []);
  useEffect(
    () => setTitle(feature.properties?.titulo || ''),
    [feature.properties?.titulo],
  );
  const icon = feature.properties?.label
    ? 'text_fields'
    : feature.geometry.type === 'Point'
      ? 'location_on'
      : feature.geometry.type === 'LineString'
        ? 'polyline'
        : 'shapes';
  function finishRename() {
    onRename(title);
    setRenaming(false);
  }

  return (
    <div className="object-item">
      <div className="editor-row">
        <button
          type="button"
          className="object-focus"
          onClick={() => {
            clearTimeout(clickTimer.current);
            clickTimer.current = setTimeout(onSelect, 220);
          }}
          onDoubleClick={() => {
            clearTimeout(clickTimer.current);
            if (!readOnly) setRenaming(true);
          }}
        >
          <Icon name={icon} />
          {renaming ? (
            <input
              autoFocus
              aria-label="Renomear objeto"
              value={title}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={finishRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') finishRename();
              }}
            />
          ) : (
            <span>{feature.properties?.titulo || `Objeto ${index + 1}`}</span>
          )}
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label={`Excluir objeto ${index + 1}`}
          onClick={onRemove}
        >
          <Icon name="close" />
        </button>
      </div>
      {readOnly && <small>camada nativa, somente leitura</small>}
      {page && (
        <label className="object-visible">
          <input
            type="checkbox"
            checked={page.featureIds.includes(feature.id)}
            onChange={(event) => onVisibilityChange(event.target.checked)}
          />
          Visível nesta página
        </label>
      )}
    </div>
  );
}

export function ObjectList({ draft, drawing, pages }) {
  const { project, geojson, loading } = draft;
  return (
    <>
      {!project && (
        <p className="editor-hint">
          clique no pino da atividade e escolha um local no mapa
        </p>
      )}
      {loading && <p role="status">carregando projeto...</p>}
      {project && !geojson.features.length && (
        <p className="editor-hint">use as ferramentas para criar objetos no mapa</p>
      )}
      {geojson.features.map((feature, index) => (
        <ObjectItem
          key={feature.id}
          feature={feature}
          index={index}
          readOnly={drawing.history.readOnlyIds?.includes(feature.id)}
          page={pages.page}
          onSelect={() => drawing.selectFeature(feature)}
          onRename={(title) => drawing.renameFeature(feature.id, title)}
          onRemove={() => drawing.removeFeature(feature.id)}
          onVisibilityChange={(visible) =>
            pages.setFeatureVisibility(feature.id, visible)
          }
        />
      ))}
    </>
  );
}
