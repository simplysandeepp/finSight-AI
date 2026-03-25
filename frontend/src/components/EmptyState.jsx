import React from 'react';
import { Sparkles } from 'lucide-react';

const EmptyState = ({ title, subtitle }) => (
  <div className="h-72 flex flex-col items-center justify-center text-center bg-[radial-gradient(circle_at_top,#1f293733,transparent_65%)] rounded-xl border border-dashed border-white/15">
    <Sparkles className="w-10 h-10 text-cyan-300 mb-3" />
    <h3 className="text-lg font-semibold text-zinc-200">{title}</h3>
    <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
  </div>
);

export default EmptyState;
