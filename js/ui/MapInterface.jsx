//BACK END
import React, { useEffect, useState } from 'react';
import { UserPanel } from './UserPanel.jsx';
import profileImage from './UserIcon/profile.png';
import loggedProfileImage from './UserIcon/logged_profile.png';
import { readDemoAccount, signOutDemoAccount } from './Page/demoAccount.js';
import { Icon } from './Icon.jsx';
import { MenuPanel, AccountPanel } from './MenuPanel.jsx';
import { MapLayersPanel } from './MapLayersPanel.jsx';
import { SettingsDialog } from './SettingsDialog.jsx';
import { GlobeActions } from './GlobeActions.jsx';
import { useMapLayers } from './useMapLayers.js';
import { ActivityExperience } from './activities/ActivityExperience.jsx';
import { ActivityEditor } from './editor/ActivityEditor.jsx';
import { SearchProject, PlaceSearch, MyProjects } from './ProjectMenus.jsx';
import * as projects from '../api/projectsService.js';
import { readStored, writeStored } from '../config/storage.js';
import {
  readActiveProject,
  readLastProject,
  setActiveProject,
} from './editor/editorSession.js';
import '../../css/editor.css';

const SHOW_ACTIVITIES_KEY = 'azimund-mostrar-atividades';
// visitante so pode usar estes painéis depois de criar conta
const ACCOUNT_ONLY = ['edit', 'search-projects', 'projects'];
const SITE_ACTION_ITEMS = [
  {
    id: 'account',
    label: 'Sua conta',
    icon: 'person',
  },
  {
    id: 'search-map',
    label: 'Pesquisar no mapa',
    icon: 'search',
  },
  {
    id: 'layers',
    label: 'Camadas do mapa',
    icon: 'public',
  },
  {
    id: 'edit',
    label: 'Editar',
    icon: 'edit_square',
  },
  {
    id: 'search-projects',
    label: 'Pesquisar projetos',
    icon: 'assignment',
  },
  {
    id: 'projects',
    label: 'Projetos',
    icon: 'library_books',
  },
];
export function MapInterface({ map, markerLayer }) {
  // a sessão é atualizada junto com o estado (e não no render)
  const [user, setUserState] = useState(() => {
    //entrada do back: pegar o usuário logado no servidor em vez da conta demo
    const account = readDemoAccount();
    const initial = account && { ...account, foto: loggedProfileImage };
    projects.setSessionUser(initial);
    return initial;
  });
  function setUser(value) {
    setUserState((current) => {
      const next = typeof value === 'function' ? value(current) : value;
      projects.setSessionUser(next);
      return next;
    });
  }
  const [signupPrompt, setSignupPrompt] = useState(false);

  //sair da conta e depois de deletar a conta usam o msm caminho
  function signOut(nextPanel) {
    signOutDemoAccount();
    markerLayer.setProjects([]);
    markerLayer.clearReveal();
    setOpenRequest(null);
    setShowActivities(false);
    setActivePanel(nextPanel);
    setUser(null);
  }

  const [activePanel, setActivePanel] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const layers = useMapLayers(map);
  const [activityPlaying, setActivityPlaying] = useState(false);

  // key nova força o editor a montar do zero ao trocar de projeto
  const [editor, setEditor] = useState(() => {
    const id = readActiveProject(user?.id);
    return id ? { id, page: -1, key: Date.now() } : null;
  });

  const [openRequest, setOpenRequest] = useState(null);
  const [error, setError] = useState('');

  const [showActivities, setShowActivities] = useState(
    () => !!user && readStored(SHOW_ACTIVITIES_KEY) === true,
  );

  useEffect(() => {
    markerLayer.setEnabled(showActivities, !user);
    if (user) writeStored(SHOW_ACTIVITIES_KEY, showActivities);
  }, [markerLayer, showActivities, user]);
  useEffect(() => {
    if (!editor) return;
    markerLayer.setVisible(false);
    return () => markerLayer.setVisible(true);
  }, [editor, markerLayer]);
  function openEditor(id = null, page = -1) {
    if (!user) {
      setError('Entre na sua conta para criar ou editar!');
      return;
    }
    setActivityPlaying(false);
    setActivePanel(null);
    setOpenRequest(null);
    setActiveProject(user.id, id);
    setEditor({ id, page, key: Date.now() });
  }
  function togglePanel(id) {
    setSignupPrompt(false);
    if (!user && ACCOUNT_ONLY.includes(id)) {
      setSignupPrompt(true);
      setActivePanel(null);
      return;
    }
    if (editor && !['layers', 'search-map'].includes(id)) {
      setError('Clique "Sair do editor" para salvar antes de sair');
      return;
    }
    if (id === 'edit') {
      openEditor(readLastProject(user.id));
      return;
    }
    setActivePanel(activePanel === id ? null : id);
  }
  function seeProject(item) {
    markerLayer.reveal(item);
    setActivePanel(null);
    setOpenRequest({ item, token: Date.now() }); // abrir o mesmo projeto denovo ainda funfa
  }
  const selectedMenu = SITE_ACTION_ITEMS.find((p) => p.id === activePanel);
  return (
    <>
      <nav
        className="main-menu"
        inert={activityPlaying}
        aria-disabled={activityPlaying || undefined}
        aria-label="Menu principal"
      >
        {SITE_ACTION_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`menu-button ${item.id === 'account' ? 'account-button' : ''}`}
            data-locked={(!user && ACCOUNT_ONLY.includes(item.id)) || undefined}
            aria-label={item.label}
            title={item.label}
            aria-expanded={item.id === 'edit' ? !!editor : activePanel === item.id}
            onClick={() => togglePanel(item.id)}
          >
            {item.id === 'account' ? (
              <img className="account-photo" src={user ? loggedProfileImage : profileImage} alt="" />
            ) : (
              <Icon name={item.icon} />
            )}
          </button>
        ))}
      </nav>
      <GlobeActions map={map} disabled={activityPlaying} />
      {editor ? (
        <ActivityEditor
          key={editor.key}
          map={map}
          initialId={editor.id}
          initialPage={editor.page}
          onOpenProject={(id) => openEditor(id)}
          onClose={() => {
            setActiveProject(user?.id, null);
            setEditor(null);
          }}
        />
      ) : (
        <ActivityExperience
          key={user?.email || 'guest'}
          map={map}
          markerLayer={markerLayer}
          openRequest={openRequest}
          onEdit={openEditor}
          onPlayingChange={setActivityPlaying}
          onOpen={() => setActivePanel(null)}
        />
      )}
      {selectedMenu &&
        (!editor || ['layers', 'search-map'].includes(activePanel)) &&
        activePanel !== 'projects' && (
          <MenuPanel label={selectedMenu.label} setActivePanel={setActivePanel}>
            {activePanel === 'account' ? (
              <>
                <AccountPanel
                  user={user}
                  togglePanel={togglePanel}
                  onSettings={() => {
                    setActivePanel(null);
                    setSettingsOpen(true);
                  }}
                  onLogout={() => signOut('account')}
                />
                {!user && <SearchProject onFound={seeProject} />}
              </>
            ) : activePanel === 'search-map' ? (
              <PlaceSearch map={map} />
            ) : activePanel === 'search-projects' ? (
              <SearchProject onFound={seeProject} />
            ) : activePanel === 'layers' ? (
              <MapLayersPanel
                contextVisibility={layers.contextVisibility}
                onContextChange={layers.changeContext}
                mapReady={layers.mapReady}
                projectionLocked={!!editor}
                projection={editor ? 'mercator' : layers.projection}
                changeProjection={layers.changeProjection}
                basemap={layers.basemap}
                changeBasemap={layers.changeBasemap}
                terrainExaggeration={layers.terrainExaggeration}
                changeTerrainExaggeration={layers.changeTerrainExaggeration}
                showActivities={showActivities}
                onShowActivitiesChange={setShowActivities}
              />
            ) : null}
          </MenuPanel>
        )}
      {activePanel === 'projects' && !editor && (
        <MyProjects
          onNew={() => openEditor()}
          onClose={() => setActivePanel(null)}
          onEdit={openEditor}
          onMap={seeProject}
        />
      )}
      {activePanel === 'user-info' && (
        <UserPanel
          user={user}
          onChange={setUser}
          onClose={() => setActivePanel(null)}
          onDeleted={() => signOut(null)}
        />
      )}
      {settingsOpen && (
        <SettingsDialog
          models3d={layers.models3d}
          onModels3dChange={layers.changeModels3d}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {signupPrompt && (
        <MenuPanel
          label="Conta necessária"
          setActivePanel={() => setSignupPrompt(false)}
        >
          <div className="project-search">
            <p>Crie uma conta para criar suas atividades e postá-las no mapa!</p>
            <a className="activity-button" href="./cadastro.html">
              Criar conta
            </a>
            <SearchProject
              onFound={(item) => {
                setSignupPrompt(false);
                seeProject(item);
              }}
            />
          </div>
        </MenuPanel>
      )}
      {error && (
        <div className="editor-notice error" role="alert">
          {error}
          <button className="text-button" onClick={() => setError('')}>
            Fechar
          </button>
        </div>
      )}
    </>
  );
}
