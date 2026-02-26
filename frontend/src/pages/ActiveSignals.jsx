import React from 'react';
import { Activity, Zap, ArrowRight } from 'lucide-react';

const ActiveSignals = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-bold">Active Signals</h3>
                <p className="text-sm text-zinc-500">Currently monitored assets with pending revisions.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {['AAPL', 'NVDA', 'TSLA'].map((ticker) => (
                    <div key={ticker} className="glass-card rounded-2xl p-6 flex items-center justify-between group cursor-pointer hover:bg-white/[0.04]">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center font-black text-blue-500">
                                {ticker}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Strategic Signal: Buy</h4>
                                <p className="text-[10px] text-zinc-500">Updated 2 hours ago • Confidence 82%</p>
                            </div>
                        </div>
                        <ArrowRight size={18} className="text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveSignals;
