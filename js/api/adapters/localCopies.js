// IndexedDB: cópias de trabalho de cada autor (chave "<idDoAutor>:<idDoProjeto>") e a sequência local de ids
let connection;
function openDatabase() {
  if (connection) return connection;
  connection = new Promise((resolve, reject) => {
    const request = indexedDB.open('azimund-autoria-v1', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('projetos', {
        keyPath: 'chave',
      });
      request.result.createObjectStore('meta');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      connection = null;
      reject({
        codigo: 'ARMAZENAMENTO',
        mensagem: 'Não foi possível abrir o armazenamento deste navegador.',
      });
    };
  });
  return connection;
}
async function runTransaction(store, mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, mode);
    let result;
    const request = action(transaction.objectStore(store));
    if (request)
      request.onsuccess = () => {
        result = request.result;
      };
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = transaction.onabort = () =>
      reject({
        codigo: 'ARMAZENAMENTO',
        mensagem: 'não foi possível gravar ou ler o armazenamento deste navegador',
      });
  });
}
export const getAllCopies = () =>
  runTransaction('projetos', 'readonly', (store) => store.getAll());

export const getCopy = (owner, id) =>
  runTransaction('projetos', 'readonly', (store) => store.get(`${owner}:${id}`));
export const putCopy = (record) =>
  runTransaction('projetos', 'readwrite', (store) => store.put(record));
export const deleteCopy = (owner, id) =>
  runTransaction('projetos', 'readwrite', (store) => store.delete(`${owner}:${id}`));
export async function reserveProjectId(minimum) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    // ler e gravar 'ultimoId' na MESMA transação: duas abas nunca pegam o mesmo id
    const transaction = database.transaction('meta', 'readwrite');
    const store = transaction.objectStore('meta');

    const request = store.get('ultimoId');

    let id;
    request.onsuccess = () => {
      // BigInt pra não perder precisão com ids maiores que Number.MAX_SAFE_INTEGER
      const current = BigInt(request.result || '0');
      id = String((current > minimum ? current : minimum) + 1n);
      store.put(id, 'ultimoId');
    };

    transaction.oncomplete = () => resolve(id);
    transaction.onerror = transaction.onabort = () =>
      reject({
        codigo: 'ARMAZENAMENTO',
        mensagem: 'Não foi possível reservar um id.',
      });
  });
}
