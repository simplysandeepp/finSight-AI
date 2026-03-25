import React from 'react';

const styles = {
  buy: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  sell: 'text-red-300 bg-red-500/15 border-red-500/30',
  hold: 'text-amber-200 bg-amber-500/15 border-amber-500/30',
  monitor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
};

const RecommendationBadge = ({ action = 'monitor' }) => {
  const key = String(action || 'monitor').toLowerCase();
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-semibold uppercase tracking-wide ${styles[key] || styles.monitor}`}>
      {key}
    </span>
  );
};

export default RecommendationBadge;
