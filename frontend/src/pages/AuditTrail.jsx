import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Clock, Database, Search, AlertTriangle } from 'lucide-react';

const AuditTrail = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    const filteredLogs = logs.filter(log =>
        log.request_id?.toLowerCase().includes(search.toLowerCase()) ||
        log.status?.toLowerCase().includes(search.toLowerCase()) ||
        log.company_id?.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await axios.get('/api/audit');
                setLogs(response.data);
            } catch (err) {
                setError('Failed to fetch audit logs.');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold">Audit Trail</h3>
                    <p className="text-sm text-zinc-500">Immutable record of all predictive system requests.</p>
                </div>
                <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2 items-center gap-3">
                    <Search size={16} className="text-zinc-500" />
                    <input 
                        className="bg-transparent border-none focus:ring-0 text-sm w-48 outline-none" 
                        placeholder="Search logs..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
            )}

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center">
                    <AlertTriangle className="text-rose-500 mx-auto mb-4" size={32} />
                    <p className="text-rose-400 font-medium">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className="glass-card rounded-[32px] overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Request ID</th>
                                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Company</th>
                                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Status</th>
                                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Latency</th>
                                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Model</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filteredLogs.map((log) => (
                                <tr key={log.request_id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="text-zinc-500" />
                                            <span className="text-xs text-zinc-300 font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded">{log.request_id.slice(0, 8)}...</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono text-zinc-400">{log.company_id || '—'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            <span className="text-xs capitalize text-zinc-400">{log.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-zinc-400 font-medium">{log.latency_ms}ms</td>
                                    <td className="px-6 py-4 text-xs font-bold text-zinc-500">{log.model_version}</td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-zinc-500 text-sm">No audit logs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AuditTrail;
