// A linha e os pontos são desenhados como geojson temporário e são removidos qd desativado

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';
import { readThemeColor } from '../config/theme.js';
import { isMapReady } from '../config/mapStyle.js';

const empty = { type: 'FeatureCollection', features: [] };
const source = 'azimund-distance';

const point = (position) => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'Point', coordinates: position.toArray() },
});

export function DistanceTool({ map, disabled }) {
  const [active, setActive] = useState(false);
  const [ends, setEnds] = useState([]);
  const [preview, setPreview] = useState(null);

  const end = ends[1] || preview;
  const distance = ends[0] && end ? ends[0].distanceTo(end) : null;

  const message =
    distance == null
      ? ends.length
        ? 'Clique no ponto final'
        : 'Clique no ponto inicial'
      : distance < 1000
        ? Math.round(distance) + ' m'
        : (distance / 1000).toLocaleString('pt-BR', {
            maximumFractionDigits: 2,
          }) + ' km';

  useEffect(() => {
    if (disabled) setActive(false);
  }, [disabled]);

  useEffect(() => {
    if (!active) return;

    map.stop();

    const measure = readThemeColor('--color-tertiary-measure');
    map.addSource(source, { type: 'geojson', data: empty });

    map.addLayer({
      id: source + '-line',
      type: 'line',
      source,
      filter: ['==', '$type', 'LineString'],
      paint: {
        'line-width': 3,
        'line-color': measure,
      },
    });

    map.addLayer({
      id: source + '-points',
      type: 'circle',
      source,
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-radius': 5,
        'circle-color': measure,
        'circle-stroke-width': 2,
        'circle-stroke-color': readThemeColor('--color-tertiary-panel'),
      },
    });

    const escape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        setActive(false);
      }
    };

    window.addEventListener('keydown', escape, true);

    return () => {
      window.removeEventListener('keydown', escape, true);

      for (const suffix of ['-points', '-line']) {
        if (map.getLayer(source + suffix)) {
          map.removeLayer(source + suffix);
        }
      }

      if (map.getSource(source)) {
        map.removeSource(source);
      }
    };
  }, [active, map]);

  useEffect(() => {
    if (!active || !ends[0]) return;
    const features = ends.map(point);
    if (end) {
      const a = ends[0].toArray();
      const b = end.toArray();
      b[0] += 360 * Math.round((a[0] - b[0]) / 360); // atravessando o antimeridiano a linha vai pelo lado curto
      features.unshift({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [a, b],
        },
      });
    }

    map.getSource(source)?.setData({
      type: 'FeatureCollection',
      features,
    });
  }, [active, ends, end, map]);

  function position(event) {
    const rect = map.getCanvas().getBoundingClientRect();
    const pixel = [event.clientX - rect.left, event.clientY - rect.top];
    const location = map.unproject(pixel);
    const projected = map.project(location);
    // no globo, clicar no espaço fora da terra devolve um ponto que não volta pro mesmo pixel: ignora

    return Number.isFinite(location.lat) &&
      Math.hypot(projected.x - pixel[0], projected.y - pixel[1]) < 3
      ? location
      : null;
  }

  return (
    <>
      <button
        type="button"
        className="map-button"
        aria-label="Medir distância"
        title="Medir distância"
        aria-pressed={active}
        disabled={disabled || !isMapReady(map)}
        onClick={() => {
          setEnds([]);
          setPreview(null);
          setActive(!active);
        }}
      >
        <Icon name="straighten" />
      </button>

      {active && (
        <>
          <output className="distance-readout">{message}</output>
          {createPortal(
            <div
              className="distance-surface"
              aria-label="Selecione dois pontos no mapa"
              // a superfície fica por cima do mapa e segura os eventos pra não arrastar o globo
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onMouseUp={(event) => event.stopPropagation()}
              onPointerMove={(event) => {
                event.stopPropagation();
                if (ends.length === 1) {
                  setPreview(position(event));
                }
              }}
              onClick={(event) => {
                event.stopPropagation();
                const location = position(event);
                if (!location) return;
                setEnds(ends.length === 1 ? [ends[0], location] : [location]);
                setPreview(null);
              }}
            />,
            map.getContainer(),
          )}
        </>
      )}
    </>
  );
}
