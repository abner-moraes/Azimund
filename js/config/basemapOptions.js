export const BASEMAP_OPTIONS = Object.freeze([
  { value: 'satellite-2025', label: 'Satélite 2025' },
  { value: 'satellite-2020', label: 'Satélite 2020' },
  { value: 'terrain', label: 'Terreno base' },
  { value: 'terrain-light', label: 'Terreno claro' },
]);

export const DEFAULT_BASEMAP = 'satellite-2025';

export const BASEMAP_KEYS = BASEMAP_OPTIONS.map((option) => option.value);
