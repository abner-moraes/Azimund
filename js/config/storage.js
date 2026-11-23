// localStorage com try/catch num lugar so: em modo privado ou cota cheia o app segue sem salvar
export function readStored(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

// null/undefined apaga a chave
export function writeStored(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sem armazenamento, vale so nesta sessao */
  }
}
