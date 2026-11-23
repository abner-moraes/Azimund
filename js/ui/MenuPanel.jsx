import React from 'react';
import { Icon } from './Icon.jsx';

// painel lateral padrão dos menus da direita (título + fechar)
export function MenuPanel({ label, setActivePanel, children }) {
  return (
    <section id="menu-panel" className="menu-panel" aria-labelledby="panel-title">
      <header className="panel-header">
        <p id="panel-title" className="panel-title">
          {label}
        </p>
        <button
          type="button"
          className="close-button"
          aria-label="Fechar painel"
          title="Fechar painel"
          onClick={() => setActivePanel(null)}
        >
          <Icon name="close" />
        </button>
      </header>

      {children}
    </section>
  );
}

export function AccountPanel({ togglePanel, user, onLogout, onSettings }) {
  return (
    <div className="panel-account" aria-label="Conta">
      {!user && <p>Visitante - Entre em uma atividade pelo código abaixo.</p>}
      {user && (
        <div className="panel-option" onClick={() => togglePanel('user-info')}>
          <Icon name="account_circle" />
          Informações
        </div>
      )}

      <div className="panel-option" onClick={onSettings}>
        <Icon name="settings" />
        Configurações
      </div>

      <div className="panel-option" onClick={() => (location.href = './login.html')}>
        <Icon name="login" />
        Entrar
      </div>

      {user && (
        <button type="button" className="panel-option logout-button" onClick={onLogout}>
          <Icon name="logout" />
          Sair
        </button>
      )}
    </div>
  );
}
