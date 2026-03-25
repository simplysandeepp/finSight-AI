import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-4xl w-full rounded-3xl border border-white/10 p-8 bg-[radial-gradient(circle_at_10%_10%,#34d39933,transparent_40%),radial-gradient(circle_at_90%_20%,#22d3ee22,transparent_35%),#0e111a]">
        <p className="uppercase tracking-[0.2em] text-xs text-cyan-300">FinSight AI</p>
        <h1 className="text-5xl font-black mt-3 leading-tight">Proof-Driven
          <span className="block text-emerald-300">Financial Intelligence</span>
        </h1>
        <p className="text-zinc-300 mt-4 max-w-2xl">Forecast revenue and EBITDA using a multi-agent system, with confidence diagnostics, backtesting evidence, and executive-grade reporting.</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
            Open Dashboard <ChevronRight className="w-4 h-4" />
          </Link>
          <Link to="/backtest" className="px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5">View Backtest Proof</Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
