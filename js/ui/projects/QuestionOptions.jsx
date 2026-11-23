import React from 'react';
import { Icon } from '../Icon.jsx';
import { LIMITS } from '../../config/limits.js';
import { choiceLetter } from '../../editor/pageUtils.js';

const BOOLEAN_CHOICES = [
  { id: true, texto: 'Verdadeiro' },
  { id: false, texto: 'Falso' },
];

export function QuestionOptions({
  pageId,
  question,
  editing,
  selectedAnswer,
  onAnswer,
  onChange,
}) {
  const isBoolean = question.formato === 'verdadeiro_falso';
  const choices = isBoolean ? BOOLEAN_CHOICES : question.alternativas;

  function updateChoice(id, text) {
    onChange({
      alternativas: question.alternativas.map((choice) =>
        choice.id === id ? { ...choice, texto: text } : choice,
      ),
    });
  }
  function removeChoice(id) {
    onChange({
      alternativas: question.alternativas.filter((choice) => choice.id !== id),
      respostaCorreta:
        question.respostaCorreta === id ? null : question.respostaCorreta,
    });
  }

  return (
    <div className="activity-options">
      {choices.map((choice, index) => {
        // rótulo pela posição (a, b, c...), nunca pelo id
        const letter = choiceLetter(index);
        return editing ? (
          <div className="editing-option" key={String(choice.id)}>
            <button
              type="button"
              className={`answer-check ${question.respostaCorreta === choice.id ? 'correct' : ''}`}
              title="Marcar como correta"
              aria-label={`Marcar ${choice.texto || letter} como correta`}
              aria-pressed={question.respostaCorreta === choice.id}
              onClick={() => onChange({ respostaCorreta: choice.id })}
            >
              <Icon
                name={
                  question.respostaCorreta === choice.id
                    ? 'check_circle'
                    : 'radio_button_unchecked'
                }
              />
            </button>
            {isBoolean ? (
              <span>{choice.texto}</span>
            ) : (
              <input
                aria-label={`Alternativa ${letter}`}
                placeholder={`Alternativa ${letter}`}
                value={choice.texto}
                onChange={(event) => updateChoice(choice.id, event.target.value)}
              />
            )}
            {!isBoolean && choices.length > LIMITS.minChoices && (
              <button
                type="button"
                className="icon-button"
                aria-label={`Remover alternativa ${letter}`}
                onClick={() => removeChoice(choice.id)}
              >
                <Icon name="close" />
              </button>
            )}
          </div>
        ) : (
          <label
            className={`activity-option ${selectedAnswer === choice.id ? 'selected' : ''}`}
            key={String(choice.id)}
          >
            <input
              type="radio"
              name={`resposta-${pageId}`}
              checked={selectedAnswer === choice.id}
              onChange={() => onAnswer?.(choice.id)}
            />
            <span>{choice.texto}</span>
          </label>
        );
      })}
    </div>
  );
}
