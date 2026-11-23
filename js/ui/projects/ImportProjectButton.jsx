import React, { useRef, useState } from 'react';
import { importProjectPackage } from '../../api/projectsService.js';
import { AZMD_EXTENSION } from '../../api/adapters/azmdPackage.js';

export function ImportProjectButton({
  className = 'text-button',
  label = 'Importar .azmd',
  onImported,
  onError,
}) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setBusy(true);
    try {
      const created = await importProjectPackage(file);
      onImported?.(created.id);
    } catch (error) {
      onError?.(error);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = ''; // limpa o input para deixar importar o mesmo arquivo dnv se precisar
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? 'Importando...' : label}
      </button>
      <input
        ref={input}
        type="file"
        hidden
        accept={AZMD_EXTENSION}
        onChange={(event) => handleFile(event.target.files[0])}
      />
    </>
  );
}
