"""
tests/test_generator.py
========================
Unit tests for the synthetic_financial_gen generator.

Run:
    pytest tests/ -v
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

# Add parent to path so we can import generator directly
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from synthetic_financial_gen.generator import (
    DATASET_VERSION,
    SCENARIO_PARAMS,
    generate_dataset,
    generate_company_baselines,
    parse_scenario_mix,
    quarter_date,
    simulate_revenue_ar1,
    simulate_revenue_gbm,
    main,
)
import argparse
from datetime import date


# ── Fixtures ──────────────────────────────────────────────────────────────────
@pytest.fixture
def small_args():
    """Minimal args for fast tests."""
    return argparse.Namespace(
        n_companies=5,
        n_quarters=8,
        scenario_mix='{"bull":0.4,"neutral":0.4,"bear":0.2}',
        restatement_rate=0.02,
        mismatch_rate=0.15,
        volatility_scale=1.0,
        ar1=False,
        seed=42,
        out_dir=Path("./test_out"),
    )


@pytest.fixture
def df(small_args):
    return generate_dataset(small_args)


# ── Schema tests ──────────────────────────────────────────────────────────────
REQUIRED_COLUMNS = [
    "company_id", "date", "quarter", "revenue", "ebitda", "net_income",
    "eps", "revenue_growth", "ebitda_margin", "guidance_flag", "sentiment_score",
    "topic_confidence", "transcript_excerpt", "scenario", "restatement_flag",
    "seed", "provenance_note",
]


def test_schema_all_columns_present(df):
    for col in REQUIRED_COLUMNS:
        assert col in df.columns, f"Missing column: {col}"


def test_schema_no_nulls(df):
    for col in REQUIRED_COLUMNS:
        assert df[col].notna().all(), f"Null values in column: {col}"


def test_schema_company_id_format(df):
    assert df["company_id"].str.match(r"^COMP_\d{3}$").all()


def test_schema_date_format(df):
    pd.to_datetime(df["date"], format="%Y-%m-%d")  # raises if invalid


def test_schema_quarter_format(df):
    assert df["quarter"].str.match(r"^\d{4}Q[1-4]$").all()


def test_schema_guidance_flag_binary(df):
    assert set(df["guidance_flag"].unique()).issubset({0, 1})


def test_schema_restatement_flag_binary(df):
    assert set(df["restatement_flag"].unique()).issubset({0, 1})


def test_schema_sentiment_range(df):
    assert df["sentiment_score"].between(-1, 1).all()


def test_schema_topic_confidence_range(df):
    assert df["topic_confidence"].between(0, 1).all()


def test_schema_ebitda_margin_range(df):
    assert df["ebitda_margin"].between(0, 0.5).all()


def test_schema_seed_constant(df, small_args):
    assert (df["seed"] == small_args.seed).all()


# ── Temporal consistency ───────────────────────────────────────────────────────
def test_temporal_consistency_revenue_growth_first_quarter_zero(df):
    """First quarter per company should have revenue_growth = 0."""
    first_rows = df.groupby("company_id").first().reset_index()
    assert (first_rows["revenue_growth"] == 0.0).all()


def test_temporal_consistency_growth_matches_revenue(df):
    """revenue_growth should match (rev_t / rev_{t-1}) - 1 within tolerance."""
    for cid, group in df.groupby("company_id"):
        group = group.sort_values("date").reset_index(drop=True)
        for i in range(1, len(group)):
            expected = group.loc[i - 1, "revenue"]
            actual_prev = group.loc[i - 1, "revenue"]
            computed_growth = group.loc[i, "revenue"] / actual_prev - 1
            recorded_growth = group.loc[i, "revenue_growth"]
            assert math.isclose(computed_growth, recorded_growth, rel_tol=1e-4), (
                f"{cid} row {i}: computed={computed_growth:.6f} recorded={recorded_growth:.6f}"
            )


def test_temporal_row_count(df, small_args):
    """Total rows = n_companies × n_quarters."""
    assert len(df) == small_args.n_companies * small_args.n_quarters


# ── Scenario statistics ────────────────────────────────────────────────────────
def test_scenario_mix_roughly_correct():
    """Scenario proportions should be within ±15 pp of requested mix for n=20 companies."""
    args = argparse.Namespace(
        n_companies=200,
        n_quarters=4,
        scenario_mix='{"bull":0.4,"neutral":0.4,"bear":0.2}',
        restatement_rate=0.0,
        mismatch_rate=0.0,
        volatility_scale=1.0,
        ar1=False,
        seed=123,
        out_dir=Path("./test_out"),
    )
    df = generate_dataset(args)
    # One scenario per company, so sample per-company
    company_scenarios = df.groupby("company_id")["scenario"].first()
    counts = company_scenarios.value_counts(normalize=True)
    assert abs(counts.get("bull", 0) - 0.4) < 0.15
    assert abs(counts.get("neutral", 0) - 0.4) < 0.15
    assert abs(counts.get("bear", 0) - 0.2) < 0.15


def test_bull_scenario_higher_revenue_than_bear():
    """Bull companies should have higher median revenue growth than bear companies."""
    args = argparse.Namespace(
        n_companies=100,
        n_quarters=12,
        scenario_mix='{"bull":0.5,"bear":0.5}',
        restatement_rate=0.0,
        mismatch_rate=0.0,
        volatility_scale=1.0,
        ar1=False,
        seed=99,
        out_dir=Path("./test_out"),
    )
    df = generate_dataset(args)
    bull_growth = df[df["scenario"] == "bull"]["revenue_growth"].median()
    bear_growth = df[df["scenario"] == "bear"]["revenue_growth"].median()
    assert bull_growth > bear_growth, (
        f"Expected bull > bear, got bull={bull_growth:.4f}, bear={bear_growth:.4f}"
    )


# ── Reproducibility ───────────────────────────────────────────────────────────
def test_reproducibility(small_args):
    """Same seed should produce identical DataFrames."""
    df1 = generate_dataset(small_args)
    df2 = generate_dataset(small_args)
    pd.testing.assert_frame_equal(df1, df2)


def test_different_seeds_differ(small_args):
    """Different seeds should produce different data."""
    df1 = generate_dataset(small_args)
    small_args.seed = 999
    df2 = generate_dataset(small_args)
    assert not df1["revenue"].equals(df2["revenue"])


# ── Revenue simulation helpers ────────────────────────────────────────────────
def test_gbm_length():
    rng = np.random.default_rng(0)
    path = simulate_revenue_gbm(100.0, 20, 0.02, 0.12, rng)
    assert len(path) == 20


def test_ar1_length():
    rng = np.random.default_rng(0)
    path = simulate_revenue_ar1(100.0, 20, 0.02, 0.12, 0.85, rng)
    assert len(path) == 20


def test_gbm_positive_values():
    rng = np.random.default_rng(0)
    path = simulate_revenue_gbm(50.0, 50, -0.05, 0.25, rng)
    assert (path > 0).all()


# ── Scenario mix parsing ───────────────────────────────────────────────────────
def test_parse_scenario_mix_valid():
    mix = parse_scenario_mix('{"bull":0.4,"neutral":0.4,"bear":0.2}')
    assert math.isclose(sum(mix.values()), 1.0)


def test_parse_scenario_mix_invalid_sum():
    with pytest.raises(ValueError, match="sum to 1.0"):
        parse_scenario_mix('{"bull":0.5,"neutral":0.5,"bear":0.2}')


# ── Quarter date ───────────────────────────────────────────────────────────────
def test_quarter_date_format():
    _, qstr = quarter_date(date(2019, 1, 1), 0)
    assert qstr == "2019Q1"

    _, qstr = quarter_date(date(2019, 1, 1), 3)
    assert qstr == "2019Q4"

    _, qstr = quarter_date(date(2019, 1, 1), 4)
    assert qstr == "2020Q1"


# ── Company baselines ──────────────────────────────────────────────────────────
def test_baselines_count():
    rng = np.random.default_rng(0)
    df = generate_company_baselines(15, rng)
    assert len(df) == 15


def test_baselines_margin_range():
    rng = np.random.default_rng(0)
    df = generate_company_baselines(50, rng)
    assert df["base_margin"].between(0.05, 0.40).all()


# ── File output integration ────────────────────────────────────────────────────
def test_main_writes_files(tmp_path):
    """main() should produce all three output files."""
    main([
        "--n-companies", "3",
        "--n-quarters", "4",
        "--seed", "7",
        "--out-dir", str(tmp_path),
    ])
    assert (tmp_path / "synthetic_financials.csv").exists()
    assert (tmp_path / "generation_manifest.json").exists()
    assert (tmp_path / "sample_transcripts.jsonl").exists()


def test_manifest_contains_seed(tmp_path):
    main(["--n-companies", "2", "--n-quarters", "4", "--seed", "55",
          "--out-dir", str(tmp_path)])
    manifest = json.loads((tmp_path / "generation_manifest.json").read_text())
    assert manifest["parameters"]["seed"] == 55
    assert manifest["dataset_version"] == DATASET_VERSION


def test_sample_transcripts_valid_jsonl(tmp_path):
    main(["--n-companies", "10", "--n-quarters", "10", "--seed", "1",
          "--out-dir", str(tmp_path)])
    lines = (tmp_path / "sample_transcripts.jsonl").read_text().strip().split("\n")
    assert len(lines) <= 10
    for line in lines:
        obj = json.loads(line)
        assert "transcript_excerpt" in obj
        assert "sentiment_score" in obj
