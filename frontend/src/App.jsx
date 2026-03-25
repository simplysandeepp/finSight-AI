import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Activity, Home, Info, FlaskConical, Shield, GitCompareArrows } from 'lucide-react';
import LandingPage from './pages/LandingPage.jsx';
import SimpleDashboard from './pages/SimpleDashboard.jsx';
import BacktestDashboard from './pages/BacktestDashboard.jsx';
import ComparisonDashboard from './pages/ComparisonDashboard.jsx';
import ModelInfoPage from './pages/ModelInfoPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import SectorOverviewPage from './pages/SectorOverviewPage.jsx';
import AdminHealthPage from './pages/AdminHealthPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/backtest', label: 'Backtest', icon: Activity },
  { to: '/model-info', label: 'Model Info', icon: FlaskConical },
  { to: '/sector-overview', label: 'Sectors', icon: Info },
  { to: '/compare', label: 'Compare', icon: GitCompareArrows },
  { to: '/about', label: 'About', icon: Info },
  { to: '/admin/health', label: 'Admin', icon: Shield },
  { to: '/auth', label: 'Auth', icon: Shield },
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
      <div className="border-b border-white/10 backdrop-blur sticky top-0 z-40 bg-app/85">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-black tracking-wide">FinSight AI</h1>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="bg-card border border-white/10 rounded-2xl p-3 h-fit sticky top-20">
          <nav className="space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-300 hover:bg-white/5'}`}
              >
                <Icon className="w-4 h-4" /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main>
          <PageShell>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<SimpleDashboard />} />
              <Route path="/backtest" element={<BacktestDashboard />} />
              <Route path="/model-info" element={<ModelInfoPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/compare" element={<ComparisonDashboard />} />
              <Route path="/sector-overview" element={<SectorOverviewPage />} />
              <Route path="/admin/health" element={<AdminHealthPage />} />
              <Route path="/auth" element={<AuthPage />} />
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
