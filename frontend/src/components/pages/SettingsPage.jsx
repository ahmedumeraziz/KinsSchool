import React, { useState, useEffect } from 'react'
import { Card, Btn, Input, Badge, Icon, PageHeader, Divider } from '../common/UI'
import { useAppStore } from '../../store/appStore'

const API_URL = import.meta.env.VITE_API_URL || ''

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
}`

export default function SettingsPage({ toast }) {
  const { sheetsUrl, scriptUrl, setSheetsUrl, setScriptUrl } = useAppStore()
  const [tab, setTab]                   = useState('connection')
  const [backendInfo, setBackendInfo]   = useState(null)
  const [loadingInfo, setLoadingInfo]   = useState(false)
  const [testing, setTesting]           = useState(false)
  const [creating, setCreating]         = useState(false)
  const [testResult, setTestResult]     = useState(null)
  const [createResult, setCreateResult] = useState(null)
  const [copyDone, setCopyDone]         = useState(false)
  const [manualScript, setManualScript] = useState(scriptUrl || '')

  // On mount — fetch backend info to show stored env URLs
  useEffect(() => {
    const fetchInfo = async () => {
      if (!API_URL) return
      setLoadingInfo(true)
      try {
        const token = useAppStore.getState().token
        const res   = await fetch(`${API_URL}/api/settings/info`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setBackendInfo(data)
          // Auto-populate local state if backend has URLs
          if (data.sheetsUrl) setSheetsUrl(data.sheetsUrl)
          if (data.scriptUrl) setScriptUrl(data.scriptUrl)
          if (data.scriptUrl) setManualScript(data.scriptUrl)
        }
      } catch { /* backend offline */ }
      finally { setLoadingInfo(false) }
    }
    fetchInfo()
  }, [])

  const testConnection = async () => {
    const url = backendInfo?.scriptUrl || manualScript
    if (!url) { toast('No Apps Script URL found.', 'error'); return }
    setTesting(true); setTestResult(null)
    try {
      const token = useAppStore.getState().token
      const res   = await fetch(`${API_URL}/api/settings/test-sheets`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ url }),
      })
      const data = await res.json()
      setTestResult(data)
      toast(data.ok ? 'Connection successful!' : 'Connection failed.', data.ok ? 'success' : 'error')
    } catch (e) {
      setTestResult({ ok: false, message: `Error: ${e.message}` })
      toast('Connection failed.', 'error')
    } finally { setTesting(false) }
  }

  const autoCreateSheets = async () => {
    const url = backendInfo?.scriptUrl || manualScript
    if (!url) { toast('No Apps Script URL found.', 'error'); return }
    setCreating(true); setCreateResult(null)
    try {
      const token = useAppStore.getState().token
      const res   = await fetch(`${API_URL}/api/settings/create-headers`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({}),
      })
      const data = await res.json()
      if (data.ok) {
        setCreateResult({ ok: true, msg: '✅ All 7 sheets created with headers!', sheets: Object.keys(SHEETS_STRUCTURE) })
        toast('All sheet headers created!', 'success')
      } else {
        setCreateResult({ ok: false, msg: `❌ ${data.error || 'Failed'}` })
        toast('Failed to create headers.', 'error')
      }
    } catch (e) {
      setCreateResult({ ok: false, msg: `❌ ${e.message}` })
      toast('Error connecting to backend.', 'error')
    } finally { setCreating(false) }
  }

  const manualSync = async () => {
    try {
      const token = useAppStore.getState().token
      const res   = await fetch(`${API_URL}/api/settings/sync`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      toast(`Synced — Students: ${data.synced?.students || 0}, Fees: ${data.synced?.fees || 0}`, 'success')
    } catch { toast('Sync failed. Backend may be offline.', 'error') }
  }

  const copyScript = () => {
    navigator.clipboard.writeText(GAS_CODE).then(() => {
      setCopyDone(true)
      toast('Apps Script copied to clipboard!', 'success')
      setTimeout(() => setCopyDone(false), 2500)
    })
  }

  const downloadScript = () => {
    const blob = new Blob([GAS_CODE], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'KinsSchool-AppsScript.gs'; a.click()
    URL.revokeObjectURL(url)
    toast('Apps Script downloaded!', 'success')
  }

  const exportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      school:     'KINS SCHOOL',
      data:       JSON.parse(localStorage.getItem('kins-school-store') || '{}'),
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `KinsSchool-Backup-${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.json`
    a.click()
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
    { key: 'connection', label: 'Connection',    icon: 'wifi'     },
    { key: 'script',     label: 'Apps Script',   icon: 'results'  },
    { key: 'backup',     label: 'Backup',         icon: 'backup'   },
    { key: 'about',      label: 'About',          icon: 'alert'    },
  ]

  const activeScript = backendInfo?.scriptUrl || manualScript || ''
  const activeSheet  = backendInfo?.sheetsUrl  || sheetsUrl    || ''

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Settings" sub="Google Sheets connection, Apps Script setup and backup" />

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t.key ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon name={t.icon} size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* ── CONNECTION TAB ── */}
      {tab === 'connection' && (
        <div className="flex flex-col gap-5 max-w-2xl">

          {/* Backend connection status */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Icon name="wifi" size={16} className="text-blue-600" />
                Backend API Status
              </h3>
              {loadingInfo
                ? <Badge color="gray">Checking…</Badge>
                : backendInfo
                  ? <Badge color="green">✓ Connected</Badge>
                  : <Badge color="red">Not Connected</Badge>
              }
            </div>

            <div className="flex flex-col gap-3">
              {/* Backend URL */}
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Backend API URL</div>
                <div className="font-mono-num text-sm text-slate-800 break-all">
                  {API_URL || <span className="text-red-400">Not set — add VITE_API_URL in Render</span>}
                </div>
                {API_URL && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-emerald-600 font-semibold">API is reachable</span>
                  </div>
                )}
              </div>

              {/* Google Sheet URL from backend env */}
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Google Sheet URL
                  <span className="ml-2 text-blue-500 font-normal">(from Render environment)</span>
                </div>
                {loadingInfo
                  ? <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                  : activeSheet
                    ? <a href={activeSheet} target="_blank" rel="noreferrer"
                        className="font-mono-num text-xs text-blue-600 hover:underline break-all">
                        {activeSheet}
                      </a>
                    : <span className="text-xs text-amber-600">⚠️ GOOGLE_SHEET_ID not set in Render environment variables</span>
                }
              </div>

              {/* Apps Script URL from backend env */}
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Apps Script URL
                  <span className="ml-2 text-blue-500 font-normal">(from Render environment)</span>
                </div>
                {loadingInfo
                  ? <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                  : activeScript
                    ? <span className="font-mono-num text-xs text-slate-700 break-all">{activeScript}</span>
                    : <span className="text-xs text-amber-600">⚠️ GOOGLE_SCRIPT_URL not set in Render environment variables</span>
                }
              </div>

              {/* Test + Sync buttons */}
              {testResult && (
                <div className={`px-4 py-3 rounded-xl text-sm border ${testResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {testResult.message}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Btn onClick={testConnection} variant="outline" icon="wifi" disabled={testing}>
                  {testing ? 'Testing…' : 'Test Connection'}
                </Btn>
                <Btn onClick={manualSync} variant="primary" icon="sync">
                  Manual Sync Now
                </Btn>
              </div>
            </div>
          </Card>

          {/* How to set env vars */}
          <Card className="bg-amber-50 border-amber-100">
            <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
              <Icon name="alert" size={15} className="text-amber-600" />
              How to set URLs in Render
            </h3>
            <ol className="space-y-2 text-sm text-amber-800">
              {[
                'Go to render.com → your backend service (kinsschool)',
                'Click Environment → Add Environment Variable',
                'Add GOOGLE_SHEET_ID = (your sheet ID from the URL)',
                'Add GOOGLE_SCRIPT_URL = (your deployed Apps Script URL)',
                'Click Save Changes — Render will redeploy automatically',
                'Come back here — URLs will appear above automatically',
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </Card>

          {/* Sheet structure */}
          <Card>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Icon name="results" size={16} className="text-blue-600" />
              Sheet Structure (7 sheets)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(SHEETS_STRUCTURE).map(([name, cols]) => (
                <div key={name} className="border border-slate-200 rounded-xl p-3">
                  <div className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />{name}
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

      {/* ── APPS SCRIPT TAB ── */}
      {tab === 'script' && (
        <div className="flex flex-col gap-5 max-w-2xl">
          {/* Step guide */}
          <Card className="bg-blue-50 border-blue-100">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Icon name="alert" size={16} className="text-blue-600" />Step-by-Step Setup
            </h3>
            <ol className="space-y-2 text-sm text-blue-800">
              {[
                ['Open your Google Sheet', activeSheet ? <a href={activeSheet} target="_blank" rel="noreferrer" className="underline font-semibold ml-1">Click here →</a> : ''],
                ['Click Extensions → Apps Script', ''],
                ['Delete existing code, paste script below', ''],
                ['Press Ctrl+S to save', ''],
                ['Deploy → New Deployment → Web App', ''],
                ['Execute as: Me | Who has access: Anyone', ''],
                ['Copy the Web App URL → paste in Render env as GOOGLE_SCRIPT_URL', ''],
                ['Come back → Connection tab → Auto-Create Headers', ''],
              ].map(([step, detail], i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                  <div><span className="font-semibold">{step}</span>{detail && <span className="ml-1">{detail}</span>}</div>
                </li>
              ))}
            </ol>
          </Card>

          {/* Auto-create */}
          <Card>
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Icon name="plus" size={16} className="text-emerald-600" />Auto-Create All Sheet Headers
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Once Apps Script is deployed, click below — all 7 sheets created automatically with proper column headers, blue styling, and frozen rows.
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
            <Btn onClick={autoCreateSheets} variant="success" icon="plus" size="lg" disabled={creating}>
              {creating ? '⏳ Creating sheets…' : '🚀 Auto-Create All 7 Sheet Headers'}
            </Btn>
          </Card>

          {/* Script code */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">Apps Script Code</h3>
              <div className="flex gap-2">
                <Btn onClick={copyScript} variant={copyDone ? 'success' : 'outline'} size="sm" icon={copyDone ? 'check' : 'receipt'}>
                  {copyDone ? 'Copied!' : 'Copy'}
                </Btn>
                <Btn onClick={downloadScript} variant="ghost" size="sm" icon="download">.gs</Btn>
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-auto max-h-72">
              <pre className="whitespace-pre-wrap">{GAS_CODE}</pre>
            </div>
          </Card>
        </div>
      )}

      {/* ── BACKUP TAB ── */}
      {tab === 'backup' && (
        <div className="max-w-lg flex flex-col gap-5">
          <Card>
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Icon name="backup" size={16} className="text-blue-600" />Backup & Restore
            </h3>
            <p className="text-sm text-slate-500 mb-5">Download all local data as JSON or restore from a previous backup.</p>
            <div className="flex flex-col gap-3">
              <Btn onClick={exportBackup} variant="primary" icon="download" size="lg">Download Backup (JSON)</Btn>
              <Btn onClick={restoreBackup} variant="outline" icon="restore">Restore from Backup File</Btn>
            </div>
            <Divider />
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <strong>⚠️ Warning:</strong> Restoring overwrites all current local data.
            </div>
          </Card>
        </div>
      )}

      {/* ── ABOUT TAB ── */}
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
                ['Version',         'v1.0.0'],
                ['Frontend',        'React 18 + Vite + Tailwind CSS'],
                ['Backend',         'FastAPI (Python)'],
                ['Database',        'Google Sheets via Apps Script'],
                ['Offline Storage', 'Dexie.js (IndexedDB)'],
                ['Deploy',          'Render'],
                ['WhatsApp',        'wa.me links (no API key)'],
                ['Backend URL',     API_URL || 'Not configured'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-700 text-right text-xs break-all max-w-48">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
