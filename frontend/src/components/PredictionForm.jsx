import React from 'react';
import { TrendingUp, Upload } from 'lucide-react';

const HORIZON_OPTIONS = [
  { value: 1, label: '+3 Months (1 Quarter)' },
  { value: 2, label: '+6 Months (2 Quarters)' },
  { value: 3, label: '+9 Months (3 Quarters)' },
  { value: 4, label: '+1 Year (4 Quarters)' },
];

const PredictionForm = ({
  role,
  setRole,
  loading,
  ticker,
  setTicker,
  horizon,
  setHorizon,
  csvFile,
  setCsvFile,
  orgDate,
  setOrgDate,
  onInvestorSubmit,
  onOrgSubmit,
}) => {
  return (
    <div className="bg-[#121520] border border-white/10 rounded-2xl p-5">
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setRole('investor')}
          className={`px-4 py-2 rounded-lg border text-sm ${role === 'investor' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'border-white/10 text-zinc-300'}`}
        >
          Investor
        </button>
        <button
          onClick={() => setRole('organization')}
          className={`px-4 py-2 rounded-lg border text-sm ${role === 'organization' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'border-white/10 text-zinc-300'}`}
        >
          Organization
        </button>
      </div>

      {role === 'investor' ? (
        <form onSubmit={onInvestorSubmit} className="space-y-3">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-lg bg-[#0b0e16] border border-white/10 text-zinc-100 placeholder-zinc-500"
            placeholder="Ticker: AAPL"
            required
          />
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Forecast Horizon</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg bg-[#0b0e16] border border-white/10 text-zinc-100 appearance-none cursor-pointer"
            >
              {HORIZON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button disabled={loading} className="w-full px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium inline-flex justify-center items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Analyze Company
          </button>
        </form>
      ) : (
        <form onSubmit={onOrgSubmit} className="space-y-3">
          <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} className="w-full px-4 py-3 rounded-lg bg-[#0b0e16] border border-white/10" required />
          {csvFile && <p className="text-xs text-cyan-300">{csvFile.name}</p>}
          <input type="date" value={orgDate} onChange={(e) => setOrgDate(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-[#0b0e16] border border-white/10" required />
          <button disabled={loading} className="w-full px-4 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium inline-flex justify-center items-center gap-2">
            <Upload className="w-4 h-4" /> Analyze CSV
          </button>
        </form>
      )}
    </div>
  );
};

export default PredictionForm;
