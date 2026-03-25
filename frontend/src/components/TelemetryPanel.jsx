import React from 'react';

const TelemetryPanel = ({ result }) => {
  if (!result) return null;
  const lat = result.agent_latencies || {};

  return (
    <div className="bg-[#121520] border border-white/10 rounded-xl p-4 space-y-2">
      <h3 className="text-sm font-semibold text-zinc-200">System Telemetry</h3>
      <div className="text-xs text-zinc-400">Total Latency: {(result.latency_ms / 1000).toFixed(2)}s</div>
      <div className="text-xs text-zinc-500">NLP: {lat.transcript_nlp ?? '--'}ms</div>
      <div className="text-xs text-zinc-500">Financial: {lat.financial_model ?? '--'}ms</div>
      <div className="text-xs text-zinc-500">News: {lat.news_macro ?? '--'}ms</div>
      <div className="text-xs text-zinc-500">Competitor: {lat.competitor ?? '--'}ms</div>
      <div className="text-[11px] text-zinc-600 font-mono break-all">Trace: {result.trace_id}</div>
    </div>
  );
};

export default TelemetryPanel;
