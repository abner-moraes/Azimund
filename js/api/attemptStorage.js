// histórico de tentativas no navegador (visitantes sempre; contas so no modo local)
const ATTEMPT_PREFIX = 'azimund-tentativas:';
function accountKey(user) {
  if (!user) return ATTEMPT_PREFIX + 'guest';
  const identity = user.id
    ? `id:${user.id}`
    : `email:${user.email.trim().toLowerCase()}`;
  return `${ATTEMPT_PREFIX}${encodeURIComponent(identity)}`;
}
function listAttempts(user) {
  const stored = localStorage.getItem(accountKey(user));
  const attempts = stored ? JSON.parse(stored) : [];
  if (!Array.isArray(attempts)) throw new Error('Histórico de tentativas inválido.');
  return attempts;
}
export function saveAttempt(user, attempt) {
  try {
    const attempts = listAttempts(user);
    const usuario = user && {
      id: user.id,
      nome: user.nome.trim(),
      email: user.email.trim(),
    };
    const record = { ...attempt, usuario, concluidaEm: new Date().toISOString() };
    localStorage.setItem(accountKey(user), JSON.stringify([...attempts, record]));
    return { salva: true };
  } catch {
    return { salva: false, mensagem: 'ocorreu um erro' };
  }
}

// melhor nota do projeto (tbm olha a chave antiga por email de antes da conta ter id)
export function bestAttempt(user, id) {
  const attempts = listAttempts(user);
  if (user?.id && user.email) attempts.push(...listAttempts({ email: user.email }));
  let best = null;
  for (const attempt of attempts) {
    if (String(attempt.idProjeto) !== String(id)) continue;
    const score = attempt.resultado;
    if (!Number.isInteger(score?.acertos) || !Number.isInteger(score.total)) continue;
    const ratio = score.acertos / (score.total || 1);
    if (
      !best ||
      ratio > best.acertos / (best.total || 1) ||
      (ratio === best.acertos / (best.total || 1) && score.total > best.total)
    ) {
      best = { acertos: score.acertos, total: score.total };
    }
  }
  return best;
}
