import React from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, DollarSign, BarChart2 } from 'lucide-react';

const MetricTile = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden min-w-0">
    <div className={`p-1.5 rounded-lg shrink-0 ${accent}`}>
      <Icon className="w-3.5 h-3.5 text-white" />
    </div>
    <div className="min-w-0 flex-1 truncate">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-1 truncate">{label}</p>
      <p className="text-sm font-semibold text-white leading-none truncate">{value}</p>
    </div>
  </div>
);

const normalizePercentValue = (value, { fixDoubleScaled = false } = {}) => {
  if (value == null) return null;

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;

  if (Math.abs(numericValue) <= 1) {
    return numericValue * 100;
  }

  if (fixDoubleScaled && Math.abs(numericValue) > 100 && Math.abs(numericValue) <= 10000) {
    return numericValue / 100;
  }

  return numericValue;
};

const MetricsRibbon = ({ profile }) => {
  if (!profile) return null;

  const sector    = profile.sector       || profile.finnhubIndustry || '—';
  const pe        = profile.pe_ratio     || profile.peTTM           || null;
  const margin    = normalizePercentValue(profile.profit_margin ?? profile.netMarginTTM, { fixDoubleScaled: true });
  const yoyGrowth = normalizePercentValue(profile.revenue_growth_yoy ?? profile.revenue_growth);

  const fmtPct  = (v) => v != null ? `${Number(v).toFixed(1)}%` : '—';
  const fmtPe   = (v) => v != null ? `${Number(v).toFixed(1)}×` : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-2 gap-3"
    >
      <MetricTile icon={Building2} label="Sector"         value={sector}          accent="bg-indigo-500/20" />
      <MetricTile icon={BarChart2} label="P/E"            value={fmtPe(pe)}       accent="bg-violet-500/20" />
      <MetricTile icon={DollarSign} label="Margin"        value={fmtPct(margin)}  accent="bg-emerald-500/20" />
      <MetricTile icon={TrendingUp} label="Growth"        value={fmtPct(yoyGrowth)} accent="bg-sky-500/20" />
    </motion.div>
  );
};

export default MetricsRibbon;
