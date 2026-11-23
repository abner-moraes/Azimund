// painéis da direita: busca de lugar (Photon/OSM), busca por código e a lista de Projetos
import React, { useEffect, useState } from 'react';
import * as projects from '../api/projectsService.js';
import { ProjectGlyph } from './ProjectGlyph.jsx';
import { Icon } from './Icon.jsx';
import { Modal } from './common/Modal.jsx';
import { ImportProjectButton } from './projects/ImportProjectButton.jsx';
const normalizeSearch = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos depois do NFD separá-los das letras
    .toLocaleLowerCase();
export function PlaceSearch({ map }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('');
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    // espera 600ms sem digitar antes de buscar (não martela a API do Photon)
    const timer = setTimeout(async () => {
      setStatus('Buscando...');
      try {
        const url = new URL('https://photon.komoot.io/api/');
        url.searchParams.set('q', query.trim());
        url.searchParams.set('limit', '6');
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json();
        setResults(data.features || []);
        setStatus(data.features?.length ? '' : 'Nenhum local encontrado');
      } catch (error) {
        if (error.name !== 'AbortError') setStatus('Não foi possível buscar locais.');
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return (
    <div className="project-search">
      <label className="field-label">
        Pesquisar local
        <input
          placeholder="Procure no mapa..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {status && <p role="status">{status}</p>}
      {results.map((feature, index) => (
        <button
          type="button"
          className="text-button"
          key={feature.properties.osm_id || index}
          onClick={() => {
            map.flyTo({
              center: feature.geometry.coordinates,
              zoom: 13,
              duration: 1600,
            });
            setResults([]);
          }}
        >
          {[
            feature.properties.name,
            feature.properties.city,
            feature.properties.state,
            feature.properties.country,
          ]
            .filter(Boolean)
            .filter((part, index, list) => list.indexOf(part) === index)
            .join(', ')}
        </button>
      ))}
      <small>Dados OpenStreetMap contributors - Photon</small>
    </div>
  );
}
export function SearchProject({ onFound }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function search(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const item = await projects.findProjectByCode(code);
      if (item) onFound(item);
      else setError('Nenhuma atividade com este código');
    } catch (error) {
      setError(error.mensagem);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form className="project-search" onSubmit={search}>
      <label className="field-label">
        Código da atividade
        <input
          aria-label="Código da atividade"
          placeholder="6 dígitos"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          autoFocus
        />
      </label>
      <button className="activity-button" disabled={loading || code.length !== 6}>
        {loading ? 'Buscando...' : 'Buscar atividade'}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
export function MyProjects({ onEdit, onMap, onClose, onNew }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [importError, setImportError] = useState(null);
  async function loadProjects() {
    setError(null);
    try {
      setItems(
        (await projects.listMyProjects()).sort((a, b) =>
          (b.horarioModificado || '').localeCompare(a.horarioModificado || ''),
        ),
      );
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let mounted = true;
    const run = () => {
      if (mounted) loadProjects();
    };
    run();
    const off = projects.subscribeToProjects(run);
    return () => {
      mounted = false;
      off();
    };
  }, []);
  async function confirmDelete() {
    try {
      await projects.deleteProject(pendingDelete.id);
      setPendingDelete(null);
      await loadProjects();
    } catch (e) {
      setError(e);
    }
  }
  return (
    <section className="my-projects" aria-label="Projetos">
      <div className="editor-row">
        <input
          aria-label="Procure um projeto"
          placeholder="Procure um projeto..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button className="icon-button" aria-label="Fechar projetos" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <div className="editor-row">
        <h2>Projetos</h2>
        <div className="my-projects-new">
          <ImportProjectButton onImported={onEdit} onError={setImportError} />
          <button className="text-button" onClick={onNew}>
            + Novo projeto
          </button>
        </div>
      </div>
      {importError && (
        <p className="my-projects-error" role="alert">
          {importError.mensagem || importError.message}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando projetos...</p>
      ) : error ? (
        <div role="alert">
          <p>{error.mensagem}</p>
          <button className="text-button" onClick={loadProjects}>
            Tentar de novo
          </button>
        </div>
      ) : !items.length ? (
        <p>Você ainda não criou projetos</p>
      ) : (
        items
          .filter((p) => normalizeSearch(p.titulo).includes(normalizeSearch(filter)))
          .map((p) => (
            <article className="my-project-item" key={p.id}>
              <button className="my-project-open" onClick={() => onEdit(p.id)}>
                <ProjectGlyph type={p.tipo} />
                <span>{p.titulo}</span>
              </button>
              <div className="my-project-actions">
                <button className="text-button" onClick={() => onMap(p)}>
                  Ver no mapa
                </button>
                <button className="text-button" onClick={() => setPendingDelete(p)}>
                  Excluir
                </button>
              </div>
            </article>
          ))
      )}
      {pendingDelete && (
        <Modal title="Excluir atividade?" onClose={() => setPendingDelete(null)}>
          <p>{pendingDelete.titulo}</p>
          <button className="activity-button" onClick={confirmDelete}>
            Confirmar exclusão
          </button>
        </Modal>
      )}
    </section>
  );
}
