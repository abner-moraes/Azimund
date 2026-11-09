import maplibregl from 'maplibre-gl';
import { MARKERS_GEOJSON } from '../config/markers.js';
import { markerIconUrl } from '../api/markerIcons.js';

// Os exemplos do GitHub continuam sendo criados aqui, uma única vez no main.
// projetoId é a ponte entre o marcador existente e o conteúdo do serviço.
export function addMarkers(map, zoomVisibility, onSelect = null) {
  let projetos = new Map();
  let listener = onSelect;
  let visible = true;
  let selectedId = null;
  let pending = null;
  let opener = null;
  const originais = [];
  let adicionais = [];

  function criar(marker, id) {
    const el = document.createElement('div');
    el.className = 'marker project-marker';
    el.style.width = `${marker.properties.iconSize[0]}px`;
    el.style.height = `${marker.properties.iconSize[1]}px`;
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
    el.dataset.projectId = marker.properties.projetoId;
    const fallback = document.createElement('span');
    fallback.className = 'material-symbols-outlined';
    fallback.setAttribute('aria-hidden', 'true');
    el.append(fallback);

    // Mesma geometria, tamanho e anchor padrão usados pelo projeto original.
    const instance = new maplibregl.Marker({ element: el })
      .setLngLat(marker.geometry.coordinates)
      .addTo(map);

    function update() {
      el.style.display =
        visible &&
        selectedId !== marker.properties.projetoId &&
        zoomVisibility.isVisible(id)
          ? 'block'
          : 'none';
    }
    zoomVisibility.register(id, marker.properties.levelRange, {
      onShow: update,
      onHide: update,
    });

    function abrir() {
      opener = el;
      const projeto = projetos.get(marker.properties.projetoId);
      if (projeto && listener) listener(projeto);
      else pending = marker.properties.projetoId;
    }
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      abrir();
    });
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        abrir();
      }
    });

    let imageRequest = 0;
    function atualizarProjeto() {
      const projeto = projetos.get(marker.properties.projetoId);
      const titulo = projeto?.titulo || marker.properties.message;
      el.title = titulo;
      el.setAttribute('aria-label', `Abrir ${titulo}`);
      fallback.textContent = projeto?.tipo === 'APRESENTACAO' ? 'slideshow' : 'quiz';
      const miniatura = projeto?.miniatura ?? marker.properties.miniatura ?? '';
      el.style.backgroundImage = markerIconUrl(marker.properties.iconSize, miniatura);
      fallback.hidden = !!miniatura;
      const token = ++imageRequest;
      if (miniatura) {
        const image = new Image();
        image.onerror = () => {
          if (token === imageRequest) {
            el.style.backgroundImage = 'none';
            fallback.hidden = false;
          }
        };
        image.src = `${import.meta.env?.BASE_URL || '/'}${miniatura.replace(/^\//, '')}`;
      }
    }
    atualizarProjeto();
    return {
      update,
      atualizarProjeto,
      el,
      projetoId: marker.properties.projetoId,
      remove() {
        imageRequest += 1;
        instance.remove();
        zoomVisibility.unregister(id);
      },
    };
  }

  MARKERS_GEOJSON.features.forEach((marker, i) =>
    originais.push(criar(marker, `marker-${i}`)),
  );

  function abrirPendente() {
    if (pending && listener && projetos.has(pending)) {
      const projeto = projetos.get(pending);
      pending = null;
      listener(projeto);
    }
  }

  const control = {
    onSelect(callback) {
      listener = callback;
      abrirPendente();
      return () => {
        if (listener === callback) listener = null;
      };
    },
    setProjects(itens) {
      projetos = new Map(itens.map((item) => [item.id, item]));
      originais.forEach((item) => item.atualizarProjeto());
      adicionais.forEach((item) => item.remove());
      const vinculados = new Set(originais.map((item) => item.projetoId));
      // Projetos novos do índice usam o mesmo renderer, sem duplicar os exemplos.
      adicionais = itens
        .filter((item) => !vinculados.has(item.id))
        .map((item) =>
          criar(
            {
              properties: {
                projetoId: item.id,
                message: item.titulo,
                miniatura: item.miniatura,
                iconSize: [50, 50],
                levelRange: ['CONTINENTAL', 'STREET'],
              },
              geometry: {
                type: 'Point',
                coordinates: [item.ancora.lng, item.ancora.lat],
              },
            },
            `projeto-${item.id}`,
          ),
        );
      abrirPendente();
    },
    setVisible(value) {
      visible = value;
      [...originais, ...adicionais].forEach((item) => item.update());
    },
    setSelected(id) {
      selectedId = id;
      [...originais, ...adicionais].forEach((item) => item.update());
    },
    focus(id) {
      const target =
        opener?.isConnected && opener.dataset.projectId === id
          ? opener
          : [...originais, ...adicionais].find((item) => item.projetoId === id)?.el;
      target?.focus({ preventScroll: true });
    },
    remove() {
      [...originais, ...adicionais].forEach((item) => item.remove());
      pending = null;
      map.off('remove', control.remove);
    },
  };
  map.on('remove', control.remove);
  return control;
}

export function addAnchor(map, ancora) {
  const el = document.createElement('span');
  el.className = 'material-symbols-outlined activity-anchor';
  el.textContent = 'location_on';
  el.setAttribute('aria-hidden', 'true');
  return new maplibregl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat([ancora.lng, ancora.lat])
    .addTo(map);
}
