/**
 * KINS SCHOOL — Google Apps Script API
 * =====================================
 * School: KINS SCHOOL, Ratta Rd, Kins St, Gujranwala
 * Version: 1.0.0
 *
 * DEPLOY INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Extensions → Apps Script
 * 3. Paste this entire file
 * 4. Save (Ctrl+S)
 * 5. Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL
 * 7. Paste in KINS SCHOOL Settings → Apps Script URL
 */

// ─── ENTRY POINTS ────────────────────────────────────────
function doGet(e)  { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const params = e.parameter || {};
  const action = params.action;
  const sheet  = params.sheet;

  try {
    let result;
    switch (action) {
      case 'getAll':        result = getAll(sheet);               break;
      case 'insert':        result = insert(sheet, params.data);  break;
      case 'update':        result = update(sheet, params.id, params.data); break;
      case 'delete':        result = deleteRow(sheet, params.id); break;
      case 'createHeaders': result = createHeaders();             break;
      case 'getDefaulters': result = getDefaulters(params.month, params.year); break;
      case 'getStudent':    result = getStudent(params.id);       break;
      case 'ping':          result = { pong: true, time: new Date().toISOString() }; break;
      default:
        result = { error: `Unknown action: ${action}` };
    }

    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message, stack: err.stack });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── SHEET HELPERS ────────────────────────────────────────
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheetByName(name) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Sheet "${name}" not found. Run createHeaders first.`);
  return sheet;
}

// ─── CRUD OPERATIONS ─────────────────────────────────────

/** GET ALL rows as array of objects */
function getAll(sheetName) {
  const sheet = getSheetByName(sheetName);
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}

/** INSERT a new row */
function insert(sheetName, dataJson) {
  const sheet  = getSheetByName(sheetName);
  const data   = JSON.parse(dataJson);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row     = headers.map(h => (data[h] !== undefined ? data[h] : ''));
  sheet.appendRow(row);
  return { inserted: true, id: data.id || '' };
}

/** UPDATE a row by id */
function update(sheetName, id, dataJson) {
  const sheet   = getSheetByName(sheetName);
  const data    = JSON.parse(dataJson);
  const allVals = sheet.getDataRange().getValues();
  const headers = allVals[0];
  const idCol   = headers.indexOf('id');
  if (idCol === -1) throw new Error('No "id" column found');

  for (let i = 1; i < allVals.length; i++) {
    if (String(allVals[i][idCol]) === String(id)) {
      headers.forEach((h, j) => {
        if (data[h] !== undefined) sheet.getRange(i + 1, j + 1).setValue(data[h]);
      });
      return { updated: true, row: i + 1 };
    }
  }
  return { updated: false, message: `ID ${id} not found` };
}

/** DELETE a row by id */
function deleteRow(sheetName, id) {
  const sheet   = getSheetByName(sheetName);
  const allVals = sheet.getDataRange().getValues();
  const headers = allVals[0];
  const idCol   = headers.indexOf('id');
  if (idCol === -1) throw new Error('No "id" column found');

  for (let i = 1; i < allVals.length; i++) {
    if (String(allVals[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { deleted: true, row: i + 1 };
    }
  }
  return { deleted: false };
}

/** GET a single student by ID */
function getStudent(id) {
  const all = getAll('Students');
  return all.find(s => String(s.id) === String(id)) || null;
}

/** GET defaulters for a given month */
function getDefaulters(month, year) {
  const fees = getAll('Fees');
  const students = getAll('Students');
  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  const unpaid = fees.filter(f => f.status === 'unpaid' || f.status === 'partial');
  const grouped = {};
  unpaid.forEach(f => {
    if (!grouped[f.studentId]) {
      grouped[f.studentId] = { studentId: f.studentId, student: studentMap[f.studentId], months: [], totalDue: 0 };
    }
    grouped[f.studentId].months.push(f.month);
    grouped[f.studentId].totalDue += Number(f.agreed) - Number(f.paid);
  });

  return Object.values(grouped).map(d => ({
    ...d,
    status: d.months.length >= 2 ? 'strict' : 'first',
  }));
}

// ─── AUTO-CREATE SHEET HEADERS ────────────────────────────
function createHeaders() {
  const ss = getSpreadsheet();

  const SHEETS = {
    Students: [
      'id','name','father','admission','family','kinship',
      'fatherCell','motherCell','address','class',
      'paperFund','monthlyFee','admissionDate'
    ],
    Fees: [
      'id','studentId','studentName','month','year',
      'agreed','paid','status','date','notes'
    ],
    Receipts: [
      'id','receiptNo','studentId','studentName','father',
      'class','totalPaid','remaining','paidMonths',
      'paperFundPaid','stationaryTotal','date','time'
    ],
    Results: [
      'id','studentId','studentName','class','exam','year',
      'totalMax','totalObt','percentage','grade','pass','remarks'
    ],
    Attendance: [
      'id','date','studentId','studentName','class','status'
    ],
    Stationary: [
      'id','name','category','stock','price','sold','unit'
    ],
    WhatsappLogs: [
      'id','studentId','studentName','messageType',
      'cell','message','date','status'
    ],
  };

  const HEADER_STYLE = {
    background: '#1B4FD8',
    fontColor: '#FFFFFF',
  };

  const created = [];
  const existing = [];

  Object.entries(SHEETS).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      created.push(name);
    } else {
      existing.push(name);
    }

    // Write headers
    const range = sheet.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
    range.setBackground(HEADER_STYLE.background);
    range.setFontColor(HEADER_STYLE.fontColor);
    range.setFontWeight('bold');
    range.setHorizontalAlignment('center');

    // Freeze top row
    sheet.setFrozenRows(1);

    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
  });

  return {
    created,
    existing,
    message: `Created: ${created.join(', ') || 'none'} | Existing: ${existing.join(', ') || 'none'}`,
  };
}

// ─── UTILITY: BATCH DEFAULTER NOTIFICATION LOG ───────────
function logWhatsAppSent(studentId, studentName, messageType, cell) {
  try {
    const sheet = getSheetByName('WhatsappLogs');
    sheet.appendRow([
      Date.now(), studentId, studentName, messageType,
      cell, '', new Date().toLocaleDateString('en-GB'), 'sent'
    ]);
  } catch (e) {
    // Fail silently
  }
}
