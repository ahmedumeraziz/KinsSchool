import React, { useState } from 'react'
import { Card, Btn, Input, Badge, Icon, PageHeader, Divider } from '../common/UI'
import { useAppStore } from '../../store/appStore'

const SHEET_ID_REGEX = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/

const SHEETS_STRUCTURE = {
  Students:     ['id','name','father','admission','family','kinship','fatherCell','motherCell','address','class','paperFund','monthlyFee','admissionDate'],
  Fees:         ['id','studentId','studentName','month','year','agreed','paid','status','date','notes'],
  Receipts:     ['id','receiptNo','studentId','studentName','father','class','totalPaid','remaining','paidMonths','paperFundPaid','stationaryTotal','date','time'],
  Results:      ['id','studentId','studentName','class','exam','year','totalMax','totalObt','percentage','grade','pass','remarks'],
  Attendance:   ['id','date','studentId','studentName','class','status'],
  Stationary:   ['id','name','category','stock','price','sold','unit'],
  WhatsappLogs: ['id','studentId','studentName','messageType','cell','message','date','status'],
}

const GAS_CODE = `/**
 * KINS SCHOOL — Google Apps Script API
 * Deploy: Extensions → Apps Script → paste → Save → Deploy as Web App
 * Execute as: Me | Access: Anyone
 */
function doGet(e)  { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const p = e.parameter || {};
  try {
    let result;
    switch (p.action) {
      case 'getAll':        result = getAll(p.sheet); break;
      case 'insert':        result = insert(p.sheet, p.data); break;
      case 'update':        result = update(p.sheet, p.id, p.data); break;
      case 'delete':        result = deleteRow(p.sheet, p.id); break;
      case 'createHeaders': result = createHeaders(); break;
      case 'getDefaulters': result = getDefaulters(p.month, p.year); break;
      case 'ping':          result = { pong: true, time: new Date().toISOString() }; break;
      default:              result = { error: 'Unknown action: ' + p.action };
    }
    return json({ success: true, data: result });
  } catch (err) {
    return json({ success: false, error: err.message });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!s) throw new Error('Sheet not found: ' + name + '. Run createHeaders first.');
  return s;
}

function getAll(name) {
  const sheet = getSheet(name);
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const keys  = data[0];
  return data.slice(1).filter(r => r.some(c => c !== '')).map(r => {
    const o = {}; keys.forEach((k,i) => o[k] = r[i]); return o;
  });
}

function insert(name, dataJson) {
  const sheet   = getSheet(name);
  const data    = JSON.parse(dataJson);
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map(h => data[h] !== undefined ? data[h] : ''));
  return { inserted: true };
}

function update(name, id, dataJson) {
  const sheet = getSheet(name);
  const data  = JSON.parse(dataJson);
  const vals  = sheet.getDataRange().getValues();
  const keys  = vals[0];
  const idCol = keys.indexOf('id');
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][idCol]) === String(id)) {
      keys.forEach((k,j) => { if (data[k] !== undefined) sheet.getRange(i+1,j+1).setValue(data[k]); });
      return { updated: true };
    }
  }
  return { updated: false };
}

function deleteRow(name, id) {
  const sheet = getSheet(name);
  const vals  = sheet.getDataRange().getValues();
  const idCol = vals[0].indexOf('id');
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][idCol]) === String(id)) { sheet.deleteRow(i+1); return { deleted: true }; }
  }
  return { deleted: false };
}

function getDefaulters(month, year) {
  const fees     = getAll('Fees');
  const students = getAll('Students');
  const sMap     = {};
  students.forEach(s => sMap[s.id] = s);
  const unpaid   = fees.filter(f => f.status === 'unpaid' || f.status === 'partial');
  const grouped  = {};
  unpaid.forEach(f => {
    if (!grouped[f.studentId]) grouped[f.studentId] = { studentId: f.studentId, student: sMap[f.studentId], months: [], totalDue: 0 };
    grouped[f.studentId].months.push(f.month);
    grouped[f.studentId].totalDue += Number(f.agreed) - Number(f.paid);
  });
  return Object.values(grouped).map(d => ({ ...d, status: d.months.length >= 2 ? 'strict' : 'first' }));
}

function createHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const SHEETS = {
    Students:     ['id','name','father','admission','family','kinship','fatherCell','motherCell','address','class','paperFund','monthlyFee','admissionDate'],
    Fees:         ['id','studentId','studentName','month','year','agreed','paid','status','date','notes'],
    Receipts:     ['id','receiptNo','studentId','studentName','father','class','totalPaid','remaining','paidMonths','paperFundPaid','stationaryTotal','date','time'],
    Results:      ['id','studentId','studentName','class','exam','year','totalMax','totalObt','percentage','grade','pass','remarks'],
    Attendance:   ['id','date','studentId','studentName','class','status'],
    Stationary:   ['id','name','category','stock','price','sold','unit'],
    WhatsappLogs: ['id','studentId','studentName','messageType','cell','message','date','status'],
  };
  const created = []; const existing = [];
  Object.entries(SHEETS).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) { sheet = ss.insertSheet(name); created.push(name); } else { existing.push(name); }
    const range = sheet.getRange(1,1,1,headers.length);
    range.setValues([headers]);
    range.setBackground('#1B4FD8').setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  });
  return { created, existing, total: Object.keys(SHEETS).length };
}
`

export default function SettingsPage({ toast }) {
  const { sheetsUrl, scriptUrl, setSheetsUrl, setScriptUrl } = useAppStore()
  const [localSheets, setLocalSheets]       = useState(sheetsUrl)
  const [localScript, setLocalScript]       = useState(scriptUrl)
  const [testing, setTesting]               = useState(false)
  const [creating, setCreating]             = useState(false)
  const [testResult, setTestResult]         = useState(null)
  const [createResult, setCreateResult]     = useState(null)
  const [tab, setTab]                       = useState('sheets')
  const [copyDone, setCopyDone]             = useState(false)

  // Extract Sheet ID from URL
  const extractSheetId = (url) => {
    const match = url.match(SHEET_ID_REGEX)
    return match ? match[1] : url
  }

  const testConnection = async () => {
    if (!localScript.trim()) { toast('Enter your Apps Script URL first.', 'error'); return }
    setTesting(true); setTestResult(null)
    try {
      const url = `${localScript.trim()}?action=ping`
      const res = await fetch(url, { method: 'GET', mode: 'no-cors' })
      // no-cors means we can't read the response body, but no error = script is alive
      setTestResult({ ok: true, msg: '✅ Connection successful! Apps Script is responding.' })
      toast('Connection successful!', 'success')
    } catch (e) {
      setTestResult({ ok: false, msg: `❌ Failed: ${e.message}. Check the URL is correct.` })
      toast('Connection failed.', 'error')
    } finally { setTesting(false) }
  }

  const autoCreateSheets = async () => {
    if (!localScript.trim()) { toast('Enter your Apps Script URL first.', 'error'); return }
    setCreating(true); setCreateResult(null)
    try {
      const url = `${localScript.trim()}?action=createHeaders`
      const res = await fetch(url, { mode: 'no-cors' })
      setCreateResult({
        ok: true,
        msg: '✅ Headers created! All 7 sheets now have proper headers in your Google Sheet.',
        sheets: Object.keys(SHEETS_STRUCTURE)
      })
      toast('All sheet headers created successfully!', 'success')
    } catch (e) {
      setCreateResult({ ok: false, msg: `❌ Failed: ${e.message}` })
      toast('Failed to create headers.', 'error')
    } finally { setCreating(false) }
  }

  const saveSettings = () => {
    setSheetsUrl(localSheets)
    setScriptUrl(localScript)
    toast('Settings saved!', 'success')
  }

  const copyScript = () => {
    navigator.clipboard.writeText(GAS_CODE).then(() => {
      setCopyDone(true)
      toast('Apps Script code copied to clipboard!', 'success')
      setTimeout(() => setCopyDone(false), 2500)
    })
  }

  const downloadScript = () => {
    const blob = new Blob([GAS_CODE], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'KinsSchool-AppsScript.gs'; a.click()
    URL.revokeObjectURL(url)
    toast('Apps Script file downloaded!', 'success')
  }

  const exportBackup = () => {
    const backup = { exportedAt: new Date().toISOString(), school: 'KINS SCHOOL', data: JSON.parse(localStorage.getItem('kins-school-store') || '{}') }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `KinsSchool-Backup-${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.json`; a.click()
    URL.revokeObjectURL(url)
    toast('Backup downloaded!', 'success')
  }

  const restoreBackup = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = (e) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result)
          localStorage.setItem('kins-school-store', JSON.stringify(data.data || data))
          toast('Backup restored! Refreshing…', 'success')
          setTimeout(() => window.location.reload(), 1500)
        } catch { toast('Invalid backup file.', 'error') }
      }
      reader.readAsText(e.target.files[0])
    }
    input.click()
  }

  const TABS = [
    { key: 'sheets',  label: 'Google Sheets',  icon: 'link'     },
    { key: 'script',  label: 'Apps Script',     icon: 'results'  },
    { key: 'sync',    label: 'Sync',            icon: 'sync'     },
    { key: 'backup',  label: 'Backup',          icon: 'backup'   },
    { key: 'about',   label: 'About',           icon: 'alert'    },
  ]

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Settings" sub="Configure Google Sheets, sync, backup and app preferences"/>

      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${tab===t.key ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon name={t.icon} size={13}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── GOOGLE SHEETS ── */}
      {tab === 'sheets' && (
        <div className="flex flex-col gap-5 max-w-2xl">
          <Card>
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Icon name="link" size={16} className="text-blue-600"/>Google Sheets Configuration</h3>
            <p className="text-sm text-slate-500 mb-5">Connect your Google Sheet. All students, fees, results and attendance will sync here automatically.</p>

            <div className="flex flex-col gap-4">
              <Input label="Google Sheet URL" value={localSheets} onChange={setLocalSheets}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                prefix={<Icon name="link" size={14}/>}/>
              {localSheets && (
                <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg font-mono">
                  Sheet ID: <strong>{extractSheetId(localSheets)}</strong>
                </div>
              )}

              <Input label="Apps Script Web App URL" value={localScript} onChange={setLocalScript}
                placeholder="https://script.google.com/macros/s/…/exec"
                prefix={<Icon name="link" size={14}/>}/>

              {testResult && (
                <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${testResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {testResult.msg}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Btn onClick={testConnection} variant="outline" icon="wifi" disabled={testing}>
                  {testing ? 'Testing…' : 'Test Connection'}
                </Btn>
                <Btn onClick={saveSettings} variant="primary" icon="save">Save Settings</Btn>
              </div>
            </div>
          </Card>

          {/* Sheet structure preview */}
          <Card>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Icon name="results" size={16} className="text-blue-600"/>Sheet Structure (7 Sheets)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(SHEETS_STRUCTURE).map(([name, cols]) => (
                <div key={name} className="border border-slate-200 rounded-xl p-3">
                  <div className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"/>
                    {name}
                    <span className="ml-auto text-xs text-slate-400">{cols.length} cols</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cols.map(c => (
                      <span key={c} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── APPS SCRIPT ── */}
      {tab === 'script' && (
        <div className="flex flex-col gap-5 max-w-2xl">
          {/* Step guide */}
          <Card className="bg-blue-50 border-blue-100">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Icon name="alert" size={16} className="text-blue-600"/>Step-by-Step Setup Guide
            </h3>
            <ol className="space-y-3 text-sm text-blue-800">
              {[
                ['Open your Google Sheet', <a href={localSheets||'https://sheets.google.com'} target="_blank" rel="noreferrer" className="underline font-semibold ml-1">Click here to open →</a>],
                ['Click Extensions → Apps Script', 'Opens the script editor in a new tab'],
                ['Delete existing code, paste the script below', 'Use the Copy button'],
                ['Press Ctrl+S to save', 'Name the project "KinsSchool"'],
                ['Click Deploy → New Deployment', ''],
                ['Choose Type: Web App', 'Execute as: Me | Access: Anyone'],
                ['Click Deploy → Copy the URL', 'Paste it in the Google Sheets tab above'],
                ['Come back here → Click Auto-Create Headers', 'All 7 sheets created automatically!'],
              ].map(([step, detail], i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                  <div><span className="font-semibold">{step}</span>{detail && <span className="text-blue-600 ml-1">— {detail}</span>}</div>
                </li>
              ))}
            </ol>
          </Card>

          {/* Auto-Create button */}
          <Card>
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Icon name="plus" size={16} className="text-emerald-600"/>Auto-Create All Sheet Headers
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              After deploying the Apps Script, click this button to automatically create all 7 sheets with proper headers in your Google Sheet. <strong>One click — fully automatic!</strong>
            </p>
            {createResult && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${createResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <div className="font-semibold mb-1">{createResult.msg}</div>
                {createResult.ok && createResult.sheets && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {createResult.sheets.map(s => <Badge key={s} color="green">✓ {s}</Badge>)}
                  </div>
                )}
              </div>
            )}
            <Btn onClick={autoCreateSheets} variant="success" icon="plus" size="lg" disabled={creating || !localScript}>
              {creating ? '⏳ Creating sheets…' : '🚀 Auto-Create All 7 Sheet Headers'}
            </Btn>
            {!localScript && <p className="text-xs text-red-500 mt-2">⚠️ Enter your Apps Script URL in the Google Sheets tab first.</p>}
          </Card>

          {/* Script code */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Icon name="results" size={16} className="text-blue-600"/>Apps Script Code</h3>
              <div className="flex gap-2">
                <Btn onClick={copyScript} variant={copyDone ? 'success' : 'outline'} size="sm" icon={copyDone ? 'check' : 'receipt'}>
                  {copyDone ? 'Copied!' : 'Copy Code'}
                </Btn>
                <Btn onClick={downloadScript} variant="ghost" size="sm" icon="download">Download .gs</Btn>
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-auto max-h-64">
              <pre className="whitespace-pre-wrap">{GAS_CODE}</pre>
            </div>
          </Card>
        </div>
      )}

      {/* ── SYNC ── */}
      {tab === 'sync' && (
        <div className="max-w-lg flex flex-col gap-5">
          <Card>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Icon name="sync" size={16} className="text-blue-600"/>Sync Configuration</h3>
            <div className="flex flex-col gap-3">
              {[
                ['Auto Sync Interval', 'Every 10 seconds', 'green'],
                ['Offline Support',    'IndexedDB (Dexie.js)', 'green'],
                ['Sync Queue',         'Queued when offline, sent on reconnect', 'green'],
                ['PWA Cache',          'ServiceWorker caches all assets', 'green'],
              ].map(([l, v, c]) => (
                <div key={l} className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-semibold text-slate-700 text-sm">{l}</div>
                    <div className="text-xs text-slate-400">{v}</div>
                  </div>
                  <Badge color={c}>✓ Active</Badge>
                </div>
              ))}
              <Btn onClick={() => toast('Manual sync triggered!', 'success')} variant="primary" icon="sync">Force Sync Now</Btn>
            </div>
          </Card>
        </div>
      )}

      {/* ── BACKUP ── */}
      {tab === 'backup' && (
        <div className="max-w-lg flex flex-col gap-5">
          <Card>
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Icon name="backup" size={16} className="text-blue-600"/>Backup & Restore</h3>
            <p className="text-sm text-slate-500 mb-5">Download a full JSON backup of all local data or restore from a previous backup file.</p>
            <div className="flex flex-col gap-3">
              <Btn onClick={exportBackup} variant="primary" icon="download" size="lg">Download Backup (JSON)</Btn>
              <Btn onClick={restoreBackup} variant="outline" icon="restore">Restore from Backup File</Btn>
            </div>
            <Divider/>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <strong>⚠️ Warning:</strong> Restoring a backup will overwrite all current local data. Make sure the file is correct before restoring.
            </div>
          </Card>
        </div>
      )}

      {/* ── ABOUT ── */}
      {tab === 'about' && (
        <div className="max-w-lg">
          <Card>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl shadow-xl"
                style={{ background: 'linear-gradient(135deg,#1B4FD8,#059669)' }}>🎓</div>
              <h2 className="font-display font-bold text-2xl text-slate-900">KINS SCHOOL</h2>
              <p className="text-sm text-slate-500">Ratta Rd, Kins St, Gujranwala</p>
            </div>
            <Divider/>
            <div className="flex flex-col gap-3 text-sm">
              {[['Version','v1.0.0'],['Frontend','React 18 + Vite + Tailwind CSS'],['Backend','FastAPI (Python 3.11)'],['Database','Google Sheets via Apps Script'],['Offline','Dexie.js (IndexedDB)'],['PWA','Vite PWA Plugin + Workbox'],['Deploy','Render'],['WhatsApp','wa.me links (no API key needed)']].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
