// demo de um usuario
const ACCOUNT_KEY = 'azimund-demo-account';

export function readDemoAccount() {
  try {
    const account = JSON.parse(sessionStorage.getItem(ACCOUNT_KEY));
    if (typeof account?.nome === 'string' && typeof account?.email === 'string') {
      return { nome: account.nome, email: account.email };
    }
  } catch {
    // interface continua msm se o armazenamento não estiver funfando
  }
  return null;
}

export function saveDemoAccount({ nome, email }) {
  try {
    // Senha e n são gravados
    sessionStorage.setItem(ACCOUNT_KEY, JSON.stringify({ nome, email })); //jsonnn
    return true;
  } catch {
    return false;
  }
}
