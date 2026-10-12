/**
 * Sheet: https://docs.google.com/spreadsheets/d/1p-7eWB5kZVTH4iiauRvhVbunHKPv2AFqo7rpEYY6k78/edit
 *
 * The live web app keeps the previous code until you publish a new version:
 * 1. Extensions → Apps Script
 * 2. Replace Code.gs with this file → Save
 * 3. Deploy → Manage deployments → pencil
 * 4. Version: New version → Deploy
 * Do not create a second deployment. The invite already calls the current /exec URL.
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

function norm_(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function alreadyRegistered_(sheet, email) {
  var emailKey = norm_(email);
  if (!emailKey) return false;
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var emails = sheet.getRange(2, 3, last - 1, 1).getValues();
  for (var i = 0; i < emails.length; i++) {
    if (norm_(emails[i][0]) === emailKey) return true;
  }
  return false;
}

/** Keeps the first reply for each email. Later copies are deleted. */
function removeDuplicateRsvps_(sheet) {
  var last = sheet.getLastRow();
  if (last < 3) return;
  var emails = sheet.getRange(2, 3, last - 1, 1).getValues();
  var seenEmails = {};
  var drop = [];
  for (var i = 0; i < emails.length; i++) {
    var emailKey = norm_(emails[i][0]);
    if (!emailKey) continue;
    if (seenEmails[emailKey]) drop.push(i + 2);
    else seenEmails[emailKey] = true;
  }
  for (var d = drop.length - 1; d >= 0; d--) {
    sheet.deleteRow(drop[d]);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheet = getRsvpSheet_();
    ensureHeaders_(sheet);
    removeDuplicateRsvps_(sheet);

    var name = (e.parameter.name || '').trim();
    var email = (e.parameter.email || '').trim();
    if (alreadyRegistered_(sheet, email)) {
      return json_({ ok: false, duplicate: true, message: 'This email has already been used to RSVP.' });
    }

    sheet.appendRow([
      new Date(),
      name,
      email,
      (e.parameter.attend || '').trim(),
      (e.parameter.message || '').trim()
    ]);

    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('RSVP')
    .addItem('Remove duplicate replies', 'removeDuplicateRsvps')
    .addToUi();
}

function removeDuplicateRsvps() {
  var sheet = getRsvpSheet_();
  ensureHeaders_(sheet);
  removeDuplicateRsvps_(sheet);
}
