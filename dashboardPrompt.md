# 🔷 FinSight Ai — Ultimate Dashboard Rebuild Prompt for Claude Opus

> **Copy everything below this line and paste it directly to Claude Opus.**

---

## MASTER PROMPT — FINSIGHT AI ULTRA DASHBOARD

You are an elite React + Tailwind CSS frontend architect and UI/UX designer. You will completely rebuild the FinSight Ai multi-agent financial intelligence platform dashboard as a single, jaw-dropping, production-grade React JSX file.

This is a premium financial intelligence SaaS product used by institutional investors and analysts. The UI must feel like a **Bloomberg Terminal meets Linear meets Vercel** — dark, dense, data-rich, with micro-interactions, glowing accents, animated confidence indicators, and pixel-perfect typography hierarchy.

---

## 🏗 PROJECT CONTEXT (READ CAREFULLY)

**FinSight Ai** runs 4 parallel AI agents on any company and returns a unified investment signal in <10 seconds:

| Agent | Technology | Output |
|---|---|---|
| Agent 1: Transcript NLP | Groq LLaMA 3.3-70b | sentiment, drivers, topics, numeric_facts |
| Agent 2: Financial Model | XGBoost quantile regression | revenue_p50, ebitda_p50, confidence intervals |
| Agent 3: News & Macro | Groq LLaMA / Gemini | macro score, news sentiment, rate impact |
| Agent 4: Competitor | yfinance peer data | peer_rankings, relative_strength |
| CIO Ensembler | Groq LLaMA 3.3-70b | final recommendation, combined_confidence, explanations |

**Backend API endpoint:** `POST /api/predict` → returns the full payload below.

---

## 📦 FULL API RESPONSE SHAPE

```json
{
  "request_id": "req-a3f7b2c1",
  "trace_id": "trace-9d4e5f6a",
  "model_version": "bundle_v1",
  "status": "success",
  "latency_ms": 4823,
  "data_source": "live_vantage",
  "agents_called": ["transcript_nlp", "financial_model", "news_macro", "competitor"],
  "degraded_agents": [],
  "agent_latencies": {
    "transcript_nlp": 1240,
    "financial_model": 980,
    "news_macro": 2100,
    "competitor": 1650
  },
  "result": {
    "final_forecast": {
      "revenue_p50": 124.3,
      "ebitda_p50": 38.5,
      "revenue_ci": [110.2, 138.1],
      "ebitda_ci": [32.1, 44.8]
    },
    "recommendation": {
      "action": "buy",
      "rationale": "Strong revenue momentum supported by services growth"
    },
    "explanations": [
      "Revenue growth YoY of 6% exceeds sector median of 3.2%",
      "EBITDA margin expanding from 28% to 31% signals operating leverage",
      "Stable macro environment with neutral rate outlook reduces discount risk",
      "Peer positioning: above median in margin, below in absolute revenue scale"
    ],
    "human_review_required": false,
    "combined_confidence": 0.827,
    "agent_outputs": {
      "transcript_nlp": {
        "sentiment": 0.74,
        "confidence": 0.85,
        "drivers": [
          { "sentence": "Services revenue grew 17% YoY driven by App Store", "importance": 0.92, "mismatch_flag": false },
          { "sentence": "Operating cash flow exceeded expectations at $32B", "importance": 0.88, "mismatch_flag": false }
        ],
        "numeric_facts": [
          { "name": "revenue", "value": 124.3, "unit": "billion_USD", "source": "transcript" },
          { "name": "ebitda", "value": 38.5, "unit": "billion_USD", "source": "transcript" }
        ],
        "top_topics": [
          { "topic": "services_growth", "score": 0.88 },
          { "topic": "supply_chain", "score": 0.61 },
          { "topic": "ai_investment", "score": 0.74 }
        ]
      },
      "financial_model": {
        "revenue_forecast": { "p05": 110.2, "p50": 124.3, "p95": 138.1 },
        "ebitda_forecast": { "p05": 32.1, "p50": 38.5, "p95": 44.8 },
        "confidence": 0.88,
        "feature_importances": [
          { "feature": "revenue_lag_1q", "weight": 0.34 },
          { "feature": "revenue_roll_mean_4q", "weight": 0.21 },
          { "feature": "revenue_growth_yoy", "weight": 0.18 }
        ]
      },
      "news_macro": {
        "confidence": 0.78,
        "macro_score": 0.65,
        "rate_impact": "neutral",
        "news_sentiment": 0.71,
        "key_risks": ["Interest rate trajectory", "FX headwinds"]
      },
      "competitor": {
        "confidence": 0.80,
        "peer_rankings": [
          { "ticker": "MSFT", "revenue": 198.3, "margin": 0.42 },
          { "ticker": "GOOGL", "revenue": 175.0, "margin": 0.28 },
          { "ticker": "META", "revenue": 134.9, "margin": 0.35 }
        ],
        "relative_strength": 0.73
      }
    }
  },
  "explainability": {
    "confidence_breakdown": {
      "transcript_nlp": 0.85,
      "financial_model": 0.88,
      "news_macro": 0.78,
      "competitor": 0.80
    },
    "degraded": []
  },
  "audit_link": "https://audit.internal/req-a3f7b2c1"
}
```

---

## ⚙️ EXISTING TECH STACK

- **React 18** with hooks (`useState`, `useMemo`, `useEffect`, `useCallback`, `useRef`)
- **Tailwind CSS** (utility-only, no custom config — use only core Tailwind classes)
- **Recharts** for all charts: `BarChart`, `Bar`, `LineChart`, `Line`, `RadarChart`, `Radar`, `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, `ReferenceLine`, `ComposedChart`
- **Lucide React** v0.263.1 for icons
- **Framer Motion** for animations: `motion`, `AnimatePresence`
- **axios** for API calls
- **React Router DOM** v7 (`BrowserRouter`, `Routes`, `Route`, `useNavigate`, `useLocation`)

---

## 🎨 DESIGN SYSTEM

### Color Palette
```
Background:      #0a0a0b  (deepest)
Surface:         #0d0d0f  (page bg)
Card:            #111113  (card bg)
Border:          rgba(255,255,255,0.06)
Text Primary:    #f4f4f5  (zinc-100)
Text Secondary:  #71717a  (zinc-500)
Text Muted:      #3f3f46  (zinc-700)

Buy/Bullish:     #10b981  emerald-500  glow: rgba(16,185,129,0.15)
Sell/Bearish:    #f43f5e  rose-500     glow: rgba(244,63,94,0.15)
Hold/Neutral:    #6366f1  indigo-500   glow: rgba(99,102,241,0.15)
Monitor:         #f59e0b  amber-500    glow: rgba(245,158,11,0.15)
Info:            #3b82f6  blue-500
AI/Agent:        #8b5cf6  violet-500

Confidence High: #10b981
Confidence Med:  #f59e0b
Confidence Low:  #f43f5e
```

### Typography Scale
```
Hero number:  text-5xl font-black tracking-tighter
KPI value:    text-3xl font-bold tabular-nums
Label:        text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500
Body:         text-sm text-zinc-300
Caption:      text-xs text-zinc-500
Badge:        text-[9px] font-black uppercase tracking-widest
```

### Card Styles
```
Standard glass card: bg-[#111113] border border-white/[0.06] rounded-2xl
Elevated card:       bg-[#111113] border border-white/[0.06] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]
Glow card (buy):     ring-1 ring-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.08)]
Glow card (sell):    ring-1 ring-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.08)]
Hover:               hover:border-white/[0.12] transition-all duration-200
```

---

## 🏛 LAYOUT ARCHITECTURE

Build a single `App.jsx` file that contains ALL of the following — every component, page, utility, and state — in ONE export. Structure it with clearly commented sections.

### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (64px collapsed / 240px expanded)          │
│  ┌───────────────────────────────────────────────┐  │
│  │  TOPBAR: Ticker Input + Date + Analyze Button │  │
│  ├───────────────────────────────────────────────┤  │
│  │  PAGE CONTENT (scrollable)                    │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  Active Page Component                  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Pages (all implemented)
1. `/` → Landing
2. `/dashboard` → Main Dashboard ← **PRIMARY FOCUS**
3. `/signals` → Active Signals History
4. `/sector` → Sector Analysis
5. `/peers` → Peer Benchmarking
6. `/audit` → Audit Trail
7. `/configs` → Configurations

---

## 🧩 COMPONENT SPECIFICATIONS

### 1. SIDEBAR Component
- Collapsible: toggle between 64px (icons only) and 240px (icons + labels)
- Logo at top: "FS" monogram in a gradient square, "FinSight Ai" text when expanded
- Navigation items with icons, labels, active state indicator (left border glow)
- Bottom section: system status dot (green = online), version badge `v1.0`
- Collapse toggle button at bottom
- Smooth width transition with `transition-all duration-300`

### 2. TOPBAR / NAVBAR Component
- Left: current page title + breadcrumb
- Center: Company ID input (monospace font, placeholder "COMP_007 or AAPL"), Date picker input, "Run Analysis" button
- "Run Analysis" button: gradient bg, loading spinner (animated), disabled state while fetching
- Right: Data source badge (LIVE / SYNTHETIC), latency display, notification bell, settings gear
- Show last analysis timestamp when data is available

### 3. DASHBOARD PAGE — THE CENTERPIECE

Build the dashboard as a **multi-section, deeply information-rich** layout. Use a **12-column CSS grid** system.

#### Section A — Alert Banner (conditional)
Show ONLY if `human_review_required === true`:
- Amber/rose pulsing banner: "⚠ Escalation Triggered — Human Verification Required"
- Shows confidence score, degraded agents list, escalation button

#### Section B — Hero KPI Row (4 cards, full width)
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ SIGNAL       │ CONFIDENCE   │ REVENUE P50  │ EBITDA P50   │
│ STRONG BUY   │ 82.7%        │ $124.3M      │ $38.5M       │
│ emerald glow │ animated arc │ +CI range    │ +CI range    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Signal Card:** Large action text with matching glow shadow, recommendation rationale below, pulsing signal dot.

**Confidence Card:** Animated circular arc/ring (use SVG or CSS) that fills from 0% → actual% on mount. Color: emerald >80%, amber 60-80%, rose <60%.

**Revenue Card:** P50 value large, show CI range as `[$110.2M – $138.1M]`, small uncertainty bar beneath showing the spread as a mini visual range indicator.

**EBITDA Card:** Same treatment as Revenue.

#### Section C — Main Analysis Grid (cols 8 + 4)

**Left (8 cols):**

**C1 — Forecast Visualization Chart**
- Use `ComposedChart` from Recharts
- Show Revenue and EBITDA as grouped bars (p50 values)
- Overlay error bars or reference lines for CI ranges (p05, p95)
- Custom tooltip showing all three values (p05, p50, p95)
- Gradient bar fills: `fill="url(#revenueGradient)"` with SVG `<defs>`
- Animated on data load with Framer Motion

**C2 — Ensemble Intelligence Drivers**
- Section title: "CIO Synthesis — Reasoning Chain"
- Show each explanation as a numbered card
- Each card: index number badge (colored), explanation text, subtle divider
- Hover: card lifts slightly, text brightens
- If `mismatch_flag` is true on any driver, show a `⚠` amber icon next to it

**C3 — Agent Sentiment & Topic Heatmap**
- From `transcript_nlp.top_topics`: show as horizontal bars with topic labels
- Color intensity maps to score (0 = dark, 1 = vibrant)
- Animate bars from 0 → actual width on mount using CSS `transition`

**Right (4 cols):**

**C4 — Agent Confidence Breakdown**
- For each agent (`transcript_nlp`, `financial_model`, `news_macro`, `competitor`):
  - Agent name + icon (🧠 📊 📰 🏢)
  - Latency badge (e.g., "1.24s")
  - Confidence bar (color-coded): animated fill
  - Degraded pill if agent is in `degraded_agents[]`
- Title: "Multi-Agent Signal Attribution"

**C5 — Recommendation Card**
- Large action: BUY / SELL / HOLD / MONITOR
- Full rationale text from `recommendation.rationale`
- Signal strength meter (0-100) mapped from combined_confidence
- Timestamp of analysis
- "Open Audit Trail →" link

**C6 — Numeric Facts Panel**
- From `transcript_nlp.numeric_facts`
- Table-like list: Fact name | Value | Unit | Source badge
- Clean monospace numbers, alternating row shading

#### Section D — Secondary Grid (3 equal columns)

**D1 — Forecast Confidence Interval Visualization**
- Show Revenue CI as a horizontal range bar
- Mark p05, p50, p95 with labeled tick marks
- Fill between p05-p95 with semi-transparent color
- Show EBITDA CI below it
- Title: "Probabilistic Forecast Bands"

**D2 — Macro & News Signals**
- From `news_macro` agent output:
- `macro_score`: large gauge number with color
- `news_sentiment`: emoji + score (😊 Positive / 😐 Neutral / 😟 Negative)
- `rate_impact`: badge (Bullish / Neutral / Bearish)
- `key_risks`: list with `⚡` icons
- Title: "External Signal Environment"

**D3 — Request Metadata**
- `request_id`, `trace_id`, `model_version`
- `status` pill: success (emerald) / partial (amber)
- `latency_ms` with a mini bar visualization
- `data_source` badge: LIVE (blue pulse) / SYNTHETIC (gray)
- `agents_called` list
- `audit_link` button: "View Full Audit →"
- Title: "System Metadata"

---

### 4. ACTIVE SIGNALS PAGE (`/signals`)
- Header with filter controls: date range picker, action filter (BUY/SELL/HOLD/MONITOR), confidence threshold slider
- Table/grid of past predictions (use mock data if no real history):
  - Columns: Company ID | Date | Action | Confidence | Revenue P50 | Status | Latency | View
  - Row hover: highlight + expand chevron
  - Action pills: color-coded
  - Confidence: inline mini-bar
  - Status: success (green dot) / partial (amber dot)
- Pagination controls at bottom
- Empty state: animated placeholder

### 5. SECTOR ANALYSIS PAGE (`/sector`)
- Sector performance overview (use mock data)
- Radar chart (`RadarChart`) showing sector scores: Growth, Profitability, Momentum, Quality, Value
- Sector heatmap grid: 8 sectors × 4 metrics as colored cells
- "Your company vs sector median" comparison bars
- Data freshness indicator

### 6. PEER BENCHMARKING PAGE (`/peers`)
- From `competitor.peer_rankings` + mock data for richer view
- Scatter plot: X = Revenue, Y = EBITDA Margin, bubble size = relative_strength
- Table: Rank | Ticker | Revenue | EBITDA Margin | Relative Strength | vs. Subject
- "vs. Subject" column shows `▲ +X%` or `▼ -X%` with color
- Subject company highlighted in all visualizations

### 7. AUDIT TRAIL PAGE (`/audit`)
- Timeline view of all API requests (mock data for history)
- Each entry: timestamp, company, action taken, confidence, latency, agents, degraded list
- Expandable rows showing full JSON output
- Search bar + filter by status
- Export button (mock)

### 8. CONFIGURATIONS PAGE (`/configs`)
- System settings panel:
  - Primary LLM toggle (Groq / Gemini)
  - Confidence threshold slider (0-100) for human review trigger
  - Degraded agent threshold (1/2/3)
  - Data source preference (Live / Synthetic / Auto)
  - Timeout per agent (5s / 10s / 15s)
- All toggles/sliders are interactive React-controlled components
- "Save Config" button (mock save)
- System health panel: agent status dots, API health, DB status

---

## 🎛 CUSTOMIZATION SYSTEM (VERY IMPORTANT — BUILD THIS)

Implement a **live customization panel** accessible from a `⚙` button in the top-right corner.

When opened, it slides in from the right as a drawer (300px wide) with:

### Theme Controls
- **Accent color picker**: 6 presets — Emerald (default), Blue, Violet, Amber, Cyan, Rose. Clicking changes ALL accent colors globally via a React context/state.
- **Dark mode intensity**: slider — "Deep Black", "Dark Gray", "Charcoal" (changes background from `#0a0a0b` → `#111827` → `#1f2937`)
- **Chart style toggle**: "Gradient Fill" vs "Solid Fill" vs "Outline Only"
- **Border glow**: toggle on/off the colored border glow on cards

### Layout Controls
- **Sidebar mode**: "Collapsed" / "Expanded" / "Hidden"
- **Density**: "Compact" / "Comfortable" / "Spacious" — changes padding on all cards
- **KPI cards**: toggle individual cards on/off (checkboxes for Signal, Confidence, Revenue, EBITDA)
- **Chart type for Forecast**: toggle between Bar, Area, and Line chart

### Data Display Controls
- **Confidence decimal places**: 0, 1, or 2 decimal places
- **Currency unit**: Millions ($M) / Billions ($B) / Raw
- **Show/hide sections**: toggle visibility of each dashboard section (Drivers, Topics, Metadata, etc.)
- **Animate on load**: toggle all entrance animations on/off

### Export & Share
- **Export Dashboard** button: downloads a JSON snapshot of current data (mock)
- **Copy Report** button: copies a text summary to clipboard (actually functional!)
- **Share Link** button: copies a mock URL

Close button at top-right of drawer. Backdrop overlay when open.

---

## 🌊 ANIMATION SPECIFICATIONS

Use **Framer Motion** for ALL entrance animations:

```jsx
// Cards enter with stagger
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: index * 0.08 }}
>
```

```jsx
// Loading state: pulsing skeleton cards
<motion.div
  animate={{ opacity: [0.3, 0.6, 0.3] }}
  transition={{ duration: 1.5, repeat: Infinity }}
  className="h-40 rounded-2xl bg-zinc-800/50"
/>
```

```jsx
// Confidence ring animation
<motion.circle
  initial={{ strokeDashoffset: circumference }}
  animate={{ strokeDashoffset: offset }}
  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
/>
```

- All chart bars animate from 0 height on mount
- Number counters animate from 0 → actual value using `useEffect` + `requestAnimationFrame`
- Sidebar collapse/expand is animated
- Customization drawer slides in with spring physics
- Alert banner pulses continuously if shown

---

## 📊 MOCK DATA SYSTEM

When `data === null` (no API response yet), render the dashboard in **"Demo Mode"** with:
- A subtle "DEMO" watermark badge in top-right
- Pre-populated mock data matching the full API schema above
- The Analyze button still works and will replace demo data with real API data

```jsx
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
    final_forecast: { revenue_p50: 124.3, ebitda_p50: 38.5, revenue_ci: [110.2, 138.1], ebitda_ci: [32.1, 44.8] },
    recommendation: { action: "buy", rationale: "Strong revenue momentum supported by services growth trajectory and expanding margins." },
    explanations: [
      "Revenue growth YoY of 6% exceeds sector median of 3.2%",
      "EBITDA margin expanding from 28% → 31% signals operating leverage",
      "Stable macro with neutral rate outlook reduces discount rate risk",
      "Peer positioning: above median in margin, below in absolute revenue scale"
    ],
    human_review_required: false,
    combined_confidence: 0.827,
    agent_outputs: {
      transcript_nlp: {
        sentiment: 0.74, confidence: 0.85,
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
        confidence: 0.78, macro_score: 0.65, rate_impact: "neutral",
        news_sentiment: 0.71,
        key_risks: ["Interest rate trajectory uncertainty", "FX headwinds in APAC markets", "Regulatory pressure on services"]
      },
      competitor: {
        confidence: 0.80, relative_strength: 0.73,
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
    confidence_breakdown: { transcript_nlp: 0.85, financial_model: 0.88, news_macro: 0.78, competitor: 0.80 },
    degraded: []
  },
  audit_link: "https://audit.internal/demo-req-001"
};
```

---

## 🔧 STATE MANAGEMENT ARCHITECTURE

```jsx
// Root state in App component
const [companyId, setCompanyId] = useState('COMP_007');
const [asOfDate, setAsOfDate] = useState('2026-01-31');
const [loading, setLoading] = useState(false);
const [data, setData] = useState(MOCK_DATA);   // ← initialize with mock
const [error, setError] = useState(null);
const [isDemoMode, setIsDemoMode] = useState(true);
const [signalHistory, setSignalHistory] = useState([]);  // accumulates past runs

// Customization state
const [theme, setTheme] = useState({
  accent: 'emerald',       // 'emerald' | 'blue' | 'violet' | 'amber' | 'cyan' | 'rose'
  bgDepth: 'deep',         // 'deep' | 'dark' | 'charcoal'
  chartStyle: 'gradient',  // 'gradient' | 'solid' | 'outline'
  borderGlow: true,
  sidebarMode: 'expanded', // 'collapsed' | 'expanded' | 'hidden'
  density: 'comfortable',  // 'compact' | 'comfortable' | 'spacious'
  animate: true,
  currencyUnit: 'M',       // 'M' | 'B' | 'raw'
  confDecimals: 1,
  showSections: {
    drivers: true, topics: true, metadata: true,
    macro: true, peers: true, features: true
  },
  chartType: 'bar',        // 'bar' | 'area' | 'line'
  kpiCards: {
    signal: true, confidence: true, revenue: true, ebitda: true
  }
});

const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

// On successful prediction: add to history
const handlePredict = async (e) => {
  if (e) e.preventDefault();
  setLoading(true);
  setError(null);
  setIsDemoMode(false);
  try {
    const response = await axios.post('/api/predict', { company_id: companyId, as_of_date: asOfDate });
    setData(response.data);
    setSignalHistory(prev => [{ ...response.data, companyId, asOfDate, ts: new Date().toISOString() }, ...prev]);
  } catch (err) {
    setError(err.response?.data?.detail || 'System synchronization failure.');
  } finally {
    setLoading(false);
  }
};
```

---

## 💎 SPECIAL INTERACTIVE FEATURES TO BUILD

### 1. Animated Confidence Ring
```jsx
// SVG circular progress ring that animates on mount
const ConfidenceRing = ({ value, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value * circumference);
  const color = value > 0.8 ? '#10b981' : value > 0.6 ? '#f59e0b' : '#f43f5e';
  // ... animate strokeDashoffset from circumference → offset
};
```

### 2. Animated Number Counter
```jsx
// Numbers count up from 0 to their value on mount
const useCountUp = (target, duration = 1000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // requestAnimationFrame loop
  }, [target]);
  return count;
};
```

### 3. Live Agent Status Indicator
When loading (`loading === true`), show a **live agent execution visualization**:
- 4 agent boxes arranged in a row
- Each shows: agent name, spinning loader, "Analyzing..."
- They complete one by one with a checkmark animation (staggered)
- Below them: "CIO Ensembler synthesizing..." with a different animation
- This entire overlay fades out when data arrives

### 4. Customizer Drawer
```jsx
// Framer Motion slide-in drawer
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
        {/* Customizer content */}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### 5. Copy Report Button (Actually Functional)
```jsx
const copyReport = () => {
  const report = `
FinSight Ai — Analysis Report
==============================
Company: ${companyId} | Date: ${asOfDate}
Signal: ${data.result.recommendation.action.toUpperCase()}
Confidence: ${(data.result.combined_confidence * 100).toFixed(1)}%
Revenue Forecast: $${data.result.final_forecast.revenue_p50}M [${data.result.final_forecast.revenue_ci[0]}M – ${data.result.final_forecast.revenue_ci[1]}M]
EBITDA Forecast: $${data.result.final_forecast.ebitda_p50}M

Rationale: ${data.result.recommendation.rationale}

Key Drivers:
${data.result.explanations.map((e, i) => `${i+1}. ${e}`).join('\n')}

Request ID: ${data.request_id}
Latency: ${data.latency_ms}ms
  `.trim();
  navigator.clipboard.writeText(report);
  // Show a toast notification
};
```

### 6. Feature Importance Chart
From `financial_model.feature_importances`, render a horizontal bar chart showing top 5 features with their weights. Use gradient fills from violet to blue.

### 7. Radar Chart (Sector Analysis page)
Use `RadarChart` from Recharts:
- Axes: Growth, Profitability, Momentum, Quality, Value
- Two data series: "Subject Company" and "Sector Median"
- Custom dot styling, animated fill

---

## 📐 RESPONSIVE BEHAVIOR

- Desktop (>1280px): Full 12-column grid as designed
- Tablet (768-1280px): Stack to 6-column grid, sidebar collapses automatically
- Mobile (<768px): Single column, sidebar becomes bottom nav
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`

---

## 🚨 CRITICAL IMPLEMENTATION RULES

1. **Everything in ONE file** — `App.jsx`. All components are defined as functions within the same file. No imports from custom files (except the libraries listed above).

2. **No TypeScript** — pure JSX only.

3. **No localStorage** — all state in React. No browser storage APIs.

4. **No form tags** — use `onClick` on buttons and `onChange` on inputs.

5. **All Tailwind classes must be from core Tailwind** — no custom utilities except what's already in `index.css` (`.glass`, `.glass-card`, `.gradient-text`).

6. **Handle null/undefined gracefully everywhere** — use optional chaining (`?.`) and nullish coalescing (`??`) throughout. Never crash if a field is missing from API response.

7. **Demo mode on startup** — populate with `MOCK_DATA` so the dashboard is never empty. Show `[DEMO]` badge. Real data replaces it on first API call.

8. **All charts must have:**
   - `ResponsiveContainer` wrapper
   - Custom styled `Tooltip` with dark background
   - Animated entry (Recharts `isAnimationActive={theme.animate}`)
   - Empty state when no data

9. **Loading state:** While `loading === true`, show the agent execution visualization overlay, not a simple spinner.

10. **Error state:** Show inline error banner (rose-colored) below the topbar, not a full-page error. Dashboard remains visible underneath.

11. **Apply `theme` state** — all accent colors, padding density, border glow, chart style should visually change based on the `theme` object from the customizer. Use a computed `accentColors` object derived from `theme.accent`:

```jsx
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
```

---

## 📋 FINAL DELIVERY CHECKLIST

Before finalizing your code, verify:

- [ ] App loads in demo mode with MOCK_DATA visible immediately
- [ ] All 4 KPI hero cards render with animated values
- [ ] Confidence ring animates from 0 on mount
- [ ] Forecast chart renders with gradient fills and CI reference lines
- [ ] Agent attribution panel shows all 4 agents with confidence bars
- [ ] Explanation/driver cards render with stagger animation
- [ ] Topic heatmap bars animate correctly
- [ ] Customizer drawer opens/closes smoothly
- [ ] All 6 theme accent colors visibly change the dashboard
- [ ] Density slider changes card padding
- [ ] Section visibility toggles actually hide/show sections
- [ ] Active Signals page shows mock signal history table
- [ ] Peer Benchmarking shows scatter plot + table
- [ ] Audit Trail shows timeline
- [ ] Configurations page has all interactive controls
- [ ] Copy Report button actually copies formatted text
- [ ] Loading overlay shows agent execution animation
- [ ] Error state shows inline rose banner
- [ ] `human_review_required: true` shows escalation banner
- [ ] Sidebar collapses/expands with animation
- [ ] All numbers use optional chaining and have null fallbacks
- [ ] No console errors on initial load

---

## 🎯 TONE & POLISH REMINDERS

- This is a **premium B2B financial product**, not a personal project. Every pixel matters.
- Spacing should feel **intentional and generous** — not cramped.
- Typography hierarchy must be **immediately readable** — the signal should dominate visually.
- Charts should be **beautiful, not just functional** — use gradients, custom dots, styled tooltips.
- Micro-interactions (hover states, active states, transitions) should feel **smooth and instant**.
- The overall impression should be: *"This is the dashboard a quantitative hedge fund would pay $50k/month for."*

---

**Now write the complete, production-ready `App.jsx` file. Start with imports, then MOCK_DATA, then all component definitions, then the root App component with all state and routing. Use extensive inline comments to separate sections. Aim for maximum completeness — every page, every feature, every customization control.**