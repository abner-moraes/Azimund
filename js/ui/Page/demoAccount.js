//BACK END
// cópia da conta logada no sessionStorage (some ao fechar o navegador)
// a sessão de verdade é o cookie do Spring; isso aqui so evita piscar a tela de visitante
// e guarda o email/função, que o GET /back/auth/me não devolve
const ACCOUNT_KEY = 'azimund-demo-account';

export function readDemoAccount() {
  try {
    const account = JSON.parse(sessionStorage.getItem(ACCOUNT_KEY));
    if (typeof account?.nome === 'string' && typeof account?.email === 'string') {
      return {
        id: account.id != null ? String(account.id) : undefined,
        nome: account.nome,
        email: account.email,
        funcao: typeof account.funcao === 'string' ? account.funcao : '',
      };
    }
  } catch {
    // interface continua msm se o armazenamento não estiver funcionando
  }
  return null;
}

export function saveDemoAccount({ id, nome, email, funcao = '' }) {
  try {
    sessionStorage.setItem(ACCOUNT_KEY, JSON.stringify({ id, nome, email, funcao }));
    return true;
  } catch {
    return false;
  }
}

export function signOutDemoAccount() {
  try {
    sessionStorage.removeItem(ACCOUNT_KEY);
  } catch {
    /* sem armazenamento */
  }
}
