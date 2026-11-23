// os controles inferiores do globo, régua, inclinação 3D, orientação e zoom
import React, { useEffect, useState } from 'react';
import { DistanceTool } from './DistanceTool.jsx';
import { Icon } from './Icon.jsx';

export function GlobeActions({ map, disabled = false }) {
  const [tiltOpen, setTiltOpen] = useState(false);
  const [tilt, setTilt] = useState(() => map.getPitch());
  useEffect(() => {
    const sync = () => setTilt(map.getPitch());
    map.on('pitch', sync);
    return () => map.off('pitch', sync);
  }, [map]);
  return (
    <div
      className="map-actions"
      role="group"
      aria-label="Controles do mapa"
      inert={disabled}
      aria-disabled={disabled || undefined}
    >
      <DistanceTool map={map} disabled={disabled} />
      <button
        type="button"
        className="map-button"
        aria-label="3D"
        title="3D"
        onClick={() => setTiltOpen(!tiltOpen)}
        aria-expanded={tiltOpen}
      >
        <Icon name="view_in_ar" />
      </button>
      {tiltOpen && (
        <label className="tilt-control">
          Inclinação {Math.round(tilt)}°{' '}
          <input
            aria-label="Inclinação da câmera"
            type="range"
            min="0"
            max="90"
            value={tilt}
            onChange={(event) => map.setPitch(Number(event.target.value))}
          />
        </label>
      )}

      <button
        type="button"
        className="map-button"
        aria-label="Orientação"
        title="Orientação"
        onClick={() =>
          map.easeTo({
            bearing: 0,
            pitch: 0,
            duration: 700,
          })
        }
      >
        <Icon name="explore" />
      </button>

      <div className="zoom-buttons" role="group" aria-label="Zoom">
        <button
          type="button"
          className="map-button"
          aria-label="Aumentar zoom"
          title="Aumentar zoom"
          onClick={() => map.zoomIn()}
        >
          <Icon name="add" />
        </button>

        <button
          type="button"
          className="map-button"
          aria-label="Diminuir zoom"
          title="Diminuir zoom"
          onClick={() => map.zoomOut()}
        >
          <Icon name="remove" />
        </button>
      </div>
    </div>
  );
}
