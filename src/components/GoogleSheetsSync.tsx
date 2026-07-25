import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  getGoogleAccessToken, 
  signInWithGoogleSheets, 
  auth 
} from '../lib/firebase';
import { 
  createGoogleSpreadsheet, 
  updateGoogleSpreadsheetValues, 
  getGoogleSpreadsheetValues, 
  listUserSpreadsheets, 
  formatSitesForSheets, 
  formatWarehouseForSheets, 
  extractSpreadsheetId,
  SpreadsheetInfo 
} from '../utils/googleSheets';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Search, 
  Table, 
  ShieldCheck, 
  Lock, 
  Eye,
  Database,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GoogleSheetsSync() {
  const { token, user } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(getGoogleAccessToken());
  const [connecting, setConnecting] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetInfo[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  
  // Export states
  const [exportingType, setExportingType] = useState<'sites' | 'warehouse' | 'reports' | null>(null);
  const [lastExportedUrl, setLastExportedUrl] = useState<string | null>(null);
  
  // Import / Sync states
  const [sheetInput, setSheetInput] = useState('');
  const [previewRows, setPreviewRows] = useState<string[][] | null>(null);
  const [readingSheet, setReadingSheet] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  
  // Feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active Embedded Sheet Preview
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      loadUserSpreadsheets(accessToken);
    }
  }, [accessToken]);

  const handleGoogleConnect = async () => {
    setConnecting(true);
    setStatusMessage(null);
    try {
      const result = await signInWithGoogleSheets();
      if (result) {
        setAccessToken(result.accessToken);
        setStatusMessage({ type: 'success', text: 'Successfully connected Google Workspace account!' });
        await loadUserSpreadsheets(result.accessToken);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to connect Google account.' });
    } finally {
      setConnecting(false);
    }
  };

  const loadUserSpreadsheets = async (tokenToUse: string) => {
    setLoadingSheets(true);
    try {
      const list = await listUserSpreadsheets(tokenToUse);
      setSpreadsheets(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleExportSites = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Please connect Google Workspace first.' });
      return;
    }
    setExportingType('sites');
    setStatusMessage(null);
    try {
      const sites = await api.get('/api/sites', token!);
      const sitesList = Array.isArray(sites) ? sites : [];
      const formattedData = formatSitesForSheets(sitesList);

      const title = `FlowVerge - Sites Master Export (${new Date().toLocaleDateString()})`;
      const sheetResult = await createGoogleSpreadsheet(accessToken, title, 'Sites Master');
      
      await updateGoogleSpreadsheetValues(
        accessToken, 
        sheetResult.spreadsheetId, 
        'Sites Master!A1', 
        formattedData
      );

      setLastExportedUrl(sheetResult.spreadsheetUrl);
      setActivePreviewId(sheetResult.spreadsheetId);
      setStatusMessage({ 
        type: 'success', 
        text: `Exported ${sitesList.length} sites successfully to Google Sheets!` 
      });
      await loadUserSpreadsheets(accessToken);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to export sites to Google Sheets.' });
    } finally {
      setExportingType(null);
    }
  };

  const handleExportWarehouse = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Please connect Google Workspace first.' });
      return;
    }
    setExportingType('warehouse');
    setStatusMessage(null);
    try {
      const stock = await api.get('/api/warehouse/stock', token!);
      const stockList = Array.isArray(stock) ? stock : [];
      const formattedData = formatWarehouseForSheets(stockList);

      const title = `FlowVerge - Inventory & Stock (${new Date().toLocaleDateString()})`;
      const sheetResult = await createGoogleSpreadsheet(accessToken, title, 'Inventory');
      
      await updateGoogleSpreadsheetValues(
        accessToken, 
        sheetResult.spreadsheetId, 
        'Inventory!A1', 
        formattedData
      );

      setLastExportedUrl(sheetResult.spreadsheetUrl);
      setActivePreviewId(sheetResult.spreadsheetId);
      setStatusMessage({ 
        type: 'success', 
        text: `Exported ${stockList.length} materials successfully to Google Sheets!` 
      });
      await loadUserSpreadsheets(accessToken);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to export warehouse stock.' });
    } finally {
      setExportingType(null);
    }
  };

  const handleFetchSheetForImport = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Please connect Google Workspace first.' });
      return;
    }
    if (!sheetInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a Google Sheet URL or Spreadsheet ID.' });
      return;
    }

    const spreadsheetId = extractSpreadsheetId(sheetInput);
    setReadingSheet(true);
    setStatusMessage(null);
    try {
      const rows = await getGoogleSpreadsheetValues(accessToken, spreadsheetId, 'A1:Z50');
      if (!rows || rows.length === 0) {
        throw new Error('Spreadsheet appears to be empty.');
      }
      setPreviewRows(rows);
      setActivePreviewId(spreadsheetId);
      setStatusMessage({ type: 'success', text: `Successfully loaded ${rows.length} rows from Google Sheet!` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch spreadsheet contents.' });
    } finally {
      setReadingSheet(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewRows || previewRows.length < 2) {
      setStatusMessage({ type: 'error', text: 'No valid data rows found to import.' });
      return;
    }

    setSyncingData(true);
    setShowConfirmModal(false);
    try {
      // Import site rows (assuming headers match Site Custom ID, Name, District, Client)
      const dataRows = previewRows.slice(1);
      let importedCount = 0;

      for (const row of dataRows) {
        if (row[0] && row[1]) {
          await api.post('/api/sites', {
            site_custom_id: row[1] || row[0],
            project_id: 'PRJ-IMPORT-GS',
            name: row[3] || row[1] || 'Imported Site',
            district: row[4] || row[2] || 'Default District',
            client: row[5] || row[3] || 'Client Sync',
            client_site_id: row[6] || 'C-SYNC',
            location: row[7] || row[4] || 'Google Sheet Location',
            current_stage_id: 1
          }, token!);
          importedCount++;
        }
      }

      setStatusMessage({ 
        type: 'success', 
        text: `Successfully imported ${importedCount} sites into FlowVerge database from Google Sheets!` 
      });
      setPreviewRows(null);
      setSheetInput('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to sync Google Sheets data to FlowVerge database.' });
    } finally {
      setSyncingData(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-zinc-900 to-emerald-950/40 p-6 rounded-2xl border border-emerald-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FileSpreadsheet className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Google Workspace Integration
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Google Sheets Synchronization Hub
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl">
              Export live site tracking, warehouse stock, and inspection reports directly into Google Sheets, or import sheet data back into FlowVerge.
            </p>
          </div>

          <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/10 flex items-center gap-4">
            {accessToken ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="text-xs text-zinc-400 font-medium">Google Status</div>
                  <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </div>
                </div>
                <button
                  onClick={handleGoogleConnect}
                  disabled={connecting}
                  className="ml-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors border border-white/10"
                >
                  Reconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleConnect}
                disabled={connecting}
                className="bg-white hover:bg-zinc-200 text-black px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center gap-2"
              >
                {connecting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Connect Google Sheets
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border flex items-center justify-between ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
              <span className="text-sm font-medium">{statusMessage.text}</span>
            </div>
            {lastExportedUrl && (
              <a
                href={lastExportedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition-colors border border-emerald-500/30"
              >
                Open Google Sheet <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sites Export Card */}
        <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-lg">
          <div>
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Export Sites to Google Sheets</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Generates a new structured Google Sheet containing all sites, locations, stage progress, and assigned supervisors.
            </p>
          </div>
          <button
            onClick={handleExportSites}
            disabled={exportingType === 'sites'}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md"
          >
            {exportingType === 'sites' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Exporting Sites...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Export Sites Master
              </>
            )}
          </button>
        </div>

        {/* Warehouse Export Card */}
        <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-lg">
          <div>
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Export Inventory & Stock</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Syncs material codes, stock balances, low-stock alerts, and warehouse locations into a live Google Sheet.
            </p>
          </div>
          <button
            onClick={handleExportWarehouse}
            disabled={exportingType === 'warehouse'}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md"
          >
            {exportingType === 'warehouse' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Exporting Stock...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Export Inventory Sheet
              </>
            )}
          </button>
        </div>

        {/* Import from Google Sheets Card */}
        <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-lg md:col-span-2 lg:col-span-1">
          <div>
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Import from Google Sheets</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Paste a Google Sheet URL or Spreadsheet ID to import site records or update databases directly.
            </p>

            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            onClick={handleFetchSheetForImport}
            disabled={readingSheet}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md"
          >
            {readingSheet ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Reading Sheet...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Load & Inspect Sheet
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loaded Rows Preview & Confirmation for Import */}
      {previewRows && (
        <div className="bg-zinc-900 border border-blue-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Table className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">Google Sheet Preview</h3>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {previewRows.length} Rows Found
              </span>
            </div>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Database className="w-4 h-4" /> Sync to Database
            </button>
          </div>

          <div className="overflow-x-auto max-h-64 rounded-xl border border-white/10">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase font-semibold border-b border-white/10">
                <tr>
                  {previewRows[0]?.map((col, idx) => (
                    <th key={idx} className="p-3 whitespace-nowrap">{col || `Col ${idx + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-zinc-900/50">
                {previewRows.slice(1, 10).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/5">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 whitespace-nowrap max-w-xs truncate">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewRows.length > 10 && (
            <div className="text-xs text-zinc-500 text-center">
              Showing first 10 rows out of {previewRows.length}
            </div>
          )}
        </div>
      )}

      {/* User Confirmation Modal for Destructive/Mutating Database Sync */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <ShieldCheck className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">Confirm Database Sync</h3>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                You are about to import <strong className="text-white">{previewRows ? previewRows.length - 1 : 0} site records</strong> from this Google Sheet into the FlowVerge project database.
              </p>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>This action will write site data to your persistent FlowVerge database. Existing IDs may be updated.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={syncingData}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
                >
                  {syncingData ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Syncing...
                    </>
                  ) : (
                    'Confirm & Sync Now'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Embedded Live Sheet Viewer */}
      {activePreviewId && (
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Eye className="w-5 h-5 text-emerald-400" />
              Live Google Sheets Embed Viewer
            </div>
            <a
              href={`https://docs.google.com/spreadsheets/d/${activePreviewId}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              Open in Google Sheets <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="w-full h-96 rounded-xl border border-white/10 overflow-hidden bg-white">
            <iframe
              src={`https://docs.google.com/spreadsheets/d/${activePreviewId}/htmlembed?widget=true&headers=false`}
              className="w-full h-full border-0"
              title="Embedded Google Sheet"
            />
          </div>
        </div>
      )}

      {/* Recent Spreadsheets in Drive */}
      <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Your Google Drive Spreadsheets
            </h3>
            <p className="text-xs text-zinc-400">
              Spreadsheets stored in your Google Drive accessible via Workspace OAuth.
            </p>
          </div>
          <button
            onClick={() => accessToken && loadUserSpreadsheets(accessToken)}
            disabled={loadingSheets || !accessToken}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors border border-white/10"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loadingSheets ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {!accessToken ? (
          <div className="p-8 text-center bg-zinc-950/50 rounded-xl border border-white/5 space-y-3">
            <Lock className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400">Connect Google Workspace above to view your Google Drive spreadsheets.</p>
          </div>
        ) : loadingSheets ? (
          <div className="p-8 text-center text-zinc-500 flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Fetching spreadsheets from Google Drive...
          </div>
        ) : spreadsheets.length === 0 ? (
          <div className="p-8 text-center bg-zinc-950/50 rounded-xl border border-white/5 text-xs text-zinc-400">
            No spreadsheets found in your Google Drive. Click export above to generate one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spreadsheets.map((sheet) => (
              <div
                key={sheet.id}
                className="bg-zinc-950 p-4 rounded-xl border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white truncate" title={sheet.name}>
                      {sheet.name}
                    </h4>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Modified: {sheet.modifiedTime ? new Date(sheet.modifiedTime).toLocaleDateString() : 'Recently'}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => setActivePreviewId(sheet.id)}
                    className="text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <a
                    href={sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    Open Sheet <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
