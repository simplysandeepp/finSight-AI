import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, ArrowRight } from 'lucide-react';

const ActiveSignals = () => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/audit').then(res => {
            setSignals(res.data.slice(0, 10));
        }).catch(() => {
            setSignals([]);
        }).finally(() => setLoading(false));
    }, []);

    const getActionColor = (action) => {
        if (!action) return 'text-zinc-400';
        if (action.includes('buy')) return 'text-emerald-400';
        if (action.includes('sell')) return 'text-rose-400';
        return 'text-indigo-400';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-bold">Active Signals</h3>
                <p className="text-sm text-zinc-500">Recent predictions from the intelligence engine.</p>
            </div>

            {loading && <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>}

            <div className="grid grid-cols-1 gap-4">
                {signals.length === 0 && !loading && (
                    <div className="glass-card rounded-2xl p-12 text-center text-zinc-500">
                        <Activity className="mx-auto mb-4 text-zinc-700" size={40} />
                        <p>No signals yet. Run a prediction from the Dashboard.</p>
                    </div>
                )}
                {signals.map((sig) => {
                    const result = typeof sig.final_output_json === 'string'
                        ? JSON.parse(sig.final_output_json || '{}')
                        : (sig.final_output_json || {});
                    const action = result?.recommendation?.action || 'monitor';
                    const confidence = result?.combined_confidence;
                    return (
                        <div key={sig.request_id} className="glass-card rounded-2xl p-6 flex items-center justify-between group cursor-pointer hover:bg-white/[0.04]">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center font-black text-blue-500 text-xs">
                                    {sig.company_id || '—'}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm capitalize ${getActionColor(action)}`}>Signal: {action}</h4>
                                    <p className="text-[10px] text-zinc-500">
                                        {sig.timestamp ? new Date(sig.timestamp).toLocaleString() : '—'}
                                        {confidence ? ` • Confidence ${(confidence * 100).toFixed(0)}%` : ''}
                                        {sig.status === 'partial' ? ' • ⚠ Partial' : ''}
                                    </p>
                                </div>
                            </div>
                            <ArrowRight size={18} className="text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActiveSignals;
