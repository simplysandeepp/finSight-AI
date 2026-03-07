"""Check if backend server is logging the debug output"""
import subprocess
import sys

print("\nChecking if backend server is running and where logs are...")
print("="*80)

# Try to find running Python processes
try:
    result = subprocess.run(
        ["powershell", "-Command", "Get-Process python | Select-Object Id, ProcessName, Path"],
        capture_output=True,
        text=True
    )
    print(result.stdout)
except Exception as e:
    print(f"Could not check processes: {e}")

print("\nTo see the debug logs, check the terminal where you started the backend server")
print("The logs should show:")
print("  - DEBUG: FINNHUB DATA → FEATURES PIPELINE")
print("  - All available quarters from Finnhub")
print("  - Requested date vs Using quarter date")
print("="*80)
