import maplibregl from 'maplibre-gl';
import { MARKERS_GEOJSON } from '../config/markers.js';
import { markerIconUrl } from '../api/markerIcons.js';

// marcadores criados em DOM (atividade)
export function addMarkers(map, zoomVisibility) {
  MARKERS_GEOJSON.features.forEach((marker, i) => {
    // cria elemento do marcador
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = markerIconUrl(marker.properties.iconSize);
    el.style.width = `${marker.properties.iconSize[0]}px`;
    el.style.height = `${marker.properties.iconSize[1]}px`;

    // põe marcador no mapa
    new maplibregl.Marker({ element: el })
      .setLngLat(marker.geometry.coordinates)
      .addTo(map);

    zoomVisibility.register(`marker-${i}`, marker.properties.levelRange, {
      onShow: () => { el.style.display = 'block'; },
      onHide: () => { el.style.display = 'none'; }
    });

    el.addEventListener('click', () => {

      //AQUI QUE ABRE O CARD DA ATIVIDADE
      console.log("clicado");
    });
  });
}
