import React, { useMemo, useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatFinancialMillions } from '../utils/formatters.js';

const AnimatedValue = ({ value = 0, durationMs = 700, formatValue }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value || 0);
    const start = performance.now();
    let rafId = 0;

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [value, durationMs]);

  return <>{formatValue ? formatValue(display) : display.toFixed(2)}</>;
};

const ForecastCard = ({ result }) => {
  const forecast = result?.result?.final_forecast;
  if (!forecast) return null;

  const revenueData = useMemo(() => ([
    { name: 'Bear', low: forecast.revenue_ci?.[0] || 0, median: forecast.revenue_p50 || 0, high: forecast.revenue_ci?.[1] || 0 },
    { name: 'Base', low: forecast.revenue_ci?.[0] || 0, median: forecast.revenue_p50 || 0, high: forecast.revenue_ci?.[1] || 0 },
    { name: 'Bull', low: forecast.revenue_ci?.[0] || 0, median: forecast.revenue_p50 || 0, high: forecast.revenue_ci?.[1] || 0 },
  ]), [forecast]);

  const spark = useMemo(() => {
    const base = forecast.revenue_p50 || 0;
    return [0.92, 0.96, 1.0, 1.05, 1.03, 1.08].map((m, idx) => ({ i: idx, v: base * m }));
  }, [forecast]);

  return (
    <div className="bg-[#121520] border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="text-lg font-semibold">Forecast Fan Chart</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData}>
            <XAxis dataKey="name" stroke="#71717a" />
            <YAxis stroke="#71717a" tickFormatter={formatFinancialMillions} />
            <Tooltip formatter={(value) => formatFinancialMillions(value)} />
            <Area type="monotone" dataKey="high" stroke="#60a5fa" fill="#60a5fa33" />
            <Area type="monotone" dataKey="low" stroke="#f87171" fill="#f8717133" />
            <Area type="monotone" dataKey="median" stroke="#34d399" fill="#34d39933" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-zinc-500">Revenue P50</p>
          <p className="text-xl font-bold text-emerald-300">
            <AnimatedValue value={forecast.revenue_p50 || 0} formatValue={formatFinancialMillions} />
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            EBITDA P50: <AnimatedValue value={forecast.ebitda_p50 || 0} formatValue={formatFinancialMillions} />
          </p>
        </div>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spark}>
              <Line type="monotone" dataKey="v" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ForecastCard;
