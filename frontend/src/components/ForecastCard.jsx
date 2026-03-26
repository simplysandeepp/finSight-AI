import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatFinancialMillions } from '../utils/formatters.js';

const AnimatedValue = ({ value = 0, durationMs = 700, formatValue }) => {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const target = Number(value || 0);
    const start = performance.now();
    let rafId = 0;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [value, durationMs]);

  return <>{formatValue ? formatValue(display) : display.toFixed(2)}</>;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-3 py-2 text-xs space-y-1">
      <p className="text-gray-300">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {formatFinancialMillions(p.value)}</p>
      ))}
    </div>
  );
};

const ForecastCard = ({ result }) => {
  const forecast = result?.result?.final_forecast;
  if (!forecast) return null;

  const revenueData = React.useMemo(() => ([
    { name: 'Bear', low: forecast.revenue_ci?.[0] || 0, median: forecast.revenue_p50 || 0, high: forecast.revenue_ci?.[1] || 0 },
    { name: 'Base', low: forecast.revenue_ci?.[0] || 0, median: forecast.revenue_p50 || 0, high: forecast.revenue_ci?.[1] || 0 },
    { name: 'Bull', low: forecast.revenue_ci?.[0] || 0, median: forecast.revenue_p50 || 0, high: forecast.revenue_ci?.[1] || 0 },
  ]), [forecast]);

  const spark = React.useMemo(() => {
    const base = forecast.revenue_p50 || 0;
    return [0.92, 0.96, 1.0, 1.05, 1.03, 1.08].map((m, idx) => ({ i: idx, v: base * m }));
  }, [forecast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-5 space-y-4"
    >
      <h3 className="text-lg font-semibold text-white">Forecast Fan Chart</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#e2e8f0" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#e2e8f0" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f8fafc" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f8fafc" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#374151" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis stroke="#374151" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={formatFinancialMillions} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="high"   name="Bull" stroke="#e2e8f0" strokeWidth={1.5} fill="url(#gradHigh)" />
            <Area type="monotone" dataKey="low"    name="Bear" stroke="#94a3b8" strokeWidth={1.5} fill="url(#gradLow)"  />
            <Area type="monotone" dataKey="median" name="Base" stroke="#f8fafc" strokeWidth={2}   fill="url(#gradMed)"  />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Revenue P50</p>
          <p className="text-2xl font-bold text-white">
            <AnimatedValue value={forecast.revenue_p50 || 0} formatValue={formatFinancialMillions} />
          </p>
          <p className="text-xs text-gray-500 mt-1">
            EBITDA P50: <span className="text-gray-300"><AnimatedValue value={forecast.ebitda_p50 || 0} formatValue={formatFinancialMillions} /></span>
          </p>
        </div>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spark}>
              <Line type="monotone" dataKey="v" stroke="#e2e8f0" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default ForecastCard;
