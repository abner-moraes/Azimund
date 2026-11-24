//BACK END
// tela de login e cadastro (mesmo componente, muda pelo data-page do HTML)
import React, { useRef, useState } from 'react';
import bg from './bg.png';
import { HudShape } from './HudShape.jsx';
import { readDemoAccount, saveDemoAccount } from './demoAccount.js';
import { login, signUp } from '../../api/accountService.js';

export function AuthPage({ signup }) {
  const [account] = useState(readDemoAccount);
  const [values, setValues] = useState({
    nome: '',
    email: signup ? '' : account?.email || '',
    senha: '',
    confirmation: '',
  });
  const [error, setError] = useState(null);
  const [complete, setComplete] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const confirmationRef = useRef(null);
  const nameRef = useRef(null);
  const statusRef = useRef(null);

  function changeField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setError(null);
  }

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    if (signup && !values.nome.trim()) {
      setError({ field: 'nome', message: 'Informe seu nome ou nickname' });
      nameRef.current?.focus();
      return;
    }
    if (!values.senha.trim()) {
      setError({
        field: 'senha',
        message: 'Informe uma senha (minimo 8 caracteres)',
      });
      event.currentTarget.elements.senha.focus();
      return;
    }
    if (signup && values.senha !== values.confirmation) {
      setError({
        field: 'confirmation',
        message: 'As senhas devem ser iguais',
      });
      confirmationRef.current?.focus();
      return;
    }

    //entrada do back: login e cadastro no Spring (endereços em config/backEndpoints.js)
    const email = values.email.trim();
    setLoading(true);
    try {
      if (signup) {
        await signUp({ nome: values.nome.trim(), email, senha: values.senha });
      } else {
        // login + GET /back/auth/me (pega o id_usuario real do banco)
        const user = await login({ email, senha: values.senha });
        // guarda a cópia da conta pro mapa abrir já logado (a sessão real é o cookie)
        const funcao =
          account?.email?.toLowerCase() === user.email.toLowerCase() ? account.funcao : '';
        setStorageAvailable(saveDemoAccount({ ...user, funcao }));
      }
    } catch (failure) {
      setError({ field: null, message: failure?.mensagem || 'Não foi possível concluir.' });
      return;
    } finally {
      setLoading(false);
    }
    setValues((current) => ({ ...current, senha: '', confirmation: '' }));
    setError(null);
    if (!signup) {
      window.location.assign('./index.html');
      return;
    }
    setComplete(true);
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  function field(name, placeholder, type, autoComplete, ref) {
    const invalid = error?.field === name;
    return (
      <div className="auth-field">
        <label className="auth-label" htmlFor={`auth-${name}`}>
          {placeholder}
        </label>
        <input
          id={`auth-${name}`}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={values[name]}
          onChange={changeField}
          ref={ref}
          required
          minLength={name === 'senha' || name === 'confirmation' ? 8 : undefined}
          maxLength={name === 'email' ? 254 : 120}
          aria-invalid={invalid}
          aria-describedby={
            invalid ? 'auth-error' : name === 'senha' ? 'auth-password-help' : undefined
          }
        />
      </div>
    );
  }

  return (
    <main
      className={`auth-page ${signup ? 'auth-signup' : 'auth-login'}`}
      aria-labelledby="auth-title"
    >
      <img className="auth-background" src={bg} alt="" />
      <div className="auth-hud" aria-hidden="true">
        <HudShape />
      </div>
      <section className="auth-content">
        <h1 id="auth-title">{signup ? 'Bem vindo abordo!' : 'Bem vindo de volta!'}</h1>
        {complete ? (
          <div className="auth-result" ref={statusRef} tabIndex={-1}>
            <p role="status">Cadastro feito!</p>
            <p>Faça o login para continuar</p>
            {!storageAvailable && <p role="alert">O navegador não salvou os dados</p>}
            <a className="auth-submit" href="./login.html">
              fazer login
            </a>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <div className="auth-fields">
              {signup && field('nome', 'Nome ou Nickname', 'text', 'nickname', nameRef)}
              {field('email', 'Email', 'email', 'email')}
              {field(
                'senha',
                signup ? 'Insira sua Senha' : 'Senha',
                'password',
                signup ? 'new-password' : 'current-password',
              )}
              {signup &&
                field(
                  'confirmation',
                  'Confirme sua Senha',
                  'password',
                  'new-password',
                  confirmationRef,
                )}
            </div>
            <span id="auth-password-help" className="auth-label">
              Pelo menos 8 caracteres.
            </span>
            {error && (
              <p id="auth-error" className="auth-error" role="alert">
                {error.message}
              </p>
            )}
            <button className="auth-submit" type="submit" disabled={loading}>
              {signup ? 'Cadastrar-se' : 'Fazer Login'}
            </button>
          </form>
        )}
        <p className="auth-switch">
          {signup ? 'Já tem uma conta?' : 'Não tem uma conta?'}
          <a href={signup ? './login.html' : './cadastro.html'}>
            {signup ? 'Faça seu Login aqui!' : 'Cadastre-se aqui!'}
          </a>
        </p>
      </section>
    </main>
  );
}
