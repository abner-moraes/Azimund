import React from 'react';
import { Icon } from '../Icon.jsx';
import { ActivityResult } from './ActivityResult.jsx';

const LOADING_LABELS = {
  'loading-json': 'Carregando projeto...',
  'loading-map': 'Preparando o mapa...',
  submitting: 'Conferindo suas respostas...',
};
function errorMessage(error) {
  switch (error.codigo) {
    case 'NAO_ENCONTRADO':
      return ' o arquivo não foi encontrado';
    case 'FALHA_REDE':
      return 'Verifique a conexão e tente novamente';
    case 'DADOS_INVALIDOS':
      return 'Os dados precisam de uma revisão pelo autor';
    default:
      return error.mensagem || 'Tente novamente.';
  }
}
export function ErrorState({ error, onRetry }) {
  return (
    <div className="activity-error" role="alert">
      <Icon name="info" />
      <p>Não foi possível abrir este conteúdo</p>
      <p className="activity-error-detail">{errorMessage(error)}</p>
      <button type="button" className="activity-button" onClick={onRetry}>
        tentar novamente
      </button>
    </div>
  );
}

export function ActivityStatus({ player }) {
  const {
    project,
    phase,
    error,
    heading,
    hasQuestions,
    result,
    answers,
    exit,
    retry,
    returnToGlobe,
  } = player;
  const loading = LOADING_LABELS[phase];
  return (
    <>
      {project && (
        <div className="activity-project-banner">
          <Icon name={hasQuestions ? 'quiz' : 'slideshow'} />
          <span title={project.titulo}>{project.titulo}</span>
        </div>
      )}

      <section
        id="activity-panel"
        className={`activity-panel ${project ? 'activity-with-banner' : ''}`}
        aria-label={project?.titulo || 'Projeto'}
        aria-busy={!!loading}
      >
        <button
          type="button"
          className="close-button activity-close"
          title="Sair"
          aria-label="Sair do projeto"
          onClick={exit}
        >
          <Icon name="close" />
        </button>
        {loading && (
          <div className="activity-centered">
            <p className="activity-loading" role="status">
              {loading}
            </p>
          </div>
        )}
        {error && (
          <div className="activity-centered">
            <ErrorState error={error} onRetry={retry} />
          </div>
        )}
        {phase === 'result' && (
          <ActivityResult
            project={project}
            result={result}
            answers={answers}
            headingRef={heading}
            onExit={returnToGlobe}
          />
        )}
        {phase === 'complete' && (
          <div className="activity-centered">
            <Icon name="task_alt" />
            <h1 tabIndex={-1} ref={heading}>
              apresentação concluída
            </h1>
            <p>{project.titulo}</p>
            <button type="button" className="activity-button" onClick={returnToGlobe}>
              voltar ao mapa
            </button>
          </div>
        )}
      </section>
    </>
  );
}
