// propriedades do objeto selecionado (cores, tamanhos, texto)
import React from 'react';
import { ColorField, NumberField } from './PropertyFields.jsx';
import { readThemeColor } from '../../../config/theme.js';

export function FeatureProperties({ feature, readOnly, onChange, onRemove }) {
  const properties = feature.properties;
  const mint = readThemeColor('--color-general-mint');
  const geometry = feature.geometry.type;
  const color = (label, key, fallback) => (
    <ColorField
      label={label}
      value={properties[key] || fallback}
      onChange={(value) => onChange({ [key]: value })}
    />
  );
  const number = (label, key, fallback, min, max, step) => (
    <NumberField
      label={label}
      value={properties[key] ?? fallback}
      min={min}
      max={max}
      step={step}
      onChange={(value) => onChange({ [key]: value })}
    />
  );

  return (
    <>
      <label className="field-label">
        Título
        <input
          value={properties.titulo || ''}
          onChange={(event) => onChange({ titulo: event.target.value })}
          disabled={readOnly}
        />
      </label>
      {readOnly ? (
        <p>Camada nativa, somente leitura</p>
      ) : (
        <>
          {geometry !== 'Point' && (
            <>
              {color('Contorno', 'stroke', mint)}
              {number('Largura', 'stroke-width', 2, 0, 50)}
              {number('Opacidade do contorno', 'stroke-opacity', 1, 0, 1, 0.05)}
            </>
          )}
          {geometry === 'Polygon' && (
            <>
              {color('Preenchimento', 'fill', mint)}
              {number('Opacidade do preenchimento', 'fill-opacity', 0.25, 0, 1, 0.05)}
              {number('Altura 3D (m)', 'altura', 0, 0, 1000000)}
            </>
          )}
          {geometry === 'Point' && (
            <>
              {color('Cor do ponto', 'marker-color', mint)}
              <label className="field-label">
                Tamanho
                <select
                  value={properties['marker-size'] || 'medium'}
                  onChange={(event) => onChange({ 'marker-size': event.target.value })}
                >
                  <option value="small">Pequeno</option>
                  <option value="medium">Médio</option>
                  <option value="large">Grande</option>
                </select>
              </label>
              <label className="field-label">
                Texto
                <input
                  value={properties.label || ''}
                  onChange={(event) =>
                    onChange({
                      label: event.target.value,
                      modo: event.target.value ? 'texto' : 'point',
                    })
                  }
                />
              </label>
              {number('Tamanho do texto', 'label-size', 18, 8, 64)}
              {color(
                'Cor do texto',
                'label-color',
                readThemeColor('--color-primary-cosmic-latte'),
              )}
            </>
          )}
        </>
      )}
      <button type="button" className="danger-button" onClick={onRemove}>
        excluir objeto
      </button>
    </>
  );
}
