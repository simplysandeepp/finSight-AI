import React, { useState } from 'react';
import { BarChart, Menu, X } from 'lucide-react';
import SimpleDashboard from './pages/SimpleDashboard.jsx';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <div
        className={`fixed left-0 top-0 h-full bg-[#0a0a0b] border-r border-white/[0.06] transition-all duration-300 z-40 ${
          isSidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="p-6">
          <h1 className="text-4xl font-bold text-white mb-8">FinSight AI</h1>
          <nav className="space-y-2">
            <button
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors bg-emerald-500/10 text-emerald-400"
              type="button"
            >
              <BarChart className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
          </nav>
        </div>
      </div>

      <div className="fixed top-0 right-0 left-0 h-16 bg-[#0a0a0b] border-b border-white/[0.06] flex items-center justify-between px-6 z-30">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-white/[0.02] rounded-lg transition-colors"
          type="button"
        >
          {isSidebarOpen ? <X className="w-5 h-5 text-zinc-400" /> : <Menu className="w-5 h-5 text-zinc-400" />}
        </button>
        <div className="text-emerald-400 text-sm">FinSight AI - Demo Mode</div>
      </div>

      <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6">
          <SimpleDashboard />
        </div>
      </div>
    </div>
  );
};

export default App;
