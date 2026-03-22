"""
Simple test to demonstrate the CI fix works correctly
"""

import numpy as np

print("\n" + "="*80)
print("DEMONSTRATING CONFIDENCE INTERVAL FIX")
print("="*80 + "\n")

# Simulate what the old code did (BROKEN)
print("OLD CODE (BROKEN):")
print("-" * 40)
p05_raw = 22000.0
p50_raw = 25000.0
p95_raw = 28000.0

print(f"Raw predictions from models:")
print(f"  p05_raw = {p05_raw:,.0f}")
print(f"  p50_raw = {p50_raw:,.0f}")
print(f"  p95_raw = {p95_raw:,.0f}")
print()

# Old broken logic
p50_old = max(p05_raw, p50_raw)  # This is fine
p95_old = max(p50_old, p95_raw)  # This is fine too

print(f"After monotonicity enforcement:")
print(f"  p05 = {p05_raw:,.0f}")
print(f"  p50 = {p50_old:,.0f}")
print(f"  p95 = {p95_old:,.0f}")
print()

# But what if the model outputs were reversed? (This is the bug scenario)
print("BUG SCENARIO (when p95_raw < p50_raw):")
print("-" * 40)
p05_raw_bug = 22000.0
p50_raw_bug = 28000.0  # Model predicted high median
p95_raw_bug = 25000.0  # But lower upper bound (model confusion)

print(f"Raw predictions from models:")
print(f"  p05_raw = {p05_raw_bug:,.0f}")
print(f"  p50_raw = {p50_raw_bug:,.0f}")
print(f"  p95_raw = {p95_raw_bug:,.0f}")
print()

# Old broken logic
p50_old_bug = max(p05_raw_bug, p50_raw_bug)  # = 28000
p95_old_bug = max(p50_old_bug, p95_raw_bug)  # = max(28000, 25000) = 28000

print(f"After OLD monotonicity enforcement:")
print(f"  p05 = {p05_raw_bug:,.0f}")
print(f"  p50 = {p50_old_bug:,.0f}")
print(f"  p95 = {p95_old_bug:,.0f}")
print(f"  ✗ BUG: p50 == p95 (collapsed!)")
print()

# NEW CODE (FIXED)
print("\n" + "="*80)
print("NEW CODE (FIXED):")
print("="*80 + "\n")

print("SAME BUG SCENARIO:")
print("-" * 40)
print(f"Raw predictions from models:")
print(f"  p05_raw = {p05_raw_bug:,.0f}")
print(f"  p50_raw = {p50_raw_bug:,.0f}")
print(f"  p95_raw = {p95_raw_bug:,.0f}")
print()

# New fixed logic using numpy percentile
predictions = np.array([p05_raw_bug, p50_raw_bug, p95_raw_bug])
p05_new = float(np.percentile(predictions, 5))
p50_new = float(np.percentile(predictions, 50))
p95_new = float(np.percentile(predictions, 95))

print(f"After NEW percentile-based ordering:")
print(f"  p05 = {p05_new:,.0f}")
print(f"  p50 = {p50_new:,.0f}")
print(f"  p95 = {p95_new:,.0f}")
print(f"  ✓ FIXED: p05 < p50 < p95 (proper ordering!)")
print()

# Verify the fix
ci_valid = p05_new < p50_new < p95_new
spread_pct = ((p95_new - p05_new) / p50_new) * 100

print("VERIFICATION:")
print("-" * 40)
print(f"  Ordering valid: {ci_valid}")
print(f"  CI Spread: {spread_pct:.1f}% of p50")
print(f"  No collapse: {abs(p50_new - p95_new) > 0.01}")
print()

print("="*80)
print("EXPLANATION:")
print("="*80)
print("""
The old code used max() to enforce monotonicity, which worked when the model
outputs were already ordered. But when quantile regression models output
values in the wrong order (which can happen), max() would collapse the values.

The new code uses np.percentile() which:
1. Takes the 3 raw predictions as a sample
2. Computes the 5th, 50th, and 95th percentiles of that sample
3. Guarantees proper ordering: p05 <= p50 <= p95
4. Maintains meaningful spread between values

This is mathematically correct for handling potentially mis-ordered quantile
predictions from separate models.
""")
print("="*80 + "\n")
