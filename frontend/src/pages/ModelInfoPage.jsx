import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

const ModelInfoPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`${API}/api/model-info`);
      if (response.ok) {
        setData(await response.json());
      }
    };
    load();
  }, []);

  if (!data) return <div className="text-zinc-400">Loading model metadata...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Model Transparency</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#121520] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Model Version</p>
          <p className="text-xl font-semibold">{data.model_version || 'N/A'}</p>
        </div>
        <div className="bg-[#121520] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Data Source</p>
          <p className="text-xl font-semibold">{data.data_source || 'N/A'}</p>
        </div>
      </div>
      <pre className="text-xs text-zinc-300 bg-[#121520] border border-white/10 rounded-xl p-4 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default ModelInfoPage;
