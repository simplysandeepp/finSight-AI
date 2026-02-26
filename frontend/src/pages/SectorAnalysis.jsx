import React from 'react';
import { Globe, TrendingUp } from 'lucide-react';

const SectorAnalysis = ({ data }) => {
    const macroData = data?.result?.macro_sentiment;
    const newsAgent = data?.explainability?.confidence_breakdown?.news_macro;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-bold">Sector Analysis</h3>
                <p className="text-sm text-zinc-500">Cross-industry performance and sentiment aggregation.</p>
            </div>

            {!data && (
                <div className="glass-card rounded-[32px] p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-white/5">
                    <Globe className="text-zinc-700" size={48} />
                    <h4 className="text-lg font-bold text-zinc-400">Run a prediction first</h4>
                    <p className="text-sm text-zinc-600 max-w-sm">Go to Dashboard, enter a Company ID, and click Analyze to load sector data here.</p>
                </div>
            )}

            {data && (
                <>
                    <div className="glass-card rounded-[32px] p-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Macro Sentiment</span>
                            {newsAgent && (
                                <div className={`px-2 py-1 rounded text-[10px] font-black ${newsAgent > 0.7 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    Confidence {(newsAgent * 100).toFixed(0)}%
                                </div>
                            )}
                        </div>
                        <h4 className="text-xl font-bold">{macroData?.sentiment || 'Neutral'}</h4>
                        <p className="text-sm text-zinc-500">{macroData?.summary || 'Market conditions are stable with moderate growth expectations.'}</p>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${(newsAgent || 0.5) * 100}%` }} />
                        </div>
                    </div>

                    <div className="glass-card rounded-[32px] p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-white/5">
                        <Globe className="text-zinc-700" size={48} />
                        <h4 className="text-lg font-bold text-zinc-400">Advanced Heatmaps Coming Soon</h4>
                        <p className="text-sm text-zinc-600 max-w-sm">We are integrating real-time sector flows and macro-economic correlations into this module.</p>
                    </div>
                </>
            )}
        </div>
    );
};

export default SectorAnalysis;
