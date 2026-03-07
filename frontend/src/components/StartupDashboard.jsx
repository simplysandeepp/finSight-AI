// frontend/src/components/StartupDashboard.jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

export default function StartupDashboard({ result, companyProfile }) {
  const forecast = result?.result?.final_forecast;
  const peers = result?.result?.peer_benchmarks || [];
  const breakdown = result?.explainability?.confidence_breakdown || {};
  const rec = result?.result?.recommendation;

  const agentLabels = {
    transcript_nlp: "NLP Agent",
    financial_model: "ML Model",
    news_macro: "Macro Agent",
    competitor: "Competitor"
  };

  const radarData = Object.entries(breakdown).map(([key, val]) => ({
    subject: agentLabels[key] || key,
    score: Math.round(val * 100),
  }));

  return (
    <div className="space-y-6 p-4">

      {/* Company Profile Header */}
      {companyProfile && (
        <div className="bg-slate-800 rounded-2xl p-5 flex items-start gap-4">
          {companyProfile.logo && (
            <img src={companyProfile.logo} alt="logo" className="w-12 h-12 rounded-lg object-contain bg-white p-1" />
          )}
          <div>
            <h2 className="text-white font-bold text-xl">{companyProfile.name}</h2>
            <p className="text-slate-400 text-sm">{companyProfile.sector} · {companyProfile.exchange}</p>
            <p className="text-teal-400 font-semibold">
              Market Cap: ${(companyProfile.market_cap || 0).toLocaleString()}M
            </p>
          </div>
        </div>
      )}

      {/* Financial Ratios Grid */}
      {companyProfile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "P/E Ratio", value: companyProfile.pe_ratio?.toFixed(1) ?? "N/A", hint: "Price-to-Earnings" },
            { label: "Revenue Growth", value: companyProfile.revenue_growth ? `${(companyProfile.revenue_growth * 100).toFixed(1)}%` : "N/A", hint: "YoY" },
            { label: "Net Margin", value: companyProfile.profit_margin ? `${(companyProfile.profit_margin).toFixed(1)}%` : "N/A", hint: "Profitability" },
            { label: "Market Cap", value: companyProfile.market_cap ? `${(companyProfile.market_cap / 1000).toFixed(1)}B` : "N/A", hint: "Total value" },
          ].map((metric) => (
            <div key={metric.label} className="bg-slate-800 rounded-xl p-4">
              <p className="text-slate-400 text-xs">{metric.label}</p>
              <p className="text-xs text-slate-500">{metric.hint}</p>
              <p className="text-white font-bold text-xl mt-1">{metric.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Revenue Forecast with CI */}
      {forecast && (
        <div className="bg-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-bold text-lg mb-4">📊 Probabilistic Revenue Forecast</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-700 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs">P05 (Bear)</p>
              <p className="text-white font-bold text-xl">${forecast.revenue_ci?.[0]?.toFixed(1)}M</p>
            </div>
            <div className="bg-teal-900/40 border border-teal-500 rounded-xl p-3 text-center">
              <p className="text-teal-400 text-xs">P50 (Base)</p>
              <p className="text-white font-bold text-2xl">${forecast.revenue_p50?.toFixed(1)}M</p>
            </div>
            <div className="bg-slate-700 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs">P95 (Bull)</p>
              <p className="text-white font-bold text-xl">${forecast.revenue_ci?.[1]?.toFixed(1)}M</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-700 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs">EBITDA P05</p>
              <p className="text-amber-400 font-bold">${forecast.ebitda_ci?.[0]?.toFixed(1)}M</p>
            </div>
            <div className="bg-amber-900/30 border border-amber-600 rounded-xl p-3 text-center">
              <p className="text-amber-400 text-xs">EBITDA P50</p>
              <p className="text-white font-bold text-xl">${forecast.ebitda_p50?.toFixed(1)}M</p>
            </div>
            <div className="bg-slate-700 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs">EBITDA P95</p>
              <p className="text-amber-400 font-bold">${forecast.ebitda_ci?.[1]?.toFixed(1)}M</p>
            </div>
          </div>
        </div>
      )}

      {/* Peer Benchmarking */}
      {peers.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-bold text-lg mb-4">👥 Competitor Benchmarking</h3>
          <div className="space-y-3">
            {peers.map((peer, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-700 rounded-xl p-3">
                <span className="text-white font-mono font-bold">{peer.peer_id}</span>
                <span className="text-slate-400 text-sm">
                  Rev: ${peer.revenue?.toFixed(0)}M
                </span>
                <span className={`text-sm font-semibold ${peer.revenue_delta > 0 ? "text-green-400" : "text-red-400"}`}>
                  {peer.revenue_delta > 0 ? "▲" : "▼"} {Math.abs(peer.revenue_delta * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Confidence Radar */}
      {radarData.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-bold text-lg mb-4">🤖 Agent Confidence Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Radar dataKey="score" stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Expert Rationale */}
      {rec?.rationale && (
        <div className="bg-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-bold text-lg mb-3">📝 Expert Analysis</h3>
          <p className="text-slate-300 leading-relaxed">{rec.rationale}</p>
        </div>
      )}
    </div>
  );
}
