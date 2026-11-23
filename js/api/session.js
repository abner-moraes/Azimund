// usuário logado na sessão atual (em memória)
let currentUser = null;

// login demo so tem nome e email; o back-end real vai mandar o id do usuário
function getSessionIdentity(account) {
  if (!account?.nome || !account?.email) return null;
  // Hash base 131 com BigInt q transforma o e-mail num id numérico, como seria no BD
  let hash = 0n;
  for (const character of account.email.trim().toLowerCase())
    hash = (hash * 131n + BigInt(character.codePointAt(0))) % 9223372036854775806n; //security is my passion
  return {
    id: String(account.id || hash + 1n),
    nome: account.nome,
    email: account.email,
  };
}

export function setSessionUser(account) {
  currentUser = getSessionIdentity(account);
  return currentUser;
}
export function getSessionUser() {
  return currentUser;
}
export function requireSessionUser() {
  if (!currentUser)
    throw {
      codigo: 'SESSAO_NECESSARIA',
      mensagem: 'Entre na sua conta para criar ou editar.',
    };
  return currentUser;
}
export function isProjectAuthor(project) {
  return !!currentUser && project?.autor?.id === currentUser.id;
}
