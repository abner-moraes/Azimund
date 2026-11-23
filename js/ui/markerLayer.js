// marcadores HTML das atividades no globo e o pino de âncora (resumo e editor)
import maplibregl from 'maplibre-gl';
import { TEAM_AUTHOR_ID } from '../api/projectContract.js';
import { readThemeColor } from '../config/theme.js';

const MARKER_FILES = {
  RASCUNHO: 'rascunho',
  ATIVIDADE: 'atividade',
  APRESENTACAO: 'apresentacao',
  AULA: 'aula',
};

// SVG do tipo de projeto em public/markers (usado tbm pelo ProjectGlyph)
// o SVG entra como máscara, assim o pino pega a cor do projeto
export function getMarkerUrl(tipo) {
  return `${import.meta.env?.BASE_URL || '/'}markers/${MARKER_FILES[tipo] || 'rascunho'}.svg`;
}
function paintPin(el, tipo, cor) {
  const icon = `url("${getMarkerUrl(tipo)}")`;
  el.style.maskImage = icon;
  el.style.webkitMaskImage = icon;
  el.style.backgroundColor = cor || readThemeColor('--color-general-mint');
}

export function addMarkers(map) {
  let listener = null;
  let visible = true;
  let enabled = false;
  let teamOnly = false;
  let selected = null;
  let revealed = null;
  const markers = new Map();
  function update() {
    for (const [id, record] of markers)
      record.el.style.display =
        visible &&
        ((enabled && (!teamOnly || String(record.item.autor?.id) === TEAM_AUTHOR_ID)) ||
          id === revealed) &&
        id !== selected
          ? 'block'
          : 'none';
  }
  function render(item) {
    let record = markers.get(item.id);
    if (!record) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'project-marker project-pin';
      el.dataset.projectId = item.id;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        listener?.(markers.get(item.id).item);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([item.ancora.lng, item.ancora.lat])
        .addTo(map);
      record = { el, marker };
      markers.set(item.id, record);
    }
    record.item = item;
    record.el.title = item.titulo;
    record.el.setAttribute('aria-label', `Abrir ${item.titulo}`);
    paintPin(record.el, item.tipo, item.cor);
    record.marker.setLngLat([item.ancora.lng, item.ancora.lat]);
  }
  return {
    onSelect(fn) {
      listener = fn;
      return () => {
        if (listener === fn) listener = null;
      };
    },
    setProjects(items) {
      const ids = new Set(items.map((p) => p.id));
      for (const [id, r] of markers)
        if (!ids.has(id)) {
          r.marker.remove();
          markers.delete(id);
        }
      items.forEach(render);
      update();
    },
    setVisible(value) {
      visible = value;
      update();
    },
    setEnabled(value, onlyTeam = false) {
      teamOnly = onlyTeam;
      enabled = value;
      update();
    },
    setSelected(id) {
      selected = id;
      update();
    },
    clearReveal() {
      revealed = null;
      update();
    },
    reveal(item) {
      render(item);
      revealed = item.id;
      update();
    },
    focus(id) {
      markers.get(id)?.el.focus({ preventScroll: true });
    },
  };
}

// sem tipo, ícone simples (resumo da atividade)
// com tipo, o mesmo pino colorido do globo (editor)
export function addAncora(map, ancora, { cor, tipo, draggable = false, onDrag } = {}) {
  const el = document.createElement('span');
  if (tipo) {
    el.className = 'project-pin';
    paintPin(el, tipo, cor);
  } else {
    el.className = 'material-symbols-outlined activity-ancora';
    el.textContent = 'location_on';
    if (cor) el.style.color = cor;
  }
  el.setAttribute('aria-hidden', 'true');
  const marker = new maplibregl.Marker({ element: el, anchor: 'bottom', draggable })
    .setLngLat([ancora.lng, ancora.lat])
    .addTo(map);
  if (onDrag)
    marker.on('dragend', () => {
      const p = marker.getLngLat();
      onDrag({ lng: p.lng, lat: p.lat });
    });
  return marker;
}
