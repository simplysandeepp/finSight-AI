import React from 'react';
import { Search, Zap } from 'lucide-react';

const Navbar = ({ companyId, setCompanyId, asOfDate, setAsOfDate, handlePredict, loading }) => {
    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-10 py-6 bg-background/80 backdrop-blur-md border-b border-zinc-900">
            <div className="flex items-center gap-8">
                <div>
                    <h2 className="text-xl font-semibold">FinSight Ai Analysis</h2>
                    <p className="text-xs text-zinc-500">Processing company-specific probabilistic forecasts.</p>
                </div>
            </div>

            <form onSubmit={handlePredict} className="flex items-center gap-3">
                <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2 items-center gap-3 focus-within:border-blue-500/50 transition-all shadow-inner">
                    <Search size={16} className="text-zinc-500" />
                    <input
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm w-32 outline-none font-medium"
                        placeholder="Search ticker..."
                    />
                    <div className="w-px h-4 bg-zinc-800 mx-2" />
                    <input
                        type="date"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-xs text-zinc-400 outline-none uppercase font-bold"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={16} />}
                    {loading ? 'Analyzing' : 'Signal'}
                </button>
            </form>
        </header>
    );
};

export default Navbar;
