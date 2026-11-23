import React from 'react';
import { ProjectPill } from '../../projects/ProjectPill.jsx';

function saveMessage(status, hasProject) {
  switch (status.state) {
    case 'saving':
      return 'Salvando...';
    case 'pending':
      return 'Alterações pendentes...';
    case 'retrying':
      return 'erro ao salvar, tentando de novo';
    case 'error':
      return 'erro ao salvar';
    default:
      return hasProject
        ? `Salvo${status.savedAt ? ` às ${status.savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}`
        : 'clique no pino da atividade e escolha um local no mapa';
  }
}

export function EditorHeader({ draft, pages }) {
  const { project, updateProject, status, leave, retrySave } = draft;
  const icon = ['error', 'retrying'].includes(status.state)
    ? 'erro_salvar'
    : ['pending', 'saving'].includes(status.state)
      ? 'salvando'
      : 'salvo';
  const message = saveMessage(status, !!project);
  return (
    <>
      <ProjectPill
        project={project || { titulo: 'Novo projeto', paginas: [] }}
        editing={!!project}
        onChange={(title) =>
          updateProject((project) => ({ ...project, titulo: title }))
        }
      />
      <div className="editor-context-bar">
        <div className="editor-tabs">
          <button
            type="button"
            className={pages.view === 'objects' ? 'active' : ''}
            onClick={() => pages.setView('objects')}
          >
            Objetos
          </button>
          <button
            type="button"
            className={pages.view === 'pages' ? 'active' : ''}
            disabled={!project}
            onClick={() => pages.setView('pages')}
          >
            Capa e páginas
          </button>
          <button type="button" className="editor-leave" onClick={leave}>
            Sair do editor
          </button>
        </div>
      </div>
      <div className="editor-status" role="status">
        {project ? (
          <img
            src={`${import.meta.env.BASE_URL}save-status/${icon}.svg`}
            title={message}
            alt={message}
          />
        ) : (
          message
        )}
        {status.state === 'error' && (
          <button type="button" className="text-button" onClick={retrySave}>
            Tentar salvar
          </button>
        )}
      </div>
    </>
  );
}
