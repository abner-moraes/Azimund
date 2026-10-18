import maplibregl from 'maplibre-gl';
import { MARKERS_GEOJSON } from '../config/markers.js';
import { markerIconUrl } from '../api/markerIcons.js';
import { flyToOrbit } from '../core/cameraOrbit.js';

// Builds the DOM marker for each demo point of interest, wires it into the
// zoom-visibility system, and flies the camera to it on click.
export function addMarkers(map, zoomVisibility) {
  MARKERS_GEOJSON.features.forEach((marker, i) => {
    // create element for the marker
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = markerIconUrl(marker.properties.iconSize);
    el.style.width = `${marker.properties.iconSize[0]}px`;
    el.style.height = `${marker.properties.iconSize[1]}px`;

    // add marker to map
    new maplibregl.Marker({ element: el })
      .setLngLat(marker.geometry.coordinates)
      .addTo(map);

    zoomVisibility.register(`marker-${i}`, marker.properties.levelRange, {
      onShow: () => { el.style.display = 'block'; },
      onHide: () => { el.style.display = 'none'; }
    });

    el.addEventListener('click', () => {
      console.log(marker.properties.message);
      flyToOrbit(map, marker.geometry.coordinates);
    });
  });
}
