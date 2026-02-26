import React from 'react';
import { Users } from 'lucide-react';

const PeerBenchmarking = ({ data }) => {
    const peers = data?.result?.peer_benchmarks || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-bold">Peer Benchmarking</h3>
                <p className="text-sm text-zinc-500">Compare target asset against sector competitors.</p>
            </div>

            {!data && (
                <div className="glass-card rounded-[32px] p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-white/5">
                    <Users className="text-zinc-700" size={48} />
                    <h4 className="text-lg font-bold text-zinc-400">Run a prediction first</h4>
                    <p className="text-sm text-zinc-600 max-w-sm">Go to Dashboard, enter a Company ID, and click Analyze to load peer data here.</p>
                </div>
            )}

            {peers.length > 0 && (
                <div className="glass-card rounded-[32px] overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase tracking-widest">Peer</th>
                                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase tracking-widest">Revenue Δ</th>
                                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase tracking-widest">Margin Δ</th>
                                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase tracking-widest">Position</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {peers.map((peer) => (
                                <tr key={peer.peer_id} className="hover:bg-white/[0.02]">
                                    <td className="px-6 py-4 font-mono text-sm font-bold text-blue-400">{peer.peer_id}</td>
                                    <td className={`px-6 py-4 text-sm font-bold ${peer.revenue_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {peer.revenue_delta >= 0 ? '+' : ''}{(peer.revenue_delta * 100).toFixed(1)}%
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-bold ${peer.margin_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {peer.margin_delta >= 0 ? '+' : ''}{(peer.margin_delta * 100).toFixed(1)}%
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                                            {data?.result?.relative_position_score > 0 ? 'Above' : 'Below'} Target
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PeerBenchmarking;
