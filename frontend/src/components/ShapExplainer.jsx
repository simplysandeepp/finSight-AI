import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { humanizeFeature } from '../utils/formatters.js';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="glass-panel px-3 py-2 text-xs">
      <p className="text-white font-medium">{item.payload.name}</p>
      <p className={item.value >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
        SHAP: {item.value.toFixed(4)}
      </p>
    </div>
  );
};

const ShapExplainer = ({ shapValues = [] }) => {
  if (!shapValues.length) return null;

  const rows = shapValues.slice(0, 8).map((v) => ({
    name: humanizeFeature(String(v.feature || '')),
    value: Number(v.shap || 0),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="glass-panel p-5"
    >
      <h3 className="text-lg font-semibold mb-1 text-white">SHAP Waterfall — Top Drivers</h3>
      <p className="text-xs text-gray-400 mb-4">Green bars push revenue higher; red bars lower the prediction.</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24 }}>
            <XAxis type="number" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis
              dataKey="name"
              type="category"
              width={188}
              stroke="transparent"
              tick={{ fill: '#d1d5db', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]}>
              {rows.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.value >= 0 ? 'rgba(52,211,153,0.75)' : 'rgba(239,68,68,0.75)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default ShapExplainer;
