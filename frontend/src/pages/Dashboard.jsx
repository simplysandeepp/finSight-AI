import React, { useState } from 'react';
import {
    TrendingUp, ShieldAlert, AlertCircle, Cpu, Info,
    LayoutDashboard, CheckCircle2, ExternalLink, ArrowRight
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import ModeToggle from '../components/ModeToggle';
import InvestorDashboard from '../components/InvestorDashboard';
import StartupDashboard from '../components/StartupDashboard';

const Dashboard = ({ data, error, recStyles, chartData }) => {
    const [mode, setMode] = useState("investor");
    const companyProfile = data?.company_profile;

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

    if (!data) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full" />
                    <div className="relative p-10 bg-zinc-900/50 rounded-[40px] border border-zinc-800/50 shadow-2xl backdrop-blur-xl">
                        <TrendingUp size={64} className="text-blue-500/50 animate-pulse-slow" />
                    </div>
                </div>
                <div className="space-y-2 max-w-sm">
                    <h2 className="text-2xl font-bold">Ready for Analysis</h2>
                    <p className="text-zinc-500 text-sm">Enter a system company ID (e.g. COMP_007) and reference date to initiate multi-modal signal extraction.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Mode Toggle */}
            <div className="flex justify-center mb-6">
                <ModeToggle mode={mode} onToggle={setMode} />
            </div>

            {/* Conditional Dashboard Rendering */}
            {mode === "investor" ? (
                <InvestorDashboard result={data} companyProfile={companyProfile} />
            ) : (
                <StartupDashboard result={data} companyProfile={companyProfile} />
            )}

            {/* Original Dashboard (kept for reference) */}
            <div className="mt-12 pt-8 border-t border-zinc-800">
                <h3 className="text-sm text-zinc-500 mb-6 uppercase tracking-wider">Technical Details</h3>
            
            {data.result.human_review_required && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center">
                            <ShieldAlert className="text-rose-500" size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-rose-400 text-sm">Escalation Triggered: Human Verification Required</h4>
                            <p className="text-rose-400/60 text-xs">High uncertainty detected in ensemble drivers. Professional validation mandated.</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-xs font-bold transition-all">Escalate Now</button>
                </div>
            )}

            <div className="grid grid-cols-12 gap-6">
                {/* KPI Grid */}
                <div className="col-span-12 grid grid-cols-4 gap-6">
                    <div className="glass-card rounded-3xl p-6 flex flex-col justify-between h-40">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Strategic Signal</span>
                        <div className="flex items-center gap-3 mt-4">
                            <div className={`w-12 h-12 rounded-2xl ${recStyles.bg} flex items-center justify-center border ${recStyles.border}`}>
                                <recStyles.icon className={recStyles.color} size={24} />
                            </div>
                            <div>
                                <p className={`text-2xl font-black ${recStyles.color}`}>{recStyles.label}</p>
                                <p className="text-[10px] text-zinc-500 font-medium">Model Recommendation</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-3xl p-6 flex flex-col justify-between h-40">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Ensemble Confidence</span>
                            <span className={`text-[8px] font-black px-2 py-1 rounded uppercase tracking-tighter ${data.data_source === 'live_vantage' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {data.data_source === 'live_vantage' ? 'LIVE' : 'SYNTHETIC'}
                            </span>
                        </div>
                        <div className="mt-4 space-y-3">
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black tracking-tighter">{(data.result.combined_confidence * 100).toFixed(0)}%</span>
                                <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">CALIBRATED</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${data.result.combined_confidence * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-3xl p-6 col-span-2 flex flex-col justify-between h-40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Cpu size={120} />
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Revenue Forecast (p50)</span>
                        <div className="flex items-end justify-between relative">
                            <div>
                                <p className="text-4xl font-black tracking-tighter">${data.result.final_forecast.revenue_p50.toFixed(1)}M</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <TrendingUp size={14} className="text-blue-400" />
                                    <span className="text-xs text-zinc-400">Probabilistic Variance: <span className="text-zinc-200 font-bold">${(data.result.final_forecast.revenue_ci[1] - data.result.final_forecast.revenue_ci[0]).toFixed(1)}M</span></span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-tighter">p05 - p95</p>
                                <p className="text-xs font-medium text-zinc-300">${data.result.final_forecast.revenue_ci[0].toFixed(1)}M - ${data.result.final_forecast.revenue_ci[1].toFixed(1)}M</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Analysis Sections */}
                <div className="col-span-8 space-y-6">
                    <div className="glass-card rounded-[32px] p-10 h-[480px] flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex gap-4 items-center">
                                <div className="w-2 h-8 bg-blue-500 rounded-full" />
                                <div>
                                    <h3 className="font-bold text-lg">Forecast Projection</h3>
                                    <p className="text-xs text-zinc-500">Probabilistic median vs range boundaries.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500/20 rounded-[4px] border border-blue-500/30" />
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Confidence Range</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-white rounded-full" />
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">P50 Median</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={30}>
                                    <defs>
                                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#27272a" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#52525b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={15}
                                    />
                                    <YAxis
                                        stroke="#52525b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        unit="M"
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="high" fill="url(#barGrad)" radius={[12, 12, 12, 12]} barSize={80} />
                                    <Bar dataKey="value" fill="#f4f4f5" radius={[12, 12, 12, 12]} barSize={12} offset={-6} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card rounded-[32px] p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Info className="text-blue-500" size={18} />
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Ensemble Intelligence Drivers</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {data.result.explanations?.map((driver, idx) => (
                                <div key={idx} className="group p-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-2xl transition-all duration-300 flex gap-5 items-start">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                                        0{idx + 1}
                                    </div>
                                    <p className="text-[13px] text-zinc-300 leading-relaxed font-medium italic opacity-80 group-hover:opacity-100">
                                        {driver}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Analysis Sections */}
                <div className="col-span-4 space-y-6">
                    <div className="glass-card rounded-[32px] p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <LayoutDashboard className="text-indigo-500" size={18} />
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Signal Attribution</h3>
                        </div>
                        <div className="space-y-6">
                            {data.explainability.confidence_breakdown && Object.entries(data.explainability.confidence_breakdown).map(([agent, conf], idx) => (
                                <div key={idx} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-zinc-300 tracking-tight capitalize">{agent.replace('_', ' ')}</span>
                                        <span className="text-[10px] font-mono text-indigo-400">{(conf * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                            style={{ width: `${conf * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-8 border-t border-zinc-800/50">
                            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                <span>Ensemble Total</span>
                                <span className="text-zinc-300">{(data.result.combined_confidence * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-[32px] p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <CheckCircle2 className="text-emerald-500" size={18} />
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">System Health</h3>
                        </div>
                        <div className="space-y-2">
                            {data.agents_called.map((agent) => {
                                const isDegraded = data.degraded_agents.includes(agent);
                                return (
                                    <div key={agent} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] group hover:bg-white/[0.04] transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${isDegraded ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors capitalize font-medium">{agent.replace('_', ' ')}</span>
                                        </div>
                                        {isDegraded && (
                                            <span className="text-[8px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">DEGRADED</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-1 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-xl overflow-hidden group">
                        <div className="bg-[#151518] rounded-[calc(1.5rem-2px)] p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                    <ExternalLink size={20} className="text-orange-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Full Report</p>
                                    <p className="text-[10px] text-zinc-500">PDF Generation Available</p>
                                </div>
                            </div>
                            <ArrowRight size={18} className="text-zinc-600 group-hover:text-zinc-200 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default Dashboard;
