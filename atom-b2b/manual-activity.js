(() => {
  const STORAGE_KEY = 'atomManualActivities';
  const modal = document.getElementById('activityModal');
  const form = document.getElementById('activityForm');
  const openBtn = document.getElementById('addActivityTop');
  const closeBtn = document.getElementById('closeActivityModal');
  const cancelBtn = document.getElementById('cancelActivity');

  if (!modal || !form || !openBtn) return;

  const readManual = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  };

  const saveManual = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

  function normalize(item) {
    const date = item.date || '';
    const dateLabel = date ? new Date(date + 'T00:00:00').toLocaleDateString('ru-RU') : '';
    return {
      date,
      dateLabel,
      name: item.name || 'Без названия',
      city: item.city || '—',
      region: item.region || item.city || '—',
      audience: item.audience || '—',
      score: Math.max(0, Math.min(100, Number(item.score || 0))),
      priority: item.priority === 'B' ? 'B' : 'A',
      next: item.next || 'Определить следующий шаг',
      value: item.value || 'Добавлено вручную.',
      atom: item.atom || 'Практический результат не указан.',
      manual: true
    };
  }

  function mergeIntoEvents() {
    if (typeof EVENTS === 'undefined' || !Array.isArray(EVENTS)) return;
    const manual = readManual().map(normalize);
    const existing = new Set(EVENTS.filter(e => e && e.manual).map(e => `${e.name}|${e.date}`));
    manual.forEach(item => {
      const key = `${item.name}|${item.date}`;
      if (!existing.has(key)) EVENTS.push(item);
    });
  }

  function refreshUI() {
    if (typeof initFilters === 'function') initFilters();
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderEvents === 'function') renderEvents();

    const sel = document.getElementById('reminderEvent');
    if (sel && typeof EVENTS !== 'undefined') {
      const current = sel.value;
      const first = sel.querySelector('option[value=""]');
      sel.innerHTML = '';
      if (first) sel.appendChild(first);
      EVENTS.slice().sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(e => {
        const o = document.createElement('option');
        o.value = e.name;
        o.textContent = e.name;
        sel.appendChild(o);
      });
      if ([...sel.options].some(o => o.value === current)) sel.value = current;
    }
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const item = {
      id: String(Date.now()),
      name: document.getElementById('activityName').value.trim(),
      date: document.getElementById('activityDate').value,
      city: document.getElementById('activityCity').value.trim(),
      region: document.getElementById('activityRegion').value.trim(),
      audience: document.getElementById('activityAudience').value.trim(),
      score: Number(document.getElementById('activityScore').value),
      priority: document.getElementById('activityPriority').value,
      next: document.getElementById('activityNext').value.trim(),
      value: document.getElementById('activityValue').value.trim(),
      atom: document.getElementById('activityAtom').value.trim()
    };

    const items = readManual();
    items.push(item);
    saveManual(items);
    if (typeof EVENTS !== 'undefined' && Array.isArray(EVENTS)) EVENTS.push(normalize(item));
    closeModal();
    refreshUI();
    if (typeof setView === 'function') setView('events');
  });

  mergeIntoEvents();
  refreshUI();
})();
