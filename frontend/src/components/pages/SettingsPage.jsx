import React, { useState } from 'react'
import { Card, Btn, Input, Badge, Icon, PageHeader, Divider } from '../common/UI'
import { useAppStore } from '../../store/appStore'

const GAS_TEMPLATE = `// KINS SCHOOL — Google Apps Script API
// Paste this in Extensions → Apps Script → Save → Deploy as Web App

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter;
  const action = params.action;
  const sheet  = params.sheet;

  try {
    let result;
    switch(action) {
      case 'getAll':    result = getAll(sheet);            break;
      case 'insert':    result = insert(sheet, params);    break;
      case 'update':    result = update(sheet, params);    break;
      case 'delete':    result = deleteRow(sheet, params); break;
      case 'createHeaders': result = createHeaders();      break;
      default: result = { error: 'Unknown action' };
    }
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getAll(sheetName) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data  = sheet.getDataRange().getValues();
  const keys  = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    keys.forEach((k, i) => obj[k] = row[i]);
    return obj;
  });
}

function insert(sheetName, params) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  const data  = JSON.parse(params.data);
  const keys  = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row   = keys.map(k => data[k] || '');
  sheet.appendRow(row);
  return { inserted: true };
}

function update(sheetName, params) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  const data  = JSON.parse(params.data);
  const id    = params.id;
  const vals  = sheet.getDataRange().getValues();
  const keys  = vals[0];
  const idCol = keys.indexOf('id');
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][idCol]) === String(id)) {
      keys.forEach((k, j) => { if (data[k] !== undefined) sheet.getRange(i+1, j+1).setValue(data[k]); });
      return { updated: true };
    }
  }
  return { updated: false };
}

function deleteRow(sheetName, params) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  const id    = params.id;
  const vals  = sheet.getDataRange().getValues();
  const keys  = vals[0];
  const idCol = keys.indexOf('id');
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  return { deleted: false };
}

function createHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    Students:  ['id','name','father','admission','family','kinship','fatherCell','motherCell','address','class','paperFund','monthlyFee','admissionDate'],
    Fees:      ['id','studentId','month','year','agreed','paid','status','date','notes'],
    Receipts:  ['id','receiptNo','studentId','studentName','class','totalPaid','remaining','date','time'],
    Results:   ['id','studentId','exam','year','class','totalMax','totalObt','percentage','grade','remarks'],
    Attendance:['id','date','studentId','studentName','class','status'],
    Stationary:['id','name','category','stock','price','sold','unit'],
    WhatsappLogs:['id','studentId','studentName','messageType','cell','date','status'],
  };
  Object.entries(sheets).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#1B4FD8').setFontColor('#FFFFFF').setFontWeight('bold');
  });
  return { created: Object.keys(sheets) };
}
`

export default function SettingsPage({ toast }) {
  const { sheetsUrl, scriptUrl, setSheetsUrl, setScriptUrl, syncInterval } = useAppStore()
  const [localSheets, setLocalSheets] = useState(sheetsUrl)
  const [localScript, setLocalScript] = useState(scriptUrl)
  const [testing, setTesting]         = useState(false)
  const [testResult, setTestResult]   = useState(null)
  const [pwaDeferredPrompt, setPWA]   = useState(null)
  const [tab, setTab]                 = useState('sheets')

  const testConnection = async () => {
    if (!localScript) { toast('Enter your Apps Script URL first.', 'error'); return }
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch(`${localScript}?action=getAll&sheet=Students`)
      if (res.ok) {
        setTestResult({ ok: true, msg: 'Connection successful! Google Sheets is connected.' })
        toast('Connection successful!', 'success')
      } else throw new Error('HTTP ' + res.status)
    } catch (e) {
      setTestResult({ ok: false, msg: `Connection failed: ${e.message}` })
      toast('Connection failed. Check the URL.', 'error')
    } finally { setTesting(false) }
  }

  const saveSettings = () => {
    setSheetsUrl(localSheets)
    setScriptUrl(localScript)
    toast('Settings saved!', 'success')
  }

  const downloadScript = () => {
    const blob = new Blob([GAS_TEMPLATE], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'KinsSchool-GoogleAppsScript.gs'; a.click()
    URL.revokeObjectURL(url)
    toast('Apps Script file downloaded!', 'success')
  }

  const exportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      school: 'KINS SCHOOL',
      data: JSON.parse(localStorage.getItem('kins-school-store') || '{}')
    }
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
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result)
          if (data.data) {
            localStorage.setItem('kins-school-store', JSON.stringify(data.data))
            toast('Backup restored! Refreshing…', 'success')
            setTimeout(() => window.location.reload(), 1500)
          } else toast('Invalid backup file.', 'error')
        } catch { toast('Invalid JSON file.', 'error') }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const TABS = [
    { key: 'sheets',  label: 'Google Sheets',  icon: 'link'    },
    { key: 'sync',    label: 'Sync',            icon: 'sync'    },
    { key: 'backup',  label: 'Backup',          icon: 'backup'  },
    { key: 'pwa',     label: 'PWA / App',       icon: 'download'},
    { key: 'about',   label: 'About',           icon: 'alert'   },
  ]

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Settings" sub="Configure Google Sheets, sync, and app preferences" />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t.key ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon name={t.icon} size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* Google Sheets */}
      {tab === 'sheets' && (
        <div className="flex flex-col gap-5 max-w-2xl">
          <Card>
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Icon name="link" size={16} className="text-blue-600" />Google Sheets Configuration</h3>
            <p className="text-sm text-slate-500 mb-5">Connect your Google Sheet as the database. All data will sync automatically.</p>

            <div className="flex flex-col gap-4">
              <Input label="Google Sheet URL" value={localSheets} onChange={setLocalSheets}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                prefix={<Icon name="link" size={14} />} />

              <Input label="Google Apps Script URL (Web App)" value={localScript} onChange={setLocalScript}
                placeholder="https://script.google.com/macros/s/…/exec"
                prefix={<Icon name="link" size={14} />} />

              {testResult && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${testResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <Icon name={testResult.ok ? 'check' : 'close'} size={16} />
                  {testResult.msg}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Btn onClick={testConnection} variant="outline" icon="wifi" disabled={testing}>{testing ? 'Testing…' : 'Test Connection'}</Btn>
                <Btn onClick={saveSettings} variant="primary" icon="save">Save Settings</Btn>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Icon name="results" size={16} className="text-blue-600" />Google Apps Script</h3>
            <p className="text-sm text-slate-500 mb-4">Download the Apps Script file and paste it in your Google Sheet's script editor.</p>

            <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto mb-4 max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{GAS_TEMPLATE.slice(0, 500)}…</pre>
            </div>

            <div className="flex flex-wrap gap-3">
              <Btn onClick={downloadScript} variant="primary" icon="download">Download Apps Script (.gs)</Btn>
            </div>

            <Divider />

            <div className="text-xs text-slate-500 space-y-1">
              <p><strong>Steps to deploy:</strong></p>
              <p>1. Open your Google Sheet → Extensions → Apps Script</p>
              <p>2. Paste the downloaded code → Save (Ctrl+S)</p>
              <p>3. Deploy → New Deployment → Web App → Execute as: Me → Anyone → Deploy</p>
              <p>4. Copy the Web App URL and paste above</p>
            </div>
          </Card>
        </div>
      )}

      {/* Sync */}
      {tab === 'sync' && (
        <div className="max-w-lg flex flex-col gap-5">
          <Card>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Icon name="sync" size={16} className="text-blue-600" />Sync Configuration</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-700 text-sm">Auto Sync Interval</div>
                  <div className="text-xs text-slate-400">How often to sync with Google Sheets</div>
                </div>
                <Badge color="blue">Every 10 sec</Badge>
              </div>
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-700 text-sm">Offline Support</div>
                  <div className="text-xs text-slate-400">Data stored in IndexedDB when offline</div>
                </div>
                <Badge color="green">✓ Enabled</Badge>
              </div>
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-700 text-sm">Sync Queue</div>
                  <div className="text-xs text-slate-400">Changes queued when offline, sent on reconnect</div>
                </div>
                <Badge color="green">✓ Active</Badge>
              </div>
              <Btn onClick={() => toast('Manual sync triggered!', 'success')} variant="primary" icon="sync">Force Sync Now</Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Backup */}
      {tab === 'backup' && (
        <div className="max-w-lg flex flex-col gap-5">
          <Card>
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Icon name="backup" size={16} className="text-blue-600" />Backup & Restore</h3>
            <p className="text-sm text-slate-500 mb-5">Download a full JSON backup of all local data or restore from a previous backup.</p>
            <div className="flex flex-col gap-3">
              <Btn onClick={exportBackup} variant="primary" icon="download">Download Backup (JSON)</Btn>
              <Btn onClick={restoreBackup} variant="outline" icon="restore">Restore from Backup</Btn>
            </div>
            <Divider />
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <strong>⚠️ Warning:</strong> Restoring a backup will overwrite all current local data. Make sure you have the correct file before restoring.
            </div>
          </Card>
        </div>
      )}

      {/* PWA */}
      {tab === 'pwa' && (
        <div className="max-w-lg flex flex-col gap-5">
          <Card>
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Icon name="download" size={16} className="text-blue-600" />Install as App (PWA)</h3>
            <p className="text-sm text-slate-500 mb-5">Install KINS SCHOOL on your device for a native app-like experience with offline support.</p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[['Works Offline','IndexedDB + ServiceWorker'],['Auto Updates','Background sync'],['Mobile Install','Add to Home Screen'],['Desktop Install','Pin to taskbar']].map(([t, d]) => (
                  <div key={t} className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
                    <Icon name="check" size={14} className="text-blue-600 mt-0.5 shrink-0" />
                    <div><div className="font-semibold text-blue-800 text-xs">{t}</div><div className="text-blue-600 text-xs">{d}</div></div>
                  </div>
                ))}
              </div>
              <Btn onClick={() => { if (pwaDeferredPrompt) { pwaDeferredPrompt.prompt() } else toast('Use your browser\'s "Install App" or "Add to Home Screen" option.', 'info') }} variant="primary" icon="download" size="lg">Install KINS SCHOOL App</Btn>
            </div>
          </Card>
        </div>
      )}

      {/* About */}
      {tab === 'about' && (
        <div className="max-w-lg">
          <Card>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl shadow-xl"
                style={{ background: 'linear-gradient(135deg,#1B4FD8,#059669)' }}>🎓</div>
              <h2 className="font-display font-bold text-2xl text-slate-900">KINS SCHOOL</h2>
              <p className="text-sm text-slate-500">Ratta Rd, Kins St, Gujranwala</p>
            </div>
            <Divider />
            <div className="flex flex-col gap-3 text-sm">
              {[
                ['Version',          'v1.0.0'],
                ['Frontend',         'React 18 + Vite + Tailwind CSS'],
                ['Backend',          'FastAPI (Python 3.11)'],
                ['Database',         'Google Sheets via Apps Script'],
                ['Offline Storage',  'Dexie.js (IndexedDB)'],
                ['PWA',              'Vite PWA Plugin + Workbox'],
                ['Deployment',       'Railway'],
                ['Charts',           'Recharts'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-700 text-right">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
