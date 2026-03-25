import React from 'react';

const actionStyles = {
  buy: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  sell: 'text-red-300 bg-red-500/15 border-red-500/30',
  hold: 'text-amber-200 bg-amber-500/15 border-amber-500/30',
  monitor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
};

const verdictStyles = {
  buy: 'text-emerald-200',
  sell: 'text-red-200',
  hold: 'text-amber-200',
  monitor: 'text-blue-200',
};

const RecommendationBadge = ({ action = 'monitor', simpleVerdict = '' }) => {
  const key = String(action || 'monitor').toLowerCase();
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-semibold uppercase tracking-wide ${actionStyles[key] || actionStyles.monitor}`}>
        {key}
      </span>
      {simpleVerdict && (
        <p className={`text-xs max-w-xs text-right leading-snug ${verdictStyles[key] || verdictStyles.monitor}`}>
          {simpleVerdict}
        </p>
      )}
    </div>
  );
};

export default RecommendationBadge;
