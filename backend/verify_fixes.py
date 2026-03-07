"""
Quick verification script to check if the fixes are properly applied
"""

import sys
from pathlib import Path

def check_file_contains(filepath: Path, search_strings: list, description: str):
    """Check if file contains expected code patterns"""
    print(f"\n{description}")
    print("-" * 60)
    
    if not filepath.exists():
        print(f"  ✗ File not found: {filepath}")
        return False
    
    content = filepath.read_text()
    all_found = True
    
    for search_str in search_strings:
        if search_str in content:
            print(f"  ✓ Found: {search_str[:60]}...")
        else:
            print(f"  ✗ Missing: {search_str[:60]}...")
            all_found = False
    
    return all_found


def main():
    print("\n" + "="*80)
    print("VERIFYING CRITICAL FIXES IN CODE")
    print("="*80)
    
    base_dir = Path(__file__).parent
    
    # Fix 1: Check financial_model.py for CI fix
    fix1_checks = [
        "predictions = np.array([p05_raw, p50_raw, p95_raw])",
        "p05 = float(np.percentile(predictions, 5))",
        "p50 = float(np.percentile(predictions, 50))",
        "p95 = float(np.percentile(predictions, 95))",
    ]
    
    fix1_ok = check_file_contains(
        base_dir / "agents" / "financial_model.py",
        fix1_checks,
        "FIX 1: Confidence Interval Math (financial_model.py)"
    )
    
    # Fix 2: Check orchestrate.py for latency tracking
    fix2_checks = [
        "async def run_agent_with_timing(name: str, agent, input_data):",
        "start = time.time()",
        "latency = int((time.time() - start) * 1000)",
        "return name, result, latency",
    ]
    
    fix2_ok = check_file_contains(
        base_dir / "orchestrator" / "orchestrate.py",
        fix2_checks,
        "FIX 2: Individual Agent Latency Tracking (orchestrate.py)"
    )
    
    # Fix 3: Check for scaling documentation
    fix3_checks = [
        "# NOTE: All financial values (revenue, EBITDA) are expected in MILLIONS of USD",
        "self.logger.info(f\"Input revenue:",
        "self.logger.info(f\"{target} forecast:",
    ]
    
    fix3_ok = check_file_contains(
        base_dir / "agents" / "financial_model.py",
        fix3_checks,
        "FIX 3: Revenue Scaling Documentation (financial_model.py)"
    )
    
    # Summary
    print("\n" + "="*80)
    print("VERIFICATION SUMMARY")
    print("="*80)
    
    fixes = [
        ("Fix 1: CI Math", fix1_ok),
        ("Fix 2: Latency Tracking", fix2_ok),
        ("Fix 3: Scaling Docs", fix3_ok),
    ]
    
    for name, status in fixes:
        status_str = "✓ APPLIED" if status else "✗ MISSING"
        print(f"  {name:30s}: {status_str}")
    
    all_ok = all(status for _, status in fixes)
    print()
    print(f"  {'✓ ALL FIXES VERIFIED' if all_ok else '✗ SOME FIXES MISSING'}")
    print("="*80 + "\n")
    
    return all_ok


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
