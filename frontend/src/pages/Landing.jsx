import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Zap, Users, FileText, ArrowRight, Sparkles, ChevronDown,
  Shield, BarChart3, Globe, Brain, LineChart, Target, Clock, AlertTriangle,
  CheckCircle2, ArrowDown, Star, Lock, HelpCircle, ChevronUp, Cpu, Layers,
  Database, Server, Code2, Rocket, CreditCard, Crown, Building2, X, Menu
} from 'lucide-react';

/* ─── Reusable scroll-triggered wrapper ─── */
const FadeInSection = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Animated counter ─── */
const Counter = ({ target, suffix = '', prefix = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = parseInt(target);
    const duration = 2000;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);
  return <span ref={ref}>{prefix}{count}{suffix}</span>;
};

/* ─── Canvas-based financial graph background ─── */
const FinancialGraphBg = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const drawLine = (yBase, amplitude, speed, color, lineWidth) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      for (let x = 0; x < canvas.width; x += 3) {
        const y = yBase
          + Math.sin((x * 0.003) + time * speed) * amplitude
          + Math.sin((x * 0.007) + time * speed * 1.3) * (amplitude * 0.5)
          + Math.cos((x * 0.002) + time * speed * 0.7) * (amplitude * 0.3);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const drawCandles = (yBase, speed, color) => {
      for (let x = 50; x < canvas.width; x += 120) {
        const y = yBase
          + Math.sin((x * 0.004) + time * speed) * 40
          + Math.cos((x * 0.002) + time * speed * 0.5) * 20;
        const h = 8 + Math.sin((x * 0.01) + time * speed) * 6;
        ctx.fillStyle = color;
        ctx.fillRect(x - 1.5, y - h, 3, h * 2);
        ctx.fillRect(x - 4, y - h * 0.5, 8, h);
      }
    };

    const animate = () => {
      time += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(59,130,246,0.03)';
      ctx.lineWidth = 0.5;
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }

      drawLine(canvas.height * 0.3, 50, 0.4, 'rgba(59,130,246,0.08)', 1.5);
      drawLine(canvas.height * 0.5, 60, 0.3, 'rgba(139,92,246,0.06)', 1);
      drawLine(canvas.height * 0.7, 40, 0.5, 'rgba(34,211,238,0.05)', 1);
      drawLine(canvas.height * 0.4, 35, 0.6, 'rgba(16,185,129,0.05)', 0.8);
      drawCandles(canvas.height * 0.35, 0.3, 'rgba(59,130,246,0.04)');
      drawCandles(canvas.height * 0.65, 0.4, 'rgba(139,92,246,0.03)');

      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

/* ─── Floating nav ─── */
const FloatingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'AI Agents', href: '#agents' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0d0d0f]/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#hero" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <LineChart size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            FinSight AI
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300">
              {l.label}
            </a>
          ))}
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/40"
          >
            Login
          </button>
        </div>

        <button className="md:hidden text-zinc-400" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-[#0d0d0f]/95 backdrop-blur-2xl border-b border-white/5 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {links.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="text-sm text-zinc-400 hover:text-white py-2">{l.label}</a>
              ))}
              <button onClick={() => navigate('/login')} className="mt-2 px-5 py-2.5 bg-blue-600 rounded-xl text-sm font-semibold w-full">Login</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING COMPONENT
   ═══════════════════════════════════════════════════════════ */
const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const [openFaq, setOpenFaq] = useState(null);

  /* ── Data ── */
  const painPoints = [
    { icon: FileText, title: 'Manual Excel Models', desc: 'Hours of work, prone to human error and outdated assumptions', emoji: '📉' },
    { icon: CreditCard, title: 'Expensive Analysts', desc: 'Hiring financial analysts costs $150K+/yr — unaffordable for startups', emoji: '💸' },
    { icon: AlertTriangle, title: 'Missing Market Signals', desc: 'Macro events and sentiment shifts go unnoticed until it\'s too late', emoji: '🔇' },
    { icon: Users, title: 'No Peer Benchmarking', desc: 'No easy way to compare against competitors in real time', emoji: '🏝️' },
  ];

  const steps = [
    {
      num: '01',
      title: 'Upload or Enter Data',
      desc: 'Type any ticker symbol or enter your startup\'s financial data. We support both public companies and custom datasets.',
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-400',
    },
    {
      num: '02',
      title: '4 AI Agents Analyze Simultaneously',
      desc: 'Our multi-agent system processes transcripts, financials, macro signals, and competitor data — all in parallel.',
      icon: Cpu,
      gradient: 'from-purple-500 to-pink-400',
    },
    {
      num: '03',
      title: 'Get Your Full Report',
      desc: 'Revenue forecast, BUY/HOLD/SELL signal, confidence score, peer comparison — delivered in seconds.',
      icon: BarChart3,
      gradient: 'from-emerald-500 to-teal-400',
    },
  ];

  const agents = [
    {
      emoji: '📝',
      name: 'Transcript NLP Agent',
      role: 'Reads between the lines of earnings calls',
      desc: 'Uses Gemini 2.0 Flash to analyze management tone, forward guidance, and risk language from quarterly transcripts.',
      color: 'blue',
      gradient: 'from-blue-500/20 to-blue-600/5',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
    },
    {
      emoji: '📊',
      name: 'Financial Model Agent',
      role: 'XGBoost-powered forecasting engine',
      desc: 'Generates revenue and EBITDA predictions with confidence intervals using gradient-boosted decision trees on historical financials.',
      color: 'emerald',
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
    },
    {
      emoji: '📰',
      name: 'Macro News Agent',
      role: 'Macroeconomic context engine',
      desc: 'Monitors CPI, GDP, Fed policy, geopolitical events, and sector trends with Groq LLaMA 3.3 for real-time macro scoring.',
      color: 'amber',
      gradient: 'from-amber-500/20 to-amber-600/5',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
    },
    {
      emoji: '👥',
      name: 'Competitor Agent',
      role: 'Peer benchmarking system',
      desc: 'Maps your company against peers on revenue growth, margins, and market position — powered by live financial data.',
      color: 'purple',
      gradient: 'from-purple-500/20 to-purple-600/5',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-400',
    },
  ];

  const techStack = [
    { name: 'Groq LLaMA 3.3', icon: '⚡', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
    { name: 'Gemini 2.0', icon: '💎', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { name: 'XGBoost', icon: '🌲', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { name: 'FastAPI', icon: '🐍', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
    { name: 'React', icon: '⚛️', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
    { name: 'MongoDB', icon: '🍃', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { name: 'Firebase', icon: '🔥', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
    { name: 'TailwindCSS', icon: '🎨', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      badge: 'Current',
      desc: 'Perfect for exploring FinSight',
      features: ['5 analyses per month', 'All 4 AI agents', 'Basic dashboard', 'Email support'],
      cta: 'Start Free',
      featured: false,
      gradient: 'from-zinc-800 to-zinc-900',
      borderColor: 'border-zinc-700/50',
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      badge: 'Coming Soon',
      desc: 'For serious founders & analysts',
      features: ['Unlimited analyses', 'Priority processing', 'API access', 'Export reports (PDF)', 'Custom watchlists', 'Slack integration'],
      cta: 'Join Waitlist',
      featured: true,
      gradient: 'from-blue-600/20 to-purple-600/20',
      borderColor: 'border-blue-500/40',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      badge: 'Coming Soon',
      desc: 'For VC firms & financial teams',
      features: ['Everything in Pro', 'Custom model training', 'Dedicated support', 'SSO & compliance', 'White-label option', 'SLA guarantee'],
      cta: 'Contact Us',
      featured: false,
      gradient: 'from-zinc-800 to-zinc-900',
      borderColor: 'border-zinc-700/50',
    },
  ];

  const faqs = [
    {
      q: 'Is my data secure?',
      a: 'Yes. We use end-to-end encryption, never store raw financial data permanently, and our infrastructure runs on SOC 2-compliant cloud providers. Your data is processed in-memory and discarded after analysis.',
    },
    {
      q: 'What companies can I analyze?',
      a: 'Any publicly traded company with available financial data on Yahoo Finance, plus custom datasets you can upload. We support tickers from NYSE, NASDAQ, and major global exchanges.',
    },
    {
      q: 'How accurate are the forecasts?',
      a: 'Our ensemble model consistently achieves 85–92% directional accuracy on revenue forecasts. Every prediction includes confidence intervals so you know the uncertainty range. We\'re transparent — no black boxes.',
    },
    {
      q: 'Do I need technical knowledge?',
      a: 'Not at all. Just type a ticker and click Analyze. FinSight handles everything — data collection, modeling, NLP analysis, and report generation. If you can use Google, you can use FinSight.',
    },
    {
      q: 'How is this different from Bloomberg or Refinitiv?',
      a: 'Bloomberg costs $24,000/year. FinSight gives you AI-powered multi-agent analysis for free during beta. We focus on actionable signals, not raw data overload.',
    },
  ];

  const dashboardFeatures = [
    { label: 'Revenue Forecast', value: '$847M', sub: 'P50 estimate with CI', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Signal', value: 'STRONG BUY', sub: '89% confidence', icon: Target, color: 'text-blue-400' },
    { label: 'Peer Rank', value: '#2 of 8', sub: 'In sector cohort', icon: Users, color: 'text-purple-400' },
    { label: 'Macro Score', value: '7.2/10', sub: 'Favorable outlook', icon: Globe, color: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 overflow-x-hidden">
      <FloatingNav />

      {/* ═══════════════════════════════════════════════════
         ① HERO SECTION
         ═══════════════════════════════════════════════════ */}
      <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <FinancialGraphBg />

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-600/[0.08] rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-purple-600/[0.06] rounded-full blur-[120px] pointer-events-none" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale, y: heroY }} className="relative z-10 max-w-5xl mx-auto text-center px-6 pt-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-semibold mb-8 backdrop-blur-sm"
          >
            <Sparkles size={15} className="animate-pulse" />
            <span>Multi-Agent AI Financial Intelligence</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-6"
          >
            <span className="text-white">Your Startup's</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Financial Health,
            </span>
            <br />
            <span className="text-white">Decoded by AI</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            4 AI agents analyze financials, earnings transcripts, macro signals & competitors
            — delivering institutional-grade insights in seconds, not weeks.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/login')}
              className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl shadow-blue-600/25 hover:shadow-blue-500/40 flex items-center gap-3 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/10 to-blue-400/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              <span className="relative z-10 flex items-center gap-3">
                Try Free
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center gap-3"
            >
              See How It Works
              <ChevronDown size={18} className="animate-bounce" />
            </a>
          </motion.div>

          {/* Micro-stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-zinc-500"
          >
            {[
              { label: 'AI Agents', val: '4', suffix: '' },
              { label: 'Avg Analysis Time', val: '5', suffix: 's' },
              { label: 'Directional Accuracy', val: '89', suffix: '%' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-2xl font-black text-white"><Counter target={s.val} suffix={s.suffix} /></span>
                <span>{s.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <a href="#problem" className="flex flex-col items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronDown size={18} />
            </motion.div>
          </a>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════
         ② THE PROBLEM SECTION
         ═══════════════════════════════════════════════════ */}
      <section id="problem" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-400 bg-red-400/10 border border-red-400/20 rounded-full mb-6">
                The Problem
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
                Traditional analysis takes{' '}
                <span className="text-red-400">weeks.</span>
                <br />
                Your startup <span className="text-red-400">can't wait.</span>
              </h2>
              <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
                Startups move at light speed, but financial insight hasn't caught up — until now.
              </p>
            </div>
          </FadeInSection>

          {/* Pain points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {painPoints.map((p, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <div className="group relative bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6 hover:border-red-500/30 hover:bg-red-950/10 transition-all duration-500 h-full">
                  <div className="text-4xl mb-4">{p.emoji}</div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-red-400 transition-colors">{p.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{p.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>

          {/* Before vs After */}
          <FadeInSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Before */}
              <div className="relative bg-zinc-900/60 border border-red-500/20 rounded-2xl p-8 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <X size={20} className="text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-red-400">Before FinSight</h3>
                </div>
                <ul className="space-y-3">
                  {['3–5 days per analysis', 'Manual data gathering', 'Single-perspective models', 'No confidence intervals', 'Stale by delivery time'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                      <X size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* After */}
              <div className="relative bg-zinc-900/60 border border-emerald-500/20 rounded-2xl p-8 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-400">After FinSight</h3>
                </div>
                <ul className="space-y-3">
                  {['5 seconds per analysis', 'Auto-fetched live data', 'Multi-agent ensemble', 'Full confidence intervals', 'Always real-time'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                      <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
         ③ HOW IT WORKS
         ═══════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <FadeInSection>
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full mb-6">
                How It Works
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
                Three steps to{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">clarity</span>
              </h2>
              <p className="text-lg text-zinc-500 max-w-xl mx-auto">
                From raw ticker to full financial intelligence — in seconds.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <FadeInSection key={i} delay={i * 0.15}>
                <div className="group relative bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-8 hover:border-blue-500/30 transition-all duration-500 h-full">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-zinc-700 to-transparent z-20" />
                  )}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <step.icon size={26} className="text-white" />
                  </div>
                  <div className="text-5xl font-black text-zinc-800 mb-3">{step.num}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>

          {/* Agent flow diagram */}
          <FadeInSection delay={0.3}>
            <div className="mt-20 max-w-3xl mx-auto">
              <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-3xl p-8">
                <p className="text-center text-xs text-zinc-600 uppercase tracking-widest mb-6 font-bold">Agent Pipeline Architecture</p>
                <div className="flex flex-col items-center gap-4">
                  <div className="px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm font-semibold">
                    📥 Input: Ticker + Date
                  </div>
                  <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-zinc-700">
                    <ArrowDown size={20} />
                  </motion.div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                    {agents.map((a, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className={`px-3 py-3 bg-gradient-to-b ${a.gradient} border ${a.borderColor} rounded-xl text-center`}
                      >
                        <div className="text-2xl mb-1">{a.emoji}</div>
                        <div className={`text-xs font-bold ${a.textColor}`}>{a.name.replace(' Agent', '')}</div>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="text-zinc-700">
                    <ArrowDown size={20} />
                  </motion.div>
                  <div className="px-6 py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 text-sm font-semibold">
                    🧠 Ensemble Engine → Final Prediction
                  </div>
                  <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} className="text-zinc-700">
                    <ArrowDown size={20} />
                  </motion.div>
                  <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold">
                    📊 Dashboard: Forecast + Signal + Peers + Audit
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
         ④ THE 4 AGENTS
         ═══════════════════════════════════════════════════ */}
      <section id="agents" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded-full mb-6">
                AI Agents
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
                Meet your{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI analysts</span>
              </h2>
              <p className="text-lg text-zinc-500 max-w-xl mx-auto">
                Four specialized agents working in parallel — each an expert in its domain.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <div className={`group relative bg-zinc-900/50 border ${agent.borderColor} rounded-3xl p-8 hover:bg-gradient-to-b ${agent.gradient} transition-all duration-700 h-full`}>
                  <div className={`absolute -top-px -left-px -right-px h-px bg-gradient-to-r ${agent.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-t-3xl`} />
                  
                  <div className="flex items-start gap-5">
                    <div className="text-5xl flex-shrink-0">{agent.emoji}</div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-1 ${agent.textColor}`}>{agent.name}</h3>
                      <p className="text-sm text-zinc-400 font-medium mb-3">{agent.role}</p>
                      <p className="text-sm text-zinc-500 leading-relaxed">{agent.desc}</p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
         ⑤ OUTPUT SHOWCASE
         ═══════════════════════════════════════════════════ */}
      <section id="output" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full mb-6">
                What You Get
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
                Your{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">command center</span>
              </h2>
              <p className="text-lg text-zinc-500 max-w-xl mx-auto">
                Everything you need in one dashboard — no spreadsheet juggling required.
              </p>
            </div>
          </FadeInSection>

          {/* Dashboard mockup */}
          <FadeInSection delay={0.1}>
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 blur-3xl rounded-3xl" />
              
              <div className="relative bg-[#111113] border border-zinc-800/60 rounded-3xl overflow-hidden shadow-2xl">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-5 py-3 bg-zinc-900/80 border-b border-zinc-800/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="ml-3 text-xs text-zinc-600">FinSight AI — Dashboard</span>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black">AAPL Analysis</h3>
                      <p className="text-sm text-zinc-500">Apple Inc. • As of 2026-01-31</p>
                    </div>
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <span className="text-emerald-400 font-bold text-sm">● STRONG BUY</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {dashboardFeatures.map((f, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <f.icon size={14} className={f.color} />
                          <span className="text-xs text-zinc-500">{f.label}</span>
                        </div>
                        <div className={`text-xl font-black ${f.color}`}>{f.value}</div>
                        <div className="text-xs text-zinc-600 mt-1">{f.sub}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Chart mockup */}
                  <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-zinc-400">Revenue Forecast (Quarterly)</span>
                      <span className="text-xs text-zinc-600">P10 — P50 — P90</span>
                    </div>
                    <div className="h-40 flex items-end gap-2">
                      {[35, 42, 48, 52, 58, 62, 55, 68, 72, 78, 85, 92].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.4 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                          className="flex-1 rounded-t-lg bg-gradient-to-t from-blue-600/30 to-blue-400/60 relative"
                        >
                          <div className="absolute inset-x-0 top-0 h-1 bg-blue-400 rounded-t-lg opacity-80" />
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-zinc-700">
                      <span>Q1'24</span><span>Q2'24</span><span>Q3'24</span><span>Q4'24</span>
                      <span>Q1'25</span><span>Q2'25</span><span>Q3'25</span><span>Q4'25</span>
                      <span className="text-blue-400/60">Q1'26↗</span><span className="text-blue-400/60">Q2'26↗</span>
                      <span className="text-blue-400/60">Q3'26↗</span><span className="text-blue-400/60">Q4'26↗</span>
                    </div>
                  </div>

                  {/* Peer table */}
                  <div className="mt-6 bg-zinc-900/40 border border-zinc-800/40 rounded-2xl overflow-hidden">
                    <div className="px-6 py-3 border-b border-zinc-800/40">
                      <span className="text-sm font-bold text-zinc-400">Peer Comparison</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-zinc-600 border-b border-zinc-800/30">
                          <th className="text-left px-6 py-2">Company</th>
                          <th className="text-right px-6 py-2">Rev Growth</th>
                          <th className="text-right px-6 py-2">Margin</th>
                          <th className="text-right px-6 py-2">Signal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { n: 'AAPL', g: '+12.4%', m: '31.2%', s: 'BUY', sc: 'text-emerald-400' },
                          { n: 'MSFT', g: '+14.1%', m: '35.8%', s: 'BUY', sc: 'text-emerald-400' },
                          { n: 'GOOGL', g: '+8.7%', m: '27.4%', s: 'HOLD', sc: 'text-amber-400' },
                          { n: 'META', g: '+22.3%', m: '29.1%', s: 'BUY', sc: 'text-emerald-400' },
                        ].map((r, i) => (
                          <tr key={i} className="border-b border-zinc-800/20 hover:bg-zinc-800/20 transition-colors">
                            <td className="px-6 py-2.5 font-bold">{r.n}</td>
                            <td className="text-right px-6 py-2.5 text-emerald-400">{r.g}</td>
                            <td className="text-right px-6 py-2.5 text-zinc-400">{r.m}</td>
                            <td className={`text-right px-6 py-2.5 font-bold ${r.sc}`}>{r.s}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
         ⑥ WHY IT MATTERS
         ═══════════════════════════════════════════════════ */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full mb-6">
                Why It Matters
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
                Built for{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">founders</span>
                {' '}who move fast
              </h2>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Target,
                title: 'Impress Investors',
                desc: 'Series A investors want to see you understand your numbers. Walk into your pitch with AI-backed financial projections.',
                gradient: 'from-amber-400/20',
              },
              {
                icon: Shield,
                title: 'Know Your Runway',
                desc: 'Understand your margins, growth trajectory, and burn rate before your next board meeting — not after.',
                gradient: 'from-emerald-400/20',
              },
              {
                icon: AlertTriangle,
                title: 'Avoid the #1 Killer',
                desc: '73% of startups fail due to financial mismanagement. FinSight gives you the clarity to avoid that fate.',
                gradient: 'from-red-400/20',
                source: 'CB Insights, 2024',
              },
            ].map((card, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-8 h-full hover:border-zinc-700/60 transition-all duration-500">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} to-transparent flex items-center justify-center mb-6`}>
                    <card.icon size={26} className="text-zinc-200" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed mb-3">{card.desc}</p>
                  {card.source && (
                    <p className="text-xs text-zinc-700 italic">Source: {card.source}</p>
                  )}
                </div>
              </FadeInSection>
            ))}
          </div>

          {/* Big stat */}
          <FadeInSection>
            <div className="text-center bg-gradient-to-r from-red-950/20 via-red-950/30 to-red-950/20 border border-red-500/10 rounded-3xl p-12 max-w-3xl mx-auto">
              <div className="text-6xl sm:text-7xl font-black text-red-400 mb-3">
                <Counter target="73" suffix="%" />
              </div>
              <p className="text-xl font-semibold text-zinc-300 mb-2">of startups fail due to financial mismanagement</p>
              <p className="text-sm text-zinc-600">Source: CB Insights — Top Reasons Startups Fail, 2024</p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
         ⑦ TECH STACK
         ═══════════════════════════════════════════════════ */}
      <section className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <FadeInSection>
            <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full mb-6">
              Tech Stack
            </span>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Built on{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">battle-tested</span>
              {' '}AI infrastructure
            </h2>
            <p className="text-lg text-zinc-500 mb-12 max-w-xl mx-auto">
              Enterprise-grade tools powering startup-speed analysis.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.15}>
            <div className="flex flex-wrap justify-center gap-4">
              {techStack.map((tech, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className={`px-6 py-4 ${tech.bg} border ${tech.border} rounded-2xl flex items-center gap-3 backdrop-blur-sm transition-all duration-300 cursor-default`}
                >
                  <span className="text-2xl">{tech.icon}</span>
                  <span className={`font-bold text-sm ${tech.color}`}>{tech.name}</span>
                </motion.div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
         ⑧ PRICING
         ═══════════════════════════════════════════════════ */}
      <section id="pricing" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <FadeInSection>
            <div className="text-center mb-6">
              <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full mb-6">
                Pricing
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-4">
                Simple,{' '}
                <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">transparent</span>
                {' '}pricing
              </h2>
              <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-4">
                Start analyzing for free. Scale when you're ready.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold">
                <Rocket size={14} />
                Currently in Beta — Free for Early Adopters
              </div>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {pricingPlans.map((plan, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <div className={`relative bg-gradient-to-b ${plan.gradient} border ${plan.borderColor} rounded-3xl p-8 h-full flex flex-col ${plan.featured ? 'md:scale-[1.03] shadow-2xl shadow-blue-600/10' : ''}`}>
                  {plan.featured && (
                    <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      plan.badge === 'Current' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}>{plan.badge}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-zinc-500 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mb-6">{plan.desc}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm text-zinc-400">
                        <CheckCircle2 size={14} className={plan.featured ? 'text-blue-400' : 'text-zinc-600'} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => plan.name === 'Free' ? navigate('/login') : null}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      plan.featured
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-500/40'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
         ⑨ FAQ
         ═══════════════════════════════════════════════════ */}
      <section id="faq" className="relative py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400 bg-zinc-400/10 border border-zinc-400/20 rounded-full mb-6">
                FAQ
              </span>
              <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
                Got questions?
              </h2>
              <p className="text-lg text-zinc-500">We've got answers.</p>
            </div>
          </FadeInSection>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FadeInSection key={i} delay={i * 0.06}>
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden transition-all duration-300 hover:border-zinc-700/60">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                  >
                    <span className="font-semibold text-sm sm:text-base pr-4">{faq.q}</span>
                    <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown size={18} className="text-zinc-500 flex-shrink-0" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-sm text-zinc-500 leading-relaxed border-t border-zinc-800/30 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
         ⑩ FOOTER CTA
         ═══════════════════════════════════════════════════ */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeInSection>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/[0.08] blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
                Ready to understand
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  your financials?
                </span>
              </h2>
              <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-10">
                Join hundreds of founders using AI to decode their financial health. Free during beta.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="group relative px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl shadow-blue-600/25 hover:shadow-blue-500/40 flex items-center gap-3 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/10 to-blue-400/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  <span className="relative z-10 flex items-center gap-3">
                    Start Analyzing — It's Free
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
              <p className="mt-6 text-xs text-zinc-700">No credit card required • Free during beta • Takes 5 seconds</p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <LineChart size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              FinSight AI
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-600">
            <a href="#hero" className="hover:text-zinc-400 transition-colors">Home</a>
            <a href="#how-it-works" className="hover:text-zinc-400 transition-colors">How It Works</a>
            <a href="#agents" className="hover:text-zinc-400 transition-colors">AI Agents</a>
            <a href="#pricing" className="hover:text-zinc-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-zinc-400 transition-colors">FAQ</a>
          </div>
          <p className="text-xs text-zinc-700">
            © 2026 FinSight AI. Multi-agent financial intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
