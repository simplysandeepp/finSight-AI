import React from 'react';

const AboutPage = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">About FinSight AI</h1>
      <div className="bg-[#121520] border border-white/10 rounded-xl p-5 text-zinc-300 leading-relaxed">
        <p>FinSight AI is a multi-agent financial forecasting platform built for evidence-first analysis. It combines quantitative forecasting, transcript NLP, macro signals, and competitor context into a unified recommendation.</p>
        <p className="mt-3">Methodology:</p>
        <p>1. Fetch market and company context.</p>
        <p>2. Run specialized agents in parallel.</p>
        <p>3. Ensemble outputs with calibrated confidence.</p>
        <p>4. Explain decisions with SHAP and telemetry.</p>
      </div>
    </div>
  );
};

export default AboutPage;
