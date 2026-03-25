import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertCircle, Database } from 'lucide-react';
import PredictionForm from '../components/PredictionForm.jsx';
import AgentProgressTracker from '../components/AgentProgressTracker.jsx';
import ForecastCard from '../components/ForecastCard.jsx';
import ConfidenceBreakdown from '../components/ConfidenceBreakdown.jsx';
import ShapExplainer from '../components/ShapExplainer.jsx';
import RecommendationBadge from '../components/RecommendationBadge.jsx';
import TelemetryPanel from '../components/TelemetryPanel.jsx';
import ExecutiveReport from '../components/ExecutiveReport.jsx';
import AuditModal from '../components/AuditModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';

const API = import.meta.env.VITE_API_URL;

const SimpleDashboard = () => {
  const [role, setRole] = useState('investor');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [ticker, setTicker] = useState('AAPL');
  const [date, setDate] = useState('2024-12-31');
  const [csvFile, setCsvFile] = useState(null);
  const [orgDate, setOrgDate] = useState('2026-01-01');
  const [agentProgress, setAgentProgress] = useState([]);
  const [backtestStats, setBacktestStats] = useState(null);
  const [history, setHistory] = useState([]);

  const confidenceBreakdown = result?.explainability?.confidence_breakdown || null;

  useEffect(() => {
    const loadBacktest = async () => {
      try {
        const res = await fetch(`${API}/api/backtest-results`);
        if (res.ok) {
          const body = await res.json();
          setBacktestStats(body.overall_summary || null);
        }
      } catch {
        // optional widget
      }
    };
    loadBacktest();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!ticker) return;
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API}/api/prediction-history?ticker=${encodeURIComponent(ticker)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const body = await res.json();
          setHistory(body.history || []);
        }
      } catch {
        setHistory([]);
      }
    };
    loadHistory();
  }, [ticker, result]);

  const wsUrl = useMemo(() => {
    if (!API) return '';
    return `${API.replace(/^http/i, 'ws')}/ws/predict`;
  }, []);

  const runWebsocketPrediction = async (payload) => {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => socket.send(JSON.stringify(payload));

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'progress') {
          setAgentProgress((prev) => {
            const next = [...prev];
            const idx = next.findIndex((s) => s.step === msg.step);
            if (idx === -1) next.push(msg);
            else next[idx] = { ...next[idx], ...msg };
            return next;
          });
          return;
        }

        if (msg.type === 'final') {
          resolve(msg.result);
          socket.close();
          return;
        }

        if (msg.type === 'error') {
          reject(new Error(msg.message || 'Prediction failed'));
          socket.close();
        }
      };

      socket.onerror = () => reject(new Error('WebSocket connection failed'));
    });
  };

  const handleInvestorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAgentProgress([]);
    try {
      const data = await runWebsocketPrediction({ company_id: ticker, as_of_date: date });
      setResult(data);
    } catch (err) {
      setError(err?.message || 'Prediction failed');
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
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('as_of_date', orgDate);
      const response = await fetch(`${API}/upload-csv`, { method: 'POST', body: formData });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.detail || `Failed (${response.status})`);
      setResult(body);
    } catch (err) {
      setError(err?.message || 'CSV analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!result) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API}/api/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prediction_result: result }),
      });
      if (!response.ok) {
        throw new Error(`Report generation failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FinSight_Executive_Report_${result.request_id || 'report'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || 'Report download failed');
    }
  };

  return (
    <div className="min-h-screen text-zinc-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Financial Analysis Dashboard</h1>
            <p className="text-zinc-400 mt-1">Multi-agent forecasting with explainability and auditability</p>
          </div>
          {backtestStats && (
            <Link
              to="/backtest"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm"
            >
              <Activity className="w-4 h-4" />
              MAPE {backtestStats.revenue?.avg_mape?.toFixed(1)}% | Coverage {(backtestStats.revenue?.pi_coverage * 100)?.toFixed(0)}%
            </Link>
          )}
        </div>

        {error && (
          <div className="border border-red-500/40 bg-red-500/15 rounded-lg p-3 text-sm text-red-200 inline-flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="space-y-4">
            <PredictionForm
              role={role}
              setRole={setRole}
              loading={loading}
              ticker={ticker}
              setTicker={setTicker}
              date={date}
              setDate={setDate}
              csvFile={csvFile}
              setCsvFile={setCsvFile}
              orgDate={orgDate}
              setOrgDate={setOrgDate}
              onInvestorSubmit={handleInvestorSubmit}
              onOrgSubmit={handleOrgSubmit}
            />

            <TelemetryPanel result={result} />

            {result && (
              <button
                onClick={() => setShowAuditModal(true)}
                className="w-full px-4 py-3 rounded-lg bg-[#121520] border border-white/10 hover:border-cyan-500/50 text-left"
              >
                <p className="text-sm font-medium">Open Audit JSON</p>
                <p className="text-xs text-zinc-500 mt-1">View raw pipeline payload and trace</p>
              </button>
            )}

            <div className="bg-[#121520] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-cyan-300" />
                <h3 className="text-sm font-semibold">Prediction History ({ticker})</h3>
              </div>
              {!history.length ? (
                <p className="text-xs text-zinc-500">No history yet for this ticker.</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-auto">
                  {history.slice(0, 8).map((item) => (
                    <div key={item.id} className="text-xs border border-white/10 rounded-md p-2">
                      <div className="text-zinc-400">{item.created_at}</div>
                      <div className="text-zinc-200">Revenue P50: ${Number(item.revenue_p50 || 0).toFixed(2)}M</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#121520] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Analysis Result</h2>
                <p className="text-sm text-zinc-500">Live multi-agent orchestration output</p>
              </div>
              {result && (
                <div className="flex items-center gap-3">
                  <RecommendationBadge action={result.result?.recommendation?.action} />
                  <ExecutiveReport onDownload={handleDownloadReport} disabled={!result} />
                </div>
              )}
            </div>

            {loading && (
              <div className="space-y-4">
                <div className="bg-[#121520] border border-white/10 rounded-2xl p-5">
                  <p className="text-sm text-zinc-400 mb-3">Agent Progress</p>
                  <AgentProgressTracker steps={agentProgress} />
                </div>
                <LoadingSkeleton />
              </div>
            )}

            {!loading && !result && (
              <EmptyState
                title="Enter a ticker symbol to get started"
                subtitle="You will see forecast fan charts, confidence radar, and explainability factors."
              />
            )}

            {!loading && result && (
              <>
                <ForecastCard result={result} />
                <ConfidenceBreakdown breakdown={confidenceBreakdown} />
                <ShapExplainer shapValues={result.explainability?.shap_values || []} />
              </>
            )}
          </div>
        </div>
      </div>

      <AuditModal open={showAuditModal} result={result} onClose={() => setShowAuditModal(false)} />
    </div>
  );
};

export default SimpleDashboard;
