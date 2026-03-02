import React from 'react';
import {
  Heart, TrendingUp, DollarSign, BarChart3, ArrowUp, ArrowDown,
  Minus, AlertCircle, Cpu, Info, CheckCircle2, LayoutDashboard
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

/* ── health-score label helper ── */
const healthLabel = (score) => {
  if (score >= 80) return { text: 'Financially Strong', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  if (score >= 60) return { text: 'Stable with Risks', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
  return { text: 'Needs Attention', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
};

/* ── arrow indicator ── */
const DeltaArrow = ({ value }) => {
  if (value > 0) return <ArrowUp size={14} className="text-emerald-400" />;
  if (value < 0) return <ArrowDown size={14} className="text-rose-400" />;
  return <Minus size={14} className="text-zinc-500" />;
};

const OrgDashboard = ({ data, error, orgName }) => {
  /* ── error state ── */
  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
        <AlertCircle className="text-rose-500" size={48} />
        <div>
          <h3 className="text-lg font-bold text-rose-400">Analysis Halted</h3>
          <p className="text-rose-400/70 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  /* ── empty / pre-upload state ── */
  if (!data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full" />
          <div className="relative p-10 bg-zinc-900/50 rounded-[40px] border border-zinc-800/50 shadow-2xl backdrop-blur-xl">
            <BarChart3 size={64} className="text-indigo-500/50 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-bold">Welcome{orgName ? `, ${orgName}` : ''}</h2>
          <p className="text-zinc-500 text-sm">
            Upload your quarterly financial data from the <span className="text-blue-400 font-medium">Upload Data</span> page to generate your company health analysis and competitor comparison.
          </p>
        </div>
      </div>
    );
  }

  /* ── derived values ── */
  const confidence = data.result?.combined_confidence ?? 0;
  const healthScore = Math.round(confidence * 100);
  const hl = healthLabel(healthScore);

  const revP50 = data.result?.final_forecast?.revenue_p50 ?? 0;
  const ebitdaP50 = data.result?.final_forecast?.ebitda_p50 ?? 0;
  const revCI = data.result?.final_forecast?.revenue_ci ?? [0, 0];
  const ebitdaCI = data.result?.final_forecast?.ebitda_ci ?? [0, 0];

  const peers = data.result?.agent_outputs?.competitor?.peer_rankings ?? [];

  const chartData = [
    { name: 'Revenue', value: revP50, high: revCI[1], low: revCI[0] },
    { name: 'EBITDA', value: ebitdaP50, high: ebitdaCI[1], low: ebitdaCI[0] },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ── Hero KPI Row ── */}
      <div className="grid grid-cols-12 gap-6">
        {/* Health Score */}
        <div className={`col-span-3 rounded-3xl p-6 flex flex-col justify-between h-40 border ${hl.border} ${hl.bg} backdrop-blur-xl`}>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Health Score</span>
          <div className="flex items-end gap-3 mt-auto">
            <Heart className={hl.color} size={28} />
            <span className={`text-4xl font-black tracking-tighter ${hl.color}`}>{healthScore}</span>
            <span className="text-sm text-zinc-400 mb-1">/ 100</span>
          </div>
          <p className={`text-[10px] font-semibold mt-1 ${hl.color}`}>{hl.text}</p>
        </div>

        {/* Confidence */}
        <div className="col-span-3 glass-card rounded-3xl p-6 flex flex-col justify-between h-40">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Ensemble Confidence</span>
          <div className="mt-4 space-y-3">
            <span className="text-3xl font-black tracking-tighter">{(confidence * 100).toFixed(0)}%</span>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${confidence * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Revenue Forecast */}
        <div className="col-span-3 glass-card rounded-3xl p-6 flex flex-col justify-between h-40">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Revenue Forecast</span>
          <p className="text-3xl font-black tracking-tighter mt-auto">${revP50.toFixed(1)}M</p>
          <p className="text-[10px] text-zinc-500">p05–p95: ${revCI[0].toFixed(1)}M – ${revCI[1].toFixed(1)}M</p>
        </div>

        {/* EBITDA Forecast */}
        <div className="col-span-3 glass-card rounded-3xl p-6 flex flex-col justify-between h-40">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">EBITDA Forecast</span>
          <p className="text-3xl font-black tracking-tighter mt-auto">${ebitdaP50.toFixed(1)}M</p>
          <p className="text-[10px] text-zinc-500">p05–p95: ${ebitdaCI[0].toFixed(1)}M – ${ebitdaCI[1].toFixed(1)}M</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* ── Forecast Chart ── */}
        <div className="col-span-8 glass-card rounded-[32px] p-10 h-[420px] flex flex-col">
          <div className="flex gap-4 items-center mb-8">
            <div className="w-2 h-8 bg-indigo-500 rounded-full" />
            <div>
              <h3 className="font-bold text-lg">Forecast Projection</h3>
              <p className="text-xs text-zinc-500">Probabilistic median vs range boundaries.</p>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={30}>
                <defs>
                  <linearGradient id="orgBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} unit="M" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', padding: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="high" fill="url(#orgBarGrad)" radius={[12, 12, 12, 12]} barSize={80} />
                <Bar dataKey="value" fill="#f4f4f5" radius={[12, 12, 12, 12]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Signal Attribution ── */}
        <div className="col-span-4 space-y-6">
          <div className="glass-card rounded-[32px] p-8">
            <div className="flex items-center gap-3 mb-8">
              <LayoutDashboard className="text-indigo-500" size={18} />
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Agent Attribution</h3>
            </div>
            <div className="space-y-6">
              {data.explainability?.confidence_breakdown &&
                Object.entries(data.explainability.confidence_breakdown).map(([agent, conf]) => (
                  <div key={agent} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-zinc-300 capitalize">{agent.replace('_', ' ')}</span>
                      <span className="text-[10px] font-mono text-indigo-400">{(conf * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ width: `${conf * 100}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Competitor Comparison Table ── */}
      {peers.length > 0 && (
        <div className="glass-card rounded-[32px] overflow-hidden">
          <div className="px-8 pt-8 pb-4 flex items-center gap-3">
            <Info className="text-blue-500" size={18} />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Competitor Comparison</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-white/[0.02]">
                <th className="px-8 py-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Company</th>
                <th className="px-8 py-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Revenue</th>
                <th className="px-8 py-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">EBITDA Margin</th>
                <th className="px-8 py-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Rev Growth</th>
                <th className="px-8 py-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {/* Org's own row */}
              <tr className="bg-indigo-500/[0.06]">
                <td className="px-8 py-4 text-sm font-bold text-indigo-400">{orgName || 'Your Company'}</td>
                <td className="px-8 py-4 text-sm font-medium text-zinc-200">${revP50.toFixed(1)}M</td>
                <td className="px-8 py-4 text-sm font-medium text-zinc-200">
                  {ebitdaP50 && revP50 ? `${((ebitdaP50 / revP50) * 100).toFixed(1)}%` : '—'}
                </td>
                <td className="px-8 py-4 text-sm text-zinc-400">—</td>
                <td className="px-8 py-4">
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 uppercase">You</span>
                </td>
              </tr>
              {/* Peer rows */}
              {peers.map((peer) => {
                const peerMargin = peer.margin != null ? peer.margin : 0;
                const orgMargin = revP50 ? ebitdaP50 / revP50 : 0;
                const aboveOrBelow = orgMargin >= peerMargin;
                return (
                  <tr key={peer.ticker} className="hover:bg-white/[0.02]">
                    <td className="px-8 py-4 text-sm font-mono font-bold text-blue-400">{peer.ticker}</td>
                    <td className="px-8 py-4 text-sm text-zinc-300">${peer.revenue?.toFixed(1) ?? '—'}M</td>
                    <td className="px-8 py-4 text-sm text-zinc-300">{(peerMargin * 100).toFixed(1)}%</td>
                    <td className="px-8 py-4 text-sm text-zinc-300">—</td>
                    <td className="px-8 py-4 flex items-center gap-1">
                      <DeltaArrow value={aboveOrBelow ? 1 : -1} />
                      <span className={`text-[10px] font-bold ${aboveOrBelow ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {aboveOrBelow ? 'Below You' : 'Above You'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Ensemble Intelligence Drivers ── */}
      {data.result?.explanations?.length > 0 && (
        <div className="glass-card rounded-[32px] p-8">
          <div className="flex items-center gap-3 mb-6">
            <Info className="text-blue-500" size={18} />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Analysis Insights</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {data.result.explanations.map((driver, idx) => (
              <div key={idx} className="group p-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-2xl transition-all duration-300 flex gap-5 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                  0{idx + 1}
                </div>
                <p className="text-[13px] text-zinc-300 leading-relaxed font-medium italic opacity-80 group-hover:opacity-100">{driver}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgDashboard;
