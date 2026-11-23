import React from 'react';
import { PageImage } from './PageImage.jsx';
import { QuestionOptions } from './QuestionOptions.jsx';
import { LIMITS } from '../../config/limits.js';
import { defaultChoices, newChoice } from '../../editor/pageUtils.js';

export function QuestionPage({
  page,
  editing,
  confirmed,
  selectedAnswer,
  onAnswer,
  onChange,
}) {
  const question = page.questao;
  const image = page.imagem || question.imagem;
  const update = (patch) => onChange({ ...page, questao: { ...question, ...patch } });

  function changeFormat(format) {
    update({
      formato: format,
      respostaCorreta: null,
      alternativas: format === 'multipla_escolha' ? defaultChoices() : undefined,
    });
  }

  return (
    <fieldset className="activity-question" disabled={!editing && confirmed}>
      <legend>
        {editing ? (
          <textarea
            className="inline-input question-textarea"
            aria-label="Enunciado"
            placeholder="Enunciado da questão..."
            value={question.enunciado}
            onChange={(event) => update({ enunciado: event.target.value })}
          />
        ) : (
          question.enunciado
        )}
      </legend>
      {editing && (
        <select
          aria-label="Formato da questão"
          value={question.formato}
          onChange={(event) => changeFormat(event.target.value)}
        >
          <option value="multipla_escolha">Múltipla escolha</option>
          <option value="verdadeiro_falso">Verdadeiro ou falso</option>
        </select>
      )}
      {image && !editing && <PageImage src={image} alt="Imagem da questão" />}
      <QuestionOptions
        pageId={page.id}
        question={question}
        editing={editing}
        selectedAnswer={selectedAnswer}
        onAnswer={onAnswer}
        onChange={update}
      />
      {editing && question.formato === 'multipla_escolha' && (
        <button
          type="button"
          className="text-button"
          disabled={question.alternativas.length >= LIMITS.maxChoices}
          onClick={() =>
            update({
              alternativas: [
                ...question.alternativas,
                newChoice(question.alternativas),
              ],
            })
          }
        >
          + Alternativa ({question.alternativas.length}/{LIMITS.maxChoices})
        </button>
      )}
      {editing && (
        <label className="field-label">
          Comentário de erro (opcional)
          <textarea
            aria-label="Comentário de erro"
            value={question.comentarioErro || ''}
            onChange={(event) => update({ comentarioErro: event.target.value })}
          />
        </label>
      )}
    </fieldset>
  );
}
