"""
backend/backtest/__init__.py
============================
Historical backtesting module for verifying model accuracy.
"""

from .run_backtest import run_backtest

__all__ = ['run_backtest']
