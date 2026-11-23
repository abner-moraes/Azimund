import React from 'react';
import { getMarkerUrl } from './markerLayer.js';

// ícone do tipo de projeto (mesmo SVG dos pinos do globo)
export function ProjectGlyph({ type, color }) {
  const mask = `url("${getMarkerUrl(type)}")`;
  return (
    <span
      aria-hidden="true"
      className="project-glyph"
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
        backgroundColor: color || 'currentColor',
      }}
    />
  );
}
