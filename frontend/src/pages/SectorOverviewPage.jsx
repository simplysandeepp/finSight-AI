import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

const SectorOverviewPage = () => {
  const [data, setData] = useState({ sectors: [] });

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`${API}/api/sector-overview`);
      if (response.ok) {
        setData(await response.json());
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Sector Overview</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {(data.sectors || []).map((s) => (
          <div key={s.sector} className="bg-[#121520] border border-white/10 rounded-xl p-4">
            <p className="text-lg font-semibold">{s.sector}</p>
            <p className="text-sm text-zinc-400 mt-1">Avg forecast direction: {s.average_direction}</p>
            <p className="text-sm text-zinc-400">Best: {s.best_company || 'N/A'}</p>
            <p className="text-sm text-zinc-400">Worst: {s.worst_company || 'N/A'}</p>
            <p className="text-sm text-zinc-400">Macro sentiment: {s.macro_sentiment || 'neutral'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectorOverviewPage;
