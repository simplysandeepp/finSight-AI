import React from 'react';
import { Users, LayoutGrid, ArrowUpDown } from 'lucide-react';

const PeerBenchmarking = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-bold">Peer Benchmarking</h3>
                <p className="text-sm text-zinc-500">Compare target asset performance against sector competitors.</p>
            </div>

            <div className="glass-card rounded-[32px] p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-white/5">
                <Users className="text-zinc-700" size={48} />
                <h4 className="text-lg font-bold text-zinc-400">Competitive Insights Under Synthesis</h4>
                <p className="text-sm text-zinc-600 max-w-sm">Use the Dashboard for specific ticker peer analysis. This section will soon support bulk comparison and quadrant mapping.</p>
            </div>
        </div>
    );
};

export default PeerBenchmarking;
