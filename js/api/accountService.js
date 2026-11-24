//BACK END
// AuthController e UsuarioController do Spring, o Spring tem q conferir o cookie e se o id é do próprio usuário antes de mudar algo
import { requireSessionUser } from './session.js';
import { backRequest } from './backRequest.js';
import {
  CADASTRO,
  LOGIN,
  LOGOUT,
  ME,
  UPDATE,
  DELETE,
} from '../config/backEndpoints.js';

// POST /back/usuarios/cadastro  body: UsuarioCreateDTO { nome, email, senha }
export function signUp({ nome, email, senha }) {
  return backRequest(CADASTRO, { method: 'POST', body: { nome, email, senha } });
}

// POST /back/auth/login  body: LoginDTO { email, senha }  ->  { email, nome }
export async function login({ email, senha }) {
  const logged = await backRequest(LOGIN, { method: 'POST', body: { email, senha } });
  const me = await fetchMe();
  return { id: me.id, nome: me.nome ?? logged.nome, email: logged.email };
}

// GET /back/auth/me { id, nome } (401 se não tiver sessão)
export async function fetchMe() {
  const me = await backRequest(ME);
  return { id: String(me.id), nome: me.nome };
}

// POST /back/auth/logout  (invalida a sessão no Spring)
export async function logout() {
  try {
    await backRequest(LOGOUT, { method: 'POST' });
  } catch {
    //no front sai da conta do msm jt
  }
}

// PATCH /back/usuarios/update  body: UsuarioPatchDTO { id, email, senha, nome, funcao }
// manda so o id + o campo alterado spring mantém o que vier null
export async function updateAccount(changes) {
  const user = requireSessionUser();
  const saved = await backRequest(UPDATE, {
    method: 'PATCH',
    body: { id: Number(user.id), ...changes },
  });
  // a resposta é a entidade Usuario; so aproveita os campos públicos (nunca o senhaHash)
  const result = {};
  if (saved?.nome) result.nome = saved.nome;
  if (saved?.email) result.email = saved.email;
  if (saved) result.funcao = saved.funcao ?? '';
  return result;
}

// DELETE /back/usuarios/delete/{id}
export async function deleteAccount() {
  const user = requireSessionUser();
  await backRequest(DELETE(user.id), { method: 'DELETE' });
  await logout();
  return { excluido: true };
}
