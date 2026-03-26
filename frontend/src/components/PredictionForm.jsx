import React from 'react';
import { TrendingUp, Upload } from 'lucide-react';

const HORIZON_OPTIONS = [
  { value: 1, label: '+3 Months (1 Quarter)' },
  { value: 2, label: '+6 Months (2 Quarters)' },
  { value: 3, label: '+9 Months (3 Quarters)' },
  { value: 4, label: '+1 Year (4 Quarters)' },
];

const PredictionForm = ({
  role, setRole, loading,
  ticker, setTicker,
  horizon, setHorizon,
  csvFile, setCsvFile,
  orgDate, setOrgDate,
  onInvestorSubmit, onOrgSubmit,
}) => {
  return (
    <div className="glass-panel p-5">
      {/* Role switcher */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setRole('investor')}
          className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
            role === 'investor'
              ? 'bg-white/10 border-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
              : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Investor
        </button>
        <button
          onClick={() => setRole('organization')}
          className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
            role === 'organization'
              ? 'bg-white/10 border-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
              : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Organization
        </button>
      </div>

      {role === 'investor' ? (
        <form onSubmit={onInvestorSubmit} className="space-y-3">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors"
            placeholder="Ticker symbol: AAPL"
            required
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Forecast Horizon</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer"
            >
              {HORIZON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0d0d0f] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl font-semibold text-sm inline-flex justify-center items-center gap-2 transition-all
              bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
              shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed text-white"
          >
            <TrendingUp className="w-4 h-4" />
            {loading ? 'Analyzing...' : 'Analyze Company'}
          </button>
        </form>
      ) : (
        <form onSubmit={onOrgSubmit} className="space-y-3">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-sm"
            required
          />
          {csvFile && <p className="text-xs text-indigo-300">{csvFile.name}</p>}
          <input
            type="date"
            value={orgDate}
            onChange={(e) => setOrgDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-white/20"
            required
          />
          <button
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl font-semibold text-sm inline-flex justify-center items-center gap-2
              bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500
              shadow-[0_0_20px_rgba(14,165,233,0.3)] disabled:opacity-50 text-white"
          >
            <Upload className="w-4 h-4" />
            {loading ? 'Analyzing...' : 'Analyze CSV'}
          </button>
        </form>
      )}
    </div>
  );
};

export default PredictionForm;
