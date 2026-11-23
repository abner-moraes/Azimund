import React from 'react';
import { Icon } from '../Icon.jsx';

export function IconButton({ name, label, onClick, disabled = false, active = false }) {
  return (
    <button
      type="button"
      className={`icon-button ${active ? 'active' : ''}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={name} />
    </button>
  );
}
