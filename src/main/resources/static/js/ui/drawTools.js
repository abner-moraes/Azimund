import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';

export function initDrawTools(map) {
  const draw = new MaplibreTerradrawControl({
    modes: [
      'point',
      'linestring',
      'polygon',
      'rectangle',
      'circle',
      'freehand',
      'angled-rectangle',
      'sensor',
      'sector',
      'select',
      'delete-selection',
      'delete',
      'download'
    ],
    open: true
  });
  map.addControl(draw, 'top-left');

  const container = map.getContainer().querySelector('.maplibregl-terradraw-add-control').parentElement;
  container.id = 'terradraw-tools';
  container.setAttribute('role', 'toolbar');
  container.setAttribute('aria-label', 'Ferramentas TerraDraw');
  container.style.display = 'none';

  return draw;
}



// O menu abre o controle original no canto
export function setDrawToolsOpen(map, draw, isOpen) {
  const container = map.getContainer().querySelector('#terradraw-tools');
  container.style.display = isOpen ? '' : 'none';

  if (isOpen) {
    draw.activate();
  } else {
    draw.deactivate();
  }
}
