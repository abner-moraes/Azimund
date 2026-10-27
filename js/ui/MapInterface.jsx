import React, { useEffect, useState } from 'react';
import { UserPanel } from './UserPanel.jsx';
import profileImage from './UserIcon/profile.png';
import { readDemoAccount } from './Page/demoAccount.js';
import { setBasemap } from './basemapSwitcher.js';
import { setProjection } from './projectionToggle.js';
import { setDrawToolsOpen } from './drawTools.js';
import { Icon } from './Icon.jsx';
import { MenuPanel, EmptyPanel, AccountPanel, MapLayersPanel } from './MenuPanel.jsx';

const SITE_ACTION_ITEMS = [
  { id: 'account', label: 'Sua conta', icon: 'person' },
  { id: 'search-map', label: 'Pesquisar no mapa', icon: 'search' },
  { id: 'layers', label: 'Camadas do mapa', icon: 'public' },
  { id: 'edit', label: 'Editar', icon: 'edit_square' },
  { id: 'search-tasks', label: 'Pesquisar projetos', icon: 'assignment' },
  { id: 'projects', label: 'Projetos', icon: 'library_books' }
];

const GLOBE_ACTION_ITEMS = [
  { id: "measure", label: "Medir distância", icon: "straighten"},
  { id: "angle", label: "3D", icon: "view_in_ar"},
  { id: "orient", label: "Orientação", icon: "explore"},
  { id: "zoom-in", label: "Aumentar zoom", icon: "add"},
  { id: "zoom-out", label: "Diminuir zoom", icon: "remove"}
];

export function MapInterface({ map, draw }) {
  //USUARIO DE EXEMPLO
  const [user, setUser] = useState(() => ({ nome: 'Maurício Laks', tipo: 'Professor', email: 'mlaks.prof@gmail.com', foto: profileImage, ...readDemoAccount() }));
  const [activePanel, setActivePanel] = useState(null);
  const [basemap, setActiveBasemap] = useState('satellite');
  const [projection, setActiveProjection] = useState('globe');
  const [drawOpen, setDrawOpen] = useState(false);
  const [mapReady, setMapReady] = useState(!!map.getLayer('satellite'));

  const selectedMenu = SITE_ACTION_ITEMS.find((item) => item.id === activePanel);

  useEffect(() => {
    function handleLoad() {
      setMapReady(true);
    }

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
      <SiteActions 
        activePanel={activePanel}
        togglePanel={togglePanel}
        user={user}
        drawOpen={drawOpen}
      />

      <GlobeActions />

      {selectedMenu && (
        <MenuPanel 
          label={selectedMenu.label} 
          setActivePanel={setActivePanel}
        >
          {
            (() => {
              switch(activePanel) {
                case "account":
                  return <AccountPanel 
                    togglePanel={togglePanel}
                  />

                case "user-info":
                  return <UserPanel 
                    user={user}
                    onChange={setUser}
                    onClose={() => setActivePanel(null)}
                  />

                case "layers":
                  return <MapLayersPanel 
                    mapReady={mapReady} 
                    projection={projection} 
                    changeProjection={changeProjection}
                    basemap={basemap}
                    changeBasemap={changeBasemap}
                  />

                default:
                  return <EmptyPanel />
              }
            })()
          }
        </MenuPanel>
      )}
    </>
  );
}

function SiteActions({activePanel, togglePanel, user, drawOpen}) {
  return (
    <nav className="main-menu" aria-label="Menu principal">
      {SITE_ACTION_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`menu-button ${item.id === 'account' ? 'account-button' : ''}`}
          aria-label={item.label}
          title={item.label}
          aria-expanded={item.id === 'edit' ? drawOpen : activePanel === item.id}
          aria-haspopup={item.id === 'account' ? 'dialog' : undefined}
          aria-controls={item.id === 'account' ? 'user-panel' : item.id === 'edit' ? 'terradraw-tools' : activePanel === item.id ? 'menu-panel' : undefined}
          onClick={() => togglePanel(item.id)}
        >
          {item.id === 'account' ? <img className="account-photo" src={user.foto} alt="" /> : <Icon name={item.icon} />}
        </button>
      ))}
    </nav>
  );
}

function GlobeActions() {
  return (
    <div className="map-actions" role="group" aria-label="Controles do mapa">
      {/* controles visuais pro back dps*/}
      <button
        type="button"
        className="map-button"
        aria-label="Medir distância"
        title="Medir distância"
        disabled
      >
        <Icon name="straighten" />
      </button>

      <button 
        type="button" 
        className="map-button" 
        aria-label="3D" 
        title="3D" 
        disabled
      >
        <Icon name="view_in_ar" />
      </button>
      
      <button
        type="button" 
        className="map-button" 
        aria-label="Orientação" 
        title="Orientação" 
        disabled
      >
        <Icon name="explore" />
      </button>
      
      <div className="zoom-buttons" role="group" aria-label="Zoom">

        <button 
          type="button" 
          className="map-button" 
          aria-label="Aumentar zoom" 
          title="Aumentar zoom" 
          disabled
        >
          <Icon name="add" />
        </button>

        <button 
          type="button" 
          className="map-button" 
          aria-label="Diminuir zoom" 
          title="Diminuir zoom" 
          disabled
        >
          <Icon name="remove" />
        </button>

      </div>
    </div>
  );
}