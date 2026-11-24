//BACK END
// operações da conta do usuário logado
// deletar conta da tabela Usuario no MySQL
// o Spring teria q conferir os cookies/seção antes de apagar
import { requireSessionUser } from './session.js';

const isHttp = import.meta.env?.VITE_API_MODE === 'http';
const baseUrl = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

// POST /api/usuarios/deletar  body: { "idUsuario": "123" }
// resposta esperada: 200/204 (ok) ou { codigo, mensagem } em caso de erro
export async function deleteAccount() {
  const user = requireSessionUser();

  // sem back-end (modo local) não tem o que apagar no banco
  // so sai da conta mesmo
  if (!isHttp) return { excluido: true };

  let response;
  try {
    //entrada do back: POST /api/usuarios/deletar
    response = await fetch(`${baseUrl}/api/usuarios/deletar`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idUsuario: user.id }),
    });
  } catch {
    throw {
      codigo: 'FALHA_REDE',
      mensagem: 'servidor indisponível tente novamente',
    };
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw {
      codigo: data?.codigo || 'ERRO_HTTP',
      mensagem: data?.mensagem || `não foi possível deletar a conta (${response.status}).`,
    };
  }
  return { excluido: true };
}
