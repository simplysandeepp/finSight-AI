import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Activity, Globe, Users,
    Bell, Settings
} from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Market Overview', path: '/' },
        { icon: Activity, label: 'Active Signals', path: '/signals' },
        { icon: Globe, label: 'Sector Analysis', path: '/sector' },
        { icon: Users, label: 'Peer Benchmarking', path: '/peers' },
        { icon: Bell, label: 'Audit Trail', path: '/audit' },
        { icon: Settings, label: 'Configurations', path: '/configs' },
    ];

    return (
        <aside className="w-64 border-r border-zinc-900 bg-[#09090b]/50 backdrop-blur-xl flex flex-col pt-8">
            <div className="px-6 mb-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Activity className="text-white" size={22} />
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-tight">FinSight Ai</h1>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Intelligence Dashboard</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.path}
                        className={({ isActive }) =>
                            `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive
                                ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20'
                                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                            }`
                        }
                    >
                        <item.icon size={18} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-6">
                <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 rounded-2xl p-4 border border-zinc-700/30">
                    <p className="text-xs text-zinc-400 mb-3 font-medium">Model Status: v2.4a</p>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold text-zinc-200">Ensemble Active</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
