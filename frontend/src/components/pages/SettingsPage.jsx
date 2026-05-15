import React, { useState, useEffect } from 'react'
import { Card, Btn, Badge, Icon, PageHeader, Divider } from '../common/UI'
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
 * Steps: Extensions → Apps Script → Paste → Save → Deploy as Web App
 * Execute as: Me | Who has access: Anyone
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
  const [tab, setTab]                   = useState('connection')
  const [backendInfo, setBackendInfo]   = useState(null)
  const [loading, setLoading]           = useState(false)
  const [testing, setTesting]           = useState(false)
  const [creating, setCreating]         = useState(false)
  const [syncing, setSyncing]           = useState(false)
  const [testResult, setTestResult]     = useState(null)
  const [createResult, setCreateResult] = useState(null)
  const [syncResult, setSyncResult]     = useState(null)
  const [copyDone, setCopyDone]         = useState(false)

  const getToken = () => useAppStore.getState().token

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  })

  // Fetch backend info on mount — ALWAYS from backend, never from stale localStorage
  useEffect(() => {
    if (!API_URL) return
    // Clear any old/stale URLs from localStorage immediately
    useAppStore.getState().setSheetsUrl('')
    useAppStore.getState().setScriptUrl('')
    setLoading(true)
    fetch(`${API_URL}/api/settings/info`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setBackendInfo(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const testConnection = async () => {
    setTesting(true); setTestResult(null)
    try {
      const res  = await fetch(`${API_URL}/api/settings/test-sheets`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({})
      })
      const data = await res.json()
      setTestResult(data)
      toast(data.ok ? '✅ Connected!' : '❌ ' + data.message, data.ok ? 'success' : 'error')
    } catch (e) {
      setTestResult({ ok: false, message: `Error: ${e.message}` })
      toast('Connection failed.', 'error')
    } finally { setTesting(false) }
  }

  const generateHeaders = async () => {
    setCreating(true); setCreateResult(null)
    try {
      const res  = await fetch(`${API_URL}/api/settings/create-headers`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({})
      })
      const data = await res.json()
      if (data.ok) {
        setCreateResult({
          ok:       true,
          created:  data.created  || [],
          existing: data.existing || [],
          msg:      data.message  || 'Headers created!',
        })
        toast('✅ All sheet headers generated!', 'success')
      } else {
        setCreateResult({ ok: false, msg: data.message || data.detail || 'Failed' })
        toast('❌ ' + (data.message || data.detail || 'Failed'), 'error')
      }
    } catch (e) {
      setCreateResult({ ok: false, msg: `Error: ${e.message}` })
      toast('Error: ' + e.message, 'error')
    } finally { setCreating(false) }
  }

  const manualSync = async () => {
    setSyncing(true); setSyncResult(null)
    try {
      const res  = await fetch(`${API_URL}/api/settings/sync`, {
        method: 'POST', headers: authHeaders()
      })
      const data = await res.json()
      setSyncResult(data)
      if (data.ok) {
        toast(`✅ Synced — Students: ${data.synced?.students}, Fees: ${data.synced?.fees}`, 'success')
      } else {
        toast('❌ ' + (data.message || 'Sync failed'), 'error')
      }
    } catch (e) {
      setSyncResult({ ok: false, message: e.message })
      toast('Sync error: ' + e.message, 'error')
    } finally { setSyncing(false) }
  }

  const copyScript = () => {
    navigator.clipboard.writeText(GAS_CODE).then(() => {
      setCopyDone(true)
      toast('Apps Script copied!', 'success')
      setTimeout(() => setCopyDone(false), 2500)
    })
  }

  const downloadScript = () => {
    const blob = new Blob([GAS_CODE], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'KinsSchool-AppsScript.gs'; a.click()
    URL.revokeObjectURL(url)
    toast('Script downloaded!', 'success')
  }

  const exportBackup = () => {
    const data = JSON.parse(localStorage.getItem('kins-school-store') || '{}')
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' })
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
          const parsed = JSON.parse(ev.target.result)
          localStorage.setItem('kins-school-store', JSON.stringify(parsed.data || parsed))
          toast('Restored! Refreshing…', 'success')
          setTimeout(() => window.location.reload(), 1200)
        } catch { toast('Invalid file.', 'error') }
      }
      reader.readAsText(e.target.files[0])
    }
    input.click()
  }

  const TABS = [
    { key: 'connection', label: 'Connection',  icon: 'wifi'    },
    { key: 'script',     label: 'Apps Script', icon: 'results' },
    { key: 'backup',     label: 'Backup',      icon: 'backup'  },
    { key: 'about',      label: 'About',       icon: 'alert'   },
  ]

  // Helpers for display
  const sheetUrl   = backendInfo?.sheetsUrl  || ''
  const scriptUrl  = backendInfo?.scriptUrl  || ''
  const sheetIdSet = backendInfo?.sheetIdSet
  const scriptSet  = backendInfo?.scriptUrlSet

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Settings" sub="Google Sheets connection, Apps Script and backup" />

      {/* Tabs */}
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

          {/* Backend API Status */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Icon name="wifi" size={16} className="text-blue-600" />Backend API
              </h3>
              {loading
                ? <Badge color="gray">Checking…</Badge>
                : backendInfo
                  ? <Badge color="green">✅ Connected</Badge>
                  : <Badge color="red">❌ Not Reachable</Badge>
              }
            </div>

            {/* Backend URL */}
            <div className="flex flex-col gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Backend API URL</div>
                <div className="font-mono text-sm text-slate-800 break-all">
                  {API_URL || <span className="text-red-500">Not set — add VITE_API_URL in Render frontend env</span>}
                </div>
                {API_URL && backendInfo && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-emerald-600 font-semibold">API is connected and responding</span>
                  </div>
                )}
              </div>

              {/* Google Sheet ID */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Google Sheet</div>
                  {loading
                    ? <Badge color="gray">Loading…</Badge>
                    : sheetIdSet
                      ? <Badge color="green">✅ Set in Render</Badge>
                      : <Badge color="red">❌ Not Set</Badge>
                  }
                </div>
                {loading
                  ? <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3 mt-1" />
                  : sheetUrl
                    ? <a href={sheetUrl} target="_blank" rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline font-mono break-all">
                        {sheetUrl}
                      </a>
                    : <p className="text-xs text-amber-700 mt-1">
                        ⚠️ Add <code className="bg-amber-100 px-1 rounded">GOOGLE_SHEET_ID</code> in your Render backend environment variables
                      </p>
                }
              </div>

              {/* Apps Script URL */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apps Script URL</div>
                  {loading
                    ? <Badge color="gray">Loading…</Badge>
                    : scriptSet
                      ? <Badge color="green">✅ Set in Render</Badge>
                      : <Badge color="red">❌ Not Set</Badge>
                  }
                </div>
                {loading
                  ? <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4 mt-1" />
                  : scriptUrl
                    ? <p className="text-xs text-slate-700 font-mono break-all">{scriptUrl}</p>
                    : <p className="text-xs text-amber-700 mt-1">
                        ⚠️ Add <code className="bg-amber-100 px-1 rounded">GOOGLE_SCRIPT_URL</code> in your Render backend environment variables
                      </p>
                }
              </div>

              {/* Test result */}
              {testResult && (
                <div className={`px-4 py-3 rounded-xl text-sm border font-medium ${testResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {testResult.message}
                </div>
              )}

              {/* Sync result */}
              {syncResult && (
                <div className={`px-4 py-3 rounded-xl text-sm border ${syncResult.ok ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {syncResult.ok
                    ? `✅ Synced — Students: ${syncResult.synced?.students || 0} rows, Fees: ${syncResult.synced?.fees || 0} rows`
                    : `❌ ${syncResult.message}`
                  }
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                <Btn onClick={testConnection} variant="outline" icon="wifi" disabled={testing || !API_URL}>
                  {testing ? 'Testing…' : 'Test Connection'}
                </Btn>
                <Btn onClick={manualSync} variant="primary" icon="sync" disabled={syncing || !API_URL}>
                  {syncing ? 'Syncing…' : 'Sync Now'}
                </Btn>
                <Btn onClick={() => { setLoading(true); fetch(`${API_URL}/api/settings/info`,{headers:authHeaders()}).then(r=>r.ok?r.json():null).then(d=>{if(d)setBackendInfo(d)}).catch(()=>{}).finally(()=>setLoading(false)) }} variant="ghost" icon="sync" disabled={loading}>
                  {loading ? 'Refreshing…' : 'Refresh Status'}
                </Btn>
              </div>
            </div>
          </Card>

          {/* Generate Headers */}
          <Card>
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Icon name="plus" size={16} className="text-emerald-600" />Generate Google Sheet Headers
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Creates all 7 sheets with proper column headers, blue styling and frozen rows — automatically in your Google Sheet.
              <strong> Run this once after deploying Apps Script.</strong>
            </p>

            {createResult && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${createResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <div className="font-semibold mb-2">{createResult.msg}</div>
                {createResult.ok && (
                  <div className="flex flex-col gap-1.5">
                    {createResult.created?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-emerald-700 font-bold mr-1">✅ Created:</span>
                        {createResult.created.map(s => <Badge key={s} color="green">{s}</Badge>)}
                      </div>
                    )}
                    {createResult.existing?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-blue-700 font-bold mr-1">ℹ️ Already existed:</span>
                        {createResult.existing.map(s => <Badge key={s} color="blue">{s}</Badge>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Btn
              onClick={generateHeaders}
              variant="success"
              icon="plus"
              size="lg"
              disabled={creating || !API_URL}
            >
              {creating ? '⏳ Generating Headers…' : '🚀 Generate All 7 Sheet Headers'}
            </Btn>

            {!scriptSet && backendInfo && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ GOOGLE_SCRIPT_URL must be set in Render backend env first
              </p>
            )}
          </Card>

          {/* How to fix env vars */}
          {backendInfo && (!sheetIdSet || !scriptSet) && (
            <Card className="bg-amber-50 border-amber-200">
              <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                <Icon name="alert" size={15} className="text-amber-600" />Missing Environment Variables
              </h3>
              <ol className="space-y-2 text-sm text-amber-800">
                {[
                  'Go to render.com → your backend service (kinsschool)',
                  'Click Environment tab in left sidebar',
                  !sheetIdSet && 'Add: GOOGLE_SHEET_ID = (copy from your Google Sheet URL)',
                  !scriptSet  && 'Add: GOOGLE_SCRIPT_URL = (paste your deployed Apps Script URL)',
                  'Click Save Changes — Render auto-redeploys',
                  'Come back and click Refresh Status',
                ].filter(Boolean).map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                    <code className="text-xs break-all">{s}</code>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {/* Sheet structure reference */}
          <Card>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Icon name="results" size={16} className="text-blue-600" />Sheet Structure (7 sheets)
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
          <Card className="bg-blue-50 border-blue-100">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Icon name="alert" size={16} className="text-blue-600" />Step-by-Step Setup
            </h3>
            <ol className="space-y-2 text-sm text-blue-800">
              {[
                ['Open your Google Sheet', sheetUrl ? <a href={sheetUrl} target="_blank" rel="noreferrer" className="underline font-semibold ml-1">Click to open →</a> : '(set GOOGLE_SHEET_ID in Render first)'],
                ['Click Extensions → Apps Script', ''],
                ['Delete all existing code', ''],
                ['Paste the script below (use Copy button)', ''],
                ['Press Ctrl+S to save, name it "KinsSchool"', ''],
                ['Deploy → New Deployment → Web App', ''],
                ['Execute as: Me | Who has access: Anyone → Deploy', ''],
                ['Copy the Web App URL', ''],
                ['In Render backend → Environment → Add GOOGLE_SCRIPT_URL = (paste URL)', ''],
                ['Come back → Connection tab → Generate Headers', ''],
              ].map(([step, detail], i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                  <div><span className="font-semibold">{step}</span>{detail && <span className="ml-1 text-blue-600">{detail}</span>}</div>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">Apps Script Code</h3>
              <div className="flex gap-2">
                <Btn onClick={copyScript} variant={copyDone ? 'success' : 'outline'} size="sm" icon={copyDone ? 'check' : 'receipt'}>
                  {copyDone ? '✅ Copied!' : 'Copy Code'}
                </Btn>
                <Btn onClick={downloadScript} variant="ghost" size="sm" icon="download">Download .gs</Btn>
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-auto max-h-80">
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
            <p className="text-sm text-slate-500 mb-5">Download all local data as JSON or restore from a previous backup file.</p>
            <div className="flex flex-col gap-3">
              <Btn onClick={exportBackup} variant="primary" icon="download" size="lg">Download Backup (JSON)</Btn>
              <Btn onClick={restoreBackup} variant="outline" icon="restore">Restore from Backup File</Btn>
            </div>
            <Divider />
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <strong>⚠️ Warning:</strong> Restoring overwrites all current local data. Make sure you have the correct file.
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
            <div className="flex flex-col gap-2 text-sm">
              {[
                ['Version',         'v1.0.0'],
                ['Frontend',        'React 18 + Vite + Tailwind CSS'],
                ['Backend',         'FastAPI (Python)'],
                ['Database',        'Google Sheets via Apps Script'],
                ['Offline Storage', 'Dexie.js (IndexedDB)'],
                ['Deploy',          'Render'],
                ['WhatsApp',        'wa.me links'],
                ['Backend URL',     API_URL || '—'],
                ['Sheet Connected', backendInfo?.sheetIdSet  ? '✅ Yes' : '❌ No'],
                ['Script Connected',backendInfo?.scriptUrlSet ? '✅ Yes' : '❌ No'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-700 text-xs text-right break-all max-w-52">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
