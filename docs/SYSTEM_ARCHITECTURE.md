# FinSight AI - System Architecture

## Complete Visual Architecture Documentation

This document contains comprehensive Mermaid diagrams representing the entire FinSight AI system architecture.

---

## 📊 Table of Contents

1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [Request Flow Sequence](#2-request-flow-sequence)
3. [Agent Orchestration Flow](#3-agent-orchestration-flow)
4. [Data Pipeline Architecture](#4-data-pipeline-architecture)
5. [Feature Engineering Pipeline](#5-feature-engineering-pipeline)
6. [ML Model Architecture](#6-ml-model-architecture)
7. [Frontend Component Hierarchy](#7-frontend-component-hierarchy)
8. [API Layer Architecture](#8-api-layer-architecture)
9. [Database Schema](#9-database-schema)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Error Handling Flow](#11-error-handling-flow)
12. [Latency Optimization Flow](#12-latency-optimization-flow)

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer"]
        Browser[Web Browser]
        Mobile[Mobile Device]
    end
    
    subgraph Frontend["⚛️ Frontend Layer - React + Vite"]
        UI[Dashboard UI]
        State[State Management]
        Router[React Router]
        API_Client[API Client]
    end
    
    subgraph Backend["🐍 Backend Layer - FastAPI"]
        API[FastAPI Server]
        CORS[CORS Middleware]
        Validator[Pydantic Validators]
        ORCH[Orchestrator Engine]
    end
    
    subgraph DataLayer["📊 Data Layer"]
        Finnhub[Finnhub API]
        AlphaV[Alpha Vantage API]
        YFinance[yFinance API]
        FeatureStore[Feature Store]
    end
    
    subgraph AgentLayer["🤖 Agent Layer"]
        NLP[NLP Transcript Agent]
        Quant[Financial Quant Agent]
        News[News & Macro Agent]
        Comp[Competitor Agent]
    end
    
    subgraph Intelligence["🧠 Intelligence Layer"]
        LLM[Groq LLM<br/>Llama 3 70B]
        ML[Quantile Regression<br/>Model .pkl]
        SHAP[SHAP Explainer]
    end
    
    subgraph Storage["💾 Storage Layer"]
        SQLite[(SQLite<br/>Audit Trail)]
        Session[Session Storage]
        Cache[Response Cache]
    end
    
    Browser --> UI
    Mobile --> UI
    UI --> State
    State --> API_Client
    API_Client -->|HTTP/JSON| API
    
    API --> CORS
    CORS --> Validator
    Validator --> ORCH
    
    ORCH --> Finnhub
    ORCH --> AlphaV
    ORCH --> YFinance
    Finnhub --> FeatureStore
    AlphaV --> FeatureStore
    YFinance --> FeatureStore
    
    FeatureStore --> NLP
    FeatureStore --> Quant
    FeatureStore --> News
    FeatureStore --> Comp
    
    NLP --> LLM
    News --> LLM
    Comp --> LLM
    Quant --> ML
    Quant --> SHAP
    
    NLP --> ORCH
    Quant --> ORCH
    News --> ORCH
    Comp --> ORCH
    
    ORCH --> SQLite
    ORCH --> API
    API --> API_Client
    API_Client --> Session
    API_Client --> Cache
    
    style Client fill:#e1f5ff
    style Frontend fill:#fff4e6
    style Backend fill:#e8f5e9
    style DataLayer fill:#f3e5f5
    style AgentLayer fill:#fff9c4
    style Intelligence fill:#ffebee
    style Storage fill:#e0f2f1
```

---


## 2. Request Flow Sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as React Dashboard
    participant API as FastAPI Backend
    participant Data as Data Fetcher
    participant Feature as Feature Store
    participant Agents as Agent Pool
    participant LLM as Groq LLM
    participant ML as ML Model
    participant DB as SQLite DB
    
    User->>UI: Enter Ticker (AAPL) & Date
    UI->>UI: Validate Input
    UI->>API: POST /predict<br/>{ticker, date}
    
    Note over API: Generate trace_id
    API->>DB: Log request start
    
    API->>Data: Fetch company data
    Data->>Data: Find closest quarter<br/>(point-in-time)
    Data-->>API: Raw financial data
    
    API->>Feature: Engineer features
    Feature->>Feature: Calculate 20+ metrics<br/>(lags, growth, margins)
    Feature-->>API: Feature vector
    
    Note over API,Agents: Parallel Agent Execution (asyncio)
    
    par Agent 1: NLP
        API->>Agents: Trigger NLP Agent
        Agents->>LLM: Analyze transcript
        LLM-->>Agents: Sentiment + Insights
        Agents-->>API: NLP Result (4.2s)
    and Agent 2: Quant
        API->>Agents: Trigger Quant Agent
        Agents->>ML: Predict with features
        ML->>ML: Generate P05, P50, P95
        ML->>ML: Calculate SHAP values
        ML-->>Agents: Forecast + SHAP
        Agents-->>API: Quant Result (0.18s)
    and Agent 3: News
        API->>Agents: Trigger News Agent
        Agents->>LLM: Analyze market news
        LLM-->>Agents: Macro sentiment
        Agents-->>API: News Result (8.5s)
    and Agent 4: Competitor
        API->>Agents: Trigger Comp Agent
        Agents->>LLM: Benchmark peers
        LLM-->>Agents: Competitive position
        Agents-->>API: Comp Result (2.5s)
    end
    
    Note over API: Total time = max(agent times) = 8.5s
    
    API->>API: Aggregate results
    API->>API: Calculate combined confidence
    API->>API: Generate recommendation
    
    API->>DB: Log prediction result
    API-->>UI: JSON Response<br/>(15.4s total)
    
    UI->>UI: Parse & render data
    UI->>UI: Update state
    UI->>UI: Cache to sessionStorage
    UI-->>User: Display analysis
    
    User->>UI: Click "Download Report"
    UI->>UI: Generate PDF HTML
    UI->>UI: Open print dialog
    UI-->>User: PDF Report
```

---


## 3. Agent Orchestration Flow

```mermaid
graph TD
    Start([User Request]) --> Orchestrator[Orchestrator Engine]
    
    Orchestrator --> DataFetch[Fetch Company Data]
    DataFetch --> FeatureEng[Feature Engineering]
    
    FeatureEng --> AsyncGather{Async Gather<br/>asyncio.gather}
    
    AsyncGather -->|Parallel| Agent1[NLP Agent]
    AsyncGather -->|Parallel| Agent2[Quant Agent]
    AsyncGather -->|Parallel| Agent3[News Agent]
    AsyncGather -->|Parallel| Agent4[Comp Agent]
    
    subgraph NLP_Flow["NLP Transcript Agent"]
        Agent1 --> NLP1[Fetch Transcript]
        NLP1 --> NLP2[Extract Key Quotes]
        NLP2 --> NLP3[LLM Analysis]
        NLP3 --> NLP4[Sentiment Score]
        NLP4 --> NLP5[Confidence: 0.65]
    end
    
    subgraph Quant_Flow["Financial Quant Agent"]
        Agent2 --> Q1[Load Model .pkl]
        Q1 --> Q2[Scale Features]
        Q2 --> Q3[Predict P05/P50/P95]
        Q3 --> Q4[Apply Power Scaling]
        Q4 --> Q5[Calculate SHAP]
        Q5 --> Q6[Confidence: 0.84]
    end
    
    subgraph News_Flow["News & Macro Agent"]
        Agent3 --> N1[Fetch News Articles]
        N1 --> N2[Filter by Date Range]
        N2 --> N3[LLM Sentiment Analysis]
        N3 --> N4[Macro Impact Score]
        N4 --> N5[Confidence: 0.72]
    end
    
    subgraph Comp_Flow["Competitor Agent"]
        Agent4 --> C1[Identify Peer Group]
        C1 --> C2[Fetch Peer Metrics]
        C2 --> C3[LLM Benchmarking]
        C3 --> C4[Relative Position]
        C4 --> C5[Confidence: 0.58]
    end
    
    NLP5 --> Synthesize[Synthesize Results]
    Q6 --> Synthesize
    N5 --> Synthesize
    C5 --> Synthesize
    
    Synthesize --> Aggregate[Aggregate Confidence]
    Aggregate --> Recommend[Generate Recommendation]
    Recommend --> Format[Format JSON Response]
    Format --> Audit[Log to Audit Trail]
    Audit --> Return([Return to User])
    
    style AsyncGather fill:#ffeb3b
    style Synthesize fill:#4caf50
    style Aggregate fill:#2196f3
    style Recommend fill:#ff9800
```

---


## 4. Data Pipeline Architecture

```mermaid
graph LR
    subgraph External["🌐 External Data Sources"]
        F[Finnhub API<br/>Company Profile]
        A[Alpha Vantage<br/>Historical Data]
        Y[yFinance<br/>Fallback Source]
    end
    
    subgraph Ingestion["📥 Data Ingestion Layer"]
        Fetch[Data Fetcher]
        Validate[Data Validator]
        Transform[Data Transformer]
    end
    
    subgraph Processing["⚙️ Processing Layer"]
        PIT[Point-in-Time<br/>Date Matcher]
        Clean[Data Cleaner]
        Normalize[Normalizer]
    end
    
    subgraph Features["🔧 Feature Engineering"]
        Lag[Lag Features<br/>1q, 2q, 3q, 4q]
        Growth[Growth Metrics<br/>YoY, QoQ]
        Roll[Rolling Stats<br/>Mean, Std]
        Margin[Margin Metrics<br/>EBITDA, Profit]
        Vol[Volatility<br/>Coefficient of Var]
    end
    
    subgraph Store["💾 Feature Store"]
        Vector[Feature Vector<br/>20+ dimensions]
        Meta[Metadata<br/>Sector, Size]
        Scale[Scaling Factors<br/>Power 0.70]
    end
    
    subgraph Consumers["🎯 Data Consumers"]
        ML[ML Model]
        Agents[LLM Agents]
        UI[Dashboard UI]
    end
    
    F --> Fetch
    A --> Fetch
    Y --> Fetch
    
    Fetch --> Validate
    Validate --> Transform
    Transform --> PIT
    
    PIT --> Clean
    Clean --> Normalize
    
    Normalize --> Lag
    Normalize --> Growth
    Normalize --> Roll
    Normalize --> Margin
    Normalize --> Vol
    
    Lag --> Vector
    Growth --> Vector
    Roll --> Vector
    Margin --> Vector
    Vol --> Vector
    
    Vector --> Store
    Meta --> Store
    Scale --> Store
    
    Store --> ML
    Store --> Agents
    Store --> UI
    
    style External fill:#e3f2fd
    style Ingestion fill:#f3e5f5
    style Processing fill:#fff3e0
    style Features fill:#e8f5e9
    style Store fill:#fce4ec
    style Consumers fill:#f1f8e9
```

---


## 5. Feature Engineering Pipeline

```mermaid
graph TD
    Raw[Raw Financial Data] --> Check{Data Quality Check}
    
    Check -->|Pass| Split[Split by Quarter]
    Check -->|Fail| Error[Log Error & Skip]
    
    Split --> Sort[Sort by Date]
    Sort --> Window[Create Rolling Windows]
    
    Window --> Lag_Calc[Calculate Lag Features]
    Window --> Growth_Calc[Calculate Growth Metrics]
    Window --> Roll_Calc[Calculate Rolling Stats]
    Window --> Margin_Calc[Calculate Margins]
    Window --> Vol_Calc[Calculate Volatility]
    
    subgraph Lag_Features["Lag Features (8 features)"]
        Lag_Calc --> L1[revenue_lag_1q]
        Lag_Calc --> L2[revenue_lag_2q]
        Lag_Calc --> L3[revenue_lag_3q]
        Lag_Calc --> L4[revenue_lag_4q]
        Lag_Calc --> L5[ebitda_lag_1q]
        Lag_Calc --> L6[ebitda_lag_2q]
        Lag_Calc --> L7[ebitda_lag_3q]
        Lag_Calc --> L8[ebitda_lag_4q]
    end
    
    subgraph Growth_Features["Growth Metrics (4 features)"]
        Growth_Calc --> G1[revenue_growth_yoy]
        Growth_Calc --> G2[revenue_growth_qoq]
        Growth_Calc --> G3[ebitda_growth_yoy]
        Growth_Calc --> G4[ebitda_growth_qoq]
    end
    
    subgraph Rolling_Features["Rolling Stats (4 features)"]
        Roll_Calc --> R1[revenue_roll_mean_4q]
        Roll_Calc --> R2[revenue_roll_std_4q]
        Roll_Calc --> R3[ebitda_roll_mean_4q]
        Roll_Calc --> R4[ebitda_roll_std_4q]
    end
    
    subgraph Margin_Features["Margin Metrics (3 features)"]
        Margin_Calc --> M1[ebitda_margin]
        Margin_Calc --> M2[profit_margin]
        Margin_Calc --> M3[operating_margin]
    end
    
    subgraph Vol_Features["Volatility (2 features)"]
        Vol_Calc --> V1[revenue_volatility]
        Vol_Calc --> V2[ebitda_volatility]
    end
    
    L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 --> Combine
    G1 & G2 & G3 & G4 --> Combine
    R1 & R2 & R3 & R4 --> Combine
    M1 & M2 & M3 --> Combine
    V1 & V2 --> Combine
    
    Combine[Combine Features] --> Impute[Handle Missing Values]
    Impute --> Scale[Feature Scaling]
    Scale --> Validate_Final{Validation}
    
    Validate_Final -->|Pass| Output[Feature Vector<br/>21 dimensions]
    Validate_Final -->|Fail| Error
    
    Output --> Store[(Feature Store)]
    
    style Lag_Features fill:#e1f5fe
    style Growth_Features fill:#f3e5f5
    style Rolling_Features fill:#fff3e0
    style Margin_Features fill:#e8f5e9
    style Vol_Features fill:#fce4ec
```

---


## 6. ML Model Architecture

```mermaid
graph TB
    Input[Feature Vector<br/>21 dimensions] --> Preprocess[Preprocessing]
    
    Preprocess --> Model_Ensemble{Quantile Regression<br/>Ensemble}
    
    Model_Ensemble --> Model_P05[Model P05<br/>GradientBoosting<br/>alpha=0.05]
    Model_Ensemble --> Model_P50[Model P50<br/>GradientBoosting<br/>alpha=0.50]
    Model_Ensemble --> Model_P95[Model P95<br/>GradientBoosting<br/>alpha=0.95]
    
    Model_P05 --> Raw_P05[Raw P05 Prediction]
    Model_P50 --> Raw_P50[Raw P50 Prediction]
    Model_P95 --> Raw_P95[Raw P95 Prediction]
    
    Raw_P05 --> Check{Check Ordering}
    Raw_P50 --> Check
    Raw_P95 --> Check
    
    Check -->|Correct| Scale[Apply Power Scaling]
    Check -->|Incorrect| Fix[Fix with np.percentile]
    
    Fix --> Scale
    
    subgraph Scaling["Power Scaling (0.70 exponent)"]
        Scale --> Calc_Scale[Calculate Scale Factor<br/>scale = (input_size / training_avg)^0.70]
        Calc_Scale --> Apply_Rev[Apply to Revenue<br/>scaled_rev = raw_rev * scale]
        Calc_Scale --> Apply_EBIT[Apply to EBITDA<br/>scaled_ebitda = raw_ebitda * scale]
    end
    
    Apply_Rev --> Final_Rev[Final Revenue Forecast<br/>P05, P50, P95]
    Apply_EBIT --> Final_EBIT[Final EBITDA Forecast<br/>P05, P50, P95]
    
    Final_Rev --> SHAP_Calc[SHAP Calculation]
    Final_EBIT --> SHAP_Calc
    
    subgraph SHAP_Analysis["SHAP Explainability"]
        SHAP_Calc --> Tree_Explainer[TreeExplainer]
        Tree_Explainer --> SHAP_Values[SHAP Values<br/>per feature]
        SHAP_Values --> Top_Features[Top 5 Features<br/>by |SHAP|]
    end
    
    Top_Features --> Confidence[Calculate Model<br/>Confidence Score]
    
    Confidence --> Output{Output}
    
    Output --> Forecast[Forecast Object]
    Output --> Explain[Explainability Object]
    Output --> Conf[Confidence Score]
    
    style Model_Ensemble fill:#ffeb3b
    style Scaling fill:#4caf50
    style SHAP_Analysis fill:#2196f3
    style Output fill:#ff9800
```

---

