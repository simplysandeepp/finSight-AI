# 🔷 FinSight AI — Multi-Agent Financial Intelligence Platform

> **AI-powered financial forecasting with real market data.**  
> Analyze any public company using 4 parallel AI agents, real-time data from Finnhub, FRED, and NewsAPI. Get investment recommendations in both expert and plain English formats — all in under 10 seconds.

---

## 🚀 What's New - 2026 Upgrade

FinSight AI has been completely upgraded with **real data sources** and **production-ready features**:

✅ **Real Financial Data** - Finnhub API (1000+ tickers, 60 calls/min)  
✅ **Real Macro Data** - FRED API (GDP, inflation, interest rates)  
✅ **Real News** - NewsAPI (100 requests/day)  
✅ **CSV Upload** - Analyze your own company data  
✅ **Plain English Output** - Anyone can understand the analysis  
✅ **Firebase Auth** - Secure user accounts with Google OAuth  
✅ **MongoDB Atlas** - Per-user data isolation  
✅ **Production Ready** - Deploy to Render + Vercel for free  

---

## 📋 Table of Contents

1. [What Is FinSight AI?](#what-is-finsight-ai)
2. [Key Features](#key-features)
3. [Architecture Overview](#architecture-overview)
4. [Quick Start](#quick-start)
5. [How It Works](#how-it-works)
6. [API Endpoints](#api-endpoints)
7. [Tech Stack](#tech-stack)
8. [Project Structure](#project-structure)
9. [Deployment](#deployment)
10. [Documentation](#documentation)

---

## What Is FinSight AI?

**FinSight AI** is a full-stack financial intelligence platform that uses a **multi-agent AI architecture** to analyze companies and generate probabilistic financial forecasts.

### The Problem It Solves

Traditional financial analysis requires:
- Reading earnings call transcripts (hours of work)
- Running financial models in Excel (specialized skill)
- Monitoring macroeconomic news (constant effort)
- Comparing against competitors (research-intensive)

**FinSight AI automates all four tasks in parallel** and delivers results in under 10 seconds.

### What It Outputs

For any company and date, the system produces:
- 📈 **Revenue & EBITDA forecasts** with confidence intervals (p05/p50/p95)
- 🎯 **Investment recommendation** (Buy/Hold/Sell/Monitor) with reasoning
- 🧠 **Confidence score** (0-100%) across all agents
- � **Peer benchmarking** vs competitors
- �📰 **Macro sentiment** analysis from news
- 📝 **Key insights** from earnings calls in plain English
- 🔒 **Full audit trail** with per-user isolation

---

## Key Features

### 🌐 Real Data Integration

| Data Source | What It Provides | Free Tier |
|-------------|------------------|-----------|
| **Finnhub API** | Real company financials for any ticker | 60 calls/min |
| **FRED API** | Official Federal Reserve economic data | Unlimited |
| **NewsAPI** | Company news headlines | 100 requests/day |

### 🤖 Multi-Agent AI System

Four specialized AI agents run **simultaneously** using `asyncio`:

1. **Transcript NLP Agent** - Extracts insights from earnings calls (Groq LLaMA 3.3-70b)
2. **Financial Model Agent** - XGBoost quantile regression for probabilistic forecasts
3. **News & Macro Agent** - Analyzes market sentiment and economic indicators (Groq LLaMA 3.3-70b)
4. **Competitor Agent** - Peer benchmarking and relative positioning (Groq LLaMA 3.3-70b)

All outputs are synthesized by a **CIO Ensembler Agent** that produces the final investment signal.

### 📊 Plain English Output

Every analysis includes **two sections**:
- **Expert Analysis** - Detailed financial metrics for professionals
- **Simple Summary** - Plain English explanation for anyone (zero jargon)

Example: *"In simple terms: Good time to invest because the company is growing fast and making more profit."*

### 📤 CSV Upload

Users can upload their own quarterly financial data via CSV and get full AI analysis on private companies.

### 🔐 User Authentication

- Firebase Auth with Google OAuth + Email/Password
- Role-based access (Investor vs Organization)
- Per-user data isolation in MongoDB

### 🎯 Production Ready

- Backend: Deploy to Render.com (free tier)
- Frontend: Deploy to Vercel/Netlify (free tier)
- MongoDB Atlas for multi-user storage (512MB free)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────┐
│   React Frontend        │
│   (Vite + Tailwind)     │
│                         │
│  Dashboard → Upload →   │
│  History → Auth         │
└────────────┬────────────┘
             │ POST /predict
             ▼
┌─────────────────────────┐
│   FastAPI Backend       │
│   (orchestrator/api.py) │
│                         │
│  /predict  /upload-csv  │
│  /audit    /health      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│     Orchestrator        │
│  (orchestrate.py)       │
│                         │
│  1. Fetch real data     │
│  2. Dispatch 4 agents   │
│  3. Aggregate results   │
│  4. Persist to MongoDB  │
└────────────┬────────────┘
             │
    ┌────────┼────────┐
    │        │        │        │
    ▼        ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐┌────────┐
│Transcript││Financial││News/Macro││Competitor│
│NLP Agent││Model   ││Agent   ││Agent   │
│        ││Agent   ││        ││        │
│Groq    ││XGBoost ││Groq    ││Groq    │
│LLaMA   ││Quantile││LLaMA   ││LLaMA   │
└───┬────┘└───┬────┘└───┬────┘└───┬────┘
    │         │         │         │
    └─────────┴─────────┴─────────┘
              │
              ▼
    ┌─────────────────┐
    │ CIO Ensembler   │
    │ (Final Signal)  │
    └────────┬────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────┐    ┌──────────┐
│ MongoDB │    │ Response │
│ Audit   │    │ to User  │
└─────────┘    └──────────┘
```

### Data Flow

```
User Input (AAPL, 2024-12-31)
    │
    ▼
Finnhub API → Real quarterly financials
    │
    ▼
Feature Engineering (lags, rolling windows, growth)
    │
    ▼
asyncio.gather() → 4 agents run in parallel (10s timeout each)
    │
    ▼
Ensembler → Buy/Hold/Sell/Monitor signal
    │
    ▼
MongoDB → Persist with user_id
    │
    ▼
JSON response → Frontend
```

---

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- API Keys (see Environment Variables section)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Optional: Retrain models with real data
python retrain_with_real_data.py

# Start server
uvicorn orchestrator.api:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Environment Variables

Create `backend/.env`:
```env
# LLM APIs
GROQ_API_KEY_1=your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here

# Real Data APIs
FINNHUB_API_KEY=your_finnhub_key_here
FRED_API_KEY=your_fred_key_here
NEWS_API_KEY=your_newsapi_key_here

# MongoDB Atlas
MONGODB_URL=your_mongodb_connection_string

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_private_key"
```

Create `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## How It Works

### 1. User Makes Request

User enters a ticker (e.g., AAPL) and date, or uploads a CSV file with custom data.

### 2. Data Collection

- **Real Tickers**: Finnhub API fetches quarterly financials
- **CSV Upload**: System parses user data
- **Macro Data**: FRED API provides economic indicators
- **News**: NewsAPI fetches recent headlines

### 3. Feature Engineering

System computes:
- Lag features (1Q, 2Q, 4Q ago)
- Rolling windows (4Q mean, std)
- Growth metrics (YoY, QoQ)
- Scenario indicators (bull/neutral/bear)

### 4. Parallel Agent Execution

Four agents run simultaneously with 10-second timeout:

**Transcript NLP Agent**
- Extracts key driver sentences
- Identifies numeric facts
- Calculates sentiment score
- Detects management confidence

**Financial Model Agent**
- Runs XGBoost quantile regression
- Produces p05/p50/p95 forecasts
- Computes confidence from interval width
- Extracts feature importances

**News & Macro Agent**
- Analyzes news sentiment
- Evaluates macro conditions
- Identifies risk factors
- Assesses rate impact

**Competitor Agent**
- Fetches peer financials
- Compares revenue and margins
- Calculates relative positioning
- Ranks against competitors

### 5. Ensembler Synthesis

CIO Ensembler Agent:
- Combines all agent outputs
- Calculates geometric mean confidence
- Applies degradation penalty (0.9^n)
- Generates final Buy/Hold/Sell/Monitor signal
- Produces both expert and plain English explanations

### 6. Response & Audit

- Final JSON response sent to frontend
- Request logged to MongoDB with user_id
- Audit trail includes all agent outputs and latencies

---

## API Endpoints

### Core Endpoints

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/health` | GET | Health check | None |
| `/predict` | POST | Run prediction | `{"company_id": "AAPL", "as_of_date": "2024-12-31", "user_id": "optional"}` |
| `/upload-csv` | POST | Upload custom data | Form data with CSV file |
| `/audit` | GET | Get audit trail | Query param: `user_id` (optional) |

### Response Format

```json
{
  "request_id": "req-abc123",
  "trace_id": "trace-xyz789",
  "status": "success",
  "latency_ms": 4823,
  "result": {
    "final_forecast": {
      "revenue_p50": 124.3,
      "ebitda_p50": 38.5,
      "revenue_ci": [110.2, 138.1],
      "ebitda_ci": [32.1, 44.8]
    },
    "recommendation": {
      "action": "buy",
      "rationale": "Strong revenue momentum...",
      "simple_summary": "The company is growing fast...",
      "simple_verdict": "In simple terms: Good time to invest",
      "key_risks": ["Interest rate uncertainty"],
      "key_strengths": ["Margin expansion", "Services growth"]
    },
    "combined_confidence": 0.827,
    "explanations": [
      "Revenue growth YoY of 6% exceeds sector median",
      "EBITDA margin expanding from 28% → 31%"
    ]
  }
}
```

---

## Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **FastAPI** | REST API framework |
| **Python 3.9+** | Core language |
| **XGBoost** | Quantile regression models |
| **Groq LLaMA 3.3-70b** | LLM for NLP agents |
| **Gemini 2.0** | LLM fallback |
| **Motor** | Async MongoDB driver |
| **Firebase Admin** | User authentication |
| **Finnhub** | Real company financials |
| **FRED** | Macro economic data |
| **NewsAPI** | News headlines |
| **asyncio** | Parallel agent execution |
| **Pydantic** | Data validation |
| **loguru** | Logging |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **React Router** | Routing |
| **Firebase Auth** | Authentication |
| **Framer Motion** | Animations |
| **Recharts** | Data visualization |
| **Lucide React** | Icons |

### Infrastructure

| Service | Purpose | Tier |
|---------|---------|------|
| **Render.com** | Backend hosting | Free |
| **Vercel** | Frontend hosting | Free |
| **MongoDB Atlas** | Database | 512MB free |
| **Firebase** | Authentication | Free |

---

## Project Structure

```
financial-advisor/
├── backend/
│   ├── agents/                    # AI agents
│   │   ├── base.py               # Base agent class
│   │   ├── competitor.py         # Peer analysis
│   │   ├── ensembler.py          # CIO synthesis
│   │   ├── financial_model.py    # XGBoost forecasting
│   │   ├── llm_client.py         # Groq/Gemini client
│   │   ├── news_macro.py         # News & macro analysis
│   │   └── transcript_nlp.py     # Earnings call NLP
│   ├── audit/
│   │   └── audit_trail.py        # MongoDB audit logging
│   ├── data_sources/              # Real data integrations
│   │   ├── csv_loader.py         # CSV upload parser
│   │   ├── finnhub_loader.py     # Finnhub API client
│   │   ├── fred_loader.py        # FRED API client
│   │   └── news_loader.py        # NewsAPI client
│   ├── database/
│   │   └── mongodb.py            # MongoDB connection
│   ├── features/
│   │   └── feature_store.py      # Feature engineering
│   ├── orchestrator/
│   │   ├── api.py                # FastAPI endpoints
│   │   └── orchestrate.py        # Agent orchestration
│   ├── collect_training_data.py  # Fetch real training data
│   ├── retrain_with_real_data.py # Retrain pipeline
│   ├── train_pipeline.py         # Model training
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CSVUpload.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── RoleSelectModal.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Firebase auth state
│   │   ├── firebase/
│   │   │   └── config.js         # Firebase config
│   │   ├── pages/
│   │   │   ├── SimpleDashboard.jsx  # Main dashboard
│   │   │   ├── UploadData.jsx    # CSV upload page
│   │   │   ├── OrgHistory.jsx    # History page
│   │   │   ├── Landing.jsx       # Landing page
│   │   │   ├── Login.jsx         # Login page
│   │   │   └── Signup.jsx        # Signup page
│   │   ├── App.jsx               # Main app component
│   │   └── main.jsx              # Entry point
│   ├── public/
│   │   └── sample_upload.csv     # CSV template
│   ├── package.json
│   └── .env                      # Firebase credentials
├── render.yaml                   # Render deployment config
├── docker-compose.yml            # Docker setup
├── README.md                     # This file
├── UPDATES.md                    # Detailed project updates
└── UPGRADE_STATUS.md             # Feature status
```

---

## Deployment

### Backend (Render.com)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Configure:
   - Build Command: `cd backend && pip install -r requirements.txt && python train_pipeline.py`
   - Start Command: `cd backend && uvicorn orchestrator.api:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `backend/.env`
6. Deploy

### Frontend (Vercel)

1. Push code to GitHub
2. Import project on Vercel
3. Configure:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables from `frontend/.env`
5. Deploy

### MongoDB Atlas

1. Create free cluster on MongoDB Atlas
2. Create database user
3. Whitelist IP addresses (0.0.0.0/0 for development)
4. Copy connection string to `MONGODB_URL`

---

## Documentation

- **README.md** - This file (project overview)
- **UPDATES.md** - Detailed changelog of all features implemented
- **UPGRADE_STATUS.md** - Status of each upgrade feature
- **API Documentation** - Available at `/docs` when backend is running

---

## Testing

### Test Real Data Sources

```bash
cd backend

# Test Finnhub
python -c "from data_sources.finnhub_loader import get_company_financials; print(get_company_financials('AAPL'))"

# Test FRED
python -c "from data_sources.fred_loader import get_macro_indicators; print(get_macro_indicators())"

# Test NewsAPI
python -c "from data_sources.news_loader import get_company_news; print(get_company_news('Apple'))"
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Predict
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"company_id": "AAPL", "as_of_date": "2024-12-31"}'

# Audit trail
curl "http://localhost:8000/audit?user_id=test-user"
```

### Test CSV Upload

1. Navigate to `http://localhost:5173/upload`
2. Upload `frontend/public/sample_upload.csv`
3. Click "Analyze"
4. View results

---

## Key Achievements

✅ **100% Real Data** - No synthetic fake data  
✅ **Plain English** - Anyone can understand  
✅ **User Isolation** - Per-user MongoDB collections  
✅ **CSV Upload** - Analyze private companies  
✅ **92% Code Reduction** - Frontend simplified  
✅ **Production Ready** - Free deployment  
✅ **Real ML Models** - Trained on 30+ companies  
✅ **Secure Auth** - Firebase with Google OAuth  
✅ **Multi-User** - MongoDB Atlas  
✅ **Live Deployment** - Share one URL  

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ using AI-powered multi-agent architecture**

**Last Updated:** March 7, 2026  
**Status:** ✅ Production Ready  
**Version:** 2.0.0
