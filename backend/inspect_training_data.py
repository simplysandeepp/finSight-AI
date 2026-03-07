"""
Inspect the training data to understand the scale and format
"""

import pickle
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).parent
FEATURES_PATH = BASE_DIR / "out" / "features_v1.pkl"

print("\n" + "="*80)
print("INSPECTING TRAINING DATA SCALE")
print("="*80 + "\n")

if not FEATURES_PATH.exists():
    print(f"❌ Training data not found at: {FEATURES_PATH}")
    print("   Run the feature store generation first!")
    exit(1)

# Load the training data
with open(FEATURES_PATH, 'rb') as f:
    data = pickle.load(f)

print("Available keys in pickle file:")
for key in data.keys():
    print(f"  - {key}")
print()

# Examine the training data
train_df = data['train']
val_df = data['val']
full_df = data.get('full_featured', pd.DataFrame())

print(f"Training set shape: {train_df.shape}")
print(f"Validation set shape: {val_df.shape}")
print(f"Full dataset shape: {full_df.shape if not full_df.empty else 'N/A'}")
print()

# Check revenue scale in training data
print("="*80)
print("REVENUE SCALE IN TRAINING DATA")
print("="*80)
print("\nRevenue statistics (training set):")
print(train_df['revenue'].describe())
print()

print("Sample revenue values from training data:")
print(train_df[['company_id', 'date', 'revenue', 'ebitda_margin']].head(10))
print()

# Check what features are available
print("="*80)
print("FEATURE COLUMNS IN TRAINING DATA")
print("="*80)
print("\nAll columns:")
for i, col in enumerate(train_df.columns, 1):
    print(f"  {i:2d}. {col}")
print()

# Check for any scaling artifacts
print("="*80)
print("CHECKING FOR SCALED TARGETS")
print("="*80)

# Look for any columns that might indicate scaling was applied
scaled_cols = [col for col in train_df.columns if 'scaled' in col.lower() or 'normalized' in col.lower()]
if scaled_cols:
    print(f"⚠️  Found potentially scaled columns: {scaled_cols}")
else:
    print("✓ No obvious scaled/normalized columns found")
print()

# Check if revenue values are in a reasonable range for "millions"
revenue_min = train_df['revenue'].min()
revenue_max = train_df['revenue'].max()
revenue_mean = train_df['revenue'].mean()

print(f"Revenue range: {revenue_min:.2f} to {revenue_max:.2f}")
print(f"Revenue mean: {revenue_mean:.2f}")
print()

if revenue_max < 1000:
    print("✓ Revenue values appear to be in MILLIONS (max < 1000)")
elif revenue_max > 1_000_000:
    print("⚠️  Revenue values appear to be in RAW DOLLARS (max > 1M)")
else:
    print("⚠️  Revenue scale is ambiguous (1000 < max < 1M)")
print()

# Check feature columns used by model
manifest_path = BASE_DIR / "out" / "feature_manifest.json"
if manifest_path.exists():
    import json
    with open(manifest_path, 'r') as f:
        manifest = json.load(f)
    print("="*80)
    print("MODEL FEATURE MANIFEST")
    print("="*80)
    print(f"\nFeatures used by model ({len(manifest['feature_list'])} total):")
    for i, feat in enumerate(manifest['feature_list'], 1):
        print(f"  {i:2d}. {feat}")
    print()

# Check if there's a scaler saved
scaler_path = BASE_DIR / "out" / "target_scaler.pkl"
if scaler_path.exists():
    print("="*80)
    print("⚠️  TARGET SCALER FOUND!")
    print("="*80)
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)
    print(f"Scaler type: {type(scaler)}")
    print(f"Scaler params: {scaler.get_params() if hasattr(scaler, 'get_params') else 'N/A'}")
    if hasattr(scaler, 'scale_'):
        print(f"Scale factor: {scaler.scale_}")
    if hasattr(scaler, 'mean_'):
        print(f"Mean: {scaler.mean_}")
    print("\n⚠️  YOU MUST APPLY inverse_transform() TO MODEL OUTPUTS!")
else:
    print("✓ No target scaler found - model outputs should be in original scale")

print("\n" + "="*80)
print("SUMMARY")
print("="*80)
print(f"""
Training data scale: {revenue_mean:.2f}M average revenue
Expected for Tesla: ~25,000M quarterly revenue
Scale ratio: {25000 / revenue_mean:.1f}x

If the model predicts ~400M for Tesla, it suggests:
1. Model was trained on small companies (~100-500M revenue)
2. Model is extrapolating poorly to large-cap companies
3. Need to retrain with diverse company sizes OR
4. Apply a market-cap-based scaling factor
""")
print("="*80 + "\n")
