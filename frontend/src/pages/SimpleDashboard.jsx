import React, { useState, useEffect } from 'react';
import { TrendingUp, Building2, User, Loader2, CheckCircle, AlertCircle, Upload, FileText } from 'lucide-react';

const SimpleDashboard = () => {
  const [role, setRole] = useState('investor');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [ticker, setTicker] = useState('AAPL');
  const [date, setDate] = useState('2024-12-31');
  const [csvFile, setCsvFile] = useState(null);
  const [orgDate, setOrgDate] = useState('2026-01-01');
  const [notifications, setNotifications] = useState([]);

  const pushNotification = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setNotifications((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((note) => note.id !== id));
    }, 4500);
  };

  const extractApiError = async (response) => {
    let detail = '';
    try {
      const data = await response.json();
      detail = data?.detail || data?.message || '';
    } catch {
      detail = '';
    }
    return detail
      ? `Request failed (${response.status}): ${detail}`
      : `Request failed with status ${response.status}`;
  };

  useEffect(() => {
    const savedResult = sessionStorage.getItem('lastPrediction');
    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
      } catch (e) {
        console.error('Failed to parse saved result:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (result) {
      sessionStorage.setItem('lastPrediction', JSON.stringify(result));
    }
  }, [result]);

  const handleInvestorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: ticker, as_of_date: date }),
      });
      if (!response.ok) {
        throw new Error(await extractApiError(response));
      }
      const data = await response.json();
      setResult(data);

      if (data?.status === 'partial') {
        const degraded = data?.degraded_agents?.length ? data.degraded_agents.join(', ') : 'some AI agents';
        const msg = `Analysis completed with limited coverage (${degraded}). Check API keys for full AI output.`;
        setError(msg);
        pushNotification('warning', msg);
      } else {
        pushNotification('success', 'Analysis completed successfully.');
      }
    } catch (err) {
      const msg = err?.message || 'Unexpected error during prediction.';
      setError(msg);
      pushNotification('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('as_of_date', orgDate);
      const response = await fetch('http://localhost:8000/upload-csv', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await extractApiError(response));
      }
      const data = await response.json();
      setResult(data);

      if (data?.status === 'partial') {
        const degraded = data?.degraded_agents?.length ? data.degraded_agents.join(', ') : 'some AI agents';
        const msg = `CSV analysis completed with limited coverage (${degraded}). Check API keys for full AI output.`;
        setError(msg);
        pushNotification('warning', msg);
      } else {
        pushNotification('success', 'CSV uploaded and analyzed successfully.');
      }
    } catch (err) {
      const msg = err?.message || 'Unexpected error during CSV upload.';
      setError(msg);
      pushNotification('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      buy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      sell: 'text-red-400 bg-red-500/10 border-red-500/20',
      hold: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      monitor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    };
    return colors[action?.toLowerCase()] || colors.monitor;
  };

  const handleDownloadReport = () => {
    if (!result) return;

    // Create a styled HTML document for PDF
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>FinSight AI - Executive Report</title>
        <style>
          @page { margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #ffffff;
            color: #000000;
            padding: 40px;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
            padding: 40px 40px;
            margin: -40px -40px 40px -40px;
            border-bottom: 4px solid #059669;
          }
          .logo {
            font-size: 36px;
            font-weight: 900;
            color: #000000;
            margin-bottom: 10px;
            text-shadow: 0 2px 8px rgba(255,255,255,0.3);
          }
          .confidential {
            font-size: 14px;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 3px;
            font-weight: 700;
          }
          .section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
          }
          .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #10b981;
          }
          .company-header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 24px;
          }
          .company-name {
            font-size: 28px;
            font-weight: 900;
            color: #000000;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            background: #dbeafe;
            border: 1px solid #3b82f6;
            border-radius: 6px;
            font-size: 12px;
            color: #1e40af;
            font-weight: 600;
          }
          .action-box {
            background: #ecfdf5;
            border: 2px solid #10b981;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .action-label {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            color: #059669;
            margin-bottom: 12px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-top: 16px;
          }
          .metric {
            background: #ffffff;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .metric-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .metric-value {
            font-size: 18px;
            font-weight: 600;
            color: #059669;
          }
          .forecast-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .forecast-label { color: #374151; font-weight: 500; }
          .forecast-value { font-weight: 700; font-family: monospace; }
          .bear { color: #dc2626; }
          .base { color: #059669; font-size: 18px; }
          .bull { color: #2563eb; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 700;
            background: #f3f4f6;
          }
          td {
            color: #000000;
            font-weight: 500;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            font-size: 11px;
            color: #6b7280;
            text-align: center;
          }
          .trace-id {
            font-family: monospace;
            color: #059669;
            font-weight: 600;
          }
          ul {
            list-style: none;
            padding: 0;
          }
          li {
            padding: 8px 0;
            padding-left: 20px;
            position: relative;
            color: #1f2937;
            line-height: 1.6;
          }
          li:before {
            content: "•";
            color: #10b981;
            position: absolute;
            left: 0;
            font-weight: bold;
          }
          p {
            color: #1f2937;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">FinSight AI</div>
          <div class="confidential">Confidential - Proprietary AI Analysis</div>
        </div>

        <div class="company-header">
          <div>
            <div class="company-name">${result.company_profile?.name || 'Company Analysis'}</div>
            <span class="badge">${result.company_profile?.sector || 'N/A'}</span>
            <span style="margin-left: 12px; color: #374151; font-weight: 500;">Market Cap: $${(result.company_profile?.market_cap || 0).toLocaleString()}M</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Executive Summary</div>
          <div class="action-box">
            <div class="action-label">${result.result?.recommendation?.action || 'MONITOR'}</div>
            <p style="color: #1f2937; line-height: 1.6; font-weight: 500;">${result.result?.recommendation?.simple_verdict || 'Analysis complete'}</p>
          </div>
          <p style="color: #374151; line-height: 1.6; font-weight: 500;">${result.result?.recommendation?.simple_summary || ''}</p>
          <div style="margin-top: 20px;">
            <strong style="color: #1f2937;">AI Confidence:</strong>
            <span style="color: #059669; font-size: 24px; font-weight: bold; margin-left: 12px;">
              ${Math.round((result.result?.combined_confidence || 0) * 100)}%
            </span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Financial Forecast</div>
          <div style="margin-bottom: 24px;">
            <h4 style="color: #374151; margin-bottom: 12px; font-weight: 600;">Revenue Forecast (Millions USD)</h4>
            <div class="forecast-row">
              <span class="forecast-label bear">Bear Case (P05):</span>
              <span class="forecast-value bear">$${(result.result?.final_forecast?.revenue_ci?.[0] || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}M</span>
            </div>
            <div class="forecast-row">
              <span class="forecast-label base">Base Case (P50):</span>
              <span class="forecast-value base">$${(result.result?.final_forecast?.revenue_p50 || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}M</span>
            </div>
            <div class="forecast-row">
              <span class="forecast-label bull">Bull Case (P95):</span>
              <span class="forecast-value bull">$${(result.result?.final_forecast?.revenue_ci?.[1] || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}M</span>
            </div>
          </div>
          <div>
            <h4 style="color: #374151; margin-bottom: 12px; font-weight: 600;">EBITDA Forecast (Millions USD)</h4>
            <div class="forecast-row">
              <span class="forecast-label bear">Bear Case (P05):</span>
              <span class="forecast-value bear">$${(result.result?.final_forecast?.ebitda_ci?.[0] || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}M</span>
            </div>
            <div class="forecast-row">
              <span class="forecast-label base">Base Case (P50):</span>
              <span class="forecast-value base">$${(result.result?.final_forecast?.ebitda_p50 || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}M</span>
            </div>
            <div class="forecast-row">
              <span class="forecast-label bull">Bull Case (P95):</span>
              <span class="forecast-value bull">$${(result.result?.final_forecast?.ebitda_ci?.[1] || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}M</span>
            </div>
          </div>
        </div>

        <div class="section" style="page-break-before: always; margin-top: 60px;">
          <div class="section-title">Multi-Agent AI Confidence Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>AI Agent</th>
                <th>Confidence Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>NLP Transcript Agent</td>
                <td>${Math.round((result.explainability?.confidence_breakdown?.transcript_nlp || 0) * 100)}%</td>
              </tr>
              <tr>
                <td>Financial Math Model</td>
                <td>${Math.round((result.explainability?.confidence_breakdown?.financial_model || 0) * 100)}%</td>
              </tr>
              <tr>
                <td>News & Macro Agent</td>
                <td>${Math.round((result.explainability?.confidence_breakdown?.news_macro || 0) * 100)}%</td>
              </tr>
              <tr>
                <td>Competitor Agent</td>
                <td>${Math.round((result.explainability?.confidence_breakdown?.competitor || 0) * 100)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${result.explainability?.shap_values?.length > 0 ? `
        <div class="section">
          <div class="section-title">Top Factors Influencing AI Prediction</div>
          <ul>
            ${result.explainability.shap_values.slice(0, 5).map(item => `
              <li>${item.feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: <span style="color: ${item.shap >= 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">${item.shap >= 0 ? '+' : ''}${item.shap.toFixed(1)}</span></li>
            `).join('')}
          </ul>
        </div>
        ` : ''}

        <div class="footer">
          <p>Generated by FinSight AI Multi-Agent Orchestrator</p>
          <p style="margin-top: 8px;">Digital Signature: <span class="trace-id">${result.trace_id}</span></p>
          <p style="margin-top: 4px;">Timestamp: ${new Date().toLocaleString()}</p>
          <p style="margin-top: 8px;">Data Source: ${result.data_source} | Total Processing Time: ${(result.latency_ms / 1000).toFixed(1)}s</p>
        </div>
      </body>
      </html>
    `;

    // Open print dialog with the styled content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white p-6">
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[340px] max-w-[90vw]">
        {notifications.map((note) => (
          <div
            key={note.id}
            className={`rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${
              note.type === 'error'
                ? 'bg-red-500/15 border-red-500/40 text-red-200'
                : note.type === 'warning'
                ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-100'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100'
            }`}
          >
            {note.message}
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">FinSight AI - Financial Analysis</h1>
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-4">
              <button
                onClick={() => setRole('investor')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all ${
                  role === 'investor'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Investor</span>
              </button>
              <button
                onClick={() => setRole('organization')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all ${
                  role === 'organization'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="font-medium">Organization</span>
              </button>
            </div>
            
            {result && (
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                  sessionStorage.removeItem('lastPrediction');
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                <span className="font-medium">Clear Logs</span>
              </button>
            )}
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Box 1: Input Form */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">
                {role === 'investor' ? 'Analyze Public Company' : 'Upload Your Data'}
              </h2>
              {role === 'investor' ? (
                <form onSubmit={handleInvestorSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Company Ticker</label>
                    <input
                      type="text"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      placeholder="AAPL, MSFT, GOOGL..."
                      className="w-full px-4 py-3 bg-[#0a0a0b] border border-white/[0.06] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Analysis Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0a0a0b] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-lg font-medium transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5" />
                        Analyze Company
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOrgSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Upload CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      className="w-full px-4 py-3 bg-[#0a0a0b] border border-white/[0.06] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 file:cursor-pointer"
                      required
                    />
                    {csvFile && <p className="text-sm text-emerald-400 mt-2">Selected: {csvFile.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Analysis Date</label>
                    <input
                      type="date"
                      value={orgDate}
                      onChange={(e) => setOrgDate(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0a0a0b] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-lg font-medium transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Analyze Data
                      </>
                    )}
                  </button>
                </form>
              )}
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">Error</p>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Box 2: Company Fundamentals */}
            {result?.company_profile && (
              <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">🏢 Company Fundamentals</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Revenue Growth</div>
                    <div className={`text-lg font-semibold ${(result.company_profile.revenue_growth || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.company_profile.revenue_growth?.toFixed(2) || 'N/A'}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Profit Margin</div>
                    <div className="text-lg font-semibold text-white">
                      {result.company_profile.profit_margin || 'N/A'}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Exchange</div>
                    <div className="text-sm font-medium text-zinc-300">
                      {result.company_profile.exchange || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">HQ Location</div>
                    <div className="text-sm font-medium text-zinc-300">
                      {result.company_profile.country || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Box 3: Top AI Prediction Drivers */}
            {result?.explainability?.shap_values && result.explainability.shap_values.length > 0 && (
              <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">⚖️ Top Factors Influencing AI</h3>
                <div className="space-y-3">
                  {result.explainability.shap_values.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm text-zinc-300 mb-1">
                          {item.feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.shap >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(Math.abs(item.shap) / Math.max(...result.explainability.shap_values.map(s => Math.abs(s.shap))) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className={`ml-3 text-sm font-mono font-semibold ${item.shap >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.shap >= 0 ? '+' : ''}{item.shap.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Box 4: System Telemetry */}
            {result && (
              <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">⏱️ System Execution Trace</h3>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Data Pipeline:</span>
                    <span className="text-emerald-400 font-semibold">{result.data_source || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Total API Latency:</span>
                    <span className="text-white font-semibold">{(result.latency_ms / 1000).toFixed(1)}s</span>
                  </div>
                  {result.agent_latencies && (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-600">├─ NLP Processing:</span>
                        <span className="text-zinc-400">{result.agent_latencies.transcript_nlp}ms</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-600">├─ Quant Model:</span>
                        <span className="text-zinc-400">{result.agent_latencies.financial_model}ms</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-600">├─ News & Macro:</span>
                        <span className="text-zinc-400">{result.agent_latencies.news_macro}ms</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-600">└─ Competitor:</span>
                        <span className="text-zinc-400">{result.agent_latencies.competitor}ms</span>
                      </div>
                    </>
                  )}
                  <div className="pt-2 border-t border-white/[0.06]">
                    <div className="text-xs text-zinc-600">System Trace ID:</div>
                    <div className="text-xs text-zinc-500 mt-1 break-all">{result.trace_id}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Box 5: Audit Trail */}
            {result && (
              <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">🔒 Audit Trail</h3>
                <button
                  onClick={() => setShowAuditModal(true)}
                  className="w-full px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-lg text-center text-zinc-300 hover:text-white text-sm font-medium transition-all"
                >
                  Generate System Audit PDF →
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Analysis Result */}
          <div className="lg:col-span-2">
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Analysis Result</h2>
                {result && !loading && (
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download Executive Report</span>
                  </button>
                )}
              </div>

              {!result && !loading && (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                  <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
                  <p>Submit a request to see results</p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-16 h-16 text-emerald-400 animate-spin mb-4" />
                  <p className="text-zinc-400">Running AI analysis...</p>
                  <p className="text-zinc-500 text-sm mt-2">This may take 10-20 seconds</p>
                </div>
              )}

              {result && !loading && (
                <div className="space-y-6">
                  {/* Company Header */}
                  {result.company_profile && (
                    <div className="flex items-center gap-4 p-4 bg-[#0a0a0b] rounded-lg border border-white/[0.06]">
                      {result.company_profile.logo && (
                        <img 
                          src={result.company_profile.logo} 
                          alt={result.company_profile.name}
                          className="w-12 h-12 rounded-lg object-contain bg-white/5 p-2"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{result.company_profile.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">
                            {result.company_profile.sector}
                          </span>
                          <span className="text-zinc-400 text-sm">
                            Market Cap: ${(result.company_profile.market_cap || 0).toLocaleString()}M
                          </span>
                          {result.company_profile.pe_ratio && (
                            <span className="text-zinc-400 text-sm">
                              P/E: {result.company_profile.pe_ratio.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Executive Summary */}
                  <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-sm font-medium text-zinc-400">Action Required:</h3>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border font-bold text-sm ${getActionColor(result.result?.recommendation?.action)}`}>
                            <span className="uppercase tracking-wider">
                              {result.result?.recommendation?.action || 'MONITOR'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-xs font-medium text-zinc-500 mb-1">The Bottom Line:</h4>
                            <p className="text-white font-medium leading-relaxed">
                              {result.result?.recommendation?.simple_verdict || 'Analysis complete'}
                            </p>
                          </div>
                          {result.result?.recommendation?.simple_summary && (
                            <div>
                              <h4 className="text-xs font-medium text-zinc-500 mb-1">Detailed Summary:</h4>
                              <p className="text-zinc-300 text-sm leading-relaxed">
                                {result.result.recommendation.simple_summary}
                              </p>
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-medium text-zinc-500 mb-2">Total AI Confidence:</h4>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 transition-all duration-500"
                                  style={{ width: `${(result.result?.combined_confidence || 0) * 100}%` }}
                                />
                              </div>
                              <span className="text-white font-bold text-lg">
                                {Math.round((result.result?.combined_confidence || 0) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bull vs Bear Case */}
                  <div className="p-5 bg-[#0a0a0b] rounded-lg border border-white/[0.06]">
                    <h3 className="text-lg font-semibold text-white mb-4">📊 Bull vs. Bear Case</h3>
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-zinc-400 mb-3">Revenue Forecast Range</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-400">Bear Case (P05):</span>
                          <span className="text-red-400 font-mono">
                            ${(result.result?.final_forecast?.revenue_ci?.[0] || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}M
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 font-semibold">Base Case (P50):</span>
                          <span className="text-emerald-400 font-bold text-lg font-mono">
                            ${(result.result?.final_forecast?.revenue_p50 || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}M
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-400">Bull Case (P95):</span>
                          <span className="text-blue-400 font-mono">
                            ${(result.result?.final_forecast?.revenue_ci?.[1] || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}M
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 h-2 bg-white/[0.06] rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-emerald-500/50 to-blue-500/30" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-zinc-400 mb-3">EBITDA Forecast Range</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-400">Bear Case (P05):</span>
                          <span className="text-red-400 font-mono">
                            ${(result.result?.final_forecast?.ebitda_ci?.[0] || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}M
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 font-semibold">Base Case (P50):</span>
                          <span className="text-emerald-400 font-bold text-lg font-mono">
                            ${(result.result?.final_forecast?.ebitda_p50 || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}M
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-400">Bull Case (P95):</span>
                          <span className="text-blue-400 font-mono">
                            ${(result.result?.final_forecast?.ebitda_ci?.[1] || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}M
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 h-2 bg-white/[0.06] rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-emerald-500/50 to-blue-500/30" />
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  {result.result?.explanations?.length > 0 && (
                    <div className="p-5 bg-[#0a0a0b] rounded-lg border border-white/[0.06]">
                      <h3 className="text-lg font-semibold text-white mb-3">💡 AI Reasoning & Explanations</h3>
                      <p className="text-sm text-zinc-400 mb-3">Why is the AI predicting this?</p>
                      <ul className="space-y-2">
                        {result.result.explanations.map((explanation, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-zinc-300 text-sm">
                            <span className="text-emerald-400 mt-1">•</span>
                            <span>{explanation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Under the Hood */}
                  {result.explainability?.confidence_breakdown && (
                    <div className="p-5 bg-[#0a0a0b] rounded-lg border border-white/[0.06]">
                      <h3 className="text-lg font-semibold text-white mb-3">🤖 Under the Hood</h3>
                      <p className="text-sm text-zinc-400 mb-4">Multi-Agent Confidence Breakdown</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                          <div className="text-xs text-zinc-500 mb-1">NLP Transcript Agent</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 transition-all"
                                style={{ width: `${(result.explainability.confidence_breakdown.transcript_nlp || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-white text-sm font-medium">
                              {Math.round((result.explainability.confidence_breakdown.transcript_nlp || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                          <div className="text-xs text-zinc-500 mb-1">Financial Math Model</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 transition-all"
                                style={{ width: `${(result.explainability.confidence_breakdown.financial_model || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-white text-sm font-medium">
                              {Math.round((result.explainability.confidence_breakdown.financial_model || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                          <div className="text-xs text-zinc-500 mb-1">News & Macro Agent</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${(result.explainability.confidence_breakdown.news_macro || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-white text-sm font-medium">
                              {Math.round((result.explainability.confidence_breakdown.news_macro || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                          <div className="text-xs text-zinc-500 mb-1">Competitor Agent</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-500 transition-all"
                                style={{ width: `${(result.explainability.confidence_breakdown.competitor || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-white text-sm font-medium">
                              {Math.round((result.explainability.confidence_breakdown.competitor || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audit Modal */}
        {showAuditModal && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111113] border border-white/[0.12] rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Security & System Audit Log</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-mono">
                      Trace Verification: {result.trace_id}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAuditModal(false)}
                    className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <span className="text-zinc-400 hover:text-white text-2xl">×</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <div className="bg-[#0a0a0b] rounded-lg p-4 border border-white/[0.06]">
                  <pre className="text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="p-6 border-t border-white/[0.06]">
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDashboard;
