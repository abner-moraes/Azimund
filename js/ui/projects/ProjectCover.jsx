import React, { useEffect, useState } from 'react';
import { Icon } from '../Icon.jsx';
import { getBestAttempt } from '../../api/projectsService.js';
import { ProjectGlyph } from '../ProjectGlyph.jsx';
import { getProjectType } from '../../api/projectContract.js';
const TYPE_LABELS = {
  RASCUNHO: 'Rascunho',
  ATIVIDADE: 'Questionário',
  APRESENTACAO: 'Apresentação',
  AULA: 'Aula',
};
export function ProjectCover({ project, editing, isAuthor, onChange }) {
  const [copied, setCopied] = useState(false);
  const type = getProjectType(project);
  const count = project.paginas.length;
  const [progress, setProgress] = useState('');
  useEffect(() => {
    let active = true;
    setProgress('');
    getBestAttempt(project.idProjeto)
      .then((best) => {
        if (!active) return;
        setProgress(
          !best
            ? 'Você ainda não realizou esta atividade!'
            : best.total
              ? `Realizada, ${best.acertos}/${best.total}`
              : 'Realizada',
        );
      })
      .catch(() => {
        if (active) setProgress('Histórico indisponível');
      });
    return () => {
      active = false;
    };
  }, [project.idProjeto]);
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(project.codigo);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <>
      {editing ? (
        <input
          className="activity-page-title inline-input"
          aria-label="Título da capa"
          value={project.titulo}
          onChange={(event) =>
            onChange({
              ...project,
              titulo: event.target.value,
            })
          }
        />
      ) : (
        <h1 className="activity-page-title">{project.titulo}</h1>
      )}
      <div className="activity-page-body">
        {editing ? (
          <textarea
            className="inline-input cover-description"
            aria-label="Descrição do projeto"
            placeholder="Descreva o projeto..."
            value={project.descricao}
            onChange={(event) =>
              onChange({
                ...project,
                descricao: event.target.value,
              })
            }
          />
        ) : (
          <p className="activity-text">
            {project.descricao || 'Este projeto ainda não tem descrição'}
          </p>
        )}
      </div>
      <p className="activity-progress" role="status">
        {progress}
      </p>
      <p className="activity-type">
        <ProjectGlyph type={type} />
        {TYPE_LABELS[type]} - {count} {type === 'ATIVIDADE' ? 'questões' : 'páginas'}
      </p>
      <div className="editor-row author-code">
        <span>Por {project.autor.nome}</span>
        {isAuthor && (
          <button
            type="button"
            title="Copiar código"
            className="code-button"
            onClick={copyCode}
          >
            {copied ? 'Copiado!' : project.codigo}
            <Icon name="content_copy" />
          </button>
        )}
      </div>
    </>
  );
}
