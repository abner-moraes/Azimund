import React from 'react';
import { isProjectAuthor } from '../../api/projectsService.js';
import { Modal } from '../common/Modal.jsx';
import { ProjectPanel } from '../projects/ProjectPanel.jsx';
import { useActivityPlayer } from './useActivityPlayer.js';
import { ActivityStatus, ErrorState } from './ActivityStatus.jsx';
import '../../../css/activity.css';
import '../../../css/activity-result.css';

function PlayerNavigation({ player }) {
  const { page, pages, pageIndex, selectedAnswer, hasQuestions, previous, next, exit } =
    player;
  return (
    <>
      <div className="activity-navigation">
        {!hasQuestions && (
          <button
            type="button"
            className="activity-button activity-secondary"
            disabled={pageIndex === 0}
            onClick={previous}
          >
            Anterior
          </button>
        )}
        <button
          type="button"
          className="activity-button"
          disabled={page.tipo === 'questao' && selectedAnswer === null}
          onClick={next}
        >
          {pageIndex === pages.length - 1 ? 'Concluir' : 'Próximo'}
          <span className="activity-next-arrow" aria-hidden="true" />
        </button>
      </div>
      <button type="button" className="activity-exit" onClick={exit}>
        Sair {hasQuestions ? 'da atividade' : 'da apresentação'}
      </button>
    </>
  );
}

export function ActivityExperience(props) {
  const player = useActivityPlayer(props);
  const {
    selection,
    project,
    phase,
    page,
    pages,
    pageIndex,
    exitRequested,
    setExitRequested,
  } = player;
  if (!selection)
    return player.index.error ? (
      <div className="activity-index-error">
        <ErrorState error={player.index.error} onRetry={player.reload} />
      </div>
    ) : null;
  const playing = phase === 'playing';
  const panelVisible = playing || phase === 'summary';
  const openEditor = () =>
    props.onEdit?.(
      project.idProjeto,
      playing ? project.paginas.findIndex((item) => item.id === page.id) : -1,
    );

  return (
    <>
      {panelVisible ? (
        <ProjectPanel
          project={{ ...project, autor: project.autor || selection.autor }}
          page={playing ? page : null}
          pageIndex={playing ? pageIndex : 0}
          pages={pages}
          isAuthor={isProjectAuthor(project)}
          onToggleEdit={openEditor}
          selectedAnswer={player.selectedAnswer}
          onAnswer={player.setSelectedAnswer}
          confirmed={player.confirmed}
          onExit={player.exit}
          footer={
            playing ? (
              <PlayerNavigation player={player} />
            ) : (
              <button
                type="button"
                className="activity-button"
                disabled={!pages.length}
                onClick={player.start}
              >
                {pages.length ? 'Jogar' : 'Rascunho sem páginas jogáveis'}
              </button>
            )
          }
        />
      ) : (
        <ActivityStatus player={player} />
      )}
      {exitRequested && (
        <Modal title="Sair da atividade?" onClose={() => setExitRequested(false)}>
          <p>Suas respostas serão descartadas e esta tentativa não será salva</p>
          <div className="activity-modal-actions">
            <button
              type="button"
              className="activity-button activity-secondary"
              autoFocus
              onClick={() => setExitRequested(false)}
            >
              Continuar jogando
            </button>
            <button
              type="button"
              className="activity-button"
              onClick={player.returnToGlobe}
            >
              Sair
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
