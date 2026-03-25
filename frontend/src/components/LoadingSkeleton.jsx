import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Forecast Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
            <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-zinc-700 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
          </div>
        ))}
      </div>

      {/* Agent Confidence Skeleton */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
        <div className="h-5 bg-zinc-800 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-4 bg-zinc-800 rounded w-1/5"></div>
              <div className="flex-1 h-4 bg-zinc-800 rounded"></div>
              <div className="h-4 bg-zinc-800 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>

      {/* SHAP Values Skeleton */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
        <div className="h-5 bg-zinc-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="h-8 bg-zinc-800 rounded flex-1"></div>
              <div className="h-8 bg-zinc-800 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
