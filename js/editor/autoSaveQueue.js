// serializa salvamento e edits
export function createAutoSaveQueue(
  save,
  onStatus,
  { delay = 1500, attempts = 5 } = {},
) {
  let pending = null;
  let inFlight = null;
  let debounceTimer;
  let retryTimer;
  let resumeRetry;
  let failures = 0;
  let lastSavedKey = null;
  let active = true;

  function report(status) {
    if (active) onStatus(status);
  }

  async function processNext() {
    if (inFlight) {
      await inFlight;
      return;
    }
    if (!pending) return;
    clearTimeout(debounceTimer);
    const job = pending;
    pending = null;
    report({ state: 'saving' });
    inFlight = (async () => {
      try {
        await save(job.data);
        lastSavedKey = job.key;
        failures = 0;
        report({ state: 'saved', savedAt: new Date() });
      } catch (error) {
        pending ||= job;
        failures += 1;
        report({ state: failures >= attempts ? 'error' : 'retrying', error });
        if (failures < attempts) {
          await new Promise((resolve) => {
            resumeRetry = resolve;
            retryTimer = setTimeout(
              resolve,
              Math.min(1000 * 2 ** (failures - 1), 16000),
            );
          });
          resumeRetry = null;
        }
      }
    })();
    await inFlight;
    inFlight = null;
    if (pending && failures < attempts) await processNext();
  }

  function schedule(data) {
    const key = JSON.stringify(data);
    if ((key === lastSavedKey && !pending && !inFlight) || key === pending?.key) return;
    pending = { data: structuredClone(data), key };
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processNext, delay);
    report({ state: 'pending' });
  }

  async function flush() {
    clearTimeout(debounceTimer);
    while (inFlight || pending) {
      await processNext();
      if (pending && failures >= attempts)
        throw {
          codigo: 'SALVAMENTO',
          mensagem: 'Não foi possível salvar. Tente novamente antes de sair.',
        };
    }
  }

  return {
    schedule,
    flush,
    async retry() {
      failures = 0;
      clearTimeout(retryTimer);
      resumeRetry?.();
      await processNext();
    },
    dispose() {
      active = false;
      clearTimeout(debounceTimer);
      clearTimeout(retryTimer);
      resumeRetry?.();
    },
    get pending() {
      return !!pending || !!inFlight;
    },
  };
}
