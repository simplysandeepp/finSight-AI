import React, { useState } from 'react';
import { GitCompareArrows, Loader2, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatFinancialMillions } from '../utils/formatters.js';

const ComparisonDashboard = () => {
  const [tickersInput, setTickersInput] = useState('AAPL,MSFT');
  const [asOfDate, setAsOfDate] = useState('2024-12-31');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  const compareRows = results.filter((r) => r.status === 'success').map((r) => ({
    ticker: r.ticker,
    revenue: Number(r?.result?.result?.final_forecast?.revenue_p50 || 0),
    confidence: Number(r?.result?.result?.combined_confidence || 0),
  }));

  const leader = compareRows.length
    ? [...compareRows].sort((a, b) => b.revenue - a.revenue)[0]
    : null;

  const parseTickers = (raw) => {
    return raw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 3);
  };

  const handleCompare = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tickers = parseTickers(tickersInput);
      if (tickers.length < 2) {
        throw new Error('Enter at least 2 ticker symbols separated by commas.');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/predict-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers, as_of_date: asOfDate }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.detail || `Request failed with status ${response.status}`);
      }

      setResults(body.results || []);
    } catch (err) {
      setError(err?.message || 'Comparison request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitCompareArrows className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl font-semibold">Comparison Mode</h1>
        </div>

        <form onSubmit={handleCompare} className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-zinc-400 mb-2">Tickers (2-3, comma separated)</label>
            <input
              value={tickersInput}
              onChange={(e) => setTickersInput(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#0a0a0b] border border-white/[0.08]"
              placeholder="AAPL, MSFT, GOOGL"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-2">As of date</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#0a0a0b] border border-white/[0.08]"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 font-medium"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Comparing...</span>
              ) : (
                'Compare Tickers'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <>
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Overlaid Revenue Forecast (P50)</h3>
              {leader && <span className="text-xs text-emerald-300">Relative strength leader: {leader.ticker}</span>}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={compareRows}>
                  <XAxis dataKey="ticker" stroke="#71717a" />
                  <YAxis stroke="#71717a" tickFormatter={formatFinancialMillions} />
                  <Tooltip formatter={(value, name) => [name === 'Confidence' ? value : formatFinancialMillions(value), name]} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#34d399" name="Revenue P50 (M)" strokeWidth={2} />
                  <Line type="monotone" dataKey="confidence" stroke="#60a5fa" name="Confidence" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((item) => {
            const recommendation = item?.result?.result?.recommendation?.action || 'monitor';
            const confidence = Math.round((item?.result?.result?.combined_confidence || 0) * 100);
            const revenue = item?.result?.result?.final_forecast?.revenue_p50;
            const ebitda = item?.result?.result?.final_forecast?.ebitda_p50;
            const strengthScore = typeof revenue === 'number' ? revenue * (confidence / 100) : 0;

            return (
              <div key={item.ticker} className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{item.ticker}</h2>
                  <span className="text-xs px-2 py-1 rounded border border-white/[0.1] uppercase">{recommendation}</span>
                </div>

                {item.status === 'error' ? (
                  <p className="text-sm text-red-400">{item.error || 'Prediction failed'}</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-500">Confidence</span><span>{confidence}%</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Revenue P50</span><span>{typeof revenue === 'number' ? formatFinancialMillions(revenue) : 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">EBITDA P50</span><span>{typeof ebitda === 'number' ? formatFinancialMillions(ebitda) : 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Relative Strength</span><span>{strengthScore.toFixed(2)}</span></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
};

export default ComparisonDashboard;
