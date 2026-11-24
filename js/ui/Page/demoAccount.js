//BACK END
// conta demo no sessionStorage enquanto não tem back-end (some ao fechar o navegador)
const ACCOUNT_KEY = 'azimund-demo-account';

//entrada do back: trocar a conta demo pela sessão do servidor
export function readDemoAccount() {
  try {
    const account = JSON.parse(sessionStorage.getItem(ACCOUNT_KEY));
    if (typeof account?.nome === 'string' && typeof account?.email === 'string') {
      return { nome: account.nome, email: account.email };
    }
  } catch {
    // interface continua msm se o armazenamento não estiver funcionando
  }
  return null;
}

export function saveDemoAccount({ nome, email }) {
  try {
    sessionStorage.setItem(ACCOUNT_KEY, JSON.stringify({ nome, email }));
    return true;
  } catch {
    return false;
  }
}

export function signOutDemoAccount() {
  sessionStorage.removeItem(ACCOUNT_KEY);
}
