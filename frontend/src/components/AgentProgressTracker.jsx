import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Clock3 } from 'lucide-react';

const labelMap = {
  data_fetch: 'Data Fetch',
  financial_model: 'Financial Model',
  news_macro: 'News & Macro',
  competitor: 'Competitor',
  ensembler: 'Ensembler',
};

const StepIcon = ({ status }) => {
  if (status === 'done') {
    return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  }
  if (status === 'running') {
    return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
  }
  if (status === 'error') {
    return <AlertCircle className="w-4 h-4 text-red-400" />;
  }
  return <Clock3 className="w-4 h-4 text-zinc-500" />;
};

const AgentProgressTracker = ({ steps = [] }) => {
  const ordered = ['data_fetch', 'financial_model', 'news_macro', 'competitor', 'ensembler'];

  return (
    <div className="w-full max-w-xl space-y-2">
      {ordered.map((key) => {
        const found = steps.find((s) => s.step === key) || { step: key, status: 'pending', message: 'Waiting...' };
        return (
          <div
            key={key}
            className="flex items-center justify-between p-3 rounded-lg border border-white/[0.08] bg-[#0a0a0b]/80"
          >
            <div className="flex items-center gap-3">
              <StepIcon status={found.status} />
              <div>
                <p className="text-sm text-zinc-200 font-medium">{labelMap[key]}</p>
                <p className="text-xs text-zinc-500">{found.message || 'Waiting...'}</p>
              </div>
            </div>
            <div className="text-xs text-zinc-400 min-w-14 text-right">
              {found.latency_ms ? `${found.latency_ms}ms` : '--'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AgentProgressTracker;
