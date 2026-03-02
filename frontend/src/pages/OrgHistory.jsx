import React, { useEffect, useState } from 'react';
import { History, TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const HealthBadge = ({ score }) => {
  if (score == null) return <span className="text-zinc-600">—</span>;
  const color = score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'rose';
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${color}-500/20 text-${color}-400`}>
      {score.toFixed(1)}
    </span>
  );
};

const OrgHistory = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError('');
    try {
      const [financialsRes, analysisRes] = await Promise.all([
        axios.get(`/api/org-history?uid=${user.uid}`),
        axios.get(`/api/org-history?uid=${user.uid}&type=analysis`).catch(() => ({ data: { results: [] } })),
      ]);

      const financials = financialsRes.data?.records || [];
      const analyses = analysisRes.data?.results || [];

      // Merge financials with analysis results per quarter
      const merged = financials.map((f) => {
        const matchingAnalysis = analyses.find(
          a => a.quarter === f.quarter && a.year === f.year
        );
        return {
          ...f,
          label: `${f.quarter} ${f.year}`,
          health_score: matchingAnalysis?.health_score ?? null,
          confidence: matchingAnalysis?.confidence ?? null,
          signal: matchingAnalysis?.signal ?? null,
        };
      });

      // Sort by year, then quarter
      merged.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const qOrder = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
        return (qOrder[a.quarter] || 0) - (qOrder[b.quarter] || 0);
      });

      setData(merged);
    } catch (err) {
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.uid]);

  const formatCurrency = (v) => {
    if (v == null) return '—';
    return `$${Number(v).toFixed(1)}M`;
  };

  const latestGrowth = (() => {
    if (data.length < 2) return null;
    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    if (!last.revenue || !prev.revenue) return null;
    return ((last.revenue - prev.revenue) / prev.revenue * 100).toFixed(1);
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Quarterly History</h2>
          <p className="text-sm text-zinc-500 mt-1">Track your financial performance and AI-generated health scores over time.</p>
        </div>
        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex items-center gap-4">
          <AlertTriangle className="text-rose-400" size={22} />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {data.length === 0 && !error && (
        <div className="glass-card rounded-[32px] p-16 text-center">
          <History size={48} className="mx-auto text-zinc-600 mb-4" />
          <p className="text-lg font-bold text-zinc-400 mb-1">No History Yet</p>
          <p className="text-sm text-zinc-600">Upload quarterly financial data to get started.</p>
        </div>
      )}

      {data.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-[32px] p-8">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Quarters Tracked</p>
              <p className="text-4xl font-bold">{data.length}</p>
            </div>
            <div className="glass-card rounded-[32px] p-8">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Latest Revenue</p>
              <p className="text-4xl font-bold text-blue-400">{formatCurrency(data[data.length - 1]?.revenue)}</p>
            </div>
            <div className="glass-card rounded-[32px] p-8">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">QoQ Growth</p>
              <div className="flex items-center gap-2">
                {latestGrowth !== null ? (
                  <>
                    {Number(latestGrowth) >= 0 ? (
                      <TrendingUp className="text-emerald-400" size={22} />
                    ) : (
                      <TrendingDown className="text-rose-400" size={22} />
                    )}
                    <span className={`text-4xl font-bold ${Number(latestGrowth) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {latestGrowth}%
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-zinc-600">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Revenue & EBITDA Chart */}
          <div className="glass-card rounded-[32px] p-8">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6">Revenue & EBITDA Trend</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ebitdaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${v}M`}
                />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(v) => [`$${Number(v).toFixed(1)}M`]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3B82F6" fill="url(#revGrad)" strokeWidth={2} dot={{ r: 4, fill: '#3B82F6' }} />
                <Area type="monotone" dataKey="ebitda" name="EBITDA" stroke="#8B5CF6" fill="url(#ebitdaGrad)" strokeWidth={2} dot={{ r: 4, fill: '#8B5CF6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* History Table */}
          <div className="glass-card rounded-[32px] overflow-hidden">
            <div className="px-8 pt-8 pb-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Detailed History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800 bg-white/[0.02]">
                    <th className="px-6 py-3 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Quarter</th>
                    <th className="px-6 py-3 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Revenue</th>
                    <th className="px-6 py-3 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">EBITDA</th>
                    <th className="px-6 py-3 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Net Income</th>
                    <th className="px-6 py-3 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Expenses</th>
                    <th className="px-6 py-3 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Health Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {[...data].reverse().map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-zinc-200">{row.label}</td>
                      <td className="px-6 py-4 text-sm text-blue-400 font-mono">{formatCurrency(row.revenue)}</td>
                      <td className="px-6 py-4 text-sm text-violet-400 font-mono">{formatCurrency(row.ebitda)}</td>
                      <td className="px-6 py-4 text-sm text-emerald-400 font-mono">{formatCurrency(row.net_income)}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400 font-mono">{formatCurrency(row.expenses)}</td>
                      <td className="px-6 py-4"><HealthBadge score={row.health_score} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrgHistory;
