"""
tests/test_backtest.py
======================
Tests for the backtesting engine.
"""

import pytest
import json
from pathlib import Path
from unittest.mock import patch, MagicMock
import pandas as pd
import numpy as np

# Import backtest functions
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestBacktestMetrics:
    """Test backtest metric calculations."""

    def test_compute_mape_normal(self):
        """Test MAPE calculation with normal values."""
        from backtest.run_backtest import compute_mape

        # 10% error
        assert compute_mape(110, 100) == 10.0
        # 0% error
        assert compute_mape(100, 100) == 0.0
        # 50% error
        assert compute_mape(150, 100) == 50.0

    def test_compute_mape_zero_actual(self):
        """Test MAPE when actual is zero."""
        from backtest.run_backtest import compute_mape

        # Zero actual, zero predicted = 0% error
        assert compute_mape(0, 0) == 0.0
        # Zero actual, non-zero predicted = 100% error
        assert compute_mape(100, 0) == 100.0

    def test_is_within_interval(self):
        """Test prediction interval coverage check."""
        from backtest.run_backtest import is_within_interval

        # Within interval
        assert is_within_interval(100, 90, 110) is True
        # At lower bound
        assert is_within_interval(90, 90, 110) is True
        # At upper bound
        assert is_within_interval(110, 90, 110) is True
        # Below interval
        assert is_within_interval(89, 90, 110) is False
        # Above interval
        assert is_within_interval(111, 90, 110) is False

    def test_compute_directional_accuracy(self):
        """Test directional accuracy calculation."""
        from backtest.run_backtest import compute_directional_accuracy

        # Correctly predicted up trend
        assert compute_directional_accuracy(110, 120, 100) is True
        # Correctly predicted down trend
        assert compute_directional_accuracy(90, 80, 100) is True
        # Incorrectly predicted up when actually down
        assert compute_directional_accuracy(110, 90, 100) is False
        # Incorrectly predicted down when actually up
        assert compute_directional_accuracy(90, 110, 100) is False


class TestBacktestResultsAPI:
    """Test backtest API endpoint."""

    def test_backtest_results_endpoint_no_data(self):
        """Test backtest results endpoint when no data exists."""
        from fastapi.testclient import TestClient
        from orchestrator.api import app

        client = TestClient(app)

        # Mock the file not existing
        with patch('pathlib.Path.exists', return_value=False):
            response = client.get("/api/backtest-results")
            # Should return 404 when no backtest data
            assert response.status_code in [404, 500]


class TestBacktestEngine:
    """Test backtest engine functions."""

    def test_backtest_tickers_defined(self):
        """Test that backtest tickers are properly defined."""
        from backtest.run_backtest import BACKTEST_TICKERS

        assert isinstance(BACKTEST_TICKERS, list)
        assert len(BACKTEST_TICKERS) >= 5
        assert "AAPL" in BACKTEST_TICKERS
        assert "MSFT" in BACKTEST_TICKERS

    def test_backtest_dates_defined(self):
        """Test that backtest dates are properly defined."""
        from backtest.run_backtest import TRAIN_END, TEST_START, TEST_END

        assert TRAIN_END == "2021-12-31"
        assert TEST_START == "2022-01-01"
        assert TEST_END == "2024-12-31"
