// ================================================================
// ðŸ”· FinSight AI â€” Ultimate Multi-Agent Financial Intelligence Dashboard
// Single file implementation â€” All components, pages, and state management
// ================================================================

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import axios from 'axios';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import { useAuth } from './context/AuthContext.jsx';
import RoleSelectModal from './components/RoleSelectModal.jsx';
import OrgDashboard from './pages/OrgDashboard.jsx';
import UploadData from './pages/UploadData.jsx';
import OrgHistory from './pages/OrgHistory.jsx';
import { signOut } from 'firebase/auth';
import { auth } from './firebase/config';
import { 
  TrendingUp, Target, Info, Settings, Menu, X, ChevronRight, Brain,
  BarChart, LineChart, Users, Shield, Activity, Calendar, Search,
  Clock, AlertTriangle, CheckCircle, Radio, Download, Copy, Share2,
  Bell, Gauge, Zap, Star, ArrowUp, ArrowDown, Minus, Eye, FileText,
  Sparkles, ChevronDown, BarChart3, Globe, CheckCircle2, ArrowRight,
  CreditCard, Cpu, Layers, Database, Server, Code2, Rocket, Crown,
  Building2, Lock, HelpCircle, ChevronUp, LogOut, Upload, History
} from 'lucide-react';
import {
  BarChart as RechartsBarChart, Bar, LineChart as RechartsLineChart, Line,
  RadarChart, Radar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceLine, ComposedChart, ScatterChart, Scatter, Cell
} from 'recharts';

// ================================================================
// ðŸ“¦ MOCK DATA â€” Demo mode initialization
// ================================================================
const MOCK_DATA = {
  request_id: "demo-req-001",
  trace_id: "demo-trace-001",
  model_version: "bundle_v1",
  status: "success",
  latency_ms: 4823,
  data_source: "synthetic_store",
  agents_called: ["transcript_nlp", "financial_model", "news_macro", "competitor"],
  degraded_agents: [],
  agent_latencies: { transcript_nlp: 1240, financial_model: 980, news_macro: 2100, competitor: 1650 },
  result: {
    final_forecast: { 
      revenue_p50: 124.3, 
      ebitda_p50: 38.5, 
      revenue_ci: [110.2, 138.1], 
      ebitda_ci: [32.1, 44.8] 
    },
    recommendation: { 
      action: "buy", 
      rationale: "Strong revenue momentum supported by services growth trajectory and expanding margins." 
    },
    explanations: [
      "Revenue growth YoY of 6% exceeds sector median of 3.2%",
      "EBITDA margin expanding from 28% â†’ 31% signals operating leverage",
      "Stable macro with neutral rate outlook reduces discount rate risk",
      "Peer positioning: above median in margin, below in absolute revenue scale"
    ],
    human_review_required: false,
    combined_confidence: 0.827,
    agent_outputs: {
      transcript_nlp: {
        sentiment: 0.74, 
        confidence: 0.85,
        drivers: [
          { sentence: "Services revenue grew 17% YoY driven by App Store and iCloud", importance: 0.92, mismatch_flag: false },
          { sentence: "Operating cash flow exceeded expectations at $32B", importance: 0.88, mismatch_flag: false },
          { sentence: "Management guided for continued margin expansion through H2", importance: 0.76, mismatch_flag: false }
        ],
        numeric_facts: [
          { name: "revenue", value: 124.3, unit: "billion_USD", source: "transcript" },
          { name: "ebitda", value: 38.5, unit: "billion_USD", source: "transcript" },
          { name: "cash_flow", value: 32.0, unit: "billion_USD", source: "transcript" }
        ],
        top_topics: [
          { topic: "services_growth", score: 0.88 },
          { topic: "ai_investment", score: 0.74 },
          { topic: "supply_chain", score: 0.61 },
          { topic: "margin_expansion", score: 0.79 },
          { topic: "macro_outlook", score: 0.55 }
        ]
      },
      financial_model: {
        revenue_forecast: { p05: 110.2, p50: 124.3, p95: 138.1 },
        ebitda_forecast: { p05: 32.1, p50: 38.5, p95: 44.8 },
        confidence: 0.88,
        feature_importances: [
          { feature: "revenue_lag_1q", weight: 0.34 },
          { feature: "revenue_roll_mean_4q", weight: 0.21 },
          { feature: "revenue_growth_yoy", weight: 0.18 },
          { feature: "ebitda_margin_lag_1q", weight: 0.14 },
          { feature: "scenario_neutral", weight: 0.13 }
        ]
      },
      news_macro: {
        confidence: 0.78, 
        macro_score: 0.65, 
        rate_impact: "neutral",
        news_sentiment: 0.71,
        key_risks: ["Interest rate trajectory uncertainty", "FX headwinds in APAC markets", "Regulatory pressure on services"]
      },
      competitor: {
        confidence: 0.80, 
        relative_strength: 0.73,
        peer_rankings: [
          { ticker: "MSFT", revenue: 198.3, margin: 0.42 },
          { ticker: "GOOGL", revenue: 175.0, margin: 0.28 },
          { ticker: "META", revenue: 134.9, margin: 0.35 },
          { ticker: "AMZN", revenue: 189.1, margin: 0.11 }
        ]
      }
    }
  },
  explainability: {
    confidence_breakdown: { 
      transcript_nlp: 0.85, 
      financial_model: 0.88, 
      news_macro: 0.78, 
      competitor: 0.80 
    },
    degraded: []
  },
  audit_link: "https://audit.internal/demo-req-001"
};

// ================================================================
// ðŸŽ¨ UTILITY HOOKS & HELPERS
// ================================================================

// Animated number counter hook
const useCountUp = (target, duration = 1000, startDelay = 0) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    
    const timeout = setTimeout(() => {
      const start = Date.now();
      const startValue = 0;
      const endValue = target;
      
      const animate = () => {
        const now = Date.now();
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (endValue - startValue) * easeOutQuart;
        
        setCount(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, startDelay);
    
    return () => clearTimeout(timeout);
  }, [target, duration, startDelay]);
  
  return count;
};

// Format currency based on unit preference
const formatCurrency = (value, unit = 'M') => {
  if (value === null || value === undefined) return 'N/A';
  if (unit === 'B') return `$${(value / 1000).toFixed(1)}B`;
  if (unit === 'raw') return `$${value.toLocaleString()}`;
  return `$${value.toFixed(1)}M`;
};

// ================================================================
// ðŸŽ¯ ANIMATED CONFIDENCE RING COMPONENT
// ================================================================
const ConfidenceRing = ({ value, size = 120, strokeWidth = 8, decimals = 1, className = "" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value * circumference);
  
  const color = value > 0.8 ? '#10b981' : value > 0.6 ? '#f59e0b' : '#f43f5e';
  const glowColor = value > 0.8 ? 'rgba(16,185,129,0.3)' : value > 0.6 ? 'rgba(245,158,11,0.3)' : 'rgba(244,63,94,0.3)';
  
  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          filter="url(#glow)"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {(value * 100).toFixed(decimals)}%
          </div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">
            CONFIDENCE
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================================================
// ðŸš€ MAIN APP COMPONENT
// ================================================================
const AuthGateLoader = () => (
  <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
    <div className="text-zinc-400 text-sm tracking-[0.2em] uppercase">Loading FinSight...</div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, userRole, setUserRole, loading, firestoreError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleError, setRoleError] = useState('');

  const handleRoleSelect = async (role) => {
    setRoleError('');
    setIsSavingRole(true);

    try {
      await setUserRole(role);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setRoleError(error?.message || 'Unable to save role. Please try again.');
    } finally {
      setIsSavingRole(false);
    }
  };

  if (loading) {
    return <AuthGateLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <>
      {firestoreError && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/10 border-b border-amber-500/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-200">
                  Firestore Database Not Configured
                </p>
                <p className="text-xs text-amber-300/70 mt-0.5">
                  Enable Firestore in Firebase Console → Build → Firestore Database. Role selections won't persist until configured.
                </p>
              </div>
            </div>
            <a 
              href="https://console.firebase.google.com/project/finsight-ai-f1ede/firestore" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 underline whitespace-nowrap"
            >
              Open Firebase Console →
            </a>
          </div>
        </div>
      )}
      <div className={firestoreError ? 'pt-16' : ''}>
        {children}
      </div>
      {!userRole && (
        <RoleSelectModal
          onSelect={handleRoleSelect}
          isSaving={isSavingRole}
          error={roleError}
        />
      )}
    </>
  );
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthGateLoader />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  // ================================================================
  // ðŸ”§ STATE MANAGEMENT
  // ================================================================
  
  // Core application state
  const [companyId, setCompanyId] = useState('');
  const [asOfDate, setAsOfDate] = useState('2026-01-31');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [signalHistory, setSignalHistory] = useState([]);

  // Customization theme state
  const [theme, setTheme] = useState({
    accent: 'emerald',
    bgDepth: 'deep',
    chartStyle: 'gradient',
    borderGlow: true,
    sidebarMode: 'expanded',
    density: 'comfortable',
    animate: true,
    currencyUnit: 'M',
    confDecimals: 1,
    showSections: {
      drivers: true, topics: true, metadata: true,
      macro: true, peers: true, features: true
    },
    chartType: 'bar',
    kpiCards: {
      signal: true, confidence: true, revenue: true, ebitda: true
    }
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Derived theme colors
  const accentColors = useMemo(() => {
    const map = {
      emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hex: '#10b981', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.1)]' },
      blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    hex: '#3b82f6', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]' },
      violet:  { text: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  hex: '#8b5cf6', glow: 'shadow-[0_0_30px_rgba(139,92,246,0.1)]' },
      amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   hex: '#f59e0b', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.1)]' },
      cyan:    { text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    hex: '#06b6d4', glow: 'shadow-[0_0_30px_rgba(6,182,212,0.1)]' },
      rose:    { text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    hex: '#f43f5e', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.1)]' },
    };
    return map[theme.accent] || map.emerald;
  }, [theme.accent]);

  // Get auth context for org data loading
  const { userRole: appUserRole, user: appUser } = useAuth();
  
  // Load org dashboard data automatically when org user logs in
  useEffect(() => {
    const loadOrgData = async () => {
      if (appUserRole !== 'org' || !appUser?.uid) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`/api/org-latest?uid=${appUser.uid}`);
        if (response.data) {
          setData(response.data);
          console.log('Loaded org dashboard data:', response.data);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Failed to load org data:', err);
        } else {
          console.log('No analysis results yet - dashboard will show empty state');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadOrgData();
  }, [appUserRole, appUser?.uid]);

  // ================================================================
  // ðŸ”„ API FUNCTIONS
  // ================================================================
  
  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setIsDemoMode(false);
    
    try {
      const response = await axios.post('/api/predict', {
        company_id: companyId,
        as_of_date: asOfDate
      });
      setData(response.data);
      setSignalHistory(prev => [
        { ...response.data, companyId, asOfDate, ts: new Date().toISOString() }, 
        ...prev
      ]);
    } catch (err) {
      setError(err.response?.data?.detail || 'System synchronization failure.');
    } finally {
      setLoading(false);
    }
  };

  // Copy report functionality
  const copyReport = useCallback(() => {
    const report = `
FinSight Ai â€” Analysis Report
==============================
Company: ${companyId} | Date: ${asOfDate}
Signal: ${data?.result?.recommendation?.action?.toUpperCase() || 'N/A'}
Confidence: ${((data?.result?.combined_confidence || 0) * 100).toFixed(theme.confDecimals)}%
Revenue Forecast: ${formatCurrency(data?.result?.final_forecast?.revenue_p50, theme.currencyUnit)}
EBITDA Forecast: ${formatCurrency(data?.result?.final_forecast?.ebitda_p50, theme.currencyUnit)}

Rationale: ${data?.result?.recommendation?.rationale || 'N/A'}

Key Drivers:
${data?.result?.explanations?.map((e, i) => `${i+1}. ${e}`).join('\n') || 'None available'}

Request ID: ${data?.request_id || 'N/A'}
Latency: ${data?.latency_ms || 0}ms
    `.trim();
    
    navigator.clipboard.writeText(report);
    // Could add toast notification here
  }, [data, companyId, asOfDate, theme.currencyUnit]);

  // ================================================================
  // ðŸŽ¯ SIDEBAR COMPONENT
  // ================================================================
  const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userRole } = useAuth();
    const isCollapsed = theme.sidebarMode === 'collapsed';
    const isHidden = theme.sidebarMode === 'hidden';
    
    const investorNavItems = [
      { path: '/dashboard', icon: BarChart, label: 'Dashboard', key: 'dashboard' },
      { path: '/signals', icon: Radio, label: 'Active Signals', key: 'signals' },
      { path: '/sector', icon: TrendingUp, label: 'Sector Analysis', key: 'sector' },
      { path: '/peers', icon: Users, label: 'Peer Benchmarking', key: 'peers' },
      { path: '/audit', icon: Shield, label: 'Audit Trail', key: 'audit' },
      { path: '/configs', icon: Settings, label: 'Configurations', key: 'configs' }
    ];

    const orgNavItems = [
      { path: '/dashboard', icon: BarChart, label: 'My Dashboard', key: 'dashboard' },
      { path: '/upload', icon: Upload, label: 'Upload Data', key: 'upload' },
      { path: '/org-history', icon: History, label: 'My Company History', key: 'org-history' },
      { path: '/peers', icon: Users, label: 'Competitor Compare', key: 'peers' },
      { path: '/audit', icon: Shield, label: 'Audit Trail', key: 'audit' },
      { path: '/configs', icon: Settings, label: 'Configurations', key: 'configs' }
    ];

    const navItems = userRole === 'org' ? orgNavItems : investorNavItems;
  
    if (isHidden) return null;
  
    return (
      <motion.div
        className={`fixed left-0 top-0 h-full bg-[#0d0d0f] border-r border-white/[0.06] z-30 
                   ${isCollapsed ? 'w-16' : 'w-60'} transition-all duration-300`}
        initial={{ x: -240 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-white/[0.06]">
          {isCollapsed ? (
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">FS</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">FS</span>
              </div>
              <span className="text-lg font-bold text-white">FinSight Ai</span>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="mt-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center p-3 mx-2 rounded-xl transition-all duration-200
                           ${isActive 
                             ? `${accentColors.bg} ${accentColors.text} border-l-2 ${accentColors.border}` 
                             : 'text-zinc-400 hover:text-zinc-300 hover:bg-white/[0.02]'}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3 font-medium">{item.label}</span>}
              </motion.button>
            );
          })}
        </nav>
        
        {/* Bottom section */}
        <div className="absolute bottom-4 left-2 right-2">
          {!isCollapsed && (
            <div className="mb-4 p-3 bg-[#111113] rounded-xl border border-white/[0.06]">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-zinc-500">System Online</span>
              </div>
              <div className="text-xs text-zinc-600">Version 1.0</div>
            </div>
          )}
          
          <button
            onClick={() => setTheme(prev => ({ 
              ...prev, 
              sidebarMode: prev.sidebarMode === 'expanded' ? 'collapsed' : 'expanded' 
            }))}
            className="w-full p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 mx-auto" /> : <Menu className="w-4 h-4 mx-auto" />}
          </button>
        </div>
      </motion.div>
    );
  };

  // ================================================================
  // ðŸ” TOP NAVIGATION BAR COMPONENT  
  // ================================================================
  const TopBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userRole, user } = useAuth();

    const handleLogout = async () => {
      try {
        await signOut(auth);
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Logout failed:', err);
      }
    };
    
    const getPageTitle = () => {
      const pathMap = {
        '/': 'Landing',
        '/dashboard': userRole === 'org' ? 'My Dashboard' : 'Multi-Agent Dashboard',
        '/signals': 'Active Signals',
        '/sector': 'Sector Analysis', 
        '/peers': userRole === 'org' ? 'Competitor Compare' : 'Peer Benchmarking',
        '/audit': 'Audit Trail',
        '/configs': 'Configurations',
        '/upload': 'Upload Data',
        '/org-history': 'My Company History'
      };
      return pathMap[location.pathname] || 'Dashboard';
    };

    return (
      <div className="h-16 bg-[#0d0d0f] shadow-sm shadow-black/20 flex items-center justify-between px-6 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent">
        {/* Left: Page title */}
        <div>
          <h1 className="text-xl font-bold text-white">{getPageTitle()}</h1>
          <div className="flex items-center text-xs text-zinc-500 space-x-1">
            <span>FinSight AI</span>
            <ChevronRight className="w-3 h-3" />
            <span>{getPageTitle()}</span>
          </div>
        </div>

        {/* Center: Controls — different for investor vs org */}
        {userRole === 'org' ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-zinc-400">{user?.displayName || user?.email || 'Organization'}</span>
            <button
              onClick={async () => {
                if (!user?.uid) return;
                setLoading(true);
                setError(null);
                try {
                  const response = await axios.post('/api/predict-org', {
                    uid: user.uid,
                    as_of_date: new Date().toISOString().split('T')[0],
                  });
                  setData(response.data);
                } catch (err) {
                  setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 transition-all
                         ${loading 
                           ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                           : 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 hover:scale-105 active:scale-95'}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Run Analysis</span>
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
            >
              <Upload className="w-4 h-4" />
              <span>Upload CSV</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handlePredict} className="flex items-center space-x-4">
            <input
              type="text"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="COMP_007 or AAPL"
              className="bg-[#111113] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white font-mono 
                       focus:border-emerald-500/50 focus:outline-none w-40"
            />
            
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-[#111113] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white
                       focus:border-emerald-500/50 focus:outline-none"
            />
            
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 transition-all
                         ${loading 
                           ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                           : `bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 hover:scale-105 active:scale-95`}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Run Analysis</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Right: Status, role badge, and controls */}
        <div className="flex items-center space-x-4">
          {/* Role badge */}
          <span className={`px-2 py-1 text-[10px] font-black uppercase rounded tracking-wider border ${
            userRole === 'org'
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}>
            {userRole === 'org' ? 'Organization' : 'Investor'}
          </span>

          {isDemoMode && userRole !== 'org' && (
            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold uppercase rounded border border-amber-500/30">
              DEMO
            </span>
          )}
          
          {userRole !== 'org' && (
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${data?.data_source === 'live_vantage' ? 'bg-blue-500 animate-pulse' : 'bg-zinc-500'}`}></div>
              <span className="text-xs text-zinc-500 uppercase">
                {data?.data_source === 'live_vantage' ? 'LIVE' : 'SYNTHETIC'}
              </span>
            </div>
          )}
          
          {data?.latency_ms && userRole !== 'org' && (
            <div className="text-xs text-zinc-500">
              {data.latency_ms}ms
            </div>
          )}
          
          <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // ================================================================
  // ðŸ’« LOADING ANIMATION OVERLAY
  // ================================================================
  const LoadingOverlay = () => (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-8">Multi-Agent Analysis in Progress</h2>
            
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { name: 'Transcript NLP', icon: Brain, delay: 0 },
                { name: 'Financial Model', icon: BarChart, delay: 200 },
                { name: 'News & Macro', icon: Radio, delay: 400 },
                { name: 'Competitor', icon: Users, delay: 600 }
              ].map((agent, index) => (
                <motion.div
                  key={agent.name}
                  className="bg-[#111113] border border-white/[0.06] rounded-xl p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: agent.delay / 1000 }}
                >
                  <agent.icon className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <div className="text-sm font-medium text-white mb-1">{agent.name}</div>
                  <div className="text-xs text-zinc-500">Analyzing...</div>
                  <div className="w-full bg-zinc-800 rounded-full h-1 mt-2">
                    <motion.div
                      className="bg-emerald-500 h-1 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: agent.delay / 1000, duration: 2 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-zinc-400"
            >
              CIO Ensembler synthesizing results...
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const chartData = useMemo(() => {
    if (!data?.result) return [];
    return [
      {
        name: 'Revenue',
        p05: data.result.final_forecast.revenue_ci[0],
        p50: data.result.final_forecast.revenue_p50,
        p95: data.result.final_forecast.revenue_ci[1],
        type: 'Revenue'
      },
      {
        name: 'EBITDA', 
        p05: data.result.final_forecast.ebitda_ci[0],
        p50: data.result.final_forecast.ebitda_p50,
        p95: data.result.final_forecast.ebitda_ci[1],
        type: 'EBITDA'
      }
    ];
  }, [data]);

  // ================================================================
  // 🎯 SHARED HELPERS
  // ================================================================
  const getRecStyles = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('buy')) return { 
      label: 'STRONG BUY', 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20',
      glow: 'shadow-[0_0_40px_rgba(16,185,129,0.15)]'
    };
    if (actionLower.includes('sell')) return { 
      label: 'SELL', 
      color: 'text-rose-400', 
      bg: 'bg-rose-500/10', 
      border: 'border-rose-500/20',
      glow: 'shadow-[0_0_40px_rgba(244,63,94,0.15)]'
    };
    if (actionLower.includes('hold')) return { 
      label: 'HOLD', 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10', 
      border: 'border-indigo-500/20',
      glow: 'shadow-[0_0_40px_rgba(99,102,241,0.15)]'
    };
    return { 
      label: 'MONITOR', 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/20',
      glow: 'shadow-[0_0_40px_rgba(245,158,11,0.15)]'
    };
  };

  // ================================================================
  // ðŸŽ› CUSTOMIZER DRAWER COMPONENT
  // ================================================================
  const CustomizerDrawer = () => (
    <AnimatePresence>
      {isCustomizerOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCustomizerOpen(false)}
          />
          <motion.div
            className="fixed right-0 top-0 h-full w-80 bg-[#111113] border-l border-white/[0.06] z-50 overflow-y-auto"
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Customization</h2>
                <button
                  onClick={() => setIsCustomizerOpen(false)}
                  className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {/* Theme Controls */}
              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Theme</h3>
                
                {/* Accent Color Picker */}
                <div className="mb-4">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Accent Color</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['emerald', 'blue', 'violet', 'amber', 'cyan', 'rose'].map(color => (
                      <button
                        key={color}
                        onClick={() => setTheme(prev => ({ ...prev, accent: color }))}
                        className={`h-8 rounded-lg border-2 transition-all ${
                          theme.accent === color ? 'border-white' : 'border-transparent'
                        }`}
                        style={{ 
                          background: {
                            emerald: '#10b981', blue: '#3b82f6', violet: '#8b5cf6',
                            amber: '#f59e0b', cyan: '#06b6d4', rose: '#f43f5e'
                          }[color] 
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Depth */}
                <div className="mb-4">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Background</label>
                  <select
                    value={theme.bgDepth}
                    onChange={(e) => setTheme(prev => ({ ...prev, bgDepth: e.target.value }))}
                    className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="deep">Deep Black</option>
                    <option value="dark">Dark Gray</option>
                    <option value="charcoal">Charcoal</option>
                  </select>
                </div>

                {/* Chart Style */}
                <div className="mb-4">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Chart Style</label>
                  <select
                    value={theme.chartStyle}
                    onChange={(e) => setTheme(prev => ({ ...prev, chartStyle: e.target.value }))}
                    className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="gradient">Gradient Fill</option>
                    <option value="solid">Solid Fill</option>
                    <option value="outline">Outline Only</option>
                  </select>
                </div>
              </div>

              {/* Layout Controls */}
              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Layout</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Sidebar Mode</label>
                    <select
                      value={theme.sidebarMode}
                      onChange={(e) => setTheme(prev => ({ ...prev, sidebarMode: e.target.value }))}
                      className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="expanded">Expanded</option>
                      <option value="collapsed">Collapsed</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Density</label>
                    <select
                      value={theme.density}
                      onChange={(e) => setTheme(prev => ({ ...prev, density: e.target.value }))}
                      className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="compact">Compact</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="spacious">Spacious</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Forecast Chart Type</label>
                    <select
                      value={theme.chartType}
                      onChange={(e) => setTheme(prev => ({ ...prev, chartType: e.target.value }))}
                      className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="bar">Bar Chart</option>
                      <option value="area">Area Chart</option>
                      <option value="line">Line Chart</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">KPI Cards</label>
                    <div className="space-y-2">
                      {[
                        { key: 'signal', label: 'Signal' },
                        { key: 'confidence', label: 'Confidence' },
                        { key: 'revenue', label: 'Revenue' },
                        { key: 'ebitda', label: 'EBITDA' }
                      ].map(card => (
                        <label key={card.key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={theme.kpiCards[card.key]}
                            onChange={() => setTheme(prev => ({
                              ...prev,
                              kpiCards: { ...prev.kpiCards, [card.key]: !prev.kpiCards[card.key] }
                            }))}
                            className="w-4 h-4 rounded border-white/20 bg-zinc-800 accent-emerald-500"
                          />
                          <span className="text-sm text-zinc-300">{card.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Display */}
              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Data Display</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Currency Unit</label>
                    <select
                      value={theme.currencyUnit}
                      onChange={(e) => setTheme(prev => ({ ...prev, currencyUnit: e.target.value }))}
                      className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="M">Millions ($M)</option>
                      <option value="B">Billions ($B)</option>
                      <option value="raw">Raw Numbers</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Confidence Decimals</label>
                    <select
                      value={theme.confDecimals}
                      onChange={(e) => setTheme(prev => ({ ...prev, confDecimals: Number(e.target.value) }))}
                      className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value={0}>0 decimals</option>
                      <option value={1}>1 decimal</option>
                      <option value={2}>2 decimals</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Animations</label>
                    <button
                      onClick={() => setTheme(prev => ({ ...prev, animate: !prev.animate }))}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        theme.animate ? 'bg-emerald-500' : 'bg-zinc-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        theme.animate ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Border Glow</label>
                    <button
                      onClick={() => setTheme(prev => ({ ...prev, borderGlow: !prev.borderGlow }))}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        theme.borderGlow ? 'bg-emerald-500' : 'bg-zinc-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        theme.borderGlow ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section Visibility */}
              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Show / Hide Sections</h3>
                <div className="space-y-2">
                  {[
                    { key: 'drivers', label: 'Reasoning Chain' },
                    { key: 'topics', label: 'Topic Heatmap' },
                    { key: 'metadata', label: 'System Metadata' },
                    { key: 'macro', label: 'Macro & News' },
                    { key: 'peers', label: 'Peer Snapshot' },
                    { key: 'features', label: 'Feature Importance' }
                  ].map(section => (
                    <div key={section.key} className="flex items-center justify-between">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider">{section.label}</label>
                      <button
                        onClick={() => setTheme(prev => ({
                          ...prev,
                          showSections: { ...prev.showSections, [section.key]: !prev.showSections[section.key] }
                        }))}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          theme.showSections[section.key] ? 'bg-emerald-500' : 'bg-zinc-600'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          theme.showSections[section.key] ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export & Share */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Export & Share</h3>
                <div className="space-y-2">
                  <button
                    onClick={copyReport}
                    className="w-full flex items-center space-x-2 px-3 py-2 bg-[#0a0a0b] border border-white/[0.06] rounded-lg text-sm text-white hover:bg-white/[0.02] transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Report</span>
                  </button>
                  
                  <button className="w-full flex items-center space-x-2 px-3 py-2 bg-[#0a0a0b] border border-white/[0.06] rounded-lg text-sm text-white hover:bg-white/[0.02] transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Export Dashboard</span>
                  </button>
                  
                  <button className="w-full flex items-center space-x-2 px-3 py-2 bg-[#0a0a0b] border border-white/[0.06] rounded-lg text-sm text-white hover:bg-white/[0.02] transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share Link</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // ================================================================
  // ðŸ“Š DASHBOARD PAGE - THE CENTERPIECE
  // ================================================================
  const DashboardPage = () => {
    const recStyles = getRecStyles(data?.result?.recommendation?.action);
    const confidence = data?.result?.combined_confidence || 0;
    const revenueP50 = useCountUp(data?.result?.final_forecast?.revenue_p50 || 0, 1000, 200);
    const ebitdaP50 = useCountUp(data?.result?.final_forecast?.ebitda_p50 || 0, 1000, 400);

    // Show empty state when no data
    if (!loading && !data) {
      return (
        <div className="min-h-[600px] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
              <Search className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Analysis Yet</h3>
            <p className="text-zinc-400 mb-6">
              Enter a stock ticker in the search bar above and click "Run Analysis" to view AI-powered financial insights and forecasts.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Live Data</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>4 AI Agents</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Real-time</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Alert Banner */}
        {data?.result?.human_review_required && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 flex items-center space-x-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <div className="font-medium text-amber-400">âš  Escalation Triggered â€” Human Verification Required</div>
              <div className="text-sm text-amber-400/80">
                Confidence: {(confidence * 100).toFixed(theme.confDecimals)}% | 
                Degraded agents: {data?.degraded_agents?.join(', ') || 'None'}
              </div>
            </div>
            <button className="ml-auto px-3 py-1 bg-amber-500 text-black rounded-lg text-sm font-medium">
              Review
            </button>
          </motion.div>
        )}

        {/* Hero KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
          {/* Signal Card */}
          {theme.kpiCards.signal && (
            <motion.div
              initial={theme.animate ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0 }}
              className={`bg-[#111113] border border-white/[0.06] rounded-2xl p-6 ${recStyles.glow} ${theme.borderGlow ? recStyles.border : ''}`}
            >
              <div className={`text-2xl font-black ${recStyles.color} mb-2`}>{recStyles.label}</div>
              <div className="text-sm text-zinc-400 mb-3">{data?.result?.recommendation?.rationale}</div>
              <div className={`w-3 h-3 rounded-full ${recStyles.bg} animate-pulse`}></div>
            </motion.div>
          )}

          {/* Confidence Card */}
          {theme.kpiCards.confidence && (
            <motion.div
              initial={theme.animate ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 flex items-center justify-center"
            >
              <ConfidenceRing value={confidence} size={100} decimals={theme.confDecimals} />
            </motion.div>
          )}

          {/* Revenue Card */}
          {theme.kpiCards.revenue && (
            <motion.div
              initial={theme.animate ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
              className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">REVENUE P50</div>
              <div className="text-3xl font-bold text-white tabular-nums">
                {formatCurrency(revenueP50, theme.currencyUnit)}
              </div>
              <div className="text-sm text-zinc-400 mt-2">
                CI: [{formatCurrency(data?.result?.final_forecast?.revenue_ci?.[0], theme.currencyUnit)} â€“ {formatCurrency(data?.result?.final_forecast?.revenue_ci?.[1], theme.currencyUnit)}]
              </div>
              <div className="mt-2 relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 h-full bg-gradient-to-r from-emerald-500/40 to-emerald-500/80 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
                <div className="absolute top-0 h-full w-0.5 bg-white" style={{
                  left: `${((data?.result?.final_forecast?.revenue_p50 - (data?.result?.final_forecast?.revenue_ci?.[0] || 0)) / ((data?.result?.final_forecast?.revenue_ci?.[1] || 1) - (data?.result?.final_forecast?.revenue_ci?.[0] || 0))) * 100}%`
                }} />
              </div>
            </motion.div>
          )}

          {/* EBITDA Card */}
          {theme.kpiCards.ebitda && (
            <motion.div
              initial={theme.animate ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.24 }}
              className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">EBITDA P50</div>
              <div className="text-3xl font-bold text-white tabular-nums">
                {formatCurrency(ebitdaP50, theme.currencyUnit)}
              </div>
              <div className="text-sm text-zinc-400 mt-2">
                CI: [{formatCurrency(data?.result?.final_forecast?.ebitda_ci?.[0], theme.currencyUnit)} â€“ {formatCurrency(data?.result?.final_forecast?.ebitda_ci?.[1], theme.currencyUnit)}]
              </div>
              <div className="mt-2 relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 h-full bg-gradient-to-r from-blue-500/40 to-blue-500/80 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                />
                <div className="absolute top-0 h-full w-0.5 bg-white" style={{
                  left: `${((data?.result?.final_forecast?.ebitda_p50 - (data?.result?.final_forecast?.ebitda_ci?.[0] || 0)) / ((data?.result?.final_forecast?.ebitda_ci?.[1] || 1) - (data?.result?.final_forecast?.ebitda_ci?.[0] || 0))) * 100}%`
                }} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Main Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts and Analysis */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Forecast Visualization */}
            <motion.div
              initial={theme.animate ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.32 }}
              className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 overflow-hidden"
            >
              <h3 className="text-lg font-bold text-white mb-4">Probabilistic Forecast</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accentColors.hex} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={accentColors.hex} stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-3 text-sm shadow-xl">
                            <div className="font-bold text-white mb-1">{d?.name}</div>
                            <div className="text-emerald-400">P50: {formatCurrency(d?.p50, theme.currencyUnit)}</div>
                            <div className="text-amber-400">P05: {formatCurrency(d?.p05, theme.currencyUnit)}</div>
                            <div className="text-amber-400">P95: {formatCurrency(d?.p95, theme.currencyUnit)}</div>
                          </div>
                        );
                      }}
                    />
                    {theme.chartType === 'area' ? (
                      <Area
                        dataKey="p50"
                        fill={theme.chartStyle === 'outline' ? 'transparent' : (theme.chartStyle === 'solid' ? accentColors.hex : 'url(#revenueGradient)')}
                        stroke={accentColors.hex}
                        strokeWidth={theme.chartStyle === 'outline' ? 2 : 1}
                        isAnimationActive={theme.animate}
                      />
                    ) : theme.chartType === 'line' ? (
                      <Line
                        dataKey="p50"
                        stroke={accentColors.hex}
                        strokeWidth={2}
                        dot={{ fill: accentColors.hex, r: 4 }}
                        isAnimationActive={theme.animate}
                      />
                    ) : (
                      <Bar
                        dataKey="p50"
                        fill={theme.chartStyle === 'outline' ? 'transparent' : (theme.chartStyle === 'solid' ? accentColors.hex : 'url(#revenueGradient)')}
                        stroke={theme.chartStyle === 'outline' ? accentColors.hex : undefined}
                        strokeWidth={theme.chartStyle === 'outline' ? 2 : 0}
                        isAnimationActive={theme.animate}
                      />
                    )}
                    <ReferenceLine y={data?.result?.final_forecast?.revenue_ci?.[0]} stroke="#f59e0b" strokeDasharray="2 2" />
                    <ReferenceLine y={data?.result?.final_forecast?.revenue_ci?.[1]} stroke="#f59e0b" strokeDasharray="2 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Explanation Cards */}
            {theme.showSections.drivers && (
              <motion.div
                initial={theme.animate ? { opacity: 0, y: 20 } : {}}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">CIO Synthesis â€” Reasoning Chain</h3>
                <div className="space-y-3">
                  {data?.result?.explanations?.map((explanation, index) => (
                    <motion.div
                      key={index}
                      initial={theme.animate ? { opacity: 0, x: -20 } : {}}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      className="flex items-start space-x-3 p-3 bg-[#0a0a0b] rounded-xl hover:bg-white/[0.02] transition-colors"
                    >
                      <div className={`w-6 h-6 rounded-full ${accentColors.bg} ${accentColors.text} flex items-center justify-center text-xs font-bold`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 text-sm text-zinc-300">{explanation}</div>
                      {data?.result?.agent_outputs?.transcript_nlp?.drivers?.[index]?.mismatch_flag && (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" title="Mismatch detected" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Topic Heatmap */}
            {theme.showSections.topics && (
              <motion.div
                initial={theme.animate ? { opacity: 0, y: 20 } : {}}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.48 }}
                className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">Agent Sentiment & Topic Heatmap</h3>
                <div className="space-y-3">
                  {data?.result?.agent_outputs?.transcript_nlp?.top_topics?.map((topic, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-24 text-sm text-zinc-400 capitalize truncate" title={topic.topic.replace('_', ' ')}>
                        {topic.topic.replace('_', ' ')}
                      </div>
                      <div className="flex-1 bg-zinc-800 rounded-full h-2">
                        <motion.div
                          className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${topic.score * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        />
                      </div>
                      <div className="text-sm text-zinc-500 tabular-nums w-12">
                        {(topic.score * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Agent Attribution & Metadata */}
          <div className="space-y-6 min-w-0">
            {/* Agent Confidence Breakdown */}
            <motion.div
              initial={theme.animate ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.56 }}
              className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Multi-Agent Signal Attribution</h3>
              <div className="space-y-4">
                {[
                  { key: 'transcript_nlp', icon: Brain, name: 'Transcript NLP' },
                  { key: 'financial_model', icon: BarChart, name: 'Financial Model' },
                  { key: 'news_macro', icon: Radio, name: 'News & Macro' },
                  { key: 'competitor', icon: Users, name: 'Competitor' }
                ].map((agent, index) => {
                  const confidence = data?.explainability?.confidence_breakdown?.[agent.key] || 0;
                  const latency = data?.agent_latencies?.[agent.key] || 0;
                  const isDegraded = data?.degraded_agents?.includes(agent.key);
                  
                  return (
                    <div key={agent.key} className="flex items-center space-x-3">
                      <agent.icon className="w-5 h-5 text-emerald-400" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{agent.name}</span>
                          <span className="text-xs text-zinc-500">{latency}ms</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-zinc-800 rounded-full h-2">
                            <motion.div
                              className={`h-2 rounded-full ${confidence > 0.8 ? 'bg-emerald-500' : confidence > 0.6 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${confidence * 100}%` }}
                              transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 tabular-nums w-10">
                            {(confidence * 100).toFixed(theme.confDecimals)}%
                          </span>
                          {isDegraded && (
                            <span className="px-1 py-0.5 bg-rose-500/20 text-rose-400 text-xs rounded">
                              DEGRADED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Recommendation Card */}
            <motion.div
              initial={theme.animate ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.64 }}
              className={`bg-[#111113] border border-white/[0.06] rounded-2xl p-6 ${theme.borderGlow ? recStyles.border : ''}`}
            >
              <h3 className="text-lg font-bold text-white mb-4">Final Recommendation</h3>
              <div className={`text-2xl font-black ${recStyles.color} mb-3`}>
                {recStyles.label}
              </div>
              <div className="text-sm text-zinc-300 mb-4">
                {data?.result?.recommendation?.rationale}
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Signal Strength</span>
                <span className="text-sm font-bold text-white">{(confidence * 100).toFixed(theme.confDecimals)}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 mb-4">
                <motion.div
                  className={`h-2 rounded-full ${confidence > 0.8 ? 'bg-emerald-500' : confidence > 0.6 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence * 100}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                />
              </div>
              <button className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                Open Audit Trail â†’
              </button>
            </motion.div>

            {/* Numeric Facts Panel */}
            <motion.div
              initial={theme.animate ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.72 }}
              className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Numeric Facts</h3>
              <div className="space-y-3">
                {data?.result?.agent_outputs?.transcript_nlp?.numeric_facts?.map((fact, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${index % 2 === 0 ? 'bg-[#0a0a0b]' : 'bg-transparent'}`}>
                    <div>
                      <div className="text-sm font-medium text-white capitalize">
                        {fact.name.replace('_', ' ')}
                      </div>
                      <span className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded uppercase">
                        {fact.source}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-white">
                        {fact.value.toFixed(1)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {fact.unit.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Macro & News Signals */}
            {theme.showSections.macro && (
              <motion.div
                initial={theme.animate ? { opacity: 0, y: 20 } : {}}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
                className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">External Signal Environment</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Macro Score</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-2 bg-zinc-800 rounded-full">
                        <motion.div
                          className="h-2 bg-emerald-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(data?.result?.agent_outputs?.news_macro?.macro_score || 0) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.9 }}
                        />
                      </div>
                      <span className="text-sm font-bold text-white">
                        {((data?.result?.agent_outputs?.news_macro?.macro_score || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">News Sentiment</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {(data?.result?.agent_outputs?.news_macro?.news_sentiment || 0) > 0.6 ? 'ðŸ˜Š' :
                         (data?.result?.agent_outputs?.news_macro?.news_sentiment || 0) > 0.4 ? 'ðŸ˜' : 'ðŸ˜Ÿ'}
                      </span>
                      <span className="text-sm text-zinc-400">
                        {(data?.result?.agent_outputs?.news_macro?.news_sentiment || 0) > 0.6 ? 'Positive' :
                         (data?.result?.agent_outputs?.news_macro?.news_sentiment || 0) > 0.4 ? 'Neutral' : 'Negative'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Rate Impact</span>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      data?.result?.agent_outputs?.news_macro?.rate_impact === 'neutral' 
                        ? 'bg-indigo-500/20 text-indigo-400' 
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {data?.result?.agent_outputs?.news_macro?.rate_impact?.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm text-zinc-400 mb-2">Key Risks</div>
                    <div className="space-y-1">
                      {data?.result?.agent_outputs?.news_macro?.key_risks?.map((risk, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-zinc-300">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Request Metadata */}
            {theme.showSections.metadata && (
              <motion.div
                initial={theme.animate ? { opacity: 0, y: 20 } : {}}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.88 }}
                className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">System Metadata</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Request ID</span>
                    <span className="font-mono text-zinc-300">{data?.request_id}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Trace ID</span>
                    <span className="font-mono text-zinc-300">{data?.trace_id}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Model Version</span>
                    <span className="text-zinc-300">{data?.model_version}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Status</span>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      data?.status === 'success' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {data?.status?.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Latency</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-1 bg-zinc-800 rounded">
                        <div className="h-1 bg-emerald-500 rounded" style={{width: '75%'}}></div>
                      </div>
                      <span className="text-zinc-300">{data?.latency_ms}ms</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Data Source</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        data?.data_source === 'live_vantage' ? 'bg-blue-500 animate-pulse' : 'bg-zinc-500'
                      }`}></div>
                      <span className="text-zinc-300 uppercase text-xs">{data?.data_source}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-zinc-400 mb-2">Agents Called</div>
                    <div className="flex flex-wrap gap-1">
                      {data?.agents_called?.map(agent => (
                        <span key={agent} className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded">
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => window.open(data?.audit_link, '_blank')}
                    className="w-full mt-4 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/20 transition-colors"
                  >
                    View Full Audit â†’
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Section D — Secondary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* D1 — Forecast Confidence Interval Visualization */}
          <motion.div
            initial={theme.animate ? { opacity: 0, y: 20 } : {}}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.92 }}
            className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 overflow-hidden"
          >
            <h3 className="text-lg font-bold text-white mb-4">Probabilistic Forecast Bands</h3>
            <div className="space-y-6">
              {/* Revenue CI */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">REVENUE CI</div>
                <div className="relative h-8 bg-zinc-800 rounded-full overflow-hidden">
                  {(() => {
                    const revForecast = data?.result?.agent_outputs?.financial_model?.revenue_forecast;
                    const p05 = revForecast?.p05 || 0;
                    const p50 = revForecast?.p50 || 0;
                    const p95 = revForecast?.p95 || 0;
                    const range = p95 - p05 || 1;
                    const leftPct = 10;
                    const rightPct = 90;
                    const midPct = leftPct + ((p50 - p05) / range) * (rightPct - leftPct);
                    return (
                      <>
                        <motion.div
                          className="absolute top-0 h-full bg-gradient-to-r from-emerald-500/30 to-emerald-500/10 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${rightPct - leftPct}%` }}
                          style={{ left: `${leftPct}%` }}
                          transition={{ duration: 0.8, delay: 1 }}
                        />
                        <div className="absolute top-0 h-full w-0.5 bg-amber-400" style={{ left: `${leftPct}%` }} />
                        <div className="absolute top-0 h-full w-1 bg-emerald-400" style={{ left: `${midPct}%` }} />
                        <div className="absolute top-0 h-full w-0.5 bg-amber-400" style={{ left: `${rightPct}%` }} />
                      </>
                    );
                  })()}
                </div>
                <div className="flex justify-between mt-1 text-xs text-zinc-500">
                  <span>P05: {formatCurrency(data?.result?.agent_outputs?.financial_model?.revenue_forecast?.p05, theme.currencyUnit)}</span>
                  <span className="text-emerald-400 font-bold">P50: {formatCurrency(data?.result?.agent_outputs?.financial_model?.revenue_forecast?.p50, theme.currencyUnit)}</span>
                  <span>P95: {formatCurrency(data?.result?.agent_outputs?.financial_model?.revenue_forecast?.p95, theme.currencyUnit)}</span>
                </div>
              </div>
              {/* EBITDA CI */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">EBITDA CI</div>
                <div className="relative h-8 bg-zinc-800 rounded-full overflow-hidden">
                  {(() => {
                    const ebForecast = data?.result?.agent_outputs?.financial_model?.ebitda_forecast;
                    const p05 = ebForecast?.p05 || 0;
                    const p50 = ebForecast?.p50 || 0;
                    const p95 = ebForecast?.p95 || 0;
                    const range = p95 - p05 || 1;
                    const leftPct = 10;
                    const rightPct = 90;
                    const midPct = leftPct + ((p50 - p05) / range) * (rightPct - leftPct);
                    return (
                      <>
                        <motion.div
                          className="absolute top-0 h-full bg-gradient-to-r from-blue-500/30 to-blue-500/10 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${rightPct - leftPct}%` }}
                          style={{ left: `${leftPct}%` }}
                          transition={{ duration: 0.8, delay: 1.1 }}
                        />
                        <div className="absolute top-0 h-full w-0.5 bg-amber-400" style={{ left: `${leftPct}%` }} />
                        <div className="absolute top-0 h-full w-1 bg-blue-400" style={{ left: `${midPct}%` }} />
                        <div className="absolute top-0 h-full w-0.5 bg-amber-400" style={{ left: `${rightPct}%` }} />
                      </>
                    );
                  })()}
                </div>
                <div className="flex justify-between mt-1 text-xs text-zinc-500">
                  <span>P05: {formatCurrency(data?.result?.agent_outputs?.financial_model?.ebitda_forecast?.p05, theme.currencyUnit)}</span>
                  <span className="text-blue-400 font-bold">P50: {formatCurrency(data?.result?.agent_outputs?.financial_model?.ebitda_forecast?.p50, theme.currencyUnit)}</span>
                  <span>P95: {formatCurrency(data?.result?.agent_outputs?.financial_model?.ebitda_forecast?.p95, theme.currencyUnit)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* D2 — Feature Importance Chart */}
          {theme.showSections.features && (
            <motion.div
              initial={theme.animate ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.96 }}
              className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 overflow-hidden"
            >
              <h3 className="text-lg font-bold text-white mb-4">Feature Importance</h3>
              <div className="space-y-3">
                {data?.result?.agent_outputs?.financial_model?.feature_importances?.map((item, index) => {
                  const maxWeight = Math.max(...(data?.result?.agent_outputs?.financial_model?.feature_importances?.map(f => f.weight) || [1]));
                  const pct = (item.weight / maxWeight) * 100;
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-36 text-sm text-zinc-400 truncate" title={item.feature?.replace(/_/g, ' ')}>
                        {item.feature?.replace(/_/g, ' ')}
                      </div>
                      <div className="flex-1 bg-zinc-800 rounded-full h-3">
                        <motion.div
                          className="h-3 rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 1 + index * 0.1 }}
                        />
                      </div>
                      <div className="text-sm text-zinc-500 tabular-nums w-12 text-right">
                        {(item.weight * 100).toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* D3 — Competitive Position Snapshot */}
          {theme.showSections.peers && (
            <motion.div
              initial={theme.animate ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.0 }}
              className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 overflow-hidden"
            >
              <h3 className="text-lg font-bold text-white mb-4">Competitive Snapshot</h3>
              <div className="space-y-3">
                {data?.result?.agent_outputs?.competitor?.peer_rankings?.map((peer, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-[#0a0a0b] rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-zinc-500 w-5">{index + 1}</span>
                      <span className="text-sm font-medium text-white">{peer.ticker}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-zinc-400">{formatCurrency(peer.revenue, theme.currencyUnit)}</span>
                      <span className="text-xs text-zinc-400">{(peer.margin * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-xs text-zinc-500">Relative Strength</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {((data?.result?.agent_outputs?.competitor?.relative_strength || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };


  // ================================================================
  // ROLE-BASED DASHBOARD ROUTER
  // ================================================================
  const RoleDashboardPage = () => {
    const { userRole, user } = useAuth();
    if (userRole === 'org') {
      return <OrgDashboard data={data} error={error} orgName={user?.displayName || ''} />;
    }
    return <DashboardPage />;
  };
  // ================================================================
  // ðŸ“ˆ ACTIVE SIGNALS PAGE
  // ================================================================
  const ActiveSignalsPage = () => {
    const [dateRange, setDateRange] = useState('7d');
    const [actionFilter, setActionFilter] = useState('all');
    const [confidenceThreshold, setConfidenceThreshold] = useState(0);

    const filteredHistory = signalHistory.filter(signal => {
      if (actionFilter !== 'all' && signal.result?.recommendation?.action !== actionFilter) return false;
      if (signal.result?.combined_confidence < confidenceThreshold) return false;
      return true;
    });

    return (
      <div>
        {/* Header & Filters */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Active Signals History</h2>
          
          <div className="flex items-center space-x-4 mb-6">
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-[#111113] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            <select 
              value={actionFilter} 
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-[#111113] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="all">All Actions</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="hold">Hold</option>
              <option value="monitor">Monitor</option>
            </select>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-zinc-400">Min Confidence:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={confidenceThreshold * 100}
                onChange={(e) => setConfidenceThreshold(e.target.value / 100)}
                className="w-24"
              />
              <span className="text-sm text-zinc-300 w-10">{Math.round(confidenceThreshold * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Signals Table */}
        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0b] border-b border-white/[0.06]">
                <tr>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Company</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Date</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Action</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Confidence</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Revenue P50</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Status</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Latency</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">View</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((signal, index) => {
                  const recStyles = getRecStyles(signal.result?.recommendation?.action);
                  return (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-mono text-sm text-white">{signal.companyId}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-zinc-300">
                          {new Date(signal.asOfDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded ${recStyles.bg} ${recStyles.color}`}>
                          {recStyles.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 h-1 bg-zinc-800 rounded">
                            <div 
                              className={`h-1 rounded ${
                                (signal.result?.combined_confidence || 0) > 0.8 ? 'bg-emerald-500' : 
                                (signal.result?.combined_confidence || 0) > 0.6 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${(signal.result?.combined_confidence || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-zinc-300 tabular-nums">
                            {((signal.result?.combined_confidence || 0) * 100).toFixed(theme.confDecimals)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-zinc-300 font-mono">
                          {formatCurrency(signal.result?.final_forecast?.revenue_p50, theme.currencyUnit)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            signal.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}></div>
                          <span className="text-xs text-zinc-400 uppercase">{signal.status}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-zinc-400">{signal.latency_ms}ms</span>
                      </td>
                      <td className="p-4">
                        <button className="text-emerald-400 hover:text-emerald-300 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredHistory.length === 0 && (
          <div className="text-center py-12">
            <div className="text-zinc-500 mb-4">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <div>No signals found matching your filters</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ================================================================
  // ðŸ“Š SECTOR ANALYSIS PAGE
  // ================================================================
  const SectorAnalysisPage = () => {
    const sectorData = [
      { sector: 'Technology', growth: 85, profitability: 78, momentum: 92, quality: 88, value: 65 },
      { sector: 'Healthcare', growth: 72, profitability: 84, momentum: 68, quality: 90, value: 75 },
      { sector: 'Financial', growth: 65, profitability: 88, momentum: 75, quality: 82, value: 85 },
      { sector: 'Consumer', growth: 70, profitability: 75, momentum: 82, quality: 78, value: 72 },
    ];

    const radarData = [
      { metric: 'Growth', subject: 85, sector: 65, fullMark: 100 },
      { metric: 'Profitability', subject: 78, sector: 70, fullMark: 100 },
      { metric: 'Momentum', subject: 92, sector: 75, fullMark: 100 },
      { metric: 'Quality', subject: 88, sector: 80, fullMark: 100 },
      { metric: 'Value', subject: 65, sector: 85, fullMark: 100 },
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">Sector Analysis</h2>
        
        {/* Radar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">Company vs Sector Median</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#71717a', fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                  <Radar 
                    name="Subject Company" 
                    dataKey="subject" 
                    stroke={accentColors.hex} 
                    fill={accentColors.hex}
                    fillOpacity={0.2}
                    strokeWidth={2}
                    isAnimationActive={theme.animate}
                  />
                  <Radar 
                    name="Sector Median" 
                    dataKey="sector" 
                    stroke="#6366f1" 
                    fill="#6366f1"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    isAnimationActive={theme.animate}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: '#111113',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Sector Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">Sector Performance Heatmap</h3>
            <div className="space-y-3">
              {sectorData.map((sector, index) => (
                <div key={sector.sector} className="space-y-2">
                  <div className="text-sm font-medium text-white">{sector.sector}</div>
                  <div className="grid grid-cols-5 gap-1">
                    {['growth', 'profitability', 'momentum', 'quality', 'value'].map(metric => {
                      const value = sector[metric];
                      const intensity = value / 100;
                      return (
                        <div key={metric} className="aspect-square rounded flex items-center justify-center text-xs font-bold text-white relative overflow-hidden">
                          <div 
                            className="absolute inset-0 transition-all duration-500"
                            style={{ 
                              backgroundColor: `rgba(${intensity > 0.7 ? '16,185,129' : intensity > 0.5 ? '245,158,11' : '244,63,94'}, ${intensity * 0.8})` 
                            }}
                          />
                          <span className="relative z-10">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">Your Company vs Sector Median</h3>
          <div className="space-y-4">
            {radarData.map((item, index) => (
              <div key={item.metric} className="flex items-center justify-between">
                <span className="text-sm text-zinc-400 w-24">{item.metric}</span>
                <div className="flex-1 mx-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-zinc-800 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${item.subject}%` }}
                      />
                    </div>
                    <span className="text-sm text-white tabular-nums w-8">{item.subject}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.subject > item.sector ? (
                    <ArrowUp className="w-4 h-4 text-emerald-400" />
                  ) : item.subject < item.sector ? (
                    <ArrowDown className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-zinc-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    item.subject > item.sector ? 'text-emerald-400' : 
                    item.subject < item.sector ? 'text-rose-400' : 'text-zinc-400'
                  }`}>
                    {item.subject > item.sector ? '+' : ''}{item.subject - item.sector}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  // ================================================================
  // ðŸ‘¥ PEER BENCHMARKING PAGE
  // ================================================================
  const PeerBenchmarkingPage = () => {
    const peerData = useMemo(() => {
      return data?.result?.agent_outputs?.competitor?.peer_rankings?.map(peer => ({
        ...peer,
        x: peer.revenue,
        y: peer.margin * 100,
        z: data?.result?.agent_outputs?.competitor?.relative_strength * 100 || 50
      })) || [];
    }, [data]);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">Peer Benchmarking</h2>
        
        {/* Scatter Plot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">Revenue vs EBITDA Margin</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={peerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis 
                  dataKey="x" 
                  type="number" 
                  name="Revenue ($B)"
                  stroke="#71717a"
                  label={{ value: 'Revenue ($B)', position: 'insideBottom', offset: -5, fill: '#71717a' }}
                />
                <YAxis 
                  dataKey="y" 
                  type="number" 
                  name="EBITDA Margin (%)"
                  stroke="#71717a"
                  label={{ value: 'EBITDA Margin (%)', angle: -90, position: 'insideLeft', fill: '#71717a' }}
                />
                <Tooltip 
                  contentStyle={{
                    background: '#111113',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(value, name) => [
                    name === 'Revenue ($B)' ? `$${value}B` : `${value}%`,
                    name
                  ]}
                />
                <Scatter 
                  name="Peers" 
                  dataKey="y" 
                  fill={accentColors.hex}
                  opacity={0.8}
                  isAnimationActive={theme.animate}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Peer Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0b] border-b border-white/[0.06]">
                <tr>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Rank</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Ticker</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Revenue</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">EBITDA Margin</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Relative Strength</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">vs. Subject</th>
                </tr>
              </thead>
              <tbody>
                {data?.result?.agent_outputs?.competitor?.peer_rankings?.map((peer, index) => {
                  const subjectRevenue = data?.result?.final_forecast?.revenue_p50 || 124.3;
                  const revenueDiff = ((peer.revenue - subjectRevenue) / subjectRevenue * 100);
                  
                  return (
                    <tr key={peer.ticker} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-zinc-500/20 text-zinc-400' :
                            index === 2 ? 'bg-amber-600/20 text-amber-600' :
                            'bg-zinc-700/20 text-zinc-500'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-white font-medium">{peer.ticker}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-zinc-300">${peer.revenue}B</span>
                      </td>
                      <td className="p-4">
                        <span className="text-zinc-300">{(peer.margin * 100).toFixed(1)}%</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 h-2 bg-zinc-800 rounded">
                            <div 
                              className="h-2 bg-emerald-500 rounded"
                              style={{ width: `${(data?.result?.agent_outputs?.competitor?.relative_strength || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-zinc-300">
                            {((data?.result?.agent_outputs?.competitor?.relative_strength || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          {revenueDiff > 0 ? (
                            <>
                              <ArrowUp className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">+{revenueDiff.toFixed(1)}%</span>
                            </>
                          ) : (
                            <>
                              <ArrowDown className="w-4 h-4 text-rose-400" />
                              <span className="text-rose-400 font-medium">{revenueDiff.toFixed(1)}%</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    );
  };

  // ================================================================
  // ðŸ›¡ AUDIT TRAIL PAGE
  // ================================================================
  const AuditTrailPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const auditEntries = [
      ...signalHistory.map((signal, index) => ({
        id: signal.request_id || `req-${index}`,
        timestamp: signal.ts || new Date().toISOString(),
        company: signal.companyId,
        action: signal.result?.recommendation?.action,
        confidence: signal.result?.combined_confidence,
        latency: signal.latency_ms,
        agents: signal.agents_called,
        degraded: signal.degraded_agents || [],
        status: signal.status,
        data: signal
      }))
    ];

    const filteredEntries = auditEntries.filter(entry => {
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
      if (searchTerm && !entry.company.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Audit Trail</h2>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#111113] border border-white/[0.06] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#111113] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="partial">Partial</option>
              <option value="error">Error</option>
            </select>
            
            <button className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/20 transition-colors">
              Export
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {filteredEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    entry.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                    entry.status === 'partial' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {entry.status === 'success' ? <CheckCircle className="w-5 h-5" /> :
                     entry.status === 'partial' ? <AlertTriangle className="w-5 h-5" /> :
                     <X className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="font-mono text-white font-medium">{entry.company}</div>
                      <div className="text-sm text-zinc-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                      <div className={`px-2 py-1 text-xs font-bold rounded ${getRecStyles(entry.action).bg} ${getRecStyles(entry.action).color}`}>
                        {getRecStyles(entry.action).label}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Confidence:</span>
                        <span className="ml-2 text-white">{((entry.confidence || 0) * 100).toFixed(theme.confDecimals)}%</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Latency:</span>
                        <span className="ml-2 text-white">{entry.latency}ms</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Agents:</span>
                        <span className="ml-2 text-white">{entry.agents?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Degraded:</span>
                        <span className="ml-2 text-white">{entry.degraded?.length || 0}</span>
                      </div>
                    </div>

                    {entry.degraded?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.degraded.map(agent => (
                          <span key={agent} className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs rounded">
                            {agent}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto mb-4 text-zinc-500 opacity-50" />
            <div className="text-zinc-500">No audit entries found</div>
          </div>
        )}
      </div>
    );
  };

  // ================================================================
  // âš™ CONFIGURATIONS PAGE
  // ================================================================
  const ConfigurationsPage = () => {
    const [configs, setConfigs] = useState({
      primaryLLM: 'groq',
      confidenceThreshold: 70,
      degradedAgentThreshold: 2,
      dataSourcePreference: 'auto',
      agentTimeout: 10
    });

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">System Configurations</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">System Settings</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Primary LLM</label>
                <select 
                  value={configs.primaryLLM}
                  onChange={(e) => setConfigs(prev => ({ ...prev, primaryLLM: e.target.value }))}
                  className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-3 py-2 text-white"
                >
                  <option value="groq">Groq LLaMA 3.3-70b</option>
                  <option value="gemini">Google Gemini Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Confidence Threshold ({configs.confidenceThreshold}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={configs.confidenceThreshold}
                  onChange={(e) => setConfigs(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-zinc-500 mt-1">Trigger human review below this threshold</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Degraded Agent Threshold ({configs.degradedAgentThreshold})
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={configs.degradedAgentThreshold}
                  onChange={(e) => setConfigs(prev => ({ ...prev, degradedAgentThreshold: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-zinc-500 mt-1">Max failed agents before escalation</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Data Source Preference</label>
                <select 
                  value={configs.dataSourcePreference}
                  onChange={(e) => setConfigs(prev => ({ ...prev, dataSourcePreference: e.target.value }))}
                  className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-3 py-2 text-white"
                >
                  <option value="auto">Auto (Live when available)</option>
                  <option value="live">Live Data Only</option>
                  <option value="synthetic">Synthetic Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Agent Timeout ({configs.agentTimeout}s)
                </label>
                <select 
                  value={configs.agentTimeout}
                  onChange={(e) => setConfigs(prev => ({ ...prev, agentTimeout: parseInt(e.target.value) }))}
                  className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-3 py-2 text-white"
                >
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                  <option value="15">15 seconds</option>
                </select>
              </div>

              <button className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                Save Configuration
              </button>
            </div>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">System Health</h3>
            
            <div className="space-y-4">
              {[
                { name: 'API Gateway', status: 'healthy', latency: '45ms' },
                { name: 'Transcript Agent', status: 'healthy', latency: '1.2s' },
                { name: 'Financial Model', status: 'healthy', latency: '980ms' },
                { name: 'News & Macro Agent', status: 'degraded', latency: '2.1s' },
                { name: 'Competitor Agent', status: 'healthy', latency: '1.6s' },
                { name: 'Database', status: 'healthy', latency: '12ms' },
              ].map((service, index) => (
                <div key={service.name} className="flex items-center justify-between p-3 bg-[#0a0a0b] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      service.status === 'healthy' ? 'bg-emerald-500 animate-pulse' :
                      service.status === 'degraded' ? 'bg-amber-500 animate-pulse' :
                      'bg-rose-500'
                    }`}></div>
                    <span className="text-sm text-white">{service.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-zinc-500">{service.latency}</span>
                    <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${
                      service.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                      service.status === 'degraded' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  // ================================================================
  // ðŸŽ¯ MAIN APP LAYOUT & ROUTING
  // ================================================================
  
  return (
    <BrowserRouter>
      <div className={`min-h-screen ${
        theme.bgDepth === 'deep' ? 'bg-[#0a0a0b]' :
        theme.bgDepth === 'dark' ? 'bg-[#111827]' :
        'bg-[#1f2937]'
      }`}>
        
        {/* Loading Overlay */}
        <LoadingOverlay />
        
        {/* Customizer Drawer */}
        <CustomizerDrawer />

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="flex min-h-screen">
                {/* Sidebar */}
                <Sidebar />
                
                {/* Main Content Area */}
                <div className={`flex-1 min-w-0 ${
                  theme.sidebarMode === 'hidden' ? 'ml-0' :
                  theme.sidebarMode === 'collapsed' ? 'ml-16' : 'ml-60'
                } transition-all duration-300`}>
                  
                  {/* Top Navigation */}
                  <TopBar />
                  
                  {/* Error Banner */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mx-6 mt-6 bg-rose-500/20 border border-rose-500/30 rounded-xl p-4 flex items-center space-x-3"
                    >
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <div>
                        <div className="font-medium text-rose-400">System Error</div>
                        <div className="text-sm text-rose-400/80">{error}</div>
                      </div>
                      <button 
                        onClick={() => setError(null)}
                        className="ml-auto text-rose-400 hover:text-rose-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                  
                  {/* Page Content */}
                  <div className={`${
                    theme.density === 'compact' ? 'p-4' :
                    theme.density === 'comfortable' ? 'p-6' :
                    'p-8'
                  } transition-all duration-300`}>
                    
                    <Routes>
                      <Route path="/dashboard" element={<RoleDashboardPage />} />
                      <Route path="/signals" element={<ActiveSignalsPage />} />
                      <Route path="/sector" element={<SectorAnalysisPage />} />
                      <Route path="/peers" element={<PeerBenchmarkingPage />} />
                      <Route path="/audit" element={<AuditTrailPage />} />
                      <Route path="/configs" element={<ConfigurationsPage />} />
                      <Route path="/upload" element={<UploadData />} />
                      <Route path="/org-history" element={<OrgHistory />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
