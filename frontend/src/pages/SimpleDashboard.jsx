import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import MetricsRibbon from '../components/MetricsRibbon.jsx';
import { formatFinancialMillions } from '../utils/formatters.js';

const API = import.meta.env.VITE_API_URL;

const SimpleDashboard = () => {
  const [role, setRole] = useState('investor');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [ticker, setTicker] = useState(() => localStorage.getItem('dashboard_ticker') || 'AAPL');
  const [horizon, setHorizon] = useState(() => Number(localStorage.getItem('dashboard_horizon')) || 1);

  // Sync to local storage
  useEffect(() => {
    if (result) localStorage.setItem('dashboard_result', JSON.stringify(result));
    else localStorage.removeItem('dashboard_result');
  }, [result]);

  useEffect(() => {
    localStorage.setItem('dashboard_ticker', ticker);
  }, [ticker]);

  useEffect(() => {
    localStorage.setItem('dashboard_horizon', horizon);
  }, [horizon]);

  const handleClear = () => {
    setResult(null);
    setTicker('AAPL');
    setHorizon(1);
    setError('');
    localStorage.removeItem('dashboard_result');
    localStorage.removeItem('dashboard_ticker');
    localStorage.removeItem('dashboard_horizon');
    setAgentProgress([]);
  };
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
      } catch { /* optional */ }
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
        if (msg.type === 'final') { resolve(msg.result); socket.close(); return; }
        if (msg.type === 'error') { reject(new Error(msg.message || 'Prediction failed')); socket.close(); }
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
      const data = await runWebsocketPrediction({ company_id: ticker, horizon_quarters: horizon });
      setResult(data);
    } catch (err) {
      setError(err?.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) { setError('Please select a CSV file'); return; }
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

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Financial Analysis Dashboard</h1>
            <p className="text-gray-400 mt-1 text-sm">Multi-agent forecasting with explainability and auditability</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClear}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear All
            </button>
            {backtestStats?.tickers_tested > 0 && backtestStats?.revenue?.avg_mape > 0 && (
              <Link
                to="/backtest"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm hover:bg-emerald-500/15 transition-colors"
              >
                <Activity className="w-4 h-4" />
                MAPE {backtestStats.revenue.avg_mape.toFixed(1)}% | Coverage {(backtestStats.revenue.pi_coverage * 100).toFixed(0)}%
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-3 text-sm text-red-300 inline-flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left sidebar */}
          <div className="space-y-4">
            <PredictionForm
              role={role} setRole={setRole} loading={loading}
              ticker={ticker} setTicker={setTicker}
              horizon={horizon} setHorizon={setHorizon}
              csvFile={csvFile} setCsvFile={setCsvFile}
              orgDate={orgDate} setOrgDate={setOrgDate}
              onInvestorSubmit={handleInvestorSubmit}
              onOrgSubmit={handleOrgSubmit}
            />

            {/* Metrics ribbon (after result) */}
            {result?.company_profile && (
              <MetricsRibbon profile={result.company_profile} />
            )}

            <TelemetryPanel result={result} />

            {result && (
              <button
                onClick={() => setShowAuditModal(true)}
                className="w-full px-4 py-3 glass-panel text-left hover:border-indigo-500/30 transition-colors"
              >
                <p className="text-sm font-medium text-white">Open Audit JSON</p>
                <p className="text-xs text-gray-500 mt-1">View raw pipeline payload and trace</p>
              </button>
            )}

            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-indigo-300" />
                <h3 className="text-sm font-semibold text-white">Prediction History ({ticker})</h3>
              </div>
              {!history.length ? (
                <p className="text-xs text-gray-500">No history yet for this ticker.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-auto">
                  {history.slice(0, 8).map((item) => (
                    <div key={item.id} className="text-xs border border-white/10 rounded-lg p-2 bg-white/5">
                      <div className="text-gray-500">{item.created_at}</div>
                      <div className="text-gray-200">Revenue P50: {formatFinancialMillions(item.revenue_p50 || 0)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main results area */}
          <div className="lg:col-span-2 space-y-4" id="dashboard-export-area">
            {/* Results header */}
            <div className="glass-panel p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Analysis Result</h2>
                <p className="text-sm text-gray-400">
                  {result?.horizon_quarters
                    ? `${result.horizon_quarters}Q forecast → ${result.resolved_target_date || result.as_of_date}`
                    : 'Live multi-agent orchestration output'}
                </p>
              </div>
              {result && (
                <div className="flex items-center gap-3">
                  <RecommendationBadge
                    action={result.result?.recommendation?.action}
                    simpleVerdict={result.result?.recommendation?.simple_verdict}
                  />
                  <ExecutiveReport disabled={!result} />
                </div>
              )}
            </div>

            {/* Loading state */}
            {loading && (
              <div className="space-y-4">
                <div className="glass-panel p-5">
                  <p className="text-sm text-gray-400 mb-3">Agent Progress</p>
                  <AgentProgressTracker steps={agentProgress} />
                </div>
                <LoadingSkeleton />
              </div>
            )}

            {/* Empty state */}
            {!loading && !result && (
              <EmptyState
                title="Enter a ticker symbol to get started"
                subtitle="You will see forecast fan charts, confidence radar, and explainability factors."
              />
            )}

            {/* Results */}
            {!loading && result && (
              <>
                {/* Simple verdict hero banner */}
                {result.result?.recommendation?.simple_verdict && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`glass-panel p-5 text-center ${
                      result.result.recommendation.action === 'buy'
                        ? 'border-emerald-500/25 glow-emerald'
                        : result.result.recommendation.action === 'sell'
                        ? 'border-red-500/25 glow-red'
                        : 'border-amber-500/25 glow-amber'
                    }`}
                  >
                    <p className="text-lg font-semibold text-white">
                      {result.result.recommendation.simple_verdict}
                    </p>
                  </motion.div>
                )}
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
