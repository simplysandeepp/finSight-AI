import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Zap, Users, FileText, ArrowRight, Sparkles } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    const techStack = [
        { name: 'Groq LLaMA 3.3', icon: '⚡', color: 'text-orange-400' },
        { name: 'XGBoost', icon: '🌲', color: 'text-emerald-400' },
        { name: 'Gemini 2.0', icon: '💎', color: 'text-blue-400' },
        { name: 'FastAPI', icon: '🐍', color: 'text-green-400' },
        { name: 'React', icon: '⚛️', color: 'text-cyan-400' },
        { name: 'SQLite', icon: '🗄️', color: 'text-indigo-400' }
    ];

    const steps = [
        {
            number: '1',
            title: 'Enter Company + Date',
            description: 'Type any ticker (AAPL, TSLA, COMP_007) and select analysis date',
            icon: FileText
        },
        {
            number: '2',
            title: '4 AI Agents Analyze',
            description: 'Parallel processing of financials, news, peers, and transcripts',
            icon: Users
        },
        {
            number: '3',
            title: 'Get Forecast + Signal',
            description: 'Revenue prediction with buy/sell recommendation and confidence score',
            icon: TrendingUp
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0d0d0f] to-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-10">
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto text-center space-y-8 mb-20">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-bold mb-6">
                    <Sparkles size={16} />
                    <span>AI-Powered Financial Intelligence</span>
                </div>
                
                <h1 className="text-6xl font-black tracking-tight leading-tight">
                    <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        FinSight Ai
                    </span>
                </h1>
                
                <p className="text-2xl text-zinc-400 font-medium max-w-2xl mx-auto">
                    AI-powered financial forecasting for any public company
                </p>
                
                <p className="text-lg text-zinc-500">
                    Type a ticker → Get a prediction in 5 seconds
                </p>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="group mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center gap-3 mx-auto"
                >
                    Try it → Open Dashboard
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* How It Works */}
            <div className="max-w-6xl mx-auto mb-20">
                <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, idx) => (
                        <div key={idx} className="glass-card rounded-3xl p-8 text-center space-y-4 hover:bg-white/[0.04] transition-all">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                                <step.icon className="text-blue-400" size={32} />
                            </div>
                            <div className="text-4xl font-black text-blue-500">{step.number}</div>
                            <h3 className="text-xl font-bold">{step.title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tech Stack */}
            <div className="max-w-4xl mx-auto">
                <h3 className="text-center text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">
                    Powered By
                </h3>
                <div className="flex flex-wrap justify-center gap-4">
                    {techStack.map((tech, idx) => (
                        <div
                            key={idx}
                            className="px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center gap-3 hover:bg-zinc-800/50 transition-all"
                        >
                            <span className="text-2xl">{tech.icon}</span>
                            <span className={`font-bold text-sm ${tech.color}`}>{tech.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-20 text-center text-xs text-zinc-600">
                <p>Multi-agent financial forecasting system • Built with modern AI stack</p>
            </div>
        </div>
    );
};

export default Landing;
