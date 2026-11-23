import React, { useEffect, useState } from 'react';
import { Icon } from '../Icon.jsx';
import { Modal } from '../common/Modal.jsx';
import { isImageUrl } from '../../api/projectContract.js';

export function PageImage({ src, alt = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? (
    <div className="image-placeholder" role="status">
      Não foi possível carregar a imagem.
    </div>
  ) : (
    <img
      className="activity-page-image"
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export function ImageLinkEditor({ page, onChange }) {
  const image = page.imagem || page.questao?.imagem;
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  function updateImage(value) {
    onChange({
      ...page,
      imagem: value,
      ...(page.questao ? { questao: { ...page.questao, imagem: undefined } } : {}),
    });
  }

  function submit(event) {
    event.preventDefault();
    if (!isImageUrl(url)) {
      setError('Informe uma URL http ou https.');
      return;
    }
    updateImage(url.trim());
    setOpen(false);
  }

  return (
    <>
      <div className="editor-row">
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setUrl(image || '');
            setError('');
            setOpen(true);
          }}
        >
          <Icon name="add_photo_alternate" />
          {image ? 'Trocar imagem' : 'Adicionar imagem'}
        </button>
        {image && (
          <button
            type="button"
            className="text-button"
            onClick={() => updateImage(undefined)}
          >
            Remover
          </button>
        )}
      </div>
      {open && (
        <Modal title="Imagem por link" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <label className="field-label">
              URL da imagem
              <input
                aria-label="URL da imagem"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                autoFocus
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <button className="activity-button" type="submit">
              Usar imagem
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
