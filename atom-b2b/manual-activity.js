(() => {
  const WRITE_URL = 'https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-calendar-write';
  const PUBLISHABLE_KEY = 'sb_publishable_jVSgQ2sSeDw1VIXD1GmL2Q__BAbIs9F';
  const modal = document.getElementById('activityModal');
  const form = document.getElementById('activityForm');
  const openBtn = document.getElementById('addActivityTop');
  const closeBtn = document.getElementById('closeActivityModal');
  const cancelBtn = document.getElementById('cancelActivity');

  if (!modal || !form || !openBtn) return;

  function showDiagnostic(kind, title, details) {
    const diagnostic = document.getElementById('searchDiagnostic');
    if (!diagnostic) return;
    diagnostic.className = `search-diagnostic ${kind}`;
    diagnostic.innerHTML = `<strong>${title}</strong>${details ? `<div>${details}</div>` : ''}`;
  }

  function openModal() {
    form.reset();
    document.getElementById('activityScore').value = '80';
    document.getElementById('activityPriority').value = 'A';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => document.getElementById('activityName')?.focus(), 0);
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  openBtn.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const original = submit?.textContent || 'Добавить в Google Sheets';
    if (submit) { submit.disabled = true; submit.textContent = 'Запись…'; }

    const item = {
      name: document.getElementById('activityName').value.trim(),
      date: document.getElementById('activityDate').value,
      city: document.getElementById('activityCity').value.trim(),
      region: document.getElementById('activityRegion').value.trim(),
      audience: document.getElementById('activityAudience').value.trim(),
      score: Number(document.getElementById('activityScore').value),
      priority: document.getElementById('activityPriority').value,
      next: document.getElementById('activityNext').value.trim() || 'Определить следующий шаг',
      reason: document.getElementById('activityValue').value.trim(),
      value: document.getElementById('activityValue').value.trim(),
      atom: document.getElementById('activityAtom').value.trim(),
      dateStatus: 'Требует проверки',
      source: 'Добавлено вручную в Korytnik Hub'
    };

    try {
      const response = await fetch(WRITE_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'apikey': PUBLISHABLE_KEY,
          'authorization': `Bearer ${PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ event: item })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);

      closeModal();
      if (data.duplicate || data.skipped) {
        showDiagnostic('warning', 'Мероприятие уже есть в Google Sheets', `${item.name} не добавлено повторно.`);
      } else {
        showDiagnostic('success', 'Активность записана', `${item.name} добавлено в Google Sheets. Обновляем календарь…`);
      }
      if (typeof window.syncAtomGoogleSheets === 'function') {
        setTimeout(() => window.syncAtomGoogleSheets(), 500);
      }
      if (typeof setView === 'function') setView('events');
    } catch (error) {
      showDiagnostic('error', 'Не удалось записать активность', `${error?.message || 'Неизвестная ошибка'}. Данные не сохранены локально: Google Sheets остается единственной основной базой.`);
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = original; }
    }
  });
})();
