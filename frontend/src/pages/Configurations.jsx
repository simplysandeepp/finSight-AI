import React from 'react';
import { Settings, Shield, Sliders, Database } from 'lucide-react';

const Configurations = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-bold">System Configurations</h3>
                <p className="text-sm text-zinc-500">Fine-tune agent parameters and API integrations.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {[
                    { label: 'Agent Confidence thresholds', icon: Sliders, value: '0.65' },
                    { label: 'Storage Persistance', icon: Database, value: 'SQLite Active' },
                    { label: 'Security Protocols', icon: Shield, value: 'AES-256' },
                ].map((item) => (
                    <div key={item.label} className="group glass-card rounded-3xl p-6 flex items-center justify-between hover:bg-white/[0.04] transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                                <item.icon size={20} className="text-zinc-400 group-hover:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-zinc-300">{item.label}</span>
                        </div>
                        <span className="text-xs font-bold text-blue-500">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Configurations;
