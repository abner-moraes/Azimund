// painel da esquerda com a capa ou a página atual (usado no jogo e no editor)
import React, { useState } from 'react';
import { Icon } from '../Icon.jsx';
import { ProjectPill } from './ProjectPill.jsx';
import { ProjectCover } from './ProjectCover.jsx';
import { ProjectPage } from './ProjectPage.jsx';

export function ProjectPanel({
  project,
  page = null,
  pageIndex = 0,
  pages,
  editing = false,
  isAuthor = false,
  onToggleEdit,
  onChange,
  onProjectChange,
  selectedAnswer,
  onAnswer,
  confirmed = false,
  footer,
  onExit,
  showBanner = true,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);
  // no jogo as questões incompletas saem da lista, então numera pela lista que esta sendo mostrada
  const list = pages || project.paginas;
  const questionNumber = list
    .slice(0, pageIndex + 1)
    .filter((item) => item.tipo === 'questao').length;
  const countLabel = page ? `${pageIndex + 1} de ${list.length}` : 'Capa';

  return (
    <>
      {showBanner && <ProjectPill project={project} />}
      <section
        id="activity-panel"
        className={`activity-panel activity-with-banner activity-player ${collapsed ? 'activity-collapsed' : ''} ${editing ? 'page-editing' : ''}`}
        aria-label={page ? 'Página do projeto' : 'Capa do projeto'}
      >
        <div className="activity-page-toolbar">
          <button
            type="button"
            className="activity-collapse"
            aria-label={collapsed ? 'Expandir painel' : 'Recolher painel'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            <Icon name={collapsed ? 'add' : 'remove'} />
          </button>
          <div className="editor-row">
            {isAuthor && (
              <button
                type="button"
                className={`icon-button ${editing ? 'active' : ''}`}
                aria-label={editing ? 'Ver como jogador' : 'Editar página'}
                title={editing ? 'Ver como jogador' : 'Editar página'}
                onClick={onToggleEdit}
              >
                <Icon name="edit" />
              </button>
            )}
            <span
              className="activity-page-count"
              aria-label={page ? `Página ${countLabel}` : 'Capa'}
            >
              {countLabel}
            </span>
            {onExit && (
              <button
                type="button"
                className="icon-button small"
                aria-label="Sair do projeto"
                onClick={onExit}
              >
                <Icon name="close" />
              </button>
            )}
          </div>
        </div>
        <div className="activity-page-content" hidden={collapsed}>
          {page ? (
            <ProjectPage
              page={page}
              questionNumber={questionNumber}
              editing={editing}
              selectedAnswer={selectedAnswer}
              onAnswer={onAnswer}
              confirmed={confirmed}
              onChange={onChange}
            />
          ) : (
            <ProjectCover
              project={project}
              editing={editing}
              isAuthor={isAuthor}
              onChange={onProjectChange}
            />
          )}
          {children}
          <footer className="activity-page-footer">{footer}</footer>
        </div>
      </section>
    </>
  );
}
