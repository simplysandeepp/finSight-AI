import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { BarChart, Menu, X, Activity, GitCompareArrows } from 'lucide-react';
import SimpleDashboard from './pages/SimpleDashboard.jsx';
import BacktestDashboard from './pages/BacktestDashboard.jsx';
import ComparisonDashboard from './pages/ComparisonDashboard.jsx';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0b]">
        <div
          className={`fixed left-0 top-0 h-full bg-[#0a0a0b] border-r border-white/[0.06] transition-all duration-300 z-40 ${
            isSidebarOpen ? 'w-64' : 'w-0'
          } overflow-hidden`}
        >
          <div className="p-6">
            <h1 className="text-4xl font-bold text-white mb-8">FinSight AI</h1>
            <nav className="space-y-2">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-zinc-400 hover:bg-white/[0.02] hover:text-white'
                  }`
                }
              >
                <BarChart className="w-5 h-5" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/backtest"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-zinc-400 hover:bg-white/[0.02] hover:text-white'
                  }`
                }
              >
                <Activity className="w-5 h-5" />
                <span>Backtest Results</span>
              </NavLink>

              <NavLink
                to="/compare"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-zinc-400 hover:bg-white/[0.02] hover:text-white'
                  }`
                }
              >
                <GitCompareArrows className="w-5 h-5" />
                <span>Compare Tickers</span>
              </NavLink>
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
            <Routes>
              <Route path="/" element={<SimpleDashboard />} />
              <Route path="/backtest" element={<BacktestDashboard />} />
              <Route path="/compare" element={<ComparisonDashboard />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
