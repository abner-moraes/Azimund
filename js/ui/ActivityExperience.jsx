import React, { useEffect, useRef, useState } from 'react';
import {
  listarPublicos,
  carregarJson,
  carregarGeojson,
  enviarTentativa,
  derivarTipo,
} from '../api/projetosService.js';
import { addAnchor } from './markerLayer.js';
import { createActivityLayer, flyToPage } from './activityLayer.js';
import { Icon } from './Icon.jsx';
import '../../css/activity.css';

export function ActivityExperience({
  map,
  markerLayer,
  sessionUser,
  onOpen,
  onPlayingChange,
}) {
  const [indice, setIndice] = useState({
    carregando: true,
    itens: [],
    erro: null,
  });
  const [selecao, setSelecao] = useState(null);
  const [projeto, setProjeto] = useState(null);
  const [fase, setFase] = useState('globo');
  const [erro, setErro] = useState(null);
  const [pagina, setPagina] = useState(0);
  const [escolha, setEscolha] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [modal, setModal] = useState(null);
  const [mapReady, setMapReady] = useState(map.isStyleLoaded());
  const layer = useRef(null);
  const request = useRef(0);
  const indexRequest = useRef(0);
  const selectRef = useRef(null);
  const returnView = useRef(null);
  const respostasRef = useRef({});
  const submitting = useRef(false);
  const usuarioDaTentativa = useRef(null);
  const heading = useRef(null);
  const atual = projeto?.paginas[pagina];
  const tipo = projeto ? derivarTipo(projeto) : null;
  const emAndamento = ['jogando', 'enviando', 'erro-envio'].includes(fase);
  const confirmada = atual && Object.hasOwn(respostas, atual.id);

  async function carregarIndice() {
    const token = ++indexRequest.current;
    setIndice({ carregando: true, itens: [], erro: null });
    try {
      const itens = await listarPublicos();
      if (token === indexRequest.current)
        setIndice({ carregando: false, itens, erro: null });
    } catch (error) {
      if (token === indexRequest.current)
        setIndice({ carregando: false, itens: [], erro: error });
    }
  }

  useEffect(() => {
    carregarIndice();
    const ready = () => setMapReady(true);
    map.on('style.load', ready);
    return () => {
      map.off('style.load', ready);
      request.current += 1;
      indexRequest.current += 1;
      layer.current?.remove();
    };
  }, [map]);

  selectRef.current = selecionar;
  useEffect(() => {
    return markerLayer.onSelect((item) => selectRef.current(item));
  }, [markerLayer]);

  useEffect(() => {
    if (!indice.carregando && !indice.erro) markerLayer.setProjects(indice.itens);
  }, [markerLayer, indice]);

  useEffect(() => {
    markerLayer.setVisible(
      !emAndamento &&
        !['carregando-geo', 'erro-geo', 'resultado', 'concluida'].includes(fase),
    );
    markerLayer.setSelected(selecao?.id || null);
    onPlayingChange(
      emAndamento ||
        ['carregando-geo', 'erro-geo', 'resultado', 'concluida'].includes(fase),
    );
  }, [fase, emAndamento, selecao, markerLayer, onPlayingChange]);

  useEffect(() => {
    if (
      !selecao ||
      !mapReady ||
      !['carregando-json', 'erro-json', 'resumo'].includes(fase)
    )
      return;
    const pin = addAnchor(map, projeto?.ancora || selecao.ancora);
    return () => pin.remove();
  }, [map, mapReady, selecao, projeto, fase]);

  useEffect(() => {
    if (fase === 'jogando' && atual) layer.current?.show(atual);
    heading.current?.focus({ preventScroll: true });
  }, [fase, pagina, atual]);

  useEffect(() => {
    function keyDown(event) {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        document.querySelector('dialog[open]')
      )
        return;
      if (selecao) {
        event.preventDefault();
        sair();
      }
    }
    document.addEventListener('keydown', keyDown);
    return () => document.removeEventListener('keydown', keyDown);
  });

  function resetarRespostas() {
    respostasRef.current = {};
    setRespostas({});
    setPagina(0);
    setEscolha(null);
    setResultado(null);
    submitting.current = false;
    usuarioDaTentativa.current = null;
  }

  async function selecionar(item) {
    if (emAndamento) return;
    if (!selecao) {
      returnView.current = {
        center: map.getCenter().toArray(),
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      };
    }
    const token = ++request.current;
    layer.current?.remove();
    layer.current = null;
    resetarRespostas();
    setSelecao(item);
    setProjeto(null);
    setErro(null);
    setModal(null);
    setFase('carregando-json');
    onOpen();
    // o fetch começa no mesmo evento da camera sem buscar o GeoJSON
    const carregamento = carregarJson(item.id);
    flyToPage(map, {
      centro: [item.ancora.lng, item.ancora.lat],
      zoom: 10.5,
      pitch: 35,
      bearing: 0,
      duracaoMs: 2500,
    });
    try {
      const data = await carregamento;
      if (token !== request.current) return;
      setProjeto(data);
      setFase('resumo');
      if (data.ancora.lng !== item.ancora.lng || data.ancora.lat !== item.ancora.lat) {
        flyToPage(map, {
          centro: [data.ancora.lng, data.ancora.lat],
          zoom: 10.5,
          pitch: 35,
          bearing: 0,
          duracaoMs: 2500,
        });
      }
    } catch (error) {
      if (token === request.current) {
        setErro(error);
        setFase('erro-json');
      }
    }
  }

  async function iniciar() {
    if (!projeto) return;
    if (!sessionUser?.nome || !sessionUser?.email) {
      setErro({
        codigo: 'SESSAO_NECESSARIA',
        mensagem: 'Entre na sua conta para jogar.',
      });
      setFase('erro-conta');
      return;
    }
    usuarioDaTentativa.current ||= {
      ...(sessionUser.id ? { id: sessionUser.id } : {}),
      nome: sessionUser.nome,
      email: sessionUser.email,
    };
    setModal(null);
    setErro(null);
    setFase('carregando-geo');
    const token = ++request.current;
    try {
      // Único ponto de entrada do GeoJSON: depois de Jogar e da identificação.
      const geojson = await carregarGeojson(projeto.idProjeto);
      await document.fonts.load('16px "DM Sans Variable"');
      if (token !== request.current) return;
      layer.current?.remove();
      layer.current = createActivityLayer(map, geojson);
      setFase('jogando');
    } catch (error) {
      if (token === request.current) {
        layer.current?.remove();
        layer.current = null;
        setErro(
          error?.codigo
            ? error
            : {
                codigo: 'MAPA_INDISPONIVEL',
                mensagem: 'Não foi possível preparar o mapa. Tente novamente.',
              },
        );
        setFase('erro-geo');
      }
    }
  }

  function confirmar() {
    if (escolha === null || Object.hasOwn(respostasRef.current, atual.id)) return;
    respostasRef.current = { ...respostasRef.current, [atual.id]: escolha };
    setRespostas(respostasRef.current);
  }

  async function concluir() {
    if (submitting.current) return;
    submitting.current = true;
    setFase('enviando');
    setErro(null);
    const token = ++request.current;
    try {
      const data = await enviarTentativa(projeto.idProjeto, {
        respostas: respostasRef.current,
        usuario: usuarioDaTentativa.current,
      });
      if (token !== request.current) return;
      layer.current?.remove();
      layer.current = null;
      setResultado(data);
      setFase('resultado');
    } catch (error) {
      if (token === request.current) {
        setErro(error);
        setFase('erro-envio');
      }
    } finally {
      if (token === request.current) submitting.current = false;
    }
  }

  function avancar() {
    if (atual.tipo === 'questao' && !Object.hasOwn(respostasRef.current, atual.id))
      return;
    if (pagina < projeto.paginas.length - 1) {
      setPagina(pagina + 1);
      setEscolha(null);
    } else if (tipo === 'ATIVIDADE') concluir();
    else {
      layer.current?.remove();
      layer.current = null;
      setFase('concluida');
    }
  }

  function voltarGlobo() {
    request.current += 1;
    layer.current?.remove();
    layer.current = null;
    const id = selecao?.id;
    setModal(null);
    setSelecao(null);
    setProjeto(null);
    setFase('globo');
    setErro(null);
    resetarRespostas();
    map.stop();
    map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
    if (returnView.current)
      map.flyTo({
        ...returnView.current,
        duration: 1800,
        retainPadding: false,
      });
    requestAnimationFrame(() => {
      markerLayer.focus(id);
    });
  }

  function sair() {
    if (tipo === 'ATIVIDADE' && emAndamento) setModal('sair');
    else voltarGlobo();
  }

  if (!selecao) {
    return indice.erro ? (
      <div className="activity-index-error">
        <ErrorState error={indice.erro} onRetry={carregarIndice} />
      </div>
    ) : null;
  }

  return (
    <>
      <section
        id="activity-panel"
        className={`activity-panel ${fase === 'resumo' ? 'activity-summary' : ''}`}
        aria-label={projeto?.titulo || 'Projeto'}
        aria-busy={['carregando-json', 'carregando-geo', 'enviando'].includes(fase)}
      >
        <button
          type="button"
          className="close-button activity-close"
          title="Sair"
          aria-label="Sair do projeto"
          onClick={sair}
        >
          <Icon name="close" />
        </button>

        {['carregando-json', 'carregando-geo', 'enviando'].includes(fase) && (
          <div className="activity-centered">
            <LoadingText
              texto={
                fase === 'carregando-json'
                  ? 'Carregando projeto…'
                  : fase === 'carregando-geo'
                    ? 'Preparando o mapa…'
                    : 'Conferindo suas respostas…'
              }
            />
          </div>
        )}
        {erro && (
          <div className="activity-centered">
            <ErrorState
              error={erro}
              onRetry={
                fase === 'erro-json'
                  ? () => selecionar(selecao)
                  : ['erro-geo', 'erro-conta'].includes(fase)
                    ? iniciar
                    : concluir
              }
            />
          </div>
        )}

        {fase === 'resumo' && (
          <>
            <h1 className="activity-title" tabIndex={-1} ref={heading}>
              {projeto.titulo}
            </h1>
            <p className="activity-description">{projeto.descricao}</p>
            <div className="activity-summary-footer">
              <p className="activity-type">
                <Icon name={tipo === 'ATIVIDADE' ? 'quiz' : 'slideshow'} />{' '}
                {tipo === 'ATIVIDADE' ? 'Atividade' : 'Apresentação'}
              </p>
              <p className="activity-count">
                {tipo === 'ATIVIDADE'
                  ? `${projeto.paginas.filter((page) => page.tipo === 'questao').length} questões`
                  : `${projeto.paginas.length} páginas`}
              </p>
              <p className="activity-author">Por {selecao.autor.nome}</p>
              <button
                type="button"
                className="activity-button activity-play"
                onClick={iniciar}
              >
                <Icon name="play_circle" /> Jogar
              </button>
            </div>
          </>
        )}

        {fase === 'jogando' && (
          <>
            <div
              className="activity-progress"
              aria-label={`Página ${pagina + 1} de ${projeto.paginas.length}`}
            >
              {projeto.paginas.map((page, i) => (
                <span
                  key={page.id}
                  className={`${i === pagina ? 'current' : ''} ${i < pagina ? 'complete' : ''}`}
                  aria-current={i === pagina ? 'step' : undefined}
                />
              ))}
            </div>
            <p className="activity-page-count">
              Página {pagina + 1} de {projeto.paginas.length}
            </p>
            <h1 className="activity-page-title" tabIndex={-1} ref={heading}>
              {atual.titulo}
            </h1>
            <div className="activity-page-body" key={atual.id}>
              {atual.texto && <p className="activity-text">{atual.texto}</p>}
              {atual.tipo === 'questao' && (
                <fieldset className="activity-question" disabled={confirmada}>
                  <legend>{atual.questao.enunciado}</legend>
                  <div className="activity-options">
                    {(atual.questao.formato === 'verdadeiro_falso'
                      ? [
                          { id: true, texto: 'Verdadeiro' },
                          { id: false, texto: 'Falso' },
                        ]
                      : atual.questao.alternativas
                    ).map((option) => (
                      <label
                        className={`activity-option ${escolha === option.id ? 'selected' : ''}`}
                        key={String(option.id)}
                      >
                        <input
                          type="radio"
                          name={`resposta-${atual.id}`}
                          value={String(option.id)}
                          checked={escolha === option.id}
                          onChange={() => setEscolha(option.id)}
                        />
                        <span>{option.texto}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
            <footer className="activity-page-footer">
              {confirmada && (
                <p className="activity-confirmed" role="status">
                  resposta confirmada
                </p>
              )}
              <div className="activity-navigation">
                {tipo === 'APRESENTACAO' && (
                  <button
                    type="button"
                    className="activity-button activity-secondary"
                    disabled={pagina === 0}
                    onClick={() => setPagina(pagina - 1)}
                  >
                    Anterior
                  </button>
                )}
                {atual.tipo === 'questao' && !confirmada ? (
                  <button
                    type="button"
                    className="activity-button"
                    disabled={escolha === null}
                    onClick={confirmar}
                  >
                    Confirmar
                  </button>
                ) : (
                  <button type="button" className="activity-button" onClick={avancar}>
                    {pagina === projeto.paginas.length - 1
                      ? 'Concluir'
                      : tipo === 'ATIVIDADE' && atual.tipo === 'conteudo'
                        ? 'Continuar'
                        : 'Próxima'}
                  </button>
                )}
              </div>
              <button type="button" className="activity-exit" onClick={sair}>
                Sair {tipo === 'ATIVIDADE' ? 'da atividade' : 'da apresentação'}
              </button>
            </footer>
          </>
        )}

        {fase === 'resultado' && (
          <>
            <div className="activity-result-heading">
              <Icon name="task_alt" />
              <h1 tabIndex={-1} ref={heading}>
                Você acertou {resultado.acertos} de {resultado.total}
              </h1>
              <p>{projeto.titulo}</p>
              {resultado.salvamento && (
                <p role="status">
                  {resultado.salvamento.salva
                    ? 'Resultado salvo na sua conta neste navegador.'
                    : resultado.salvamento.mensagem}
                </p>
              )}
            </div>
            <div className="activity-review">
              {resultado.erros
                .filter((item) => item.comentario)
                .map((item) => {
                  const page = projeto.paginas.find((page) => page.id === item.paginaId);
                  const escolhida = respostas[page.id];
                  const label =
                    page.questao.formato === 'verdadeiro_falso'
                      ? escolhida
                        ? 'Verdadeiro'
                        : 'Falso'
                      : page.questao.alternativas.find(
                          (option) => option.id === escolhida,
                        )?.texto;
                  return (
                    <article className="activity-review-item" key={item.paginaId}>
                      <h2>{page.questao.enunciado}</h2>
                      <p className="activity-chosen">Sua resposta: {label}</p>
                      <p>{item.comentario}</p>
                    </article>
                  );
                })}
            </div>
            <button
              type="button"
              className="activity-button activity-result-exit"
              onClick={voltarGlobo}
            >
              Voltar ao globo
            </button>
          </>
        )}
        {fase === 'concluida' && (
          <div className="activity-centered">
            <Icon name="task_alt" />
            <h1 tabIndex={-1} ref={heading}>
              Apresentação concluída
            </h1>
            <p>{projeto.titulo}</p>
            <button type="button" className="activity-button" onClick={voltarGlobo}>
              Voltar ao globo
            </button>
          </div>
        )}
      </section>

      {modal === 'sair' && (
        <ActivityModal title="Sair da atividade?" onCancel={() => setModal(null)}>
          <p>Suas respostas serão descartadas e esta tentativa não será salva.</p>
          <div className="activity-modal-actions">
            <button
              type="button"
              className="activity-button activity-secondary"
              onClick={() => setModal(null)}
              autoFocus
            >
              Continuar jogando
            </button>
            <button type="button" className="activity-button" onClick={voltarGlobo}>
              Sair
            </button>
          </div>
        </ActivityModal>
      )}
    </>
  );
}

function LoadingText({ texto }) {
  // Mesmo padrão role/status q o userpanel usa
  return (
    <p className="activity-loading" role="status">
      {texto}
    </p>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="activity-error" role="alert">
      <Icon name="info" />
      <p>Não foi possível abrir este conteúdo.</p>
      <p className="activity-error-detail">
        {error.codigo === 'SESSAO_NECESSARIA'
          ? error.mensagem
          : error.codigo === 'NAO_ENCONTRADO'
            ? 'O arquivo não foi encontrado.'
            : error.codigo === 'FALHA_REDE'
              ? 'Verifique a conexão e tente novamente.'
              : 'Os dados precisam de uma revisão pelo autor.'}
      </p>
      <button type="button" className="activity-button" onClick={onRetry}>
        Tentar de novo
      </button>
    </div>
  );
}

function ActivityModal({ title, onCancel, children }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected)
        opener.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      className="activity-dialog"
      ref={dialogRef}
      aria-labelledby="activity-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id="activity-dialog-title">{title}</h2>
      {children}
    </dialog>
  );
}
