import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Activity,
  Target,
  BarChart3,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const BacktestDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backtestData, setBacktestData] = useState(null);
  const [selectedTicker, setSelectedTicker] = useState(null);

  useEffect(() => {
    fetchBacktestResults();
  }, []);

  const fetchBacktestResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/backtest-results`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Backtest results not found. Run backtest first.');
        }
        throw new Error(`Failed to fetch backtest results: ${response.statusText}`);
      }

      const data = await response.json();
      setBacktestData(data);

      // Set first ticker as default selection
      if (data.ticker_summaries && Object.keys(data.ticker_summaries).length > 0) {
        setSelectedTicker(Object.keys(data.ticker_summaries)[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runBacktest = async () => {
    if (!confirm('Running backtest will take several minutes. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/run-backtest`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Failed to run backtest: ${response.statusText}`);
      }

      const data = await response.json();
      setBacktestData(data.results);

      if (data.results.ticker_summaries && Object.keys(data.results.ticker_summaries).length > 0) {
        setSelectedTicker(Object.keys(data.results.ticker_summaries)[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading backtest results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-400 font-semibold mb-2">Error Loading Backtest</h3>
            <p className="text-zinc-400 text-sm mb-4">{error}</p>
            <button
              onClick={runBacktest}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
            >
              Run Backtest Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!backtestData) {
    return (
      <div className="text-center text-zinc-400 py-12">
        <Activity className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
        <p>No backtest data available</p>
      </div>
    );
  }

  const { overall_summary, ticker_summaries, detailed_results, metadata } = backtestData;

  // Prepare chart data for selected ticker
  const selectedTickerResults = detailed_results?.filter(r => r.ticker === selectedTicker) || [];
  const chartData = selectedTickerResults.map(r => ({
    quarter: r.quarter,
    actual: r.revenue.actual,
    predicted: r.revenue.predicted_p50,
    p05: r.revenue.predicted_p05,
    p95: r.revenue.predicted_p95,
    withinCI: r.revenue.within_ci
  }));

  // Calculate pass/fail for each ticker
  const getPassFail = (ticker) => {
    const summary = ticker_summaries[ticker];
    const mapePass = summary.revenue.avg_mape < 15; // <15% MAPE is good
    const coveragePass = summary.revenue.pi_coverage > 0.80; // >80% coverage is good
    return mapePass && coveragePass;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Historical Backtest Results</h1>
          <p className="text-zinc-400">
            Model accuracy verified against real market data ({metadata?.test_window})
          </p>
        </div>
        <button
          onClick={runBacktest}
          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Activity className="w-4 h-4" />
          <span>Run Fresh Backtest</span>
        </button>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h3 className="text-zinc-400 text-sm font-medium">Overall MAPE</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            {overall_summary?.revenue?.avg_mape?.toFixed(2)}%
          </p>
          <p className="text-xs text-zinc-500 mt-1">Mean Absolute % Error</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-zinc-400 text-sm font-medium">PI Coverage</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            {(overall_summary?.revenue?.pi_coverage * 100)?.toFixed(1)}%
          </p>
          <p className="text-xs text-zinc-500 mt-1">Actuals within prediction interval</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-zinc-400 text-sm font-medium">Directional Accuracy</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            {(overall_summary?.revenue?.directional_accuracy * 100)?.toFixed(1)}%
          </p>
          <p className="text-xs text-zinc-500 mt-1">Correct trend predictions</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-zinc-400 text-sm font-medium">Quarters Tested</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            {overall_summary?.total_quarters || 0}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Across {overall_summary?.tickers_tested || 0} companies</p>
        </div>
      </div>

      {/* Ticker Accuracy Scorecard */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Per-Ticker Accuracy Scorecard</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-4 text-zinc-400 font-medium">Ticker</th>
                <th className="text-right py-3 px-4 text-zinc-400 font-medium">Quarters</th>
                <th className="text-right py-3 px-4 text-zinc-400 font-medium">Avg MAPE</th>
                <th className="text-right py-3 px-4 text-zinc-400 font-medium">PI Coverage</th>
                <th className="text-right py-3 px-4 text-zinc-400 font-medium">Directional</th>
                <th className="text-center py-3 px-4 text-zinc-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ticker_summaries || {}).map(([ticker, summary]) => {
                const passed = getPassFail(ticker);
                return (
                  <tr
                    key={ticker}
                    className={`border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.02] ${
                      selectedTicker === ticker ? 'bg-emerald-500/5' : ''
                    }`}
                    onClick={() => setSelectedTicker(ticker)}
                  >
                    <td className="py-3 px-4">
                      <span className="text-white font-medium">{ticker}</span>
                    </td>
                    <td className="text-right py-3 px-4 text-zinc-300">{summary.quarters_tested}</td>
                    <td className="text-right py-3 px-4 text-zinc-300">
                      {summary.revenue.avg_mape.toFixed(2)}%
                    </td>
                    <td className="text-right py-3 px-4 text-zinc-300">
                      {(summary.revenue.pi_coverage * 100).toFixed(1)}%
                    </td>
                    <td className="text-right py-3 px-4 text-zinc-300">
                      {(summary.revenue.directional_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="text-center py-3 px-4">
                      {passed ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 inline" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-400 inline" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prediction vs Actual Chart */}
      {selectedTicker && chartData.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {selectedTicker} - Revenue Prediction vs Actual
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="predictionBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="quarter"
                stroke="#a1a1aa"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#a1a1aa"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}B`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => `$${(value / 1000).toFixed(2)}B`}
              />
              <Legend />

              {/* Prediction Interval Band */}
              <Area
                type="monotone"
                dataKey="p95"
                stroke="none"
                fill="url(#predictionBand)"
                name="P95"
              />
              <Area
                type="monotone"
                dataKey="p05"
                stroke="none"
                fill="#0a0a0b"
                name="P05"
              />

              {/* Predicted P50 Line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#10b981"
                strokeWidth={2}
                name="Predicted (P50)"
                dot={{ fill: '#10b981', r: 4 }}
              />

              {/* Actual Values */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Actual"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill={payload.withinCI ? '#10b981' : '#ef4444'}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span className="text-zinc-400">Within Prediction Interval</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-zinc-400">Outside Prediction Interval</span>
            </div>
          </div>
        </div>
      )}

      {/* Example Highlight Card */}
      {selectedTickerResults.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-3">Example Prediction Highlight</h3>
          {(() => {
            const example = selectedTickerResults[0];
            const inCI = example.revenue.within_ci;
            return (
              <p className="text-zinc-300">
                Our model predicted <span className="text-white font-semibold">{selectedTicker}</span>{' '}
                {example.quarter} revenue at{' '}
                <span className="text-emerald-400 font-semibold">
                  ${(example.revenue.predicted_p05 / 1000).toFixed(1)}B–${(example.revenue.predicted_p95 / 1000).toFixed(1)}B
                </span>
                . Actual: <span className="text-white font-semibold">${(example.revenue.actual / 1000).toFixed(2)}B</span>{' '}
                <span className={`font-semibold ${inCI ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {inCI ? '✅' : '⚠️'}
                </span>
              </p>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default BacktestDashboard;
