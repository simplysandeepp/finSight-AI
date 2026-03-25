# 🔷 FinSight AI

**Agentic Multi-Model Financial Intelligence Platform**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production-green.svg)
![CI](https://github.com/simplysandeepp/finSight-AI/actions/workflows/ci.yml/badge.svg?branch=main)
![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![React](https://img.shields.io/badge/react-18+-61dafb.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 🚀 Overview
FinSight AI is an **AI-powered financial forecasting system** combining:
- 📊 Quantitative Finance (Quantile Regression)
- 🤖 Multi-Agent LLM Intelligence
- 📈 Real-time Market Data

⏱️ Generates insights in **<20 seconds**

---

## 🌟 Key Features
- ⚡ Parallel AI Agents (async execution)
- 📉 Probabilistic Forecasts (Bear / Base / Bull)
- 🧠 SHAP Explainability
- 📰 News + NLP + Competitor Analysis
- 📄 PDF Reports + Audit Trail

---

## 🏗️ Architecture
- **Frontend:** React + Vite + Tailwind  
- **Backend:** FastAPI + asyncio  
- **ML:** Scikit-learn + SHAP  
- **LLM:** Groq (Llama 3)  
- **DB:** MongoDB Atlas  

---

## ⚡ Quick Start

```bash
git clone https://github.com/yourusername/finsight-ai.git
cd finsight-ai

# Backend
cd backend
pip install -r requirements.txt
uvicorn orchestrator.api:app --reload

# Frontend
cd ../frontend
npm install
npm run dev
