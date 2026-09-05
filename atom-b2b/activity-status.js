(() => {
  const STATUS_URL = 'activity-status.json';
  const LOCAL_SYNC_KEY = 'atomB2BLastSheetsSync';

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }

  function applyStatus(data) {
    if (!data) return;
    if (data.lastSearch) setText('lastActivitySearch', data.lastSearch);

    const localSync = localStorage.getItem(LOCAL_SYNC_KEY);
    const syncStamp = localSync || data.lastGoogleSync;
    if (syncStamp) {
      setText('headerSheetsSync', `данные синхронизированы · ${syncStamp}`);
      setText('systemSheetsSync', syncStamp);
      const side = document.getElementById('systemSheetsSync');
      if (side) side.classList.remove('system-warning');
    }
  }

  fetch(`${STATUS_URL}?v=${Date.now()}`, { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(applyStatus)
    .catch(() => {
      const localSync = localStorage.getItem(LOCAL_SYNC_KEY);
      if (localSync) {
        setText('headerSheetsSync', `данные синхронизированы · ${localSync}`);
        setText('systemSheetsSync', localSync);
      }
    });
})();
