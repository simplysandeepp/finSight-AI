# 🔷 FinSight Ai — Multi-Agent Financial Intelligence Platform

> **AI-powered financial forecasting for any public company.**  
> Type a ticker, pick a date, and get a probabilistic revenue forecast, buy/sell signal, peer benchmarking, and full audit trail — all powered by 4 parallel AI agents in under 10 seconds.

---

## 📋 Table of Contents

1. [What Is This Project?](#1-what-is-this-project)
2. [Who Is This For?](#2-who-is-this-for)
3. [Live Demo — What a User Actually Sees](#3-live-demo--what-a-user-actually-sees)
4. [Full System Architecture](#4-full-system-architecture)
5. [Phase 0 — Offline Data & Training Pipeline](#5-phase-0--offline-data--training-pipeline)
6. [Phase 1 — User Request Entry](#6-phase-1--user-request-entry)
7. [Phase 2 — Orchestrator & Data Routing](#7-phase-2--orchestrator--data-routing)
8. [Phase 3 — The 4 Parallel AI Agents](#8-phase-3--the-4-parallel-ai-agents)
9. [Phase 4 — Ensembler (CIO Agent)](#9-phase-4--ensembler-cio-agent)
10. [Phase 5 — Response Assembly & Audit](#10-phase-5--response-assembly--audit)
11. [Frontend Pages — Full Walkthrough](#11-frontend-pages--full-walkthrough)
12. [LLM Client — Groq + Gemini Rotation](#12-llm-client--groq--gemini-rotation)
13. [Data Sources Explained](#13-data-sources-explained)
14. [Project File Structure](#14-project-file-structure)
15. [Environment Variables & Configuration](#15-environment-variables--configuration)
16. [How to Run Locally — Step by Step](#16-how-to-run-locally--step-by-step)
17. [API Reference](#17-api-reference)
18. [Database Schema — Audit Trail](#18-database-schema--audit-trail)
19. [Tech Stack Summary](#19-tech-stack-summary)
20. [Known Limitations & Future Work](#20-known-limitations--future-work)

---

## 1. What Is This Project?

**FinSight Ai** is a full-stack, production-grade financial intelligence platform that uses a **multi-agent AI architecture** to analyze companies and generate probabilistic financial forecasts.

Unlike a single LLM chatbot that just answers questions, FinSight Ai runs **4 specialized AI agents simultaneously** — each examining the company from a different angle — and then combines their outputs into a single, calibrated investment signal.

### The Core Problem It Solves

Analyzing a company's financial health traditionally requires:
- Reading earnings call transcripts (hours of work)
- Running financial models in Excel (specialized skill)
- Monitoring macroeconomic news (constant effort)
- Comparing against competitors (research-intensive)

FinSight Ai **automates all four tasks in parallel** and delivers results in under 10 seconds.

### What It Outputs

For any given company and date, the system produces:
- 📈 **Revenue forecast** with confidence intervals (p05 / p50 / p95 quantiles)
- 📊 **EBITDA forecast** with confidence range
- 🎯 **Buy / Hold / Sell / Monitor** recommendation with reasoning
- 🧠 **Confidence score** (0–100%) across all agents
- 👥 **Peer benchmarking** vs competitors
- 📰 **Macro sentiment** analysis from news headlines
- 📝 **Transcript driver extraction** — key sentences from earnings calls
- 🔒 **Full audit trail** — every prediction logged to SQLite

---

## 2. Who Is This For?

### Primary Users

| User Type | How They Use It | Example |
|-----------|----------------|---------|
| **Finance Students** | Learn how AI applies to real financial analysis | Priya types `AAPL`, sees revenue forecast with reasoning |
| **Academic Researchers** | Study multi-agent AI systems and financial ML | Professor uses it to demonstrate ensemble methods |
| **Portfolio Analysts** | Get quick AI-assisted signals on companies | Analyst checks NVDA before earnings season |
| **Developers / ML Engineers** | Study multi-agent architecture patterns | Engineer learns how asyncio parallelism works in practice |
| **Professors / Teachers** | Demonstrate real AI + finance applications | Classroom demonstration of NLP + ML integration |

### What Users Do NOT Need to Know

- No knowledge of Python or machine learning required
- No understanding of the internal architecture needed
- No financial modeling skills required
- Just: **type a company name, pick a date, click Analyze**

---

## 3. Live Demo — What a User Actually Sees

### Step-by-Step User Journey

```
┌─────────────────────────────────────────────────────────┐
│  USER OPENS: http://localhost:5173                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  🏠 LANDING PAGE  (/)                                   │
│                                                         │
│  • Sees "FinSight Ai — AI-powered financial             │
│    forecasting for any public company"                  │
│  • Reads 3-step explainer (Enter → Analyze → Get)       │
│  • Sees tech badges: Groq, XGBoost, Gemini, FastAPI     │
│  • Clicks "Try it → Open Dashboard"                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  📊 DASHBOARD  (/dashboard)                             │
│                                                         │
│  Top bar: [ AAPL ] [ 2026-01-31 ] [ ⚡ Signal ]         │
│                                                         │
│  User types: AAPL                                       │
│  User picks: 2026-01-31                                 │
│  User clicks: Signal                                    │
│                                                         │
│  ⟳  "Analyzing..." spinner appears (3–8 seconds)        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  RESULTS APPEAR:                                        │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ Strategic    │ │ Ensemble     │ │ Revenue        │  │
│  │ Signal       │ │ Confidence   │ │ Forecast (p50) │  │
│  │              │ │              │ │                │  │
│  │  STRONG BUY  │ │    87%       │ │  $124.3M       │  │
│  │  (emerald)   │ │  ████████░░  │ │  $110M–$138M   │  │
│  └──────────────┘ └──────────────┘ └────────────────┘  │
│                                                         │
│  📊 Revenue CI Chart (bar chart with p05/p50/p95)       │
│                                                         │
│  📝 Transcript Drivers:                                 │
│  • "Revenue momentum driven by services growth"         │
│  • "Management confident in H2 margin expansion"        │
│                                                         │
│  🤖 Agent Status:                                       │
│  ● transcript_nlp  ● financial_model                   │
│  ● news_macro      ● competitor                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  USER EXPLORES OTHER PAGES (via sidebar):               │
│                                                         │
│  👥 Peer Benchmarking → AAPL vs MSFT/GOOGL/META        │
│  ⚡ Active Signals    → History of all predictions      │
│  🔍 Audit Trail       → Searchable prediction log       │
│  🌐 Sector Analysis   → Macro sector view               │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Full System Architecture

### High-Level Architecture Diagram

```
                        ┌─────────────────────────┐
                        │      React Frontend       │
                        │   (Vite + Tailwind CSS)   │
                        │                           │
                        │  Landing → Dashboard →    │
                        │  Signals → Peers →        │
                        │  Audit → Sector → Config  │
                        └────────────┬──────────────┘
                                     │  POST /api/predict
                                     │  { company_id, as_of_date }
                                     ▼
                        ┌─────────────────────────┐
                        │     FastAPI Backend       │
                        │      (api.py)             │
                        │                           │
                        │  /predict  /audit         │
                        │  /health   /config        │
                        └────────────┬──────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │      Orchestrator         │
                        │    (orchestrate.py)        │
                        │                           │
                        │  1. Route data source     │
                        │  2. Fetch transcript      │
                        │  3. Fetch peers           │
                        │  4. Dispatch 4 agents     │
                        │  5. Aggregate results     │
                        │  6. Persist to audit DB   │
                        └────────────┬──────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │                │
                    ▼                ▼                ▼                ▼
          ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
          │ Transcript   │ │  Financial   │ │  News Macro  │ │  Competitor  │
          │  NLP Agent   │ │ Model Agent  │ │    Agent     │ │    Agent     │
          │              │ │              │ │              │ │              │
          │ Groq LLaMA   │ │  XGBoost     │ │ Groq LLaMA   │ │ Groq LLaMA   │
          │ Gemini 2.0   │ │  (no LLM)    │ │ Gemini 2.0   │ │ Gemini 2.0   │
          └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                 │                │                │                │
                 └────────────────┴────────────────┴────────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │     Ensembler Agent       │
                               │   (CIO Synthesis LLM)     │
                               │                           │
                               │  Geometric mean of        │
                               │  agent confidences        │
                               │  0.9^n degraded penalty   │
                               └────────────┬──────────────┘
                                            │
                               ┌────────────┴──────────────┐
                               │                           │
                               ▼                           ▼
                    ┌──────────────────┐       ┌──────────────────┐
                    │  Final Response   │       │  SQLite Audit DB  │
                    │  JSON Payload    │       │  audit_trail.py   │
                    └──────────────────┘       └──────────────────┘
```

### Data Flow Summary

```
User Input (company_id + date)
    │
    ▼
Data Source Decision
    ├── Real ticker (AAPL, NVDA, TSLA)
    │       └── yfinance → quarterly financials → feature engineering
    └── Synthetic (COMP_001...COMP_040)
            └── features_v1.pkl → pre-computed features
    │
    ▼
Transcript Source
    ├── Synthetic → sample_transcripts.jsonl
    └── Live → placeholder text (+ Alpha Vantage news)
    │
    ▼
asyncio.gather() → 4 agents run IN PARALLEL (10s timeout each)
    │
    ▼
Ensembler → final signal
    │
    ▼
persist_request() → SQLite
    │
    ▼
JSON response → Frontend
```

---

## 5. Phase 0 — Offline Data & Training Pipeline

Before the web server runs, three scripts must be executed once to set up the data and models. This is the **offline pipeline**.

### 5.1 Synthetic Data Generator (`generator.py`)

**Purpose:** Creates realistic fake financial data for 40 companies across 20 quarters (800 total rows) since we cannot use real company data without API keys.

**How It Works:**

The generator simulates company revenue using two mathematical models:

- **GBM (Geometric Brownian Motion)** — Default. Models revenue as a random walk with drift. Mathematically: `Rev(t) = Rev(t-1) × exp((μ - σ²/2)Δt + σ√Δt × Z)` where Z is a random normal variable.
- **AR(1) (Autoregressive Order 1)** — Alternative. Revenue follows its own past: `Rev(t) = φ × Rev(t-1) + ε`

**Three Market Scenarios:**

| Scenario | % of Companies | Revenue Drift | Volatility |
|----------|---------------|---------------|------------|
| Bull | 40% | High positive | Low |
| Neutral | 40% | Slight positive | Medium |
| Bear | 20% | Negative/flat | High |

**What It Outputs:**

```
backend/out/
├── synthetic_financials.csv     ← 800 rows, 17 columns
├── generation_manifest.json     ← all parameters used
└── sample_transcripts.jsonl     ← 10 earnings call excerpts
```

**CSV Schema (every column explained):**

| Column | Type | Description |
|--------|------|-------------|
| `company_id` | string | Format: COMP_001 to COMP_040 |
| `date` | YYYY-MM-DD | Quarter end date (e.g., 2024-03-31) |
| `quarter` | YYYYQn | e.g., 2024Q1 |
| `revenue` | float (M) | Revenue in millions USD |
| `ebitda` | float (M) | Earnings before interest, tax, depreciation |
| `net_income` | float (M) | Bottom-line profit |
| `eps` | float | Diluted earnings per share |
| `revenue_growth` | float | Quarter-over-quarter growth (0.05 = +5%) |
| `ebitda_margin` | float | EBITDA ÷ Revenue (0.20 = 20%) |
| `guidance_flag` | 0 or 1 | 1 = company issued forward guidance |
| `sentiment_score` | -1 to 1 | Transcript tone (-1=negative, 1=positive) |
| `topic_confidence` | 0 to 1 | NLP extraction confidence |
| `transcript_excerpt` | string | Synthetic earnings call text |
| `scenario` | string | bull / neutral / bear |
| `restatement_flag` | 0 or 1 | 1 = this row was financially restated |
| `seed` | int | Random seed used (for reproducibility) |
| `provenance_note` | string | Generation metadata |

### 5.2 Feature Engineering (`feature_store.py`)

**Purpose:** Transforms the raw CSV into machine-learning-ready features. Computes lag features and rolling statistics that give the XGBoost model historical context.

**Features Computed:**

```
Revenue Lags:
  revenue_lag_1q    ← revenue from 1 quarter ago
  revenue_lag_2q    ← revenue from 2 quarters ago
  revenue_lag_4q    ← revenue from 4 quarters ago (YoY comparison)

EBITDA Lag:
  ebitda_margin_lag_1q  ← margin from last quarter

Rolling Windows (4-quarter lookback):
  revenue_roll_mean_4q  ← average revenue over last 4 quarters
  revenue_roll_std_4q   ← volatility of revenue over last 4 quarters
  ebitda_margin_roll_mean_4q
  ebitda_margin_roll_std_4q

Growth Metrics:
  revenue_growth_yoy   ← year-over-year growth (vs 4Q ago)
  revenue_growth_qoq   ← quarter-over-quarter growth (vs 1Q ago)

One-Hot Encoded:
  scenario_bull    ← 1 if bull scenario, 0 otherwise
  scenario_bear    ← 1 if bear scenario, 0 otherwise
  scenario_neutral ← 1 if neutral scenario, 0 otherwise
```

**Temporal Split (no data leakage):**

The dataset is split strictly by time — not randomly — to prevent the model from "seeing the future":

```
Total 800 rows sorted by date
├── Train set: 70% (earliest dates)   ← model learns from this
├── Validation set: 15% (middle)      ← used during training for eval
└── Test set: 15% (latest dates)      ← held out, never touched during training
```

**Outputs:**
```
backend/out/
├── features_v1.pkl         ← pickled dict with train/val/test splits
└── feature_manifest.json   ← list of feature column names
```

### 5.3 Model Training (`financial_model.py train()`)

**Purpose:** Trains 6 XGBoost models for probabilistic forecasting.

**Why 6 Models?**

The system uses **Quantile Regression** — instead of predicting a single number, it predicts three quantiles simultaneously:

```
2 targets × 3 quantiles = 6 models

Revenue Models:
  revenue_p05  ← pessimistic forecast (5th percentile)
  revenue_p50  ← median forecast (most likely)
  revenue_p95  ← optimistic forecast (95th percentile)

EBITDA Models:
  ebitda_p05
  ebitda_p50
  ebitda_p95
```

This gives the user a **confidence interval**, not just a point estimate. The width of the interval (p95 - p05) directly informs the confidence score.

**XGBoost Configuration:**
```python
XGBRegressor(
    objective="reg:quantileerror",  # quantile loss function
    quantile_alpha=alpha,           # 0.05, 0.50, or 0.95
    n_estimators=100,               # 100 decision trees
    learning_rate=0.1,
    max_depth=5,                    # tree depth
    tree_method="hist",             # efficient histogram method
    random_state=42                 # reproducible
)
```

**Confidence Score Formula:**
```
confidence = 1 - (p95 - p05) / (2 × p50)

Narrow interval → high confidence
Wide interval   → low confidence
Always clamped to [0, 1]
```

**Output:**
```
backend/out/
└── financial_model.pkl    ← dict containing all 6 trained models
```

### 5.4 Training Pipeline Script (`train_pipeline.py`)

Runs the full offline setup in sequence:

```bash
cd backend
python train_pipeline.py
```

Output:
```
==================================================
🚀 FINSIGHT AI: Setup & Training Pipeline
==================================================

[Step 1/2] Generating Features...
  ✓ Features computed: 800 rows → 23 feature columns
  ✓ Saved: out/features_v1.pkl
  ✓ Saved: out/feature_manifest.json

[Step 2/2] Training Financial Models (XGBoost Quantile Regression)...
  ✓ Training revenue (alpha=0.05) — done
  ✓ Training revenue (alpha=0.50) — done
  ✓ Training revenue (alpha=0.95) — done
  ✓ Training ebitda (alpha=0.05) — done
  ✓ Training ebitda (alpha=0.50) — done
  ✓ Training ebitda (alpha=0.95) — done
  ✓ Saved: out/financial_model.pkl

==================================================
✅ Training Complete. Assets ready in 'backend/out/'
==================================================
```

---

## 6. Phase 1 — User Request Entry

### The Frontend Interface

When a user navigates to the app, they land on the **Landing Page** (`/`). From there, clicking "Open Dashboard" takes them to the main analysis interface at `/dashboard`.

**Request Format (what gets sent to the backend):**
```json
POST /api/predict
{
  "company_id": "AAPL",
  "as_of_date": "2026-01-31"
}
```

**Accepted `company_id` formats:**

| Format | Example | Data Source |
|--------|---------|-------------|
| Real stock ticker | `AAPL`, `NVDA`, `TSLA`, `MSFT` | Live via yfinance |
| Synthetic company | `COMP_007`, `COMP_023` | Pre-generated dataset |
| Any unknown real ticker | `GOOGL`, `META`, `AMZN` | Live via yfinance |

**Accepted `as_of_date` formats:**
- Any valid date string: `YYYY-MM-DD`
- If the exact date is not found in the dataset, the system automatically uses the **nearest available date** (most recent quarter end)

---

## 7. Phase 2 — Orchestrator & Data Routing

The **Orchestrator** (`orchestrate.py`) is the brain of the system. It receives the request and decides where to get data, how to prepare it, and which agents to call.

### Decision Tree

```
Incoming request: { company_id: "AAPL", as_of_date: "2026-01-31" }
                        │
                        ▼
            Does company_id start with "COMP_"?
                  │               │
                 NO              YES
                  │               │
                  ▼               ▼
         Try yfinance         Load from
         live data            features_v1.pkl
                  │               │
                  ▼               ▼
         Did fetch succeed?   Find matching
              │       │       company row
              │       │       by date
             YES      NO          │
              │       │           ▼
              ▼       ▼      Use latest
         Use live  Fallback  available row
         features  to pkl    for that company
```

### Live Data Path (Real Tickers: AAPL, NVDA, etc.)

```python
# yfinance fetches last 8 quarters of quarterly financials
real_history = get_ticker_data(company_id)

# compute_features() applies the same lag/rolling feature logic
history_featured = compute_features(real_history)

# Select the row matching the requested date
features = target_row.iloc[0].to_dict()
live_data_available = True
```

**Features fetched from yfinance:**
- `Total Revenue` → `revenue`
- `EBITDA` (or `Normalized EBITDA` if available)
- `Net Income`
- `Basic EPS`
- All lag/rolling features computed on-the-fly

### Synthetic Data Path (COMP_XXX companies)

```python
# Load pre-built feature store
with open(FEATURES_PATH, 'rb') as f:
    feature_data = pickle.load(f)

full_df = feature_data['full_featured']

# Find the exact company + date row
company_row = full_df[
    (full_df['company_id'] == company_id) &
    (full_df['date'] == as_of_date)
]

# If exact date not found, use the latest available
if company_row.empty:
    company_row = full_df[full_df['company_id'] == company_id].tail(1)
```

### Peer Data Routing

```
Is it a live ticker?
    YES → Look up PEER_MAP (e.g., AAPL → [MSFT, GOOGL, META])
          → Fetch each peer via yfinance
    NO  → Pick 3 random COMP_XXX companies from synthetic dataset
          → Use their latest quarter data as peers
```

**PEER_MAP (hardcoded relationships):**
```python
PEER_MAP = {
    "AAPL": ["MSFT", "GOOGL", "META"],
    "MSFT": ["AAPL", "GOOGL", "AMZN"],
    "TSLA": ["F", "GM", "TM", "BYDDF"],
    "NVDA": ["AMD", "INTC", "AVGO", "MU"],
    "AMZN": ["WMT", "TGT", "EBAY", "BABA"],
    "GOOGL": ["MSFT", "META", "AMZN"],
    "META":  ["GOOGL", "SNAP", "PINS"],
    "AMD":   ["NVDA", "INTC", "ARM"],
    "NFLX":  ["DIS", "PARA", "WBD"],
}
```

---

## 8. Phase 3 — The 4 Parallel AI Agents

All 4 agents run **simultaneously** using `asyncio.gather()`. Each has a **10-second hard timeout**. If an agent fails or times out, it returns a degraded fallback output and the system continues with the remaining agents. If fewer than 2 agents succeed, the entire request fails with a `503` error.

```python
results = await asyncio.gather(
    transcript_nlp.run(transcript_input),
    financial_model.run(financial_input),
    news_macro.run(news_input),
    competitor.run(competitor_input),
    return_exceptions=True  # don't crash if one fails
)
```

### Agent 1 — Transcript NLP Agent

**File:** `backend/agents/transcript_nlp.py`  
**LLM:** Groq LLaMA 3.3-70b (Gemini 2.0 fallback)  
**Purpose:** Reads an earnings call transcript and extracts structured financial intelligence.

**Input:**
```json
{
  "company_id": "AAPL",
  "date": "2026-01-31",
  "quarter": "2025Q4",
  "transcript_text": "We saw exceptional growth in services revenue this quarter..."
}
```

**System Prompt (what we tell the LLM):**
> "You are a financial NLP expert. Given a full earnings-call transcript, extract: (1) the 5 most important driver sentences with importance scores, (2) all numeric facts (revenue, EBITDA, guidance), (3) overall sentiment [-1, 1], (4) management confidence [0, 1], (5) top 5 topics with scores. Flag any sentence where language is optimistic but underlying numbers are negative. Return ONLY valid JSON."

**Output Structure:**
```json
{
  "drivers": [
    {
      "sentence": "Services revenue grew 17% YoY driven by App Store and iCloud",
      "position": 245,
      "importance": 0.92,
      "mismatch_flag": false
    }
  ],
  "numeric_facts": [
    { "name": "revenue", "value": 124.3, "unit": "billion_USD", "source": "transcript" }
  ],
  "sentiment": 0.74,
  "top_topics": [
    { "topic": "services_growth", "score": 0.88 },
    { "topic": "supply_chain", "score": 0.61 }
  ],
  "confidence": 0.85
}
```

**Degraded Mode (if LLM fails/times out):**
```json
{ "drivers": [], "numeric_facts": [], "sentiment": 0.0, "top_topics": [], "confidence": 0.5 }
```

---

### Agent 2 — Financial Model Agent

**File:** `backend/agents/financial_model.py`  
**LLM:** None — uses XGBoost (pure ML, no language model)  
**Purpose:** Runs the pre-trained quantile regression models to produce probabilistic revenue and EBITDA forecasts.

**Input:**
```json
{
  "company_id": "AAPL",
  "as_of_date": "2026-01-31",
  "features": {
    "revenue_lag_1q": 119.6,
    "revenue_lag_4q": 117.2,
    "revenue_roll_mean_4q": 121.4,
    "revenue_growth_yoy": 0.06,
    "ebitda_margin_lag_1q": 0.31,
    "scenario_bull": 0,
    "scenario_neutral": 1,
    ...
  }
}
```

**What It Does:**
1. Loads `financial_model.pkl` (6 trained XGBoost models)
2. Aligns input features with the training feature list
3. Runs all 6 models on the single input row
4. Enforces **monotonicity**: ensures p05 ≤ p50 ≤ p95
5. Computes confidence from interval width
6. Extracts top-5 feature importances (by gain)

**Output Structure:**
```json
{
  "revenue_forecast": { "p05": 110.2, "p50": 124.3, "p95": 138.1, "unit": "million_USD" },
  "ebitda_forecast":  { "p05": 32.1,  "p50": 38.5,  "p95": 44.8,  "unit": "million_USD" },
  "feature_importances": [
    { "feature": "revenue_lag_1q",      "weight": 0.34 },
    { "feature": "revenue_roll_mean_4q","weight": 0.21 },
    { "feature": "revenue_growth_yoy",  "weight": 0.18 }
  ],
  "confidence": 0.82
}
```

**Confidence calculation:**
```
confidence = 1 - (138.1 - 110.2) / (2 × 124.3)
           = 1 - 27.9 / 248.6
           = 1 - 0.112
           = 0.888 → 88.8% confident
```

---

### Agent 3 — News & Macro Agent

**File:** `backend/agents/news_macro.py`  
**LLM:** Groq LLaMA 3.3-70b (Gemini 2.0 fallback)  
**Purpose:** Analyzes recent news headlines and macroeconomic indicators to assess the external environment around the company.

**Input:**
```json
{
  "headlines": [
    "Apple beats Q4 earnings expectations",
    "Fed holds rates steady amid cooling inflation",
    "Tech sector outperforms S&P 500 in January"
  ],
  "macro_indicators": {
    "gdp_growth": 0.02,
    "interest_rate": 0.05
  }
}
```

**System Prompt:** The LLM is instructed to act as a macroeconomic analyst and assess the risk/opportunity environment.

**Output Structure:**
```json
{
  "macro_sentiment": 0.62,
  "sector_outlook": "Technology sector showing resilience despite rate pressure",
  "risk_factors": [
    "Interest rate uncertainty may compress tech valuations",
    "Geopolitical tensions affecting supply chain"
  ],
  "confidence": 0.78
}
```

**Headlines Source:**
- If Alpha Vantage key is configured: fetches live news from `NEWS_SENTIMENT` endpoint
- If no key: uses synthetic headlines like `["Record profits for AAPL", "Sector outlook neutral"]`

---

### Agent 4 — Competitor Agent

**File:** `backend/agents/competitor.py`  
**LLM:** Groq LLaMA 3.3-70b (Gemini 2.0 fallback)  
**Purpose:** Benchmarks the target company against its peers, computing relative position.

**Input:**
```json
{
  "peer_financials": [
    { "peer_id": "MSFT", "revenue": 65200, "ebitda_margin": 0.44, "revenue_growth": 0.16 },
    { "peer_id": "GOOGL","revenue": 86310, "ebitda_margin": 0.31, "revenue_growth": 0.12 },
    { "peer_id": "META", "revenue": 40589, "ebitda_margin": 0.38, "revenue_growth": 0.24 }
  ],
  "market_share_signals": { "market_share": 0.15 }
}
```

**What It Does:**
The LLM is given the target company's financials alongside peer data and instructed to:
1. Calculate revenue delta (how much more/less vs each peer)
2. Calculate margin delta (how margins compare)
3. Score relative position from -1 (worst in class) to +1 (best in class)

**Output Structure:**
```json
{
  "relative_position_score": 0.72,
  "peer_benchmarks": [
    { "peer_id": "MSFT",  "revenue_delta": -0.45, "margin_delta": 0.13 },
    { "peer_id": "GOOGL", "revenue_delta":  0.44, "margin_delta": 0.01 },
    { "peer_id": "META",  "revenue_delta":  2.06, "margin_delta": -0.07 }
  ],
  "confidence": 0.80
}
```

---

## 9. Phase 4 — Ensembler (CIO Agent)

**File:** `backend/agents/ensembler.py`  
**LLM:** Groq LLaMA 3.3-70b (Gemini 2.0 fallback)  
**Purpose:** Acts as a **Chief Investment Officer** — receives all 4 agent outputs and synthesizes them into a final investment signal.

### What the Ensembler Does

```
All successful agent outputs (as JSON dict)
              │
              ▼
     LLM System Prompt:
     "You are a chief investment officer.
      Given these 4 analysis reports, produce:
      - final_forecast (revenue_p50, ebitda_p50, confidence intervals)
      - recommendation (action: buy/sell/hold/monitor)
      - explanations (3-5 bullet points of reasoning)
      - human_review_required (bool: true if high uncertainty)"
              │
              ▼
     Ensembler JSON Output (EnsemblerOutput)
```

### Confidence Aggregation Formula

After the LLM generates the signal, the orchestrator **recalculates** the combined confidence mathematically:

```
Step 1: Collect confidences from each agent
  [transcript_nlp: 0.85, financial_model: 0.88, news_macro: 0.78, competitor: 0.80]

Step 2: Geometric mean (more conservative than arithmetic mean)
  base_conf = exp( mean( log([0.85, 0.88, 0.78, 0.80]) ) )
            = exp( mean( [-0.163, -0.128, -0.248, -0.223] ) )
            = exp( -0.190 )
            = 0.827

Step 3: Penalize for degraded agents
  If 0 agents degraded: penalty = 0.9^0 = 1.0 (no penalty)
  If 1 agent degraded:  penalty = 0.9^1 = 0.9
  If 2 agents degraded: penalty = 0.9^2 = 0.81

  combined_confidence = 0.827 × 1.0 = 0.827 (82.7%)

Step 4: Clamp to [0, 1]
  final_combined_confidence = clip(0.827, 0, 1) = 0.827
```

### Ensembler Output Structure

```json
{
  "final_forecast": {
    "revenue_p50": 124.3,
    "ebitda_p50": 38.5,
    "revenue_ci": [110.2, 138.1],
    "ebitda_ci": [32.1, 44.8]
  },
  "recommendation": {
    "action": "buy",
    "rationale": "Strong revenue momentum supported by services growth trajectory"
  },
  "explanations": [
    "Revenue growth YoY of 6% exceeds sector median of 3.2%",
    "EBITDA margin expanding from 28% to 31% signals operating leverage",
    "Positive macro environment with stable rate outlook reduces discount rate risk",
    "Peer positioning: above median in margin, below in absolute revenue scale"
  ],
  "human_review_required": false,
  "combined_confidence": 0.827
}
```

**`human_review_required`** is set to `true` when:
- Combined confidence < 0.5 (high uncertainty)
- Multiple agents degraded
- The LLM detects conflicting signals across agents

---

## 10. Phase 5 — Response Assembly & Audit

### Final Response Payload

The orchestrator assembles the complete response:

```json
{
  "request_id": "req-a3f7b2c1",
  "trace_id": "trace-9d4e5f6a",
  "model_version": "bundle_v1",
  "status": "success",
  "latency_ms": 4823,
  "data_source": "live_vantage",
  "result": { ...EnsemblerOutput... },
  "explainability": {
    "confidence_breakdown": {
      "transcript_nlp": 0.85,
      "financial_model": 0.88,
      "news_macro": 0.78,
      "competitor": 0.80
    },
    "degraded": []
  },
  "agents_called": ["transcript_nlp", "financial_model", "news_macro", "competitor"],
  "degraded_agents": [],
  "agent_latencies": {
    "transcript_nlp": 4823,
    "financial_model": 4823,
    "news_macro": 4823,
    "competitor": 4823
  },
  "audit_link": "https://audit.internal/req-a3f7b2c1"
}
```

**`status` values:**
- `"success"` — all agents completed successfully
- `"partial"` — 1 or more agents degraded but minimum threshold met

**`data_source` values:**
- `"live_vantage"` — data fetched live from yfinance/Alpha Vantage
- `"synthetic_store"` — data loaded from pre-built feature store

### Audit Trail Persistence

Every prediction is automatically saved to SQLite:

```python
await persist_request({
    "request_id": request_id,
    "trace_id": trace_id,
    "model_version": "bundle_v1",
    "company_id": company_id,
    "status": "success",
    "latency_ms": latency_ms,
    "agents_called": ["transcript_nlp", "financial_model", "news_macro", "competitor"],
    "degraded_agents": [],
    "result": final_output.model_dump()
})
```

This happens **asynchronously** — it does not block the response to the user.

---

## 11. Frontend Pages — Full Walkthrough

### Page 1: Landing Page (`/`)

The public-facing introduction page. No authentication, no backend calls. Pure static React.

**Sections:**
- Hero with animated badge: "AI-Powered Financial Intelligence"
- Big headline: "FinSight Ai"
- Subtitle: "AI-powered financial forecasting for any public company"
- 3-step how-it-works cards (Enter → Analyze → Get)
- Tech stack badges (Groq, XGBoost, Gemini, FastAPI, React, SQLite)
- "Try it → Open Dashboard" button (navigates to `/dashboard`)

---

### Page 2: Dashboard (`/dashboard`)

The core analysis page. All state lives in `App.jsx` and is passed down as props.

**Top Navbar (always visible):**
- Company ticker input (`AAPL`, `COMP_007`, etc.)
- Date picker
- "Signal" button → triggers `POST /api/predict`
- Loading spinner during analysis

**Empty State (before first prediction):**
- Pulsing TrendingUp icon
- "Ready for Analysis" message
- Instructions on what to type

**After Prediction — KPI Grid (4 cards):**

| Card | Content |
|------|---------|
| Strategic Signal | BUY / HOLD / SELL / MONITOR badge (color-coded) |
| Ensemble Confidence | % score + progress bar |
| Revenue Forecast (p50) | Dollar amount + p05–p95 range |
| EBITDA Forecast (p50) | Dollar amount + p05–p95 range |

**Revenue CI Chart:**
- Recharts BarChart
- 3 grouped bars: Revenue and EBITDA
- Each bar shows p50 (main) with p05/p95 overlay
- Hover tooltip shows exact values

**Transcript Drivers Panel:**
- Lists the 5 most important sentences extracted from the earnings transcript
- Each sentence has an importance score bar
- Mismatch flags shown in amber (optimistic language + bad numbers)

**Agent Status Panel:**
- Green dot: agent succeeded
- Amber dot + "DEGRADED" badge: agent timed out or failed

**Human Review Alert (conditional):**
- Red banner appears when `human_review_required: true`
- "Escalate Now" button

---

### Page 3: Active Signals (`/signals`)

Shows the history of all predictions ever run, fetched from `/api/audit`.

**Each signal card shows:**
- Company ID
- Signal action (BUY/SELL/HOLD) — color-coded
- Timestamp of when prediction was run
- Confidence score
- "PARTIAL" warning badge if any agents were degraded

---

### Page 4: Sector Analysis (`/sector`)

Macro-level view of sector performance. Receives the `data` prop from `App.jsx` so it can show context from the most recent prediction.

---

### Page 5: Peer Benchmarking (`/peers`)

Shows a comparison table of the target company vs its peers.

**Table columns:**
- Peer ID (e.g., MSFT, GOOGL)
- Revenue Δ (% difference in revenue)
- Margin Δ (% difference in EBITDA margin)
- Position (Above / Below Target)

**Empty state:** "Run a prediction first" with instructions if no data loaded yet.

---

### Page 6: Audit Trail (`/audit`)

Full log of every prediction made, stored in SQLite.

**Features:**
- Real-time search (filter by request_id, company_id, or status)
- Table shows: Timestamp, Request ID, Company, Status, Latency (ms), Model Version
- Status: green dot = success, amber dot = partial

---

### Page 7: Configurations (`/configs`)

Displays current system configuration. Shows active model version, SQLite status, and API settings.

---

## 12. LLM Client — Groq + Gemini Rotation

**File:** `backend/agents/llm_client.py`

All 3 LLM-powered agents (Transcript NLP, News Macro, Competitor) call the same shared `LLMClient` singleton. This client handles:

### Primary: Groq (Key Rotation)

```python
self.groq_keys = [v for k, v in os.environ.items()
                  if k.startswith("GROQ_API_KEY") and v]
```

You can configure **multiple Groq keys** (`GROQ_API_KEY_1`, `GROQ_API_KEY_2`, etc.). On a `429 RateLimitError`, the client automatically rotates to the next key using round-robin:

```
Request → GROQ_API_KEY_1 → Success ✓
Request → GROQ_API_KEY_1 → 429 Rate Limit
    → Rotate to GROQ_API_KEY_2 → Success ✓
Request → GROQ_API_KEY_2 → 429 Rate Limit
    → Rotate to GROQ_API_KEY_3 → (no more keys)
    → Fallback to Gemini
```

**Model:** `llama-3.3-70b-versatile`  
**Temperature:** `0` (deterministic, no randomness)

### Fallback: Gemini

```python
self.gemini_key = os.getenv("GEMINI_API_KEY")
```

If all Groq keys fail, the client falls back to Google Gemini 2.0 Flash. Because the official `google-generativeai` library is synchronous, the client wraps it in `asyncio.to_thread()` to make it non-blocking:

```python
response = await asyncio.to_thread(
    model.generate_content,
    prompt,
    generation_config=genai.types.GenerationConfig(temperature=0)
)
```

**Model:** `gemini-2.0-flash`  
**Temperature:** `0`

### Error Path

```
All Groq keys fail + Gemini fails
        │
        ▼
LLMUnavailableError raised
        │
        ▼
Each agent catches → returns degraded output
        │
        ▼
Orchestrator adds agent to degraded_agents[]
        │
        ▼
If < 2 agents succeed → raise RuntimeError("InsufficientDataError")
        │
        ▼
FastAPI returns HTTP 500
```

---

## 13. Data Sources Explained

### yfinance (Live Real-Ticker Data)

**Library:** `yfinance`  
**Used for:** Fetching 8 quarters of financial data for real tickers like AAPL, NVDA, TSLA.

**What it returns:**
- `Total Revenue`
- `EBITDA` (or `Normalized EBITDA` or `EBIT` as fallback)
- `Net Income`
- `Basic EPS`

**Limitations:**
- Quarterly data only (not monthly or daily)
- Some companies have incomplete EBITDA reporting
- yfinance is unofficial and may break if Yahoo Finance changes its API

### Alpha Vantage (Optional Live News)

**Library:** `aiohttp` (async HTTP)  
**Used for:** Fetching live news headlines and sentiment for real tickers.

**Endpoints Used:**
- `NEWS_SENTIMENT` — returns top 5 news articles with sentiment scores
- `OVERVIEW` — company profile (not currently used in main flow)

**Requires:** `ALPHA_VANTAGE_API_KEY` in `.env`  
**Free tier:** 25 requests/day — sufficient for demos

**If no API key:** Falls back to synthetic headlines like `"Record profits for AAPL"`.

### Synthetic Feature Store (COMP_XXX companies)

**File:** `backend/out/features_v1.pkl`  
**Used for:** All `COMP_001` through `COMP_040` companies.

This is a pre-built pickle file containing:
```python
{
    "full_featured": pd.DataFrame,   # all 800 rows with features
    "train": pd.DataFrame,           # 70% earliest dates
    "val": pd.DataFrame,             # 15% middle dates
    "test": pd.DataFrame,            # 15% latest dates
}
```

---

## 14. Project File Structure

```
finsight-ai/
│
├── README.md                          ← You are here
│
├── backend/
│   ├── .env                           ← Your API keys (never commit this)
│   ├── .env.example                   ← Template for keys
│   ├── requirements.txt               ← Python dependencies
│   ├── Dockerfile                     ← Container config
│   ├── config.yaml                    ← System config (thresholds, timeouts)
│   ├── train_pipeline.py              ← Runs feature store + model training
│   │
│   ├── out/                           ← Generated artifacts (gitignored)
│   │   ├── synthetic_financials.csv   ← 800-row synthetic dataset
│   │   ├── features_v1.pkl            ← Engineered features + train/val/test splits
│   │   ├── feature_manifest.json      ← List of feature column names
│   │   ├── financial_model.pkl        ← 6 trained XGBoost models
│   │   ├── sample_transcripts.jsonl   ← 10 earnings call excerpts
│   │   └── generation_manifest.json   ← Data generation parameters
│   │
│   ├── synthetic_financial_gen/
│   │   └── generator.py               ← Synthetic data generator (GBM/AR1)
│   │
│   ├── features/
│   │   └── feature_store.py           ← Feature engineering + temporal split
│   │
│   ├── agents/
│   │   ├── base.py                    ← BaseAgent + BaseAgentInput/Output
│   │   ├── llm_client.py              ← Groq + Gemini rotation client
│   │   ├── transcript_nlp.py          ← Agent 1: NLP on earnings transcripts
│   │   ├── financial_model.py         ← Agent 2: XGBoost quantile regression
│   │   ├── news_macro.py              ← Agent 3: News + macro analysis
│   │   ├── competitor.py              ← Agent 4: Peer benchmarking
│   │   └── ensembler.py               ← CIO synthesis agent
│   │
│   ├── orchestrator/
│   │   ├── orchestrate.py             ← Main orchestration logic
│   │   └── api.py                     ← FastAPI routes (/predict, /audit, /health)
│   │
│   ├── audit/
│   │   └── audit_trail.py             ← SQLite persistence (init, persist, query)
│   │
│   ├── data/
│   │   └── yfinance_loader.py         ← Live financial data via yfinance
│   │
│   ├── utils/
│   │   └── alpha_vantage_client.py    ← Async Alpha Vantage API client
│   │
│   ├── explainability/
│   │   └── explainer.py               ← SHAP TreeExplainer for XGBoost
│   │
│   ├── evaluation/
│   │   └── evaluator.py               ← Walk-forward backtest (MAPE, PI coverage)
│   │
│   └── tests/
│       ├── test_api.py                ← FastAPI endpoint tests
│       ├── test_orchestrator.py       ← Orchestration integration tests
│       ├── test_live_data.py          ← Live path + synthetic path tests
│       └── test_api_manual.py         ← Manual curl-style test script
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js                 ← Vite dev server + /api proxy config
│   ├── tailwind.config.js
│   ├── index.html
│   │
│   └── src/
│       ├── main.jsx                   ← React app entry point
│       ├── App.jsx                    ← Root: state, routing, API calls
│       ├── index.css                  ← Global styles + glass-card utility
│       │
│       ├── components/
│       │   ├── Sidebar.jsx            ← Left navigation
│       │   └── Navbar.jsx             ← Top bar with ticker input + Signal button
│       │
│       └── pages/
│           ├── Landing.jsx            ← Home/intro page (/)
│           ├── Dashboard.jsx          ← Main analysis view (/dashboard)
│           ├── ActiveSignals.jsx      ← Prediction history (/signals)
│           ├── SectorAnalysis.jsx     ← Sector view (/sector)
│           ├── PeerBenchmarking.jsx   ← Competitor table (/peers)
│           ├── AuditTrail.jsx         ← Full audit log (/audit)
│           └── Configurations.jsx     ← System config (/configs)
│
└── Flowchart/
    └── vantage_ai_flowchart.html      ← Interactive system architecture diagram
```

---

## 15. Environment Variables & Configuration

### `.env` File (create in `backend/`)

```env
# ─── LLM APIs ────────────────────────────────────────────────────────────────
# Groq (Primary LLM - Free tier: 14,400 requests/day)
# Sign up: https://console.groq.com
GROQ_API_KEY_1=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY_2=gsk_yyyyyyyyyyyyyyyyyy   # Optional second key for rotation

# Google Gemini (Fallback LLM - Free tier: 15 RPM, 1M tokens/day)
# Sign up: https://aistudio.google.com
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx

# ─── Optional APIs ───────────────────────────────────────────────────────────
# Alpha Vantage (for live news headlines - Free tier: 25 req/day)
# Sign up: https://www.alphavantage.co/support/#api-key
# If not set, system uses synthetic headlines automatically
ALPHA_VANTAGE_API_KEY=XXXXXXXXXXXXXXXX

# ─── CORS Configuration ──────────────────────────────────────────────────────
# Comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=http://localhost:5173
```

### `config.yaml` (in `backend/`)

```yaml
model:
  version: "bundle_v1"
  min_agents_required: 2
  confidence_threshold: 0.65

agents:
  timeout_seconds: 10
  groq_model: "llama-3.3-70b-versatile"
  gemini_model: "gemini-2.0-flash"

database:
  path: "audit_trail.sqlite"
  max_records: 1000
```

---

## 16. How to Run Locally — Step by Step

### Prerequisites

```
Python 3.11+
Node.js 18+
pip
npm
```

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/finsight-ai.git
cd finsight-ai
```

### Step 2 — Set Up Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate    # Mac/Linux
# venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### Step 3 — Configure API Keys

```bash
# Copy the template
cp .env.example .env

# Edit with your keys
nano .env   # or open in any text editor
```

Minimum required:
- `GROQ_API_KEY_1` — get free at https://console.groq.com
- `GEMINI_API_KEY` — get free at https://aistudio.google.com

### Step 4 — Generate Data & Train Models

```bash
# This generates synthetic data and trains all 6 XGBoost models
# Takes ~2-3 minutes to complete
python train_pipeline.py
```

You should see:
```
✅ Training Complete. Assets ready in 'backend/out/'
```

Verify outputs exist:
```bash
ls out/
# synthetic_financials.csv  features_v1.pkl  financial_model.pkl
# feature_manifest.json     sample_transcripts.jsonl
```

### Step 5 — Start the Backend API

```bash
uvicorn orchestrator.api:app --host 0.0.0.0 --port 8000 --reload
```

Verify it's running:
```bash
curl http://localhost:8000/health
# {"status": "ok", "version": "1.0.1"}
```

### Step 6 — Set Up & Start the Frontend

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will start at: **http://localhost:5173**

The Vite config proxies all `/api/*` calls to `http://localhost:8000`, so the frontend and backend communicate automatically.

### Step 7 — First Prediction

1. Open **http://localhost:5173** in your browser
2. Click "Try it → Open Dashboard"
3. The search bar defaults to `COMP_007` with date `2026-01-31`
4. Click **⚡ Signal**
5. Wait 5–10 seconds
6. See your first AI-generated financial forecast!

### Running Tests

```bash
cd backend

# Unit tests
pytest tests/ -v

# Manual API test (server must be running)
python tests/test_api_manual.py
```

### Using Docker (Optional)

```bash
# Build the backend image
cd backend
docker build -t finsight-backend .

# Run with your keys
docker run -p 8000:8000 \
  -e GROQ_API_KEY_1=your_key \
  -e GEMINI_API_KEY=your_key \
  finsight-backend
```

---

## 17. API Reference

### `POST /api/predict`

Runs the full multi-agent analysis pipeline.

**Request:**
```json
{
  "company_id": "AAPL",
  "as_of_date": "2026-01-31"
}
```

**Response (200 OK):**
```json
{
  "request_id": "req-a3f7b2c1",
  "trace_id": "trace-9d4e5f6a",
  "model_version": "bundle_v1",
  "status": "success",
  "latency_ms": 4823,
  "data_source": "live_vantage",
  "result": {
    "final_forecast": {
      "revenue_p50": 124.3,
      "ebitda_p50": 38.5,
      "revenue_ci": [110.2, 138.1],
      "ebitda_ci": [32.1, 44.8]
    },
    "recommendation": {
      "action": "buy",
      "rationale": "Strong revenue momentum..."
    },
    "explanations": ["...", "...", "..."],
    "combined_confidence": 0.827,
    "human_review_required": false,
    "peer_benchmarks": [...]
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
  "agents_called": ["transcript_nlp", "financial_model", "news_macro", "competitor"],
  "degraded_agents": []
}
```

**Error Responses:**

| Code | Meaning |
|------|---------|
| 500 | Fewer than 2 agents succeeded (`InsufficientDataError`) |
| 500 | Feature store or model file not found (run `train_pipeline.py` first) |

---

### `GET /api/audit`

Returns the last 50 predictions from the audit trail.

**Response (200 OK):**
```json
[
  {
    "request_id": "req-a3f7b2c1",
    "trace_id": "trace-9d4e5f6a",
    "timestamp": "2026-01-31T14:23:11.847Z",
    "model_version": "bundle_v1",
    "company_id": "AAPL",
    "status": "success",
    "latency_ms": 4823,
    "agents_called": "[\"transcript_nlp\", \"financial_model\", \"news_macro\", \"competitor\"]",
    "degraded_agents": "[]",
    "final_output_json": "{ ...full result... }"
  }
]
```

---

### `GET /health`

Health check endpoint.

**Response (200 OK):**
```json
{ "status": "ok", "version": "1.0.1" }
```

---

## 18. Database Schema — Audit Trail

**Database:** SQLite  
**File:** `backend/audit_trail.sqlite` (auto-created on first startup)  
**Library:** `aiosqlite` (async, non-blocking)

### Table: `requests`

```sql
CREATE TABLE IF NOT EXISTS requests (
    request_id       TEXT PRIMARY KEY,  -- e.g., "req-a3f7b2c1"
    trace_id         TEXT,              -- e.g., "trace-9d4e5f6a"
    timestamp        TEXT,              -- ISO 8601: "2026-01-31T14:23:11.847"
    model_version    TEXT,              -- "bundle_v1"
    company_id       TEXT,              -- "AAPL" or "COMP_007"
    status           TEXT,              -- "success" or "partial"
    latency_ms       INTEGER,           -- 4823
    agents_called    TEXT,              -- JSON array as string
    degraded_agents  TEXT,              -- JSON array as string
    final_output_json TEXT              -- Full EnsemblerOutput as JSON
);
```

### Key Operations

```python
# Initialize (called on FastAPI startup)
await init_db()

# Write (called after every prediction)
await persist_request({ ...data... })

# Read (called by /audit endpoint)
rows = await get_audit_trail(limit=50)
```

### Important: Schema Migration

If you previously ran the app without the `company_id` column, you must delete the old database before restarting:

```bash
rm backend/audit_trail.sqlite
# Then restart the server — it will recreate the table automatically
```

---

## 19. Tech Stack Summary

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.11+ | Core backend language |
| **FastAPI** | 0.110+ | REST API framework (async, auto-docs) |
| **Uvicorn** | 0.27+ | ASGI server for FastAPI |
| **Pydantic** | 2.0+ | Data validation and schema enforcement |
| **XGBoost** | 2.0+ | Machine learning: quantile regression models |
| **SHAP** | 0.44+ | Model explainability: feature importance |
| **Groq** | 0.9+ | Primary LLM API (LLaMA 3.3-70b) |
| **google-generativeai** | 0.8+ | Fallback LLM API (Gemini 2.0 Flash) |
| **yfinance** | latest | Live financial data for real tickers |
| **aiohttp** | 3.8+ | Async HTTP (Alpha Vantage client) |
| **aiosqlite** | 0.20+ | Async SQLite (audit trail) |
| **pandas** | 2.0+ | Data manipulation and feature engineering |
| **numpy** | 1.24+ | Numerical computing |
| **scipy** | 1.10+ | Statistical functions |
| **loguru** | 0.7+ | Structured logging |
| **python-dotenv** | 1.0+ | Environment variable management |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.2+ | UI framework |
| **Vite** | 5.1+ | Build tool + dev server (with `/api` proxy) |
| **Tailwind CSS** | 3.4+ | Utility-first styling |
| **React Router** | 7.x | Client-side routing |
| **Recharts** | 2.12+ | Chart components (bar chart, confidence intervals) |
| **Axios** | 1.6+ | HTTP client for API calls |
| **Lucide React** | 0.344+ | Icon library |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| **SQLite** | Audit trail database (zero-config, serverless) |
| **Docker** | Optional containerization for backend |

---

## 20. Known Limitations & Future Work

### Current Limitations

**Data:**
- Synthetic companies (`COMP_XXX`) use randomly generated financial data — not real companies
- Live transcript text for real tickers (AAPL, NVDA) is still a placeholder — the system uses a generic template, not actual earnings call text
- Alpha Vantage free tier is limited to 25 requests/day

**Models:**
- XGBoost models are trained on synthetic data only, so predictions for real tickers rely on model generalization
- No scheduled model retraining — models must be manually retrained by running `train_pipeline.py`
- Sector Analysis page uses static UI rather than real aggregated data

**Architecture:**
- No user authentication — anyone with the URL can view and run predictions
- No persistent user sessions — predictions are not linked to users
- SHAP explainability is computed but not yet fully surfaced in the UI

### Future Improvements

| Feature | Complexity | Impact |
|---------|-----------|--------|
| Real earnings transcript integration (SEC EDGAR API) | Medium | High |
| User authentication (login/register) | Medium | Medium |
| Scheduled model retraining (weekly cron job) | Low | High |
| Model drift detection | Medium | High |
| Export to PDF / Excel | Low | Medium |
| Email alerts for strong buy/sell signals | Low | Medium |
| Historical backtesting visualization | High | High |
| Multi-language support | High | Medium |
| Mobile-responsive layout improvements | Low | Medium |
| Redis caching for repeated predictions | Medium | Medium |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    FINSIGHT AI — QUICK REFERENCE            │
├─────────────────────────────────────────────────────────────┤
│  SETUP (run once):                                          │
│  cd backend && python train_pipeline.py                     │
│                                                             │
│  START BACKEND:                                             │
│  uvicorn orchestrator.api:app --port 8000 --reload          │
│                                                             │
│  START FRONTEND:                                            │
│  cd frontend && npm run dev                                 │
│                                                             │
│  OPEN APP:  http://localhost:5173                           │
│  API DOCS:  http://localhost:8000/docs                      │
│  HEALTH:    http://localhost:8000/health                    │
│                                                             │
│  EXAMPLE COMPANIES TO TRY:                                  │
│  • AAPL, NVDA, TSLA, MSFT, META  (live yfinance data)      │
│  • COMP_001 through COMP_040     (synthetic data)           │
│                                                             │
│  MIN REQUIRED API KEYS:                                     │
│  • GROQ_API_KEY_1    (free at console.groq.com)             │
│  • GEMINI_API_KEY    (free at aistudio.google.com)          │
│                                                             │
│  RESET AUDIT DB (if schema changed):                        │
│  rm backend/audit_trail.sqlite                              │
└─────────────────────────────────────────────────────────────┘
```

---

*Built with ❤️*  
*A student project demonstrating multi-agent AI architecture applied to financial analysis.*