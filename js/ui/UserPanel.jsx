//BACK END
// janela "Informações" da conta, foto e campos editáveis
// salvar = PATCH /back/usuarios/update   deletar = DELETE /back/usuarios/delete/{id}
import React, { useEffect, useRef, useState } from 'react';
import { deleteAccount, updateAccount } from '../api/accountService.js';
import '../../css/user.css';

// as chaves batem com o UsuarioPatchDTO do Spring (nome, funcao, email, senha)
const USER_FIELDS = [
  { key: 'nome', label: 'Nome', type: 'text', autoComplete: 'name' },
  { key: 'funcao', label: 'Função', type: 'text', autoComplete: 'off' },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  {
    key: 'senha',
    label: 'Senha',
    type: 'password',
    autoComplete: 'new-password',
  },
];

export function UserPanel({ user, onChange, onClose, onDeleted }) {
  const dialogRef = useRef(null);
  const editButtonRef = useRef(null);
  const inputRef = useRef(null);
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // null é fechado
  // 'confirmar' é sim/não
  // 'enviando' espera o servidor
  const [deleteStep, setDeleteStep] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  async function confirmDelete() {
    setDeleteStep('enviando');
    setDeleteError('');
    try {
      await deleteAccount();
      onDeleted();
    } catch (error) {
      setDeleteError(error?.mensagem || 'Não foi possível deletar a conta.');
      setDeleteStep('confirmar');
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    dialog.showModal(); // modal nativo q o resto da página fica inativo e o foco fica aqui dentro
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
    else editButtonRef.current?.focus();
  }, [editing]);

  function finishEditing() {
    setEditing(null);
    setValue('');
    setConfirmation('');
    setError('');
  }

  function startEditing(field, event) {
    editButtonRef.current = event.currentTarget;
    setEditing(field.key);
    setValue(field.key === 'senha' ? '' : user[field.key] || '');
    setConfirmation('');
    setError('');
    setMessage('');
  }

  async function saveField(event) {
    event.preventDefault();
    if (saving) return;
    // função pode ficar vazia (coluna funcao aceita NULL); o resto é obrigatório
    if (editing !== 'funcao' && !value.trim()) {
      setError('Preencha os campos');
      inputRef.current?.focus();
      return;
    }
    if (editing === 'senha') {
      if (value.length < 8) {
        setError('A senha precisa ter pelo menos 8 caracteres');
        return;
      }
      if (value !== confirmation) {
        setError('As senhas tem que ser iguais');
        return;
      }
    }
    // senha vai como digitada; o resto sem espaços nas pontas
    const changes = { [editing]: editing === 'senha' ? value : value.trim() };

    //entrada do back: PATCH /back/usuarios/update { id, <campo alterado> }
    setSaving(true);
    setError('');
    try {
      const saved = await updateAccount(changes);
      // a senha nunca fica guardada no front
      const { senha: _ignored, ...visible } = changes;
      onChange({ ...user, ...visible, ...saved });
      setMessage(editing === 'senha' ? 'Senha alterada' : 'Atualizou');
      finishEditing();
    } catch (failure) {
      setError(failure?.mensagem || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id="user-panel"
      className="user-dialog"
      aria-label="Conta do usuário"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose(); // clique no fundo fecha
      }}
    >
      <section className="user-card">
        <button
          type="button"
          className="user-close"
          aria-label="Fechar"
          onClick={onClose}
          autoFocus
        >
          X
        </button>
        <div className="user-avatar">
          <img src={user.foto} alt="Foto de perfil" />
        </div>
        <hr></hr>
        <div className="user-fields">
          {USER_FIELDS.map((field) => (
            <div className="user-field" key={field.key}>
              <h2>{field.label}</h2>
              {editing !== field.key && (
                <p>{field.key === 'senha' ? '**********' : user[field.key] || 'usuário'}</p>
              )}
              <button
                type="button"
                className="user-edit"
                onClick={(event) => startEditing(field, event)}
                hidden={editing === field.key}
              >
                Alterar {field.label}
              </button>
              {editing === field.key && (
                <form onSubmit={saveField}>
                  <label htmlFor={`user-${field.key}`}>
                    {field.key === 'senha' ? 'Nova senha' : field.label}
                  </label>
                  <input
                    ref={inputRef}
                    id={`user-${field.key}`}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    required={field.key !== 'funcao'}
                    maxLength={field.key === 'email' ? 254 : field.key === 'nome' ? 63 : 120}
                    minLength={field.key === 'senha' ? 8 : undefined}
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value);
                      setError('');
                    }}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'user-error' : undefined}
                  />
                  {field.key === 'senha' && (
                    <>
                      <small>Pelo menos 8 caracteres</small>
                      <label htmlFor="user-confirmation">Confirmar senha nova</label>
                      <input
                        id="user-confirmation"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={120}
                        value={confirmation}
                        onChange={(event) => {
                          setConfirmation(event.target.value);
                          setError('');
                        }}
                      />
                    </>
                  )}
                  {error && (
                    <p id="user-error" className="user-error" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="user-form-actions">
                    <button type="submit" disabled={saving}>
                      {saving ? 'Salvando...' : field.key === 'senha' ? 'Validar senha' : 'Salvar'}
                    </button>
                    <button type="button" onClick={finishEditing} disabled={saving}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
        <p className="user-status" role="status">
          {message}
        </p>
        <div className="user-delete">
          {deleteStep === null ? (
            <button
              type="button"
              className="user-delete-open"
              onClick={() => setDeleteStep('confirmar')}
            >
              Deletar conta
            </button>
          ) : (
            <>
              <p>Tem certeza que quer deletar sua conta?</p>
              {deleteError && (
                <p className="user-error" role="alert">
                  {deleteError}
                </p>
              )}
              <div className="user-form-actions">
                <button
                  type="button"
                  className="user-delete-yes"
                  disabled={deleteStep === 'enviando'}
                  onClick={confirmDelete}
                >
                  {deleteStep === 'enviando' ? 'Deletando...' : 'Sim'}
                </button>
                <button
                  type="button"
                  disabled={deleteStep === 'enviando'}
                  onClick={() => {
                    setDeleteStep(null);
                    setDeleteError('');
                  }}
                  autoFocus
                >
                  Não
                </button>
              </div>
            </>
          )}
        </div>
        <nav className="user-auth-links" aria-label="Acesso à conta">
          <a href="./login.html">Entrar</a>
          <a href="./cadastro.html">Criar conta</a>
        </nav>
      </section>
    </dialog>
  );
}
