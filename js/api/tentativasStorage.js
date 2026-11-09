const PREFIXO = 'azimund-tentativas:';

function chaveDaConta(usuario) {
  const identidade = usuario.id
    ? `id:${usuario.id}`
    : `email:${usuario.email.trim().toLowerCase()}`;
  return `${PREFIXO}${encodeURIComponent(identidade)}`;
}

export function listarTentativas(usuario) {
  const dados = globalThis.localStorage.getItem(chaveDaConta(usuario));
  const tentativas = dados ? JSON.parse(dados) : [];
  if (!Array.isArray(tentativas)) throw new Error('Histórico de tentativas inválido.');
  return tentativas;
}

export function salvarTentativa(usuario, tentativa) {
  try {
    const tentativas = listarTentativas(usuario);
    const registro = {
      ...tentativa,
      usuario: {
        ...(usuario.id ? { id: usuario.id } : {}),
        nome: usuario.nome.trim(),
        email: usuario.email.trim(),
      },
      concluidaEm: new Date().toISOString(),
    };
    globalThis.localStorage.setItem(
      chaveDaConta(usuario),
      JSON.stringify([...tentativas, registro]),
    );
    return { salva: true };
  } catch {
    return {
      salva: false,
      mensagem:
        'ocorreu um erro',
    };
  }
}
