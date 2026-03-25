import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ShapExplainer = ({ shapValues = [] }) => {
  if (!shapValues.length) return null;

  const rows = shapValues.slice(0, 8).map((v) => ({
    name: String(v.feature || '').replace(/_/g, ' '),
    value: Number(v.shap || 0),
  }));

  return (
    <div className="bg-[#121520] border border-white/10 rounded-2xl p-5">
      <h3 className="text-lg font-semibold mb-3">SHAP Waterfall (Top Factors)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical">
            <XAxis type="number" stroke="#71717a" />
            <YAxis dataKey="name" type="category" width={120} stroke="#71717a" />
            <Tooltip />
            <Bar dataKey="value" fill="#22d3ee" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ShapExplainer;
