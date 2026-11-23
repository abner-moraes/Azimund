// campos de cor e número do painel de propriedades
import React, { useEffect, useState } from 'react';
import { readThemeColor } from '../../../config/theme.js';

// atalhos de cor = cores do vars.css (lidas na hora, o JSON guarda o hex)
const SWATCHES = [
  '--color-general-mint',
  '--color-primary-lime',
  '--color-primary-red',
  '--color-primary-blue',
  '--color-primary-yellow',
  '--color-general-turquoise',
  '--color-primary-cosmic-latte',
  '--color-general-slate',
];

export function ColorField({ label, value, onChange }) {
  // texto do campo hex separado do valor: so manda pra fora qd vira um #RRGGBB completo
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);
  function updateHex(event) {
    setHex(event.target.value);
    if (/^#[0-9a-f]{6}$/i.test(event.target.value)) onChange(event.target.value);
  }
  return (
    <label className="color-field">
      <span>{label}</span>
      <div className="editor-row">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          className="hex-field"
          aria-label={`${label} hexadecimal`}
          value={hex}
          maxLength={7}
          onBlur={() => setHex(value)}
          onChange={updateHex}
        />
      </div>
      <div className="color-swatches">
        {SWATCHES.map(readThemeColor).map((color) => (
          <button
            type="button"
            aria-label={`${label} ${color}`}
            key={color}
            style={{ background: color }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </label>
  );
}

export function NumberField({ label, value, onChange, min, max, step = 1 }) {
  function update(event) {
    const value = Number(event.target.value);
    if (Number.isFinite(value) && value >= min && value <= max) onChange(value);
  }
  return (
    <label className="field-label">
      {label}
      <input
        type="number"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={update}
      />
    </label>
  );
}
