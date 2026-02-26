"""
synthetic_financial_gen/generator.py
=====================================
Reproducible synthetic multimodal financial dataset generator for the
FinSight Ai | Multi-Agent Financial Intelligence Platform.

Usage
-----
python generator.py --n-companies 40 --n-quarters 20 --seed 42 --out-dir ./out

Outputs
-------
  out/synthetic_financials.csv      — main dataset
  out/generation_manifest.json      — run parameters + version
  out/sample_transcripts.jsonl      — 10 raw transcript samples
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import os
import sys
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────────────────
DATASET_VERSION = "1.0.0"
START_DATE = date(2019, 1, 1)

SCENARIO_PARAMS: Dict[str, Dict] = {
    "bull":    {"drift": 0.03,  "vol_scale": 0.8,  "margin_base": 0.22},
    "neutral": {"drift": 0.005, "vol_scale": 1.0,  "margin_base": 0.18},
    "bear":    {"drift": -0.02, "vol_scale": 1.4,  "margin_base": 0.12},
}

# Transcript templates: (template_id, optimism_despite_negatives, template_text)
TRANSCRIPT_TEMPLATES: List[tuple] = [
    ("T01", False, (
        "Good morning everyone. {ceo} here. We delivered revenue of ${revenue:.1f}M in {quarter}, "
        "reflecting {growth_adj} growth of {growth_pct:.1f}% year-over-year. Our EBITDA came in at "
        "${ebitda:.1f}M, representing a margin of {margin:.1f}%. We feel {sentiment_word} about the "
        "trajectory of our business."
    )),
    ("T02", True, (
        "Thank you for joining us. Despite some near-term headwinds, we reported revenue of ${revenue:.1f}M "
        "for {quarter}. While this reflects a {growth_pct:.1f}% {growth_dir}, our pipeline has never been "
        "stronger and we are deeply excited about the opportunities ahead. EBITDA was ${ebitda:.1f}M."
    )),
    ("T03", False, (
        "CFO speaking. Net income for {quarter} was ${net_income:.1f}M. EPS came in at ${eps:.2f}, "
        "{eps_vs_guidance} our guidance range of ${guidance_low:.2f}–${guidance_high:.2f}. We are "
        "{guidance_flag_word} guidance for next quarter."
    )),
    ("T04", True, (
        "In {quarter} we navigated a challenging environment while still achieving revenue of ${revenue:.1f}M. "
        "Yes, growth was {growth_pct:.1f}% — below our initial targets — but our strategic initiatives are "
        "gaining momentum and we remain confident in our long-term trajectory."
    )),
    ("T05", False, (
        "Analyst question: Can you comment on the revenue miss? Management: Thank you for the question. "
        "Revenue of ${revenue:.1f}M in {quarter} was impacted by timing of deal closures. Our backlog "
        "increased and we believe this represents a timing issue, not a demand issue."
    )),
    ("T06", False, (
        "This is {quarter} earnings. Revenue: ${revenue:.1f}M. EBITDA: ${ebitda:.1f}M at a {margin:.1f}% "
        "margin. Net income: ${net_income:.1f}M. EPS: ${eps:.2f}. We {guidance_flag_word} guidance. "
        "Sentiment: {sentiment_word}."
    )),
    ("T07", True, (
        "Our operational transformation continues to deliver results. Revenue in {quarter} was ${revenue:.1f}M "
        "and we maintained discipline on costs with EBITDA of ${ebitda:.1f}M. The market environment remains "
        "dynamic but we are executing well against our plan and the team is energized."
    )),
    ("T08", False, (
        "We are pleased to report another quarter of {growth_adj} growth. {quarter} revenue of ${revenue:.1f}M "
        "exceeded the high end of guidance. EBITDA margin expanded to {margin:.1f}%. We are raising full-year "
        "guidance, reflecting the strength of our business model."
    )),
    ("T09", True, (
        "I want to be direct with investors. {quarter} revenue of ${revenue:.1f}M fell short of our expectations. "
        "However, I want to emphasize that our strategic position is intact, our customer relationships are "
        "strong, and we are taking decisive action to return to growth. EBITDA was ${ebitda:.1f}M."
    )),
    ("T10", False, (
        "Let me walk you through the {quarter} numbers. Revenue growth of {growth_pct:.1f}% reflects the "
        "{scenario} macroeconomic environment. Our EBITDA of ${ebitda:.1f}M and EPS of ${eps:.2f} are "
        "consistent with our financial model. We {guidance_flag_word} guidance for the coming quarter."
    )),
]


# ── CLI ────────────────────────────────────────────────────────────────────────
def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    p = argparse.ArgumentParser(
        description="Generate synthetic multimodal financial datasets."
    )
    p.add_argument("--n-companies",       type=int,   default=40,
                   help="Number of companies to simulate (default: 40)")
    p.add_argument("--n-quarters",        type=int,   default=20,
                   help="Number of quarters per company (default: 20)")
    p.add_argument("--scenario-mix",      type=str,
                   default='{"bull":0.4,"neutral":0.4,"bear":0.2}',
                   help="JSON string or file path with scenario probabilities")
    p.add_argument("--restatement-rate",  type=float, default=0.02,
                   help="Fraction of rows to simulate restatements (default: 0.02)")
    p.add_argument("--mismatch-rate",     type=float, default=0.15,
                   help="Fraction of rows where sentiment contradicts fundamentals")
    p.add_argument("--volatility-scale",  type=float, default=1.0,
                   help="Global volatility multiplier (default: 1.0)")
    p.add_argument("--ar1",               action="store_true",
                   help="Use AR(1) instead of GBM for revenue simulation")
    p.add_argument("--seed",              type=int,   default=42,
                   help="Master random seed for reproducibility (default: 42)")
    p.add_argument("--out-dir",           type=Path,  default=Path("./out"),
                   help="Output directory (default: ./out)")
    return p.parse_args(argv)


# ── Scenario mix parsing ───────────────────────────────────────────────────────
def parse_scenario_mix(raw: str) -> Dict[str, float]:
    """Parse scenario-mix from JSON string or file path."""
    if os.path.isfile(raw):
        with open(raw) as f:
            mix = json.load(f)
    else:
        mix = json.loads(raw)
    total = sum(mix.values())
    if not math.isclose(total, 1.0, rel_tol=1e-4):
        raise ValueError(f"Scenario mix probabilities must sum to 1.0, got {total:.4f}")
    return mix


# ── Company baseline generator ────────────────────────────────────────────────
def generate_company_baselines(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """
    Draw per-company baseline parameters from distributions.

    Returns
    -------
    DataFrame with columns: company_id, base_revenue, base_margin, ar1_phi
    """
    rows = []
    for i in range(1, n + 1):
        rows.append({
            "company_id":   f"COMP_{i:03d}",
            "base_revenue": rng.lognormal(mean=4.5, sigma=0.8),   # millions
            "base_margin":  np.clip(rng.normal(0.18, 0.05), 0.05, 0.40),
            "ar1_phi":      np.clip(rng.uniform(0.6, 0.95), 0.0, 0.99),
        })
    return pd.DataFrame(rows)


# ── Revenue simulation ─────────────────────────────────────────────────────────
def simulate_revenue_gbm(
    base: float, n_quarters: int, drift: float, vol: float, rng: np.random.Generator
) -> np.ndarray:
    """Geometric Brownian Motion revenue path."""
    dt = 0.25  # quarterly
    shocks = rng.normal(0, 1, n_quarters)
    log_returns = (drift - 0.5 * vol ** 2) * dt + vol * math.sqrt(dt) * shocks
    path = base * np.exp(np.cumsum(log_returns))
    return path


def simulate_revenue_ar1(
    base: float, n_quarters: int, drift: float, vol: float,
    phi: float, rng: np.random.Generator
) -> np.ndarray:
    """AR(1) revenue path (in log space)."""
    log_rev = [math.log(base)]
    for _ in range(n_quarters - 1):
        shock = rng.normal(0, vol * 0.25)
        log_rev.append(phi * log_rev[-1] + (1 - phi) * (math.log(base) + drift) + shock)
    return np.exp(np.array(log_rev))


# ── Quarter date helper ────────────────────────────────────────────────────────
def quarter_date(start: date, q_idx: int) -> tuple[date, str]:
    """Return (end_date, 'YYYYQn') for the q_idx-th quarter after start."""
    year = start.year + (start.month - 1 + q_idx * 3) // 12
    month = (start.month - 1 + q_idx * 3) % 12 + 1
    qnum = (month - 1) // 3 + 1
    end_month = qnum * 3
    last_day = 30 if end_month in [4, 6, 9, 11] else (28 if end_month == 2 else 31)
    return date(year, end_month, last_day), f"{year}Q{qnum}"


# ── Transcript excerpt builder ─────────────────────────────────────────────────
def build_excerpt(row: dict, rng: np.random.Generator) -> str:
    """Fill a transcript template with row values."""
    tmpl_id, is_mismatch, tmpl = TRANSCRIPT_TEMPLATES[int(row["_tmpl_idx"])]
    growth_pct = row["revenue_growth"] * 100
    is_negative = row["revenue_growth"] < 0

    kwargs = {
        "ceo":             f"CEO of {row['company_id']}",
        "revenue":         row["revenue"],
        "quarter":         row["quarter"],
        "ebitda":          row["ebitda"],
        "net_income":      row["net_income"],
        "eps":             row["eps"],
        "margin":          row["ebitda_margin"] * 100,
        "growth_pct":      abs(growth_pct),
        "growth_adj":      "strong" if growth_pct > 5 else ("modest" if growth_pct > 0 else "challenging"),
        "growth_dir":      "decline" if is_negative else "increase",
        "scenario":        row["scenario"],
        "sentiment_word":  "optimistic" if row["sentiment_score"] > 0.2 else (
                           "cautious" if row["sentiment_score"] < -0.2 else "measured"),
        "guidance_flag_word": "are reaffirming" if row["guidance_flag"] else "are not updating",
        "eps_vs_guidance": "within" if rng.random() > 0.3 else "slightly above",
        "guidance_low":    row["eps"] * 0.95,
        "guidance_high":   row["eps"] * 1.05,
    }
    try:
        return tmpl.format(**kwargs)
    except KeyError:
        return tmpl  # fallback: return template as-is


# ── Main generation ────────────────────────────────────────────────────────────
def generate_dataset(args: argparse.Namespace) -> pd.DataFrame:
    """
    Generate the full synthetic financial dataset.

    Returns
    -------
    DataFrame with all columns defined in the schema.
    """
    rng = np.random.default_rng(args.seed)
    scenario_mix = parse_scenario_mix(args.scenario_mix)
    scenario_names = list(scenario_mix.keys())
    scenario_probs = [scenario_mix[s] for s in scenario_names]

    baselines = generate_company_baselines(args.n_companies, rng)

    records: List[dict] = []

    log.info("Generating %d companies × %d quarters ...", args.n_companies, args.n_quarters)

    for _, company in baselines.iterrows():
        cid = company["company_id"]

        # Assign scenario for the full run (company-level)
        scenario = rng.choice(scenario_names, p=scenario_probs)
        sp = SCENARIO_PARAMS[scenario]
        vol = sp["vol_scale"] * args.volatility_scale * 0.12

        # Revenue path
        if args.ar1:
            revenues = simulate_revenue_ar1(
                company["base_revenue"], args.n_quarters,
                sp["drift"], vol, company["ar1_phi"], rng
            )
        else:
            revenues = simulate_revenue_gbm(
                company["base_revenue"], args.n_quarters,
                sp["drift"], vol, rng
            )

        # Template index (rotate through 10 templates)
        tmpl_indices = rng.integers(0, len(TRANSCRIPT_TEMPLATES), size=args.n_quarters)

        prev_revenue = revenues[0]  # for growth calc

        for q_idx in range(args.n_quarters):
            qdate, quarter_str = quarter_date(START_DATE, q_idx)
            rev = revenues[q_idx]
            rev_growth = (rev / prev_revenue - 1) if q_idx > 0 else 0.0

            margin = np.clip(
                company["base_margin"] + rng.normal(0, 0.02),
                0.0, 0.5
            )
            ebitda = rev * margin
            # Net income ≈ 60% of EBITDA minus a small interest/tax stub
            net_income = ebitda * np.clip(rng.normal(0.60, 0.05), 0.3, 0.8)
            shares = rng.uniform(50, 200)  # millions of diluted shares
            eps = net_income / shares

            # Guidance: more likely when things are good
            guidance_flag = int(rng.random() < (0.7 if scenario == "bull" else 0.5))

            # Sentiment: correlated with revenue surprise, but sometimes mismatched
            base_sentiment = np.clip(rev_growth * 5, -1, 1)
            if rng.random() < args.mismatch_rate:
                # Inject controlled mismatch (optimistic language despite bad numbers)
                sentiment = np.clip(abs(base_sentiment) * rng.uniform(0.5, 1.0), 0.1, 1.0)
                mismatch = True
            else:
                sentiment = np.clip(base_sentiment + rng.normal(0, 0.15), -1, 1)
                mismatch = False

            topic_conf = np.clip(rng.beta(5, 2), 0.5, 1.0)

            record = {
                "company_id":       cid,
                "date":             qdate.isoformat(),
                "quarter":          quarter_str,
                "revenue":          round(rev, 4),
                "ebitda":           round(ebitda, 4),
                "net_income":       round(net_income, 4),
                "eps":              round(eps, 4),
                "revenue_growth":   round(rev_growth, 6),
                "ebitda_margin":    round(margin, 6),
                "guidance_flag":    guidance_flag,
                "sentiment_score":  round(sentiment, 4),
                "topic_confidence": round(topic_conf, 4),
                "transcript_excerpt": "",      # filled below
                "scenario":         scenario,
                "restatement_flag": 0,
                "seed":             args.seed,
                "provenance_note":  f"generated_v{DATASET_VERSION}",
                "_tmpl_idx":        int(tmpl_indices[q_idx]),
                "_mismatch":        mismatch,
            }
            record["transcript_excerpt"] = build_excerpt(record, rng)
            records.append(record)
            prev_revenue = rev

    df = pd.DataFrame(records)

    # ── Restatements ────────────────────────────────────────────────────────────
    log.info("Applying restatements (rate=%.3f) ...", args.restatement_rate)
    n_restate = max(1, int(len(df) * args.restatement_rate))
    restate_idx = rng.choice(df.index[df["quarter"] != df["quarter"].min()],
                              size=min(n_restate, len(df) - 1), replace=False)
    for idx in restate_idx:
        noise = rng.uniform(-0.08, 0.08)
        df.at[idx, "revenue"] *= (1 + noise)
        df.at[idx, "ebitda"]  *= (1 + noise * 0.9)
        df.at[idx, "restatement_flag"] = 1
        df.at[idx, "provenance_note"] = (
            f"restated_v{DATASET_VERSION}; original_noise={noise:.4f}"
        )

    # Drop internal helper columns
    df.drop(columns=["_tmpl_idx", "_mismatch"], inplace=True, errors="ignore")

    log.info("Dataset generated: %d rows, %d columns.", len(df), len(df.columns))
    return df


# ── Manifest & sample transcripts ─────────────────────────────────────────────
def write_manifest(args: argparse.Namespace, out_dir: Path) -> None:
    """Write generation_manifest.json."""
    manifest = {
        "dataset_version":  DATASET_VERSION,
        "generated_at":     str(date.today()),
        "parameters": {
            "n_companies":       args.n_companies,
            "n_quarters":        args.n_quarters,
            "scenario_mix":      json.loads(args.scenario_mix)
                                 if isinstance(args.scenario_mix, str) else args.scenario_mix,
            "restatement_rate":  args.restatement_rate,
            "mismatch_rate":     args.mismatch_rate,
            "volatility_scale":  args.volatility_scale,
            "ar1_mode":          args.ar1,
            "seed":              args.seed,
        },
    }
    path = out_dir / "generation_manifest.json"
    path.write_text(json.dumps(manifest, indent=2))
    log.info("Manifest written → %s", path)


def write_sample_transcripts(df: pd.DataFrame, out_dir: Path) -> None:
    """Write 10 sample raw transcripts (one per template) as JSONL."""
    samples = (
        df.drop_duplicates(subset=["quarter"])
        .head(10)[["company_id", "date", "quarter", "scenario",
                   "transcript_excerpt", "sentiment_score", "revenue_growth"]]
        .to_dict(orient="records")
    )
    path = out_dir / "sample_transcripts.jsonl"
    with open(path, "w") as f:
        for rec in samples:
            f.write(json.dumps(rec) + "\n")
    log.info("Sample transcripts written → %s", path)


# ── Entry point ────────────────────────────────────────────────────────────────
def main(argv: Optional[List[str]] = None) -> None:
    args = parse_args(argv)
    args.out_dir.mkdir(parents=True, exist_ok=True)

    log.info("Starting synthetic generation: seed=%d, companies=%d, quarters=%d",
             args.seed, args.n_companies, args.n_quarters)

    df = generate_dataset(args)

    csv_path = args.out_dir / "synthetic_financials.csv"
    df.to_csv(csv_path, index=False)
    log.info("CSV written → %s  (%d rows)", csv_path, len(df))

    write_manifest(args, args.out_dir)
    write_sample_transcripts(df, args.out_dir)

    log.info("Done. All outputs saved to %s", args.out_dir)


if __name__ == "__main__":
    main()
