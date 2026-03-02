import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Download, AlertTriangle, CheckCircle2, X, Eye, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SAMPLE_CSV = `quarter,year,revenue,ebitda,net_income,expenses
Q1,2023,120.5,38.2,25.1,82.3
Q2,2023,125.8,40.1,26.5,85.7
Q3,2023,130.2,42.5,28.0,88.2
Q4,2023,135.0,44.0,29.5,91.0
Q1,2024,140.3,46.5,31.2,93.8
Q2,2024,145.7,48.2,32.8,97.5
Q3,2024,148.9,49.8,33.5,99.1
Q4,2024,155.0,52.0,35.0,103.0`;

const REQUIRED_COLUMNS = ['quarter', 'year', 'revenue', 'ebitda', 'net_income', 'expenses'];

const UploadData = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [mappingConfirmed, setMappingConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  /* ── parse CSV text into array-of-objects ── */
  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
      return obj;
    });
    return { headers, rows };
  };

  /* ── handle file selection ── */
  const handleFile = useCallback((selectedFile) => {
    setError('');
    setResult(null);
    setMappingConfirmed(false);

    if (!selectedFile) return;
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Only CSV and Excel (.xlsx/.xls) files are supported.');
      return;
    }

    setFile(selectedFile);

    // For CSV, parse client-side for preview
    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const { headers, rows } = parseCSV(e.target.result);
        setPreviewData({ headers, rows });
        // Auto-map columns
        const mapping = {};
        REQUIRED_COLUMNS.forEach(col => {
          const match = headers.find(h => h === col || h.includes(col));
          if (match) mapping[col] = match;
        });
        setColumnMapping(mapping);
      };
      reader.readAsText(selectedFile);
    } else {
      // For Excel, we can't parse client-side easily — just show name
      setPreviewData(null);
      const mapping = {};
      REQUIRED_COLUMNS.forEach(col => { mapping[col] = col; });
      setColumnMapping(mapping);
    }
  }, []);

  /* ── drag and drop handlers ── */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  /* ── download sample CSV ── */
  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finsight_sample_financials.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── submit upload ── */
  const handleSubmit = async () => {
    if (!file || !user?.uid) return;
    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uid', user.uid);

      const res = await axios.post('/api/upload-financials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(res.data);

      // Don't auto-trigger analysis - let user click "Run Analysis" button on dashboard
      // This gives them control and shows the agent progress UI
      
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object' && detail.errors) {
        setError(detail.errors.join('\n'));
      } else {
        setError(typeof detail === 'string' ? detail : 'Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  /* ── reset ── */
  const reset = () => {
    setFile(null);
    setPreviewData(null);
    setColumnMapping({});
    setMappingConfirmed(false);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── clear all data ── */
  const handleClearAllData = async () => {
    if (!user?.uid) return;
    
    if (!window.confirm('Are you sure? This will permanently delete ALL your uploaded financial data, analysis results, and organization profile. This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/org-clear-data?uid=${user.uid}`);
      reset();
      setResult({ status: 'success', message: 'All data cleared successfully. You can now upload fresh data.' });
      
      // Reload page after 2 seconds to reset state
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError('Failed to clear data. Please try again.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Upload Financial Data</h2>
          <p className="text-sm text-zinc-500 mt-1">Upload your quarterly financial data as CSV or Excel to run AI analysis.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadSample}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700"
          >
            <Download size={16} />
            Sample CSV
          </button>
          <button
            onClick={handleClearAllData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/30"
            title="Clear all uploaded data and start fresh"
          >
            <Trash2 size={16} />
            Clear All Data
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {result && (
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="text-emerald-400 flex-shrink-0" size={28} />
              <div className="flex-1">
                <h4 className="font-bold text-emerald-400">Upload Successful</h4>
                <p className="text-sm text-emerald-300/70">{result.message}</p>
                <p className="text-sm text-emerald-300/90 mt-2">
                  Go to Dashboard and click <span className="font-semibold">Run Analysis</span> to generate your company health score.
                </p>
              </div>
              <button onClick={reset} className="text-zinc-400 hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 w-full px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
            >
              <span>Go to Dashboard</span>
              <span className="text-lg">→</span>
            </button>
          </div>
          {result.warning && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
              <AlertTriangle className="text-amber-400 flex-shrink-0" size={22} />
              <p className="text-sm text-amber-300/80">{result.warning}</p>
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex items-start gap-4">
          <AlertTriangle className="text-rose-400 flex-shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <h4 className="font-bold text-rose-400 mb-1">Validation Error</h4>
            <pre className="text-sm text-rose-300/70 whitespace-pre-wrap font-mono">{error}</pre>
          </div>
          <button onClick={() => setError('')} className="text-zinc-400 hover:text-zinc-200">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      {!file && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-[32px] border-2 border-dashed p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
            dragActive
              ? 'border-blue-500 bg-blue-500/[0.06]'
              : 'border-zinc-700 bg-white/[0.02] hover:border-zinc-500 hover:bg-white/[0.04]'
          }`}
        >
          <Upload size={48} className={`mb-4 ${dragActive ? 'text-blue-400' : 'text-zinc-600'}`} />
          <p className="text-lg font-bold text-zinc-300 mb-1">Drop your file here</p>
          <p className="text-sm text-zinc-500">or click to browse — CSV, XLSX, XLS supported</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* File Selected Info */}
      {file && !result && (
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="text-blue-400" size={24} />
            <div>
              <p className="font-medium text-zinc-200">{file.name}</p>
              <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button onClick={reset} className="text-zinc-400 hover:text-rose-400 transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Column Mapping */}
      {file && !mappingConfirmed && !result && (
        <div className="glass-card rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Eye className="text-indigo-400" size={18} />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Column Mapping</h3>
          </div>
          <p className="text-sm text-zinc-500">Map your file columns to the required fields. We auto-detected matches.</p>

          <div className="grid grid-cols-2 gap-4">
            {REQUIRED_COLUMNS.map((col) => (
              <div key={col} className="flex items-center justify-between bg-white/[0.02] rounded-xl p-4 border border-white/[0.05]">
                <span className="text-sm font-medium text-zinc-300 capitalize">{col.replace('_', ' ')}</span>
                <select
                  value={columnMapping[col] || ''}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))}
                  className="bg-[#0f1117] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-zinc-200 outline-none"
                >
                  <option value="">-- select --</option>
                  {previewData?.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                  {!previewData && <option value={col}>{col}</option>}
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={() => setMappingConfirmed(true)}
            disabled={REQUIRED_COLUMNS.some(c => !columnMapping[c])}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Confirm Mapping
          </button>
        </div>
      )}

      {/* Preview Table */}
      {file && previewData && mappingConfirmed && !result && (
        <div className="glass-card rounded-[32px] overflow-hidden">
          <div className="px-8 pt-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="text-blue-400" size={18} />
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Data Preview</h3>
            </div>
            <span className="text-xs text-zinc-500">{previewData.rows.length} rows</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-white/[0.02]">
                  {REQUIRED_COLUMNS.map(col => (
                    <th key={col} className="px-6 py-3 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                      {col.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {previewData.rows.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    {REQUIRED_COLUMNS.map(col => (
                      <td key={col} className="px-6 py-3 text-sm text-zinc-300 font-mono">
                        {row[columnMapping[col]] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-6">
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Submit Data
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* For Excel files where we can't preview, go straight to submit */}
      {file && !previewData && mappingConfirmed && !result && (
        <div className="glass-card rounded-[32px] p-8 text-center space-y-4">
          <FileText className="mx-auto text-zinc-500" size={40} />
          <p className="text-sm text-zinc-400">Excel file detected. Data will be validated on the server.</p>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="mx-auto px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Submit Data
              </>
            )}
          </button>
        </div>
      )}

      {/* Required Format Info */}
      <div className="glass-card rounded-[32px] p-8">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">Required CSV Format</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="pb-3 text-zinc-500 font-bold">Column</th>
                <th className="pb-3 text-zinc-500 font-bold">Type</th>
                <th className="pb-3 text-zinc-500 font-bold">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-400">
              <tr><td className="py-2 font-mono text-blue-400">quarter</td><td>Q1–Q4</td><td>Q3</td></tr>
              <tr><td className="py-2 font-mono text-blue-400">year</td><td>4-digit number</td><td>2024</td></tr>
              <tr><td className="py-2 font-mono text-blue-400">revenue</td><td>Number (millions)</td><td>145.7</td></tr>
              <tr><td className="py-2 font-mono text-blue-400">ebitda</td><td>Number (millions)</td><td>48.2</td></tr>
              <tr><td className="py-2 font-mono text-blue-400">net_income</td><td>Number (millions)</td><td>32.8</td></tr>
              <tr><td className="py-2 font-mono text-blue-400">expenses</td><td>Number (millions)</td><td>97.5</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-600 mt-4">Tip: Upload at least 4 quarters for the most accurate forecasts.</p>
      </div>
    </div>
  );
};

export default UploadData;
