// rodapé do editor de páginas: adicionar/mover/excluir, mapa base, câmera e navegação
import React from 'react';
import { LIMITS } from '../../../config/limits.js';
import { Icon } from '../../Icon.jsx';
import { IconButton } from '../../common/IconButton.jsx';
import { BasemapSelect } from '../../BasemapSelect.jsx';

export function EditorPageControls({ project, pages, onDelete }) {
  const { page, pageIndex, editing, changePage, addPage, movePage, captureCamera } =
    pages;
  const atLimit = project.paginas.length >= LIMITS.pages;
  const lastPage = pageIndex === project.paginas.length - 1;
  return (
    <>
      {editing && (
        <div className="page-edit-actions">
          <button
            type="button"
            onClick={() => addPage('conteudo')}
            disabled={atLimit}
            title={atLimit ? `Limite de ${LIMITS.pages} páginas` : ''}
          >
            + Conteúdo
          </button>
          <button
            type="button"
            onClick={() => addPage('questao')}
            disabled={atLimit}
            title={atLimit ? `Limite de ${LIMITS.pages} páginas` : ''}
          >
            + Questão
          </button>
          {page && (
            <IconButton name="delete" label="Excluir página" onClick={onDelete} />
          )}
        </div>
      )}
      <div className="editor-page-picker">
        <select
          aria-label="Escolher página"
          value={pageIndex}
          onChange={(event) => changePage(Number(event.target.value))}
        >
          <option value={-1}>
            Capa - {project.paginas.length}/{LIMITS.pages} páginas
          </option>
          {project.paginas.map((page, index) => (
            <option key={page.id} value={index}>
              {index + 1}. {page.titulo || 'Sem título'}
            </option>
          ))}
        </select>
        {editing && page && (
          <>
            <IconButton
              name="arrow_upward"
              label="Mover página acima"
              disabled={pageIndex === 0}
              onClick={() => movePage(-1)}
            />
            <IconButton
              name="arrow_downward"
              label="Mover página abaixo"
              disabled={lastPage}
              onClick={() => movePage(1)}
            />
          </>
        )}
      </div>
      {editing && (
        <label className="field-label page-basemap">
          {page ? 'Mapa base da página' : 'Mapa base da capa'}
          <BasemapSelect
            value={(page || project).mapaBase}
            defaultLabel="Padrão"
            label={page ? 'Mapa base da página' : 'Mapa base da capa'}
            onChange={pages.setPageBasemap}
          />
        </label>
      )}
      {editing && page && (
        <>
          <button
            type="button"
            className="text-button fix-camera"
            onClick={captureCamera}
          >
            <Icon name="photo_camera" />
            Fixar câmera aqui
          </button>
          <p className="editor-hint">
            marque os itens visíveis nesta página em objetos!
          </p>
        </>
      )}
      <div className="activity-navigation">
        <button
          type="button"
          className="activity-button activity-secondary"
          disabled={pageIndex < 0}
          onClick={() => changePage(pageIndex - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="activity-button"
          onClick={() =>
            lastPage ? pages.setView('objects') : changePage(pageIndex + 1)
          }
        >
          {lastPage ? 'Concluir' : 'Próximo'}{' '}
          <span className="activity-next-arrow" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
