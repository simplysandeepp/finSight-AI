// frontend/src/components/InvestorDashboard.jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ACTION_CONFIG = {
  buy:     { emoji: "🟢", label: "Good to Invest",   bg: "bg-green-900/30",  border: "border-green-500", text: "text-green-400" },
  hold:    { emoji: "🟡", label: "Wait and Watch",    bg: "bg-yellow-900/30", border: "border-yellow-500",text: "text-yellow-400" },
  sell:    { emoji: "🔴", label: "Consider Selling",  bg: "bg-red-900/30",    border: "border-red-500",   text: "text-red-400" },
  monitor: { emoji: "🔵", label: "Keep Monitoring",   bg: "bg-blue-900/30",   border: "border-blue-500",  text: "text-blue-400" },
};

// Tooltip component to explain financial terms
function TermTooltip({ term, explanation, children }) {
  return (
    <span className="group relative cursor-help border-b border-dashed border-teal-400">
      {children}
      <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block
        bg-slate-700 text-white text-xs rounded-lg p-2 w-48 z-10 shadow-xl">
        <strong>{term}:</strong> {explanation}
      </span>
    </span>
  );
}

export default function InvestorDashboard({ result, companyProfile }) {
  const rec = result?.result?.recommendation;
  const forecast = result?.result?.final_forecast;
  const ensembler = result?.result;
  const action = rec?.action?.toLowerCase() || "monitor";
  const cfg = ACTION_CONFIG[action] || ACTION_CONFIG.monitor;
  const confidence = Math.round((ensembler?.combined_confidence || 0) * 100);

  return (
    <div className="space-y-6 p-4">

      {/* Main Signal Card */}
      <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-6 text-center`}>
        <div className="text-6xl mb-3">{cfg.emoji}</div>
        <h2 className={`text-3xl font-bold ${cfg.text}`}>{cfg.label}</h2>
        <p className="text-slate-300 mt-2 text-lg">
          Confidence: {confidence}%
        </p>
      </div>

      {/* Simple Summary */}
      {rec?.simple_summary && (
        <div className="bg-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-bold text-lg mb-3">📖 What This Means (Plain English)</h3>
          <p className="text-slate-300 leading-relaxed mb-4">{rec.simple_summary}</p>
          <div className="bg-teal-900/30 border border-teal-500 rounded-lg p-3">
            <p className="text-teal-300 font-semibold">{rec.simple_verdict}</p>
          </div>
        </div>
      )}

      {/* Revenue Forecast - Simplified */}
      {forecast && (
        <div className="bg-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-bold text-lg mb-4">💰 Expected Revenue</h3>
          <p className="text-slate-400 text-sm mb-3">
            This shows how much money the company is expected to make next quarter
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-700 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs">Worst Case</p>
              <p className="text-white font-bold text-xl">${forecast.revenue_ci?.[0]?.toFixed(0)}M</p>
            </div>
            <div className="bg-teal-900/40 border border-teal-500 rounded-xl p-3 text-center">
              <p className="text-teal-400 text-xs">Most Likely</p>
              <p className="text-white font-bold text-xl">${forecast.revenue_p50?.toFixed(0)}M</p>
            </div>
            <div className="bg-slate-700 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs">Best Case</p>
              <p className="text-white font-bold text-xl">${forecast.revenue_ci?.[1]?.toFixed(0)}M</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Strengths & Risks */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-2xl p-4">
          <h3 className="text-green-400 font-bold mb-3">✅ Good Signs</h3>
          <ul className="space-y-2">
            {(rec?.key_strengths || []).slice(0, 3).map((s, i) => (
              <li key={i} className="text-slate-300 text-sm">{s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-800 rounded-2xl p-4">
          <h3 className="text-red-400 font-bold mb-3">⚠️ Watch Out For</h3>
          <ul className="space-y-2">
            {(rec?.key_risks || []).slice(0, 3).map((r, i) => (
              <li key={i} className="text-slate-300 text-sm">{r}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-slate-500 text-xs text-center">
        ⚠️ This is AI-generated analysis for educational purposes only. Not financial advice.
        Always do your own research before investing.
      </p>
    </div>
  );
}
