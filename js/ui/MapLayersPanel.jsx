// conteúdo do painel "Camadas do mapa"
import React from 'react';
import { BasemapSelect } from './BasemapSelect.jsx';
import { TERRAIN_EXAGGERATION } from '../config/preferences.js';

const CONTEXT_OPTIONS = [
  ['labels', 'Rótulos e nomes'],
  ['boundaries', 'Fronteiras'],
  ['roads', 'Ruas, estradas e bairros'],
];

export function MapLayersPanel({
  contextVisibility,
  onContextChange,
  mapReady,
  projection,
  changeProjection,
  projectionLocked,
  basemap,
  changeBasemap,
  terrainExaggeration,
  changeTerrainExaggeration,
  showActivities,
  onShowActivitiesChange,
}) {
  return (
    <div className="layers-content">
      <fieldset disabled={!mapReady} className="context-options">
        <legend>Detalhes do mapa</legend>
        {CONTEXT_OPTIONS.map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={!!contextVisibility?.[key]}
              onChange={(event) => onContextChange(key, event.target.checked)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <fieldset className="projection-options" disabled={!mapReady || projectionLocked}>
        <legend>Projeção</legend>
        <select aria-label="Projeção" value={projection} onChange={changeProjection}>
          <option value="globe">Globo</option>
          <option value="mercator">Plano</option>
        </select>
      </fieldset>

      <fieldset className="basemap-options" disabled={!mapReady}>
        <legend>Mapa base</legend>
        <BasemapSelect value={basemap} onChange={changeBasemap} />
      </fieldset>

      <fieldset className="terrain-options" disabled={!mapReady}>
        <legend>Exagero do terreno</legend>
        <div className="range-field">
          <input
            type="range"
            aria-label="Exagero do terreno"
            min={TERRAIN_EXAGGERATION.min}
            max={TERRAIN_EXAGGERATION.max}
            step={TERRAIN_EXAGGERATION.step}
            value={terrainExaggeration}
            onChange={(event) => changeTerrainExaggeration(Number(event.target.value))}
          />
          <output aria-live="polite">{terrainExaggeration.toFixed(1)}X</output>
        </div>
      </fieldset>

      <fieldset className="context-options activities-options">
        <legend>Atividades</legend>
        <label>
          <input
            type="checkbox"
            checked={showActivities}
            onChange={(event) => onShowActivitiesChange(event.target.checked)}
          />
          Mostrar atividades no globo
        </label>
      </fieldset>
    </div>
  );
}
