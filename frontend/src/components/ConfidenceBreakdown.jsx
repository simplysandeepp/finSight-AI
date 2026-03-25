import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const ConfidenceBreakdown = ({ breakdown }) => {
  if (!breakdown) return null;

  const data = [
    { agent: 'NLP', value: Math.round((breakdown.transcript_nlp || 0) * 100) },
    { agent: 'Fin', value: Math.round((breakdown.financial_model || 0) * 100) },
    { agent: 'News', value: Math.round((breakdown.news_macro || 0) * 100) },
    { agent: 'Comp', value: Math.round((breakdown.competitor || 0) * 100) },
  ];

  return (
    <div className="bg-[#121520] border border-white/10 rounded-2xl p-5">
      <h3 className="text-lg font-semibold mb-3">Agent Confidence Radar</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis dataKey="agent" stroke="#a1a1aa" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#71717a" />
            <Radar name="Confidence" dataKey="value" stroke="#34d399" fill="#34d399" fillOpacity={0.35} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ConfidenceBreakdown;
