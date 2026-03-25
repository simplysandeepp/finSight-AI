import React from 'react';
import { TrendingUp, Upload } from 'lucide-react';

const PredictionForm = ({
  role,
  setRole,
  loading,
  ticker,
  setTicker,
  date,
  setDate,
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
            className="w-full px-4 py-3 rounded-lg bg-[#0b0e16] border border-white/10"
            placeholder="Ticker: AAPL"
            required
          />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-[#0b0e16] border border-white/10" required />
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
