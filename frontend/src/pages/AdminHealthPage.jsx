import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

const AdminHealthPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API}/api/admin/health`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        setData(await response.json());
      }
    };
    load();
  }, []);

  if (!data) return <div className="text-zinc-400">Loading admin health...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Admin Monitoring</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-[#121520] border border-white/10 rounded-xl p-4"><p className="text-xs text-zinc-500">Uptime</p><p className="text-xl">{data.uptime_seconds}s</p></div>
        <div className="bg-[#121520] border border-white/10 rounded-xl p-4"><p className="text-xs text-zinc-500">Avg Latency</p><p className="text-xl">{data.average_prediction_latency_ms}ms</p></div>
        <div className="bg-[#121520] border border-white/10 rounded-xl p-4"><p className="text-xs text-zinc-500">Cache Hit Rate</p><p className="text-xl">{data.cache_hit_rate}%</p></div>
      </div>
      <pre className="text-xs text-zinc-300 bg-[#121520] border border-white/10 rounded-xl p-4 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default AdminHealthPage;
