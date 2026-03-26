import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Activity, Home, Info, FlaskConical, Shield, GitCompareArrows, LineChart } from 'lucide-react';
import LandingPage from './pages/LandingPage.jsx';
import SimpleDashboard from './pages/SimpleDashboard.jsx';
import BacktestDashboard from './pages/BacktestDashboard.jsx';
import ComparisonDashboard from './pages/ComparisonDashboard.jsx';
import ModelInfoPage from './pages/ModelInfoPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import SectorOverviewPage from './pages/SectorOverviewPage.jsx';
import AdminHealthPage from './pages/AdminHealthPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AnalyticsDashboard from './pages/AnalyticsDashboard.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const navItems = [
  { to: '/',               label: 'Home',       icon: Home },
  { to: '/dashboard',      label: 'Dashboard',  icon: BarChart3 },
  { to: '/analytics',      label: 'Analytics',  icon: LineChart },
  { to: '/backtest',       label: 'Backtest',   icon: Activity },
  { to: '/model-info',     label: 'Model Info', icon: FlaskConical },
  { to: '/sector-overview',label: 'Sectors',    icon: Info },
  { to: '/compare',        label: 'Compare',    icon: GitCompareArrows },
  { to: '/about',          label: 'About',      icon: Info },
  { to: '/admin/health',   label: 'Admin',      icon: Shield },
  { to: '/auth',           label: 'Auth',       icon: Shield },
];

const PageShell = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const AppBody = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="min-h-screen bg-app text-app">
      {/* Top navigation bar */}
      <div className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40"
        style={{ background: 'rgba(5,5,5,0.88)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-wide text-white">FinSight AI</span>
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="h-fit sticky top-20">
          <div className="glass-panel p-3">
            <nav className="space-y-0.5">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" /> {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <PageShell>
            <Routes>
              <Route path="/"                element={<LandingPage />} />
              <Route path="/dashboard"       element={<SimpleDashboard />} />
              <Route path="/analytics"       element={<AnalyticsDashboard />} />
              <Route path="/backtest"        element={<BacktestDashboard />} />
              <Route path="/model-info"      element={<ModelInfoPage />} />
              <Route path="/about"           element={<AboutPage />} />
              <Route path="/compare"         element={<ComparisonDashboard />} />
              <Route path="/sector-overview" element={<SectorOverviewPage />} />
              <Route path="/admin/health"    element={<AdminHealthPage />} />
              <Route path="/auth"            element={<AuthPage />} />
            </Routes>
          </PageShell>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <Router>
    <ErrorBoundary>
      <AppBody />
    </ErrorBoundary>
  </Router>
);

export default App;
