import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid,
} from 'recharts';
import { Activity, CheckCircle, AlertTriangle, XCircle, Zap, Database, TrendingUp, Target } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const StatCard = ({ icon: Icon, label, value, sub, accent, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="glass-panel p-5 flex items-start gap-4"
  >
    <div className={`p-2.5 rounded-xl ${accent}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  </motion.div>
);

const StatusBadge = ({ status }) => {
  const map = {
    success: { label: 'Complete',  cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    partial: { label: 'Degraded',  cls: 'bg-amber-500/15  text-amber-300  border-amber-500/30'  },
    error:   { label: 'Failed',    cls: 'bg-red-500/15    text-red-300    border-red-500/30'    },
  };
  const s = map[status] || map.partial;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-3 py-2 text-xs space-y-1">
      <p className="text-gray-300 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [history, setHistory] = useState([]);
  const [backtest, setBacktest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  // Popular tickers to aggregate history across
  const TOP_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMZN', 'META'];

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch prediction history for each ticker
        const allRecords = [];
        await Promise.allSettled(
          TOP_TICKERS.map(async (ticker) => {
            try {
              const res = await fetch(`${API}/api/prediction-history?ticker=${ticker}&limit=50`);
              if (res.ok) {
                const body = await res.json();
                (body.history || []).forEach((r) => allRecords.push({ ...r, ticker }));
              }
            } catch { /* skip */ }
          })
        );
        allRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setHistory(allRecords);

        // Fetch backtest results
        const bt = await fetch(`${API}/api/backtest-results`);
        if (bt.ok) setBacktest(await bt.json());
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalPredictions = history.length;
  const avgLatency = history.length
    ? Math.round(history.reduce((s, r) => s + (r.latency_ms || 0), 0) / history.length)
    : 0;
  const successRate = history.length
    ? Math.round((history.filter(r => r.status === 'success').length / history.length) * 100)
    : 0;
  const globalMape = backtest?.overall_summary?.revenue?.avg_mape?.toFixed(1) ?? '—';

  // ── Chart data: volume + avg-latency by day ───────────────────────────────
  const chartData = (() => {
    const byDay = {};
    history.forEach((r) => {
      const day = (r.created_at || '').slice(0, 10);
      if (!day) return;
      if (!byDay[day]) byDay[day] = { date: day, volume: 0, latency: [] };
      byDay[day].volume += 1;
      if (r.latency_ms) byDay[day].latency.push(r.latency_ms);
    });
    return Object.values(byDay)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((d) => ({
        date: d.date.slice(5), // show MM-DD
        volume: d.volume,
        latency: d.latency.length
          ? Math.round(d.latency.reduce((s, v) => s + v, 0) / d.latency.length)
          : 0,
      }));
  })();

  // ── Ticker leaderboard ────────────────────────────────────────────────────
  const tickerLeaderboard = (() => {
    const counts = {};
    history.forEach((r) => { counts[r.ticker] = (counts[r.ticker] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7);
  })();

  // ── Paginated table rows ──────────────────────────────────────────────────
  const pageRows = history.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(history.length / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm">System usage, prediction volume, and model accuracy</p>
      </div>

      {/* Top Row — Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Database}   label="Total Predictions"  value={totalPredictions} sub="across all tickers"         accent="bg-indigo-500/20" delay={0} />
        <StatCard icon={Zap}        label="Avg Latency"        value={`${(avgLatency/1000).toFixed(2)}s`}  sub="end-to-end pipeline"  accent="bg-violet-500/20" delay={0.1} />
        <StatCard icon={Target}     label="Success Rate"       value={`${successRate}%`}  sub="complete vs degraded"     accent="bg-emerald-500/20" delay={0.2} />
        <StatCard icon={TrendingUp} label="Model MAPE"         value={globalMape !== '—' ? `${globalMape}%` : '—'} sub="backtest accuracy"    accent="bg-sky-500/20" delay={0.3} />
      </div>

      {/* Middle Row — Combo chart + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel p-5 lg:col-span-2"
        >
          <h3 className="text-base font-semibold text-white mb-4">Prediction Volume &amp; Latency (Last 14 Days)</h3>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">No data yet — run some predictions first.</div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis yAxisId="left"  stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} unit="ms" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                  <Bar    yAxisId="left"  dataKey="volume"  name="Predictions" fill="rgba(99,102,241,0.5)" radius={[3,3,0,0]} />
                  <Line  yAxisId="right" dataKey="latency" name="Avg Latency (ms)" stroke="#34d399" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Ticker Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-panel p-5"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" /> Ticker Search Velocity
          </h3>
          <div className="space-y-2">
            {tickerLeaderboard.length === 0 && (
              <p className="text-sm text-gray-500">No data yet.</p>
            )}
            {tickerLeaderboard.map(([ticker, count], idx) => (
              <div key={ticker} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-4 text-right">{idx + 1}</span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm font-mono font-semibold text-white w-14">{ticker}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-400"
                      style={{ width: `${Math.min(100, (count / (tickerLeaderboard[0]?.[1] || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row — Paginated Query Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-panel p-5"
      >
        <h3 className="text-base font-semibold text-white mb-4">Recent Prediction Queries</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500">No prediction history available yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider">
                    <th className="text-left py-2 pr-4">Timestamp</th>
                    <th className="text-left py-2 pr-4">Ticker</th>
                    <th className="text-right py-2 pr-4">Revenue P50</th>
                    <th className="text-right py-2 pr-4">Latency</th>
                    <th className="text-right py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2 pr-4 text-gray-400 font-mono">{(row.created_at || '').slice(0, 16)}</td>
                      <td className="py-2 pr-4 font-semibold text-white">{row.ticker}</td>
                      <td className="py-2 pr-4 text-right text-emerald-300 font-mono">
                        {row.revenue_p50 ? `$${(row.revenue_p50 / 1000).toFixed(1)}B` : '—'}
                      </td>
                      <td className="py-2 pr-4 text-right text-gray-400">
                        {row.latency_ms ? `${(row.latency_ms / 1000).toFixed(2)}s` : '—'}
                      </td>
                      <td className="py-2 text-right">
                        <StatusBadge status={row.status || 'partial'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 disabled:opacity-30 hover:bg-white/5"
                >
                  ← Previous
                </button>
                <span className="text-xs text-gray-500">Page {page + 1} of {totalPages}</span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 disabled:opacity-30 hover:bg-white/5"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
