# FinSight AI — Feature Upgrade Roadmap (TODO)

> **Goal:** Transform FinSight AI from an advanced prototype into a production-ready,
> examiner-impressive, fully verifiable multi-agent financial intelligence platform.
>
> Prioritized in 5 tiers — complete them **top-down** for maximum impact.

---

## ⚡ Tier 0 — Critical Fixes (Do Before Anything Else)

These are quick wins that close the "prototype → production" gap immediately.

### 0.1 Frontend: Remove Hardcoded `localhost` URLs

- [✅] Open `frontend/src/pages/SimpleDashboard.jsx`
- [✅] Find every `fetch('http://localhost:8000/...')` call
- [✅] Replace with `fetch(\`${import.meta.env.VITE_API_URL}/...\`)`
- [✅] Create/update `frontend/.env` with `VITE_API_URL=http://localhost:8000`
- [✅] Create/update `frontend/.env.production` with `VITE_API_URL=https://your-render-url.onrender.com`
- [✅] Verify `frontend/.env.example` documents the variable

### 0.2 Backend: Ensure Real Training Data Is Used by Default

- [✅] Review `backend/collect_training_data.py` — understand what it does
- [✅] Wire it into the build pipeline: if `backend/out/real_training_data.csv` doesn't exist, auto-run `collect_training_data.py` before `train_pipeline.py`
- [✅] Update `render.yaml` build command to run `collect_training_data.py` → `train_pipeline.py` in sequence
- [✅] Update `backend/setup.sh` and `backend/setup.bat` accordingly
- [✅] Confirm `backend/synthetic_financial_gen/generator.py` is only used as a fallback, NOT as the primary data source

### 0.3 Environment & Config Cleanup

- [✅] Audit `backend/.env.example` — ensure every required key is documented with a placeholder
- [✅] Add clear comments in `.env.example` explaining which keys are optional vs. required
- [✅] Check `backend/config.yaml` is consistent with actual code behavior (acceptance targets, thresholds)

---

## 🏆 Tier 1 — Historical Backtesting (The Killer Feature)

> This is the single most impactful addition. It lets you **prove** your model works
> with verifiable numbers your examiner can check.

### 1.1 Backend: Backtesting Engine

- [ ] Create `backend/backtest/` directory
- [ ] Create `backend/backtest/__init__.py`
- [ ] Create `backend/backtest/run_backtest.py`:
  - Define backtest config constants:
    ```
    BACKTEST_TICKERS = ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA"]
    TRAIN_END   = "2021-12-31"
    TEST_START  = "2022-01-01"
    TEST_END    = "2024-12-31"
    ```
  - For each ticker:
    - Collect 8+ years of quarterly financial data (revenue, EBITDA) using `finnhub_loader` or `yfinance_loader`
    - Split data: train on pre-2022, test on 2022-2024
    - Run `FinancialModelAgent` quarter-by-quarter on test period
    - Record: `predicted_p05`, `predicted_p50`, `predicted_p95`, `actual_value`, `is_within_CI`
  - Compute per-ticker and overall accuracy metrics:
    - **MAPE** (Mean Absolute Percentage Error) per quarter
    - **Prediction Interval Coverage** (% of actuals within P05–P95 range)
    - **Directional Accuracy** (did the model correctly predict up/down trend?)
  - Save results to `backend/out/backtest_results.json`

### 1.2 Backend: Backtest API Endpoint

- [ ] Add `GET /api/backtest-results` in `backend/orchestrator/api.py`
  - Returns cached backtest results from `out/backtest_results.json`
  - Include per-ticker breakdown + aggregate metrics
- [ ] Add `POST /api/run-backtest` (optional, admin-only)
  - Triggers a fresh backtest run
  - Returns job status or results

### 1.3 Frontend: Backtest Dashboard Page

- [ ] Create `frontend/src/pages/BacktestDashboard.jsx`
- [ ] Add route in `frontend/src/App.jsx` → `/backtest`
- [ ] Add navigation link in sidebar/topbar
- [ ] Build the backtest results UI:
  - **Accuracy Scorecard** — table showing each ticker with MAPE, coverage %, and a ✅/❌ pass/fail indicator
  - **Prediction vs Actual Chart** — Recharts line chart per ticker:
    - Shaded band = P05–P95 prediction interval
    - Solid line = P50 predicted median
    - Dots = actual reported values
    - Highlight quarters where actual fell within band (green) vs outside (red)
  - **Summary Stats Card** — overall MAPE, overall coverage %, number of tickers tested
  - **Example Highlight Card** — e.g. "Our model predicted AAPL Q3 2023 revenue at $89.5B–$95.2B. Actual: $91.7B ✅"

### 1.4 Backtest Integration into Main Dashboard

- [ ] Add a small "Model Accuracy" badge/chip on the main prediction results page
  - Shows overall MAPE and coverage % from the latest backtest
  - Links to the full `/backtest` page
- [ ] Add a tooltip: "Verified against 12 quarters of real market data"

---

## 🔬 Tier 2 — Model Quality & Transparency

> Move from "trust me" to "here's the proof" — make the model's training lineage visible.

### 2.1 Model Info API Endpoint

- [ ] Create `GET /api/model-info` endpoint in `backend/orchestrator/api.py`
- [ ] Return structured model metadata:
  ```json
  {
    "trained_on": "31 real companies",
    "train_window": "2018-Q1 to 2022-Q4",
    "total_training_samples": 868,
    "features_used": 14,
    "quantiles": ["p05", "p50", "p95"],
    "mape_validation": 0.067,
    "pi_coverage": 0.89,
    "last_retrained": "2025-03-15",
    "data_source": "Finnhub + yFinance quarterly financials"
  }
  ```
- [ ] Read this data from `backend/out/feature_manifest.json` + model artifact metadata

### 2.2 Frontend: Model Transparency Panel

- [ ] Add a "Model Info" section/card in the dashboard UI
- [ ] Display: what data the model was trained on, training window, MAPE score, coverage %
- [ ] Add a "?" tooltip explaining what each metric means in plain English
- [ ] Users immediately trust a model that openly shows its credentials

### 2.3 Retrain on Real Company Data (Production Pipeline)

- [ ] Review `backend/collect_training_data.py` — ensure it fetches data for 30+ diverse companies
- [ ] Update the ticker list to cover multiple sectors:
  - Tech: AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA
  - Finance: JPM, GS, BAC, V, MA
  - Healthcare: JNJ, UNH, PFE, ABBV
  - Consumer: WMT, KO, PEP, MCD, NKE
  - Industrial: CAT, BA, GE, MMM
  - Energy: XOM, CVX
  - Telecom: T, VZ
  - Others: DIS, NFLX, CRM
- [ ] Run the full pipeline: `collect_training_data.py` → `train_pipeline.py`
- [ ] Validate new model against the evaluation suite in `backend/evaluation/evaluator.py`
- [ ] Save new model artifacts to `backend/out/` and commit

### 2.4 Model Versioning

- [ ] Add a `model_version` field to the model bundle (`financial_model.pkl`)
- [ ] Store version in `backend/out/model_metadata.json`
- [ ] Include model version in every API response (already partially there via `model_version` field)
- [ ] Log model version in predictions for audit trail

---

## 🔧 Tier 3 — Engineering Hardening

> These are the "production-ready" signals that examiners specifically look for.

### 3.1 Fix Test Suite & Add CI

- [ ] Review and fix `backend/tests/test_orchestrator.py`:
  - Update function signatures to match current `orchestrate()` API
  - Ensure mocks align with current agent interfaces
- [ ] Review and fix `backend/tests/test_agents.py`:
  - Verify agent input/output contracts match current implementations
- [ ] Review and fix `backend/tests/test_api.py`:
  - Ensure test client uses correct request schemas
- [ ] Verify `backend/synthetic_financial_gen/tests/test_generator.py` still passes
- [ ] Create `backend/tests/test_backtest.py` (after Tier 1 is done)
- [ ] Create `.github/workflows/ci.yml`:
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with:
            python-version: '3.11'
        - run: pip install -r backend/requirements.txt
        - run: cd backend && python -m pytest tests/ -v --tb=short
  ```
- [ ] Get the green CI badge in README.md ✅

### 3.2 Structured Logging

- [ ] Replace all `print()` statements in backend with `logging` module calls
- [ ] Create `backend/utils/logger.py` with a consistent logging config:
  - JSON-formatted logs for production
  - Human-readable format for development
  - Log levels: DEBUG, INFO, WARNING, ERROR
- [ ] Add request-scoped logging (trace_id + request_id in every log line)
- [ ] Log agent start/complete/fail events with latency

### 3.3 Error Handling & Input Validation

- [ ] Add Pydantic validation on all API request models with clear error messages
- [ ] Add ticker symbol validation (must be 1-5 uppercase letters)
- [ ] Add date format validation (must be valid ISO date)
- [ ] Add CSV validation with specific error messages for missing columns
- [ ] Add file size limit on CSV upload (e.g., 10MB max)
- [ ] Return proper HTTP status codes consistently:
  - 400 for bad input
  - 422 for validation errors
  - 503 for upstream API failures
  - 429 for rate limiting

### 3.4 Rate Limiting & Security

- [ ] Add rate limiting middleware to FastAPI (e.g., `slowapi` or custom):
  - 10 predictions per minute per IP for anonymous users
  - Higher limits for authenticated users (future scope)
- [ ] Add CORS configuration — restrict allowed origins in production
- [ ] Sanitize all user inputs (ticker symbols, dates, filenames)
- [ ] Add request timeout handling — 60-second max per prediction

### 3.5 API Documentation

- [ ] Enhance FastAPI auto-docs with descriptive tags, summaries, and examples
- [ ] Add response model schemas for all endpoints
- [ ] Add example requests/responses in the OpenAPI spec
- [ ] Document error response formats

---

## 🎨 Tier 4 — Frontend UX Transformation

> Make the UI feel alive, professional, and interactive.

### 4.1 WebSocket Real-Time Agent Progress

- [ ] Create `backend/orchestrator/websocket.py`:
  - FastAPI WebSocket endpoint at `/ws/predict`
  - As each step completes, push status messages:
    - `{"step": "data_fetch", "status": "running", "message": "🔍 Fetching Finnhub data..."}`
    - `{"step": "financial_model", "status": "done", "latency_ms": 180, "message": "✅ Financial model done (180ms)"}`
    - `{"step": "news_macro", "status": "running", "message": "⏳ Analyzing news & macro signals..."}`
    - etc.
  - Final message includes the complete prediction result
- [ ] Update `frontend/src/pages/SimpleDashboard.jsx`:
  - Replace the silent spinner with a live progress feed
  - Show each agent's status in real-time with animated transitions
  - Visual timeline/stepper component showing agent execution progress
  - Each step shows: agent name → status icon → latency

### 4.2 Component Architecture Refactor

- [ ] Break `SimpleDashboard.jsx` (48KB!) into smaller components:
  - `frontend/src/components/PredictionForm.jsx` — input form (ticker/date/CSV)
  - `frontend/src/components/AgentProgressTracker.jsx` — live WebSocket progress
  - `frontend/src/components/ForecastCard.jsx` — revenue/EBITDA forecast display
  - `frontend/src/components/ConfidenceBreakdown.jsx` — agent confidence bars
  - `frontend/src/components/ShapExplainer.jsx` — SHAP values visualization
  - `frontend/src/components/RecommendationBadge.jsx` — buy/hold/sell indicator
  - `frontend/src/components/TelemetryPanel.jsx` — latency/trace info
  - `frontend/src/components/ExecutiveReport.jsx` — report generation
  - `frontend/src/components/AuditModal.jsx` — raw JSON viewer

### 4.3 Data Visualization Upgrades

- [ ] Add interactive **Recharts** charts (already in `package.json`):
  - Revenue forecast fan chart (P05/P50/P95 as shaded area)
  - EBITDA forecast fan chart
  - Agent confidence radar chart
  - SHAP waterfall/bar chart
  - Historical trend line with prediction overlay
- [ ] Add animated number transitions for forecast values
- [ ] Add sparkline mini-charts in summary cards

### 4.4 Dark Mode & Theme System

- [ ] Implement a proper theme toggle (dark/light)
- [ ] Create CSS custom properties for all theme tokens
- [ ] Persist theme preference in `localStorage`
- [ ] Ensure all charts and components respect the active theme

### 4.5 Multi-Page Routing

- [ ] Install `react-router-dom` (if not already)
- [ ] Add proper routes:
  - `/` → Landing/Home page with project overview
  - `/dashboard` → Main prediction dashboard (current `SimpleDashboard`)
  - `/backtest` → Backtesting results page (Tier 1)
  - `/model-info` → Model transparency page (Tier 2)
  - `/about` → About the project, methodology, team
- [ ] Add a proper navigation sidebar/header with active state indicators
- [ ] Add page transition animations

### 4.6 Loading & Empty States

- [ ] Design and implement proper loading skeletons (not just a spinner)
- [ ] Add meaningful empty states with illustrations:
  - "Enter a ticker symbol to get started"
  - "No backtest results yet — run your first backtest"
- [ ] Add error boundary components with retry buttons

---

## 🚀 Tier 5 — Impressive Extras (Bonus Marks)

> These are "wow factor" features for the demo day.

### 5.1 Executive PDF Report (Enhanced)

- [ ] Upgrade the current print-to-PDF with a styled PDF using a library (e.g., `reportlab` or `pdfkit`):
  - Professional cover page with FinSight AI branding
  - Table of contents
  - Executive summary section
  - Forecast charts embedded as images
  - SHAP explanation section
  - Agent breakdown section
  - Model accuracy scorecard (from backtest)
  - Disclaimer / methodology appendix
  - Timestamp, trace ID, and version footer on every page
- [ ] Add a `/api/generate-report` endpoint that returns a PDF blob
- [ ] Frontend: "Download Executive Report" button that triggers PDF download

### 5.2 Comparison Mode

- [ ] Add ability to compare predictions for 2-3 tickers side by side
- [ ] Create `frontend/src/pages/ComparisonDashboard.jsx`:
  - Side-by-side forecast cards
  - Overlaid charts (e.g., AAPL vs MSFT revenue forecast)
  - Relative strength indicator
- [ ] Backend: batch predict endpoint `POST /api/predict-batch`

### 5.3 Historical Prediction Tracking

- [ ] Store each prediction in SQLite/MongoDB with timestamp
- [ ] Create `GET /api/prediction-history?ticker=AAPL` endpoint
- [ ] Frontend: show a timeline of past predictions for the same ticker
- [ ] Show how predictions evolved over time (was the model getting better?)

### 5.4 Sector-Level Analysis

- [ ] Group companies by sector (Tech, Healthcare, Finance, etc.)
- [ ] Add a sector overview page showing:
  - Average forecast direction per sector
  - Best/worst predicted companies
  - Sector-level macro sentiment from the news agent

### 5.5 User Authentication (Optional Scope)

- [ ] Add basic auth with JWT tokens (if org features are enabled)
- [ ] User signup/login pages
- [ ] Per-user prediction history
- [ ] Admin panel for running backtests and viewing system health

### 5.6 Performance & Caching

- [ ] Add Redis or in-memory caching for:
  - Recent predictions (cache for 1 hour)
  - Macro indicators (cache for 6 hours — they don't change fast)
  - Company profile data (cache for 24 hours)
- [ ] Add cache-hit indicator in API responses
- [ ] Add `/api/cache/stats` endpoint for observability

### 5.7 Monitoring Dashboard (Internal)

- [ ] Add a `/admin/health` page showing:
  - API uptime
  - Average prediction latency
  - Agent success/failure rates
  - External API status (Finnhub, FRED, NewsAPI, Groq/Gemini)
  - Cache hit rates
  - Recent prediction log

---

## 📋 Implementation Order (Recommended Sequence)

| Step | What                               | Tier | Time Estimate | Impact |
|------|------------------------------------|------|---------------|--------|
| 1    | Remove hardcoded localhost URLs    | 0    | 30 min        | 🔴 Critical |
| 2    | Wire real training data into build | 0    | 1 hour        | 🔴 Critical |
| 3    | Clean up `.env.example` files      | 0    | 30 min        | 🟡 Medium |
| 4    | Build backtest engine              | 1    | 2–3 days      | 🟢 **Highest** |
| 5    | Build backtest API + frontend page | 1    | 1–2 days      | 🟢 **Highest** |
| 6    | Model info endpoint + UI           | 2    | 1 day         | 🟢 High |
| 7    | Retrain on 30+ real companies      | 2    | 1 day         | 🟢 High |
| 8    | Fix test suite + add CI            | 3    | 1–2 days      | 🟡 Medium |
| 9    | Structured logging                 | 3    | 1 day         | 🟡 Medium |
| 10   | WebSocket agent progress           | 4    | 1–2 days      | 🟢 High (demo wow) |
| 11   | Break up SimpleDashboard.jsx       | 4    | 1–2 days      | 🟡 Medium |
| 12   | Data viz upgrades (charts)         | 4    | 1–2 days      | 🟢 High (visual) |
| 13   | Multi-page routing                 | 4    | 1 day         | 🟡 Medium |
| 14   | Enhanced PDF report                | 5    | 1–2 days      | 🟡 Medium |
| 15   | Comparison mode                    | 5    | 1–2 days      | 🟡 Medium |
| 16   | Everything else in Tier 5          | 5    | 3–5 days      | 🟢 Bonus |

---

## 🏁 Definition of "Done" (Final Year Project Ready)

Before you present, make sure ALL of these are true:

- [ ] Model is trained on **real company data** (not synthetic)
- [ ] Backtesting page shows **verifiable accuracy** against 2022–2024 actuals
- [ ] No hardcoded `localhost` URLs in frontend
- [ ] All core tests pass (`pytest tests/ -v`)
- [ ] GitHub Actions CI badge is green ✅
- [ ] API docs are clean and accessible at `/docs`
- [ ] The demo works end-to-end: enter ticker → see results → download report
- [ ] The backtest chart is the centerpiece of your presentation
- [ ] `README.md` has clear setup instructions, architecture diagram, and screenshots

---

> 💡 **Pro tip for your FYP presentation:** Start by showing the backtest chart —
> "Here's how our system predicted Apple's revenue for 8 consecutive quarters,
> and here's what actually happened." Then walk through the architecture.
> Lead with proof, follow with design.
