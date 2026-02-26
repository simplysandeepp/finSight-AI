import React from 'react';
import { Globe, TrendingUp, BarChart3 } from 'lucide-react';

const SectorAnalysis = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-bold">Sector Analysis</h3>
                <p className="text-sm text-zinc-500">Cross-industry performance and sentiment aggregation.</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {['Technology', 'Energy', 'Healthcare'].map((sector) => (
                    <div key={sector} className="glass-card rounded-[32px] p-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{sector}</span>
                            <div className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-[10px] font-black">+12.4%</div>
                        </div>
                        <h4 className="text-xl font-bold">Overweight</h4>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[75%]" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-card rounded-[32px] p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-white/5">
                <Globe className="text-zinc-700" size={48} />
                <h4 className="text-lg font-bold text-zinc-400">Advanced Heatmaps Coming Soon</h4>
                <p className="text-sm text-zinc-600 max-w-sm">We are integrating real-time sector flows and macro-economic correlations into this module.</p>
            </div>
        </div>
    );
};

export default SectorAnalysis;
