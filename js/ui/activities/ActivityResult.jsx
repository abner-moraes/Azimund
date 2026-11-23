import React from 'react';
import { Icon } from '../Icon.jsx';

function answerLabel(page, answer) {
  if (page.questao.formato === 'verdadeiro_falso')
    return answer ? 'Verdadeiro' : 'Falso';
  return page.questao.alternativas.find((choice) => choice.id === answer)?.texto;
}

export function ActivityResult({ project, result, answers, headingRef, onExit }) {
  return (
    <>
      <div className="activity-result-heading">
        <Icon name="task_alt" />
        <h1 tabIndex={-1} ref={headingRef}>
          Você acertou {result.acertos} de {result.total}
        </h1>
        <p>{project.titulo}</p>
        {result.salvamento && (
          <p role="status">
            {result.salvamento.salva ? 'Resultado salvo' : result.salvamento.mensagem}
          </p>
        )}
      </div>
      <div className="activity-review">
        {result.erros
          .filter((item) => item.comentario)
          .map((item) => {
            const page = project.paginas.find((page) => page.id === item.paginaId);
            return (
              <article className="activity-review-item" key={item.paginaId}>
                <h2>{page.questao.enunciado}</h2>
                <p className="activity-chosen">
                  sua resposta: {answerLabel(page, answers[page.id])}
                </p>
                <p>{item.comentario}</p>
              </article>
            );
          })}
      </div>
      <button
        type="button"
        className="activity-button activity-result-exit"
        onClick={onExit}
      >
        voltar ao mapa
      </button>
    </>
  );
}
