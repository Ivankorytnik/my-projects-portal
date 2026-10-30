/* Даты событий и хронология глав. Чистая логика без доступа к DOM: работает в браузере и в Node (для тестов). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Timeline = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const MONTH_NOM = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  const MONTH_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const MONTH_FORMS = [
    'январ(?:ь|я|е|ю|ём|ем)', 'феврал(?:ь|я|е|ю|ём|ем)', 'март(?:а|е|у|ом)?', 'апрел(?:ь|я|е|ю|ём|ем)',
    'ма(?:й|я|е|ю|ем)', 'июн(?:ь|я|е|ю|ём|ем)', 'июл(?:ь|я|е|ю|ём|ем)', 'август(?:а|е|у|ом)?',
    'сентябр(?:ь|я|е|ю|ём|ем)', 'октябр(?:ь|я|е|ю|ём|ем)', 'ноябр(?:ь|я|е|ю|ём|ем)', 'декабр(?:ь|я|е|ю|ём|ем)'
  ];
  const MONTH_ANY = '(' + MONTH_FORMS.join('|') + ')';
  const NOT_LETTER_BEFORE = '(?<![а-яёa-z0-9])';
  const NOT_LETTER_AFTER = '(?![а-яёa-z0-9])';
  const YEAR = '(1[89]\\d\\d|20[0-3]\\d)';
  const DECADE_WORDS = { 'сороков': 1940, 'пятидесят': 1950, 'шестидесят': 1960, 'семидесят': 1970, 'восьмидесят': 1980, 'девяност': 1990 };
  const MIN_YEAR = 1850;

  function monthIndex(word) {
    const w = String(word || '').toLowerCase();
    for (let i = 0; i < MONTH_FORMS.length; i += 1) {
      if (new RegExp('^(?:' + MONTH_FORMS[i] + ')$', 'iu').test(w)) return i + 1;
    }
    return 0;
  }

  function maxYear() { return new Date().getFullYear(); }
  function yearOk(y) { return Number.isInteger(y) && y >= MIN_YEAR && y <= maxYear(); }

  // Количество дней по месяцам, високосный год учитывается.
  function daysIn(month, year) {
    if (month === 2) return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
  }

  // Приводит произвольный объект к допустимой дате события или null.
  function sanitizeEvent(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const year = Number(raw.year);
    if (!yearOk(year)) return null;
    let yearTo = raw.yearTo == null || raw.yearTo === '' ? null : Number(raw.yearTo);
    if (yearTo !== null && (!yearOk(yearTo) || yearTo <= year)) yearTo = null;
    let month = raw.month == null || raw.month === '' ? null : Number(raw.month);
    if (month !== null && !(Number.isInteger(month) && month >= 1 && month <= 12)) month = null;
    if (yearTo !== null) month = null;
    let day = raw.day == null || raw.day === '' ? null : Number(raw.day);
    if (month === null) day = null;
    if (day !== null && !(Number.isInteger(day) && day >= 1 && day <= daysIn(month, year))) day = null;
    return { year, yearTo, month, day, approx: Boolean(raw.approx), auto: Boolean(raw.auto) };
  }

  function sortKey(ev) {
    const e = sanitizeEvent(ev);
    if (!e) return null;
    return e.year * 10000 + (e.month || 0) * 100 + (e.day || 0);
  }

  function isDecade(e) { return e.yearTo === e.year + 9 && e.year % 10 === 0; }

  function label(ev) {
    const e = sanitizeEvent(ev);
    if (!e) return '';
    if (isDecade(e)) return e.year + '-е';
    let text;
    if (e.yearTo) text = e.year + '-' + e.yearTo;
    else if (e.day && e.month) text = e.day + ' ' + MONTH_GEN[e.month - 1] + ' ' + e.year;
    else if (e.month) text = MONTH_NOM[e.month - 1] + ' ' + e.year;
    else text = String(e.year);
    return e.approx ? 'около ' + text : text;
  }

  function decadeLabel(ev) {
    const e = sanitizeEvent(ev);
    if (!e) return 'Без даты';
    return Math.floor(e.year / 10) * 10 + '-е годы';
  }

  // Ищет все упоминания дат в тексте. Возвращает кандидатов с позицией и точностью.
  function scan(text, opts) {
    const src = String(text || '');
    const out = [];
    const birthYear = Number(opts && opts.birthYear);
    const add = (m, rank, event, via) => out.push({ start: m.index, end: m.index + m[0].length, rank, event, via });

    for (const m of src.matchAll(/(?<!\d)(\d{1,2})[./](\d{1,2})[./](\d{4})(?!\d)/g)) {
      const y = Number(m[3]);
      const ev = sanitizeEvent({ year: y, month: Number(m[2]), day: Number(m[1]) });
      if (ev && ev.month && ev.day) add(m, 5, ev, 'date');
    }
    for (const m of src.matchAll(new RegExp('(?<!\\d)(\\d{1,2})\\s+' + MONTH_ANY + '\\s+' + YEAR + '(?!\\d)', 'giu'))) {
      const ev = sanitizeEvent({ year: Number(m[3]), month: monthIndex(m[2]), day: Number(m[1]) });
      if (ev && ev.month && ev.day) add(m, 5, ev, 'date');
    }
    for (const m of src.matchAll(new RegExp(NOT_LETTER_BEFORE + MONTH_ANY + '\\s+' + YEAR + '(?!\\d)', 'giu'))) {
      const ev = sanitizeEvent({ year: Number(m[2]), month: monthIndex(m[1]) });
      if (ev && ev.month) add(m, 4, ev, 'month');
    }
    for (const m of src.matchAll(new RegExp('(?<!\\d)' + YEAR + '\\s*(?:-|–|—|по|до)\\s*' + YEAR + '(?!\\d)', 'giu'))) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (b > a && b - a <= 60) add(m, 3, sanitizeEvent({ year: a, yearTo: b }), 'range');
    }
    for (const m of src.matchAll(/(?<!\d)(1[89]\d\d)\s*-\s*(\d{2})(?!\d)/g)) {
      const a = Number(m[1]);
      const b = Math.floor(a / 100) * 100 + Number(m[2]);
      if (b > a && b - a <= 60) add(m, 3, sanitizeEvent({ year: a, yearTo: b }), 'range');
    }
    for (const m of src.matchAll(/(?<!\d)(1[89]\d0|20[0-2]0)\s*-\s*(?:х|е)(?![а-яё])/giu)) {
      const a = Number(m[1]);
      add(m, 3, sanitizeEvent({ year: a, yearTo: a + 9, approx: true }), 'decade');
    }
    for (const m of src.matchAll(/(?<!\d)([4-9]0)\s*-\s*(?:х|е)(?![а-яё])/giu)) {
      const a = 1900 + Number(m[1]);
      add(m, 3, sanitizeEvent({ year: a, yearTo: a + 9, approx: true }), 'decade');
    }
    for (const m of src.matchAll(/(?<![а-яё])(сороков|пятидесят|шестидесят|семидесят|восьмидесят|девяност)(?:ых|ые|ым|ыми|ом|ой)(?![а-яё])/giu)) {
      const a = DECADE_WORDS[m[1].toLowerCase()];
      add(m, 3, sanitizeEvent({ year: a, yearTo: a + 9, approx: true }), 'decade');
    }
    const skipAfter = '(?!\\s*(?:руб|₽|грамм|кг|км|метр|человек|штук|тыс))';
    for (const m of src.matchAll(new RegExp('(?<!\\d)' + YEAR + '(?!\\d)(?!\\s*-\\s*(?:х|е)(?![а-яё]))' + skipAfter, 'giu'))) {
      const ev = sanitizeEvent({ year: Number(m[1]) });
      if (ev) add(m, 1, ev, 'year');
    }
    // Возраст автора: считается только от первого лица и только если известен год рождения.
    if (yearOk(birthYear)) {
      const patterns = [
        /(?<![а-яё])мне\s+(?:\S+\s+){0,3}?(\d{1,2})\s*(?:лет|года|год)(?![а-яё])/giu,
        /(?<![а-яё])мне\s+(?:\S+\s+){0,3}?лет\s+(\d{1,2})(?!\d)/giu
      ];
      for (const re of patterns) {
        for (const m of src.matchAll(re)) {
          const age = Number(m[1]);
          if (age >= 1 && age <= 90) {
            const ev = sanitizeEvent({ year: birthYear + age, approx: true });
            if (ev) add(m, 2, ev, 'age');
          }
        }
      }
    }
    return out;
  }

  function hasAgeMention(text) {
    return /(?<![а-яё])мне\s+(?:\S+\s+){0,3}?(?:\d{1,2}\s*(?:лет|года|год)|лет\s+\d{1,2})/iu.test(String(text || ''));
  }

  // Выбирает дату начала рассказа: первое по тексту упоминание, более точные даты поглощают вложенные.
  function pickFirst(text, opts) {
    const found = scan(text, opts);
    const kept = found.filter(a => !found.some(b => b !== a && b.rank > a.rank && b.start <= a.start && b.end >= a.end));
    kept.sort((a, b) => a.start - b.start || b.rank - a.rank);
    return kept[0] || null;
  }

  // sources: массив строк по убыванию приоритета (например, даты от агента, затем текст главы).
  function detect(sources, opts) {
    const list = (Array.isArray(sources) ? sources : [sources]).map(s => String(s || '')).filter(Boolean);
    for (const s of list) {
      const hit = pickFirst(s, opts);
      if (hit) return { event: hit.event, via: hit.via, needsBirthYear: false };
    }
    const birthKnown = yearOk(Number(opts && opts.birthYear));
    return { event: null, via: '', needsBirthYear: !birthKnown && list.some(hasAgeMention) };
  }

  // Сравнение двух глав для хронологического порядка: датированные раньше недатированных.
  function compareChapters(a, b) {
    const ka = sortKey(a.event);
    const kb = sortKey(b.event);
    if (ka !== null && kb !== null) return ka - kb || (a.createdAt || 0) - (b.createdAt || 0);
    if (ka !== null) return -1;
    if (kb !== null) return 1;
    return (a.createdAt || 0) - (b.createdAt || 0);
  }

  return { MONTH_NOM, MONTH_GEN, monthIndex, sanitizeEvent, sortKey, label, decadeLabel, detect, compareChapters, daysIn };
});
