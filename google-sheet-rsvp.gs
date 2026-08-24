/**
 * Sheet: https://docs.google.com/spreadsheets/d/1p-7eWB5kZVTH4iiauRvhVbunHKPv2AFqo7rpEYY6k78/edit
 *
 * Setup:
 * 1. Open that sheet → Extensions → Apps Script
 * 2. Replace Code.gs with this file → Save
 * 3. Deploy → New deployment → Web app
 *    Execute as: Me | Who has access: Anyone
 * 4. Copy the Web app URL (ends in /exec)
 * 5. Add it to Vercel env GOOGLE_SCRIPT_URL, or paste into index.html RSVP_SCRIPT_URL
 */
var SPREADSHEET_ID = '1p-7eWB5kZVTH4iiauRvhVbunHKPv2AFqo7rpEYY6k78';

function getRsvpSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheets()[0];
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Attendance', 'Message']);
    return;
  }
  var first = sheet.getRange(1, 1, 1, 5).getValues()[0];
  if (String(first[0]).toLowerCase() !== 'timestamp') {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, 5).setValues([['Timestamp', 'Name', 'Email', 'Attendance', 'Message']]);
  }
}

function doPost(e) {
  var sheet = getRsvpSheet_();
  ensureHeaders_(sheet);

  sheet.appendRow([
    new Date(),
    (e.parameter.name || '').trim(),
    (e.parameter.email || '').trim(),
    (e.parameter.attend || '').trim(),
    (e.parameter.message || '').trim()
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
