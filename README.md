# synthetic_financial_gen

Reproducible synthetic multimodal financial dataset generator for the
**Multimodal Multi-Agent Financial Advisor MVP**.

## Requirements

```
Python 3.9+
numpy pandas scipy pyyaml pytest
```

Install:
```bash
pip install numpy pandas scipy pyyaml pytest
```

## Usage

```bash
# Default: 40 companies, 20 quarters, seed=42
python generator.py --out-dir ./out

# Custom run
python generator.py \
  --n-companies 40 \
  --n-quarters 20 \
  --scenario-mix '{"bull":0.4,"neutral":0.4,"bear":0.2}' \
  --restatement-rate 0.02 \
  --mismatch-rate 0.15 \
  --volatility-scale 1.0 \
  --seed 42 \
  --out-dir ./out

# Use AR(1) instead of GBM
python generator.py --ar1 --seed 42 --out-dir ./out_ar1
```

## Outputs

| File | Description |
|------|-------------|
| `synthetic_financials.csv` | Main dataset (n_companies × n_quarters rows) |
| `generation_manifest.json` | All parameters + dataset version for reproducibility |
| `sample_transcripts.jsonl` | 10 sample transcript excerpts (one per template) |

## CSV Schema

| Column | Type | Notes |
|--------|------|-------|
| company_id | str | COMP_001 … COMP_N |
| date | YYYY-MM-DD | Quarter end date |
| quarter | YYYYQn | e.g. 2022Q3 |
| revenue | float (M) | Millions USD |
| ebitda | float (M) | |
| net_income | float (M) | |
| eps | float | Diluted |
| revenue_growth | float | QoQ fraction |
| ebitda_margin | float | 0–1 |
| guidance_flag | 0/1 | 1 = guidance issued |
| sentiment_score | float -1..1 | From transcript |
| topic_confidence | float 0..1 | NLP confidence |
| transcript_excerpt | str | Synthetic earnings call excerpt |
| scenario | str | bull / neutral / bear |
| restatement_flag | 0/1 | 1 = restated row |
| seed | int | Master seed |
| provenance_note | str | Generation metadata |

## Running Tests

```bash
cd synthetic_financial_gen
pytest tests/ -v
```

Tests cover: schema validation, temporal consistency, scenario statistics,
reproducibility, and file I/O.
