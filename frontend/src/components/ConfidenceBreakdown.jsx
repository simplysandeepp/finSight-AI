import React from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const ConfidenceBreakdown = ({ breakdown }) => {
  if (!breakdown) return null;

  const data = [
    { agent: 'NLP',  value: Math.round((breakdown.transcript_nlp  || 0) * 100) },
    { agent: 'Fin',  value: Math.round((breakdown.financial_model || 0) * 100) },
    { agent: 'News', value: Math.round((breakdown.news_macro      || 0) * 100) },
    { agent: 'Comp', value: Math.round((breakdown.competitor      || 0) * 100) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass-panel p-5"
    >
      <h3 className="text-lg font-semibold text-white mb-3">Agent Confidence Radar</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="agent" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#374151" tick={{ fill: '#4b5563', fontSize: 10 }} />
            <Radar
              name="Confidence"
              dataKey="value"
              stroke="#e2e8f0"
              fill="#e2e8f0"
              fillOpacity={0.12}
              strokeWidth={1.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default ConfidenceBreakdown;
