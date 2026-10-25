import React, { useEffect, useRef, useState } from 'react';
import { readProfilePhoto } from './UserIcon/profilePhoto.js';
import '../../css/user.css';

const USER_FIELDS = [
  { key: 'nome', label: 'Nome', type: 'text', autoComplete: 'name' },
  { key: 'tipo', label: 'Função', type: 'text', autoComplete: 'off' },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { key: 'senha', label: 'Senha', type: 'password', autoComplete: 'new-password' }
];

export function UserPanel({ user, onChange, onClose }) {
  const dialogRef = useRef(null);
  const editButtonRef = useRef(null);
  const inputRef = useRef(null);
  const photoInputRef = useRef(null);
  const photoRequestRef = useRef(0);
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    dialog.showModal();
    return () => {
      photoRequestRef.current += 1;
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus(); // mapa fica inativo quando abre
    };
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
    else editButtonRef.current?.focus();
  }, [editing]);

  async function changePhoto(event) {
    const file = event.target.files[0];
    // deixa selecionar o mesmo arquivo dnv
    event.target.value = '';
    if (!file) return;
    const request = ++photoRequestRef.current;
    setPhotoError('');
    setMessage('');
    setLoadingPhoto(true);
    try {
      const foto = await readProfilePhoto(file);
      if (request !== photoRequestRef.current) return;
      // MUDA AQUI P INTEGRAR COM O BACK-END
      onChange((currentUser) => ({ ...currentUser, foto }));
      setMessage('Foto de perfil atualizada.');
    } catch (error) {
      if (request === photoRequestRef.current) setPhotoError(error.message);
    } finally {
      if (request === photoRequestRef.current) setLoadingPhoto(false);
    }
  }

  function finishEditing() {
    setEditing(null);
    setValue('');
    setConfirmation('');
    setError('');
  }

  function startEditing(field, event) {
    editButtonRef.current = event.currentTarget;
    setEditing(field.key);
    setValue(field.key === 'senha' ? '' : user[field.key]);
    setConfirmation('');
    setError('');
    setMessage('');
  }

  function saveField(event) {
    event.preventDefault();
    if (!value.trim()) {
      setError('preencha os campos');
      inputRef.current?.focus();
      return;
    }
    if (editing === 'senha') {
      if (value !== confirmation) {
        setError('as senhas tem que ser iguais');
        return;
      }
      // MUDAR AQUI PARA INTEGRAR COM O BACK-END
      setMessage('senha funfada');
    } else {
      onChange({ ...user, [editing]: value.trim() });
      setMessage('atualizou');
    }
    finishEditing();
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return;
    const elements = [...dialogRef.current.querySelectorAll('button, input, a[href], [tabindex="0"]')]
      .filter((element) => !element.disabled && element.getClientRects().length);
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id="user-panel"
      className="user-dialog"
      aria-labelledby="user-title"
      aria-modal="true"
      onKeyDown={trapFocus}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section className="user-card">
        <button type="button" className="user-close" aria-label="fechar" onClick={onClose} autoFocus>×</button>
        <div className="user-avatar">
          <img src={user.foto} alt="Foto de perfil" />
        </div>
        <h1 id="user-title">Usuário</h1>
        <div className="user-photo-controls" aria-busy={loadingPhoto}>
          <input ref={photoInputRef} id="user-photo" type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={changePhoto} />
          <button type="button" className="user-edit" aria-describedby="user-photo-help" onClick={() => photoInputRef.current?.click()}>
            Alterar foto
          </button>
          {loadingPhoto && <p role="status">carregando foto</p>}
          {photoError && <p className="user-error" role="alert">{photoError}</p>}
        </div>
        <div className="user-fields">
          {USER_FIELDS.map((field) => (
            <div className="user-field" key={field.key}>
              <h2>{field.label}</h2>
              {editing !== field.key && <p>{field.key === 'senha' ? '**********' : user[field.key]}</p>}
              <button type="button" className="user-edit" onClick={(event) => startEditing(field, event)} hidden={editing === field.key}>
                Alterar {field.label}
              </button>
              {editing === field.key && (
                <form onSubmit={saveField}>
                  <label htmlFor={`user-${field.key}`}>{field.key === 'senha' ? 'nova senha' : field.label}</label>
                  <input ref={inputRef} id={`user-${field.key}`} type={field.type} autoComplete={field.autoComplete}
                    required maxLength={field.key === 'email' ? 254 : 120} minLength={field.key === 'senha' ? 8 : 1}
                    value={value} onChange={(event) => { setValue(event.target.value); setError(''); }}
                    aria-invalid={!!error} aria-describedby={error ? 'user-error' : undefined} />
                  {field.key === 'senha' && <>
                    <small>pelo menos 8 caracteres</small>
                    <label htmlFor="user-confirmation">confirmar senha nova</label>
                    <input id="user-confirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={120}
                      value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(''); }} />
                  </>}
                  {error && <p id="user-error" className="user-error" role="alert">{error}</p>}
                  <div className="user-form-actions">
                    <button type="submit">{field.key === 'senha' ? 'validar senha' : 'Salvar'}</button>
                    <button type="button" onClick={finishEditing}>Cancelar</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
        <p className="user-status" role="status">{message}</p>
        <nav className="user-auth-links" aria-label="Acesso à conta">
          <a href="./login.html">Entrar</a>
          <a href="./cadastro.html">Criar conta</a>
        </nav>
      </section>
    </dialog>
  );
}
