import React from 'react';
import { Modal } from './common/Modal.jsx';

export function SettingsDialog({ models3d, onModels3dChange, onClose }) {
  return (
    <Modal title="Configurações" onClose={onClose}>
      {/* espaço reservado p opções, so adiciona <label> aqui */}
      <div className="settings-options">
        <label className="settings-option">
          <input
            type="checkbox"
            checked={models3d}
            onChange={(event) => onModels3dChange(event.target.checked)}
          />
          Habilitar modelos 3D (experimental)
        </label>
      </div>
    </Modal>
  );
}
