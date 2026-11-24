//BACK END
// fetch único pro Spring q manda o cookie de sessão (JSESSIONID) e padroniza os erros
// erro = { codigo, status, mensagem }
import { BACK_URL } from '../config/backEndpoints.js';

// o Spring (ResponseStatusException) não manda a mensagem no body por padrão,
// então cada status tem um texto de reserva
const STATUS_MESSAGES = {
  400: 'Dados insuficientes para concluir.',
  401: 'Sua sessão expirou. Faça login de novo.',
  403: 'Você não pode alterar a conta de outro usuário.',
  404: 'Não encontrado.',
  500: 'Erro no servidor. Tente novamente.',
};

export async function backRequest(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${BACK_URL}${path}`, {
      method,
      credentials: 'include',
      redirect: 'manual', //pra n cair em login
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw {
      codigo: 'FALHA_REDE',
      status: 0,
      mensagem: 'O servidor está indisponível. Tente novamente.',
    };
  }

  if (response.type === 'opaqueredirect') {
    throw { codigo: 'SESSAO_NECESSARIA', status: 401, mensagem: STATUS_MESSAGES[401] };
  }

  // logout e delete
  const text = await response.text().catch(() => '');
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw {
      codigo: response.status === 401 ? 'SESSAO_NECESSARIA' : 'ERRO_HTTP',
      status: response.status,
      mensagem:
        data?.ERRO ||
        data?.mensagem ||
        data?.message ||
        STATUS_MESSAGES[response.status] ||
        `Não foi possível concluir (${response.status}).`,
    };
  }
  return data;
}
