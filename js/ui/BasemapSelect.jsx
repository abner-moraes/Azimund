import React from 'react';
import { BASEMAP_OPTIONS } from '../config/basemapOptions.js';

// defaultLabel adiciona a primeira opção "padrão"
export function BasemapSelect({ value, onChange, defaultLabel, label = 'Mapa base' }) {
  return (
    <select
      aria-label={label}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
    >
      {defaultLabel && <option value="">{defaultLabel}</option>}
      {BASEMAP_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
