import React, { useEffect, useState } from 'react';
import { setBasemap } from './basemapSwitcher.js';
import { setProjection } from './projectionToggle.js';
import { setDrawToolsOpen } from './drawTools.js';

const MENU_ITEMS = [
  { id: 'account', label: 'Conta', icon: 'person' },
  { id: 'search', label: 'Pesquisar no mapa', icon: 'search' },
  { id: 'layers', label: 'Camadas', icon: 'public' },
  { id: 'edit', label: 'Editar', icon: 'edit_square' },
  { id: 'projects', label: 'Projetos', icon: 'collections_bookmark' }
];

function Icon({ name }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{name}</span>;
}

// Os espaços vazios serão substituídos pelo conteúdo de cada menu futuramente.
function EmptyPanel() {
  return (
    <div className="panel-placeholders" aria-label="Conteúdo a ser adicionado futuramente">
      <div className="placeholder" aria-hidden="true"></div>
      <div className="placeholder" aria-hidden="true"></div>
      <div className="placeholder" aria-hidden="true"></div>
    </div>
  );
}

export function MapInterface({ map, draw }) {
  const [activePanel, setActivePanel] = useState(null);
  const [basemap, setActiveBasemap] = useState('satellite');
  const [projection, setActiveProjection] = useState('globe');
  const [drawOpen, setDrawOpen] = useState(false);
  const [mapReady, setMapReady] = useState(!!map.getLayer('satellite'));

  const selectedMenu = MENU_ITEMS.find((item) => item.id === activePanel);

  useEffect(() => {
    function handleLoad() {
      setMapReady(true);
    }

    // Espera a estrutura do estilo, sem depender do download de todas as imagens.
    if (map.getLayer('satellite')) handleLoad();
    map.on('style.load', handleLoad);
    return () => map.off('style.load', handleLoad);
  }, [map]);

  useEffect(() => {
    setDrawToolsOpen(map, draw, drawOpen);
  }, [map, draw, drawOpen]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setActivePanel(null);
        setDrawOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function togglePanel(id) {
    if (id === 'edit') {
      setDrawOpen(!drawOpen);
      setActivePanel(null);
      return;
    }
    setActivePanel(activePanel === id ? null : id);
    setDrawOpen(false);
  }

  function changeBasemap(event) {
    setBasemap(map, event.target.value);
    setActiveBasemap(event.target.value);
  }

  function changeProjection(event) {
    setProjection(map, event.target.value);
    setActiveProjection(event.target.value);
  }

  return (
    <>
      <nav className="main-menu" aria-label="Menu principal">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`menu-button ${item.id === 'account' ? 'account-button' : ''}`}
            aria-label={item.label}
            title={item.label}
            aria-expanded={item.id === 'edit' ? drawOpen : activePanel === item.id}
            aria-controls={item.id === 'edit' ? 'terradraw-tools' : activePanel === item.id ? 'menu-panel' : undefined}
            onClick={() => togglePanel(item.id)}
          >
            <Icon name={item.icon} />
          </button>
        ))}
      </nav>

      {selectedMenu && (
        <section id="menu-panel" className="menu-panel" aria-labelledby="panel-title">
          <header className="panel-header">
            <h1 id="panel-title">{selectedMenu.label}</h1>
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

          {activePanel === 'layers' ? (
            <div className="layers-content">
              <fieldset disabled={!mapReady}>
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
          ) : (
            <EmptyPanel />
          )}
        </section>
      )}

      <div className="map-actions" role="group" aria-label="Controles do mapa">
        {/* Controles visuais reservados para uma próxima etapa. */}
        <button type="button" className="map-button" aria-label="3D" title="3D — em breve" disabled>
          <Icon name="view_in_ar" />
        </button>
        <button
          type="button"
          className="map-button"
          aria-label="Medir distância"
          title="Medir distância — em breve"
          disabled
        >
          <Icon name="straighten" />
        </button>
        <button type="button" className="map-button" aria-label="Orientação" title="Orientação — em breve" disabled>
          <Icon name="explore" />
        </button>
        <div className="zoom-buttons" role="group" aria-label="Zoom">
          <button type="button" className="map-button" aria-label="Aumentar zoom" title="Aumentar zoom — em breve" disabled>
            <Icon name="add" />
          </button>
          <button type="button" className="map-button" aria-label="Diminuir zoom" title="Diminuir zoom — em breve" disabled>
            <Icon name="remove" />
          </button>
        </div>
      </div>
    </>
  );
}
