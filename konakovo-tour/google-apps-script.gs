const SHEET_ID = '1pBQ1i6QizZ6rdm7z2W_75lmxZul2vW2-yiIt-FFJ8Ug';
const SHEET_NAME = 'Заявки';
const NOTIFY_EMAIL = 'rezkor@mail.ru';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Лист не найден: ' + SHEET_NAME);

    const now = new Date();
    sheet.appendRow([
      Utilities.formatDate(now, 'Europe/Moscow', 'dd.MM.yyyy HH:mm:ss'),
      data.name || '',
      data.phone || '',
      data.tripDate || '',
      data.people || '',
      data.comment || '',
      'korytnikhub.pro/konakovo-tour',
      'Новая'
    ]);

    const subject = 'Новая заявка — Конаково';
    const body = [
      'Новая заявка с сайта туристического маршрута Конаково',
      '',
      'Имя: ' + (data.name || '—'),
      'Телефон: ' + (data.phone || '—'),
      'Дата поездки: ' + (data.tripDate || '—'),
      'Количество человек: ' + (data.people || '—'),
      'Комментарий: ' + (data.comment || '—'),
      '',
      'Источник: https://korytnikhub.pro/konakovo-tour/'
    ].join('\n');

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err && err.message || err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
