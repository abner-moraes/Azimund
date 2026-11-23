import React from 'react';
import { capabilities } from '../../../api/projectsService.js';
import { getProjectType } from '../../../api/projectContract.js';
import { Modal } from '../../common/Modal.jsx';
import { ProjectGlyph } from '../../ProjectGlyph.jsx';
import { ColorField } from './PropertyFields.jsx';
import { ImportProjectButton } from '../../projects/ImportProjectButton.jsx';
// todos os modais/popovers do editor, escolhidos pelo valor de `dialog`
export function EditorDialogs({
  dialog,
  setDialog,
  draft,
  drawing,
  pages,
  files,
  onTool,
}) {
  const { project, updateProject, publish, removeProject, openProject, setError } =
    draft;
  const close = () => setDialog(null);
  if (dialog === 'shapes')
    return (
      <div className="shapes-popover">
        {[
          ['polygon', 'Polígono'],
          ['rectangle', 'Retângulo'],
          ['circle', 'Círculo'],
        ].map(([mode, label]) => (
          <button
            type="button"
            key={mode}
            onClick={() => {
              onTool(mode);
              close();
            }}
          >
            {label}
          </button>
        ))}
      </div>
    );
  if (dialog === 'import')
    return (
      <Modal title="Importar GeoJSON" onClose={files.cancelImport}>
        <p>{files.pendingImport.geojson.features.length} objetos encontrados.</p>
        {files.pendingImport.warnings.map((warning) => (
          <p key={warning}>{warning}</p>
        ))}
        <div className="activity-modal-actions">
          <button
            type="button"
            className="activity-button"
            onClick={() => files.applyImport(false)}
          >
            Adicionar
          </button>
          <button
            type="button"
            className="activity-button activity-secondary"
            onClick={() => files.applyImport(true)}
          >
            Substituir tudo
          </button>
        </div>
      </Modal>
    );
  if (dialog === 'export')
    return (
      <Modal title="Salvar GeoJSON" onClose={close}>
        <button
          type="button"
          className="activity-button"
          onClick={() => files.exportFile()}
        >
          Todos os objetos
        </button>
        {drawing.selected && (
          <button
            type="button"
            className="activity-button activity-secondary"
            onClick={() => files.exportFile(true)}
          >
            Apenas a seleção
          </button>
        )}
      </Modal>
    );
  if (dialog === 'delete-page')
    return (
      <Modal title="Excluir página?" onClose={close}>
        <p>A página será removida. Os objetos do mapa serão mantidos.</p>
        <button
          type="button"
          className="activity-button"
          onClick={() => {
            pages.removePage();
            close();
          }}
        >
          Excluir página
        </button>
      </Modal>
    );
  if (dialog === 'settings' && project)
    return (
      <Modal title="Configurações do projeto" onClose={close}>
        <div className="marker-preview">
          <ProjectGlyph type={getProjectType(project)} color={project.cor} />
        </div>
        <ColorField
          label="Cor do marcador"
          value={project.cor}
          onChange={(color) =>
            updateProject({
              ...project,
              cor: color,
            })
          }
        />
        {['lng', 'lat'].map((key) => (
          <label key={key} className="field-label">
            {key === 'lng' ? 'Longitude' : 'Latitude'}
            <input
              type="number"
              step="any"
              min={key === 'lng' ? -180 : -90}
              max={key === 'lng' ? 180 : 90}
              defaultValue={project.ancora[key]}
              key={`${key}-${project.ancora[key]}`}
              onBlur={(event) => {
                const value = Number(event.target.value);
                const limit = key === 'lng' ? 180 : 90;
                if (
                  event.target.value !== '' &&
                  Number.isFinite(value) &&
                  Math.abs(value) <= limit
                ) {
                  updateProject({
                    ...project,
                    ancora: { ...project.ancora, [key]: value },
                  });
                } else event.target.value = project.ancora[key];
              }}
            />
          </label>
        ))}
        <button
          type="button"
          className="activity-button activity-secondary"
          onClick={() => onTool('export-file')}
        >
          Exportar GeoJSON
        </button>
        <button type="button" className="activity-button" onClick={publish}>
          Baixar arquivo
        </button>
        <ImportProjectButton
          className="activity-button activity-secondary"
          label="Importar projeto (.azmd)"
          onImported={openProject}
          onError={(error) => {
            close(); // o aviso de erro fica atrás do modal, então fecha antes
            setError(error);
          }}
        />
        {capabilities.localCopies && (
          <button
            type="button"
            className="text-button"
            onClick={() => setDialog('discard')}
          >
            Excluir cópia local
          </button>
        )}
        <button
          type="button"
          className="danger-button"
          onClick={() => setDialog('delete')}
        >
          Excluir atividade
        </button>
      </Modal>
    );
  if (dialog === 'delete' || dialog === 'discard') {
    const discard = dialog === 'discard';
    const description = discard
      ? 'Alterações locais serão removidas. Se houver arquivos publicados, eles serão usados novamente, projetos novos serão removidos'
      : capabilities.localCopies
        ? 'A exclusão vale neste browser, os arquivos publicados ainda ficam salvos'
        : 'A atividade será excluída do servidor';
    return (
      <Modal
        title={discard ? 'Excluir cópia local?' : 'Excluir atividade?'}
        onClose={() => setDialog('settings')}
      >
        <p>{description}</p>
        <button
          type="button"
          className="activity-button"
          onClick={() => removeProject(discard)}
        >
          confirmar
        </button>
      </Modal>
    );
  }
  return null;
}
