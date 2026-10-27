import React from "react";
import { Icon } from "./Icon.jsx";

export function MenuPanel({label, setActivePanel, children}) {
  return (
    <section id="menu-panel" className="menu-panel" aria-labelledby="panel-title">
      <header className="panel-header">
        <p class="panel-title">{label}</p>
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

// os espaços vazios vão ser substituídos pelo conteúdo de cada menu mais pra frente
export function EmptyPanel() {
  return (
    <div className="panel-placeholders" aria-label="Conteúdo a ser adicionado futuramente">
      <div className="placeholder" aria-hidden="true"></div>
      <div className="placeholder" aria-hidden="true"></div>
      <div className="placeholder" aria-hidden="true"></div>
    </div>
  );
}

export function AccountPanel({togglePanel}) {
  return (
    <div className="panel-account" aria-label="Conteúdo a ser adicionado futuramente">
      <div className="panel-option" onClick={() => togglePanel("user-info")}>
        <Icon name="account_circle" />
        Informações
      </div>

      <div className="panel-option">
        <Icon name="settings" />
        Configurações
      </div>

      <div className="panel-option" onClick={() => location.href = "./login.html"}>
        <Icon name="login" />
        Entrar
      </div>

      <div className="panel-option">
        <Icon name="logout" />
        Sair
      </div>
    </div>
  );
}

export function MapLayersPanel({mapReady, projection, changeProjection, basemap, changeBasemap}) {
  return (
    <div className="layers-content">
      <fieldset className="projection-options" disabled={!mapReady}>
        <legend>Projeção</legend>
        <select aria-label="Projeção" value={projection} onChange={changeProjection}>
          <option value="globe">Globo</option>
          <option value="mercator">Plano</option>
        </select>
      </fieldset>

      <fieldset className="basemap-options" disabled={!mapReady}>
        <legend>Mapa base</legend>
        <select aria-label="Mapa base" value={basemap} onChange={changeBasemap}>
          <option value="satellite">Satélite 2020</option>
          <option value="terrain">Terreno base</option>
          <option value="terrain-light">Terreno claro</option>
        </select>
      </fieldset>
    </div>
  );
}