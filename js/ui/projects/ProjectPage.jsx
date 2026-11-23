import React from 'react';
import { Icon } from '../Icon.jsx';
import { isQuestionComplete } from '../../api/projectContract.js';
import { ImageLinkEditor, PageImage } from './PageImage.jsx';
import { QuestionPage } from './QuestionPage.jsx';

export function ProjectPage({
  page,
  questionNumber,
  editing,
  selectedAnswer,
  onAnswer,
  confirmed,
  onChange,
}) {
  const isQuestion = page.tipo === 'questao';
  const image = page.imagem || page.questao?.imagem;
  return (
    <>
      {!isQuestion && editing ? (
        <input
          className="activity-page-title inline-input"
          aria-label="Título da página"
          placeholder="Título da página"
          value={page.titulo}
          onChange={(event) => onChange({ ...page, titulo: event.target.value })}
        />
      ) : (
        <h1 className="activity-page-title">
          {isQuestion ? `Questão ${questionNumber}` : page.titulo}
        </h1>
      )}
      {editing && isQuestion && !isQuestionComplete(page) && (
        <p className="incomplete-badge">
          <Icon name="warning" />
          Questão incompleta, ignorada no jogo
        </p>
      )}
      <div className="activity-page-body">
        {isQuestion ? (
          <QuestionPage
            page={page}
            editing={editing}
            confirmed={confirmed}
            selectedAnswer={selectedAnswer}
            onAnswer={onAnswer}
            onChange={onChange}
          />
        ) : editing ? (
          <textarea
            className="inline-input page-textarea"
            aria-label="Texto da página"
            placeholder="Texto da página..."
            value={page.texto}
            onChange={(event) => onChange({ ...page, texto: event.target.value })}
          />
        ) : (
          <p className="activity-text">{page.texto}</p>
        )}
        {image && (!isQuestion || editing) && (
          <PageImage src={image} alt={page.titulo} />
        )}
        {editing && <ImageLinkEditor page={page} onChange={onChange} />}
      </div>
    </>
  );
}
