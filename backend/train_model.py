"""
ML Model Training Script for Refill Prediction.

This script trains a RandomForest model to predict when customers will refill prescriptions.
Run this offline to generate the .joblib model files.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_synthetic_data(n_samples: int = 1000) -> pd.DataFrame:
    """
    Generate synthetic training data for refill prediction.
    
    In production, replace this with actual historical data from database.
    """
    np.random.seed(42)
    
    data = {
        # Prescription features
        'days_supply': np.random.choice([30, 60, 90], n_samples),
        'quantity_prescribed': np.random.randint(30, 180, n_samples),
        'refills_remaining': np.random.randint(0, 12, n_samples),
        'refills_total': np.random.randint(1, 12, n_samples),
        
        # Temporal features
        'days_since_last_fill': np.random.randint(0, 90, n_samples),
        
        # Historical features
        'avg_refill_interval': np.random.normal(30, 10, n_samples),
        'refill_count': np.random.randint(0, 20, n_samples),
        'std_refill_interval': np.random.uniform(0, 15, n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Generate target: days until next refill
    # Rule: mostly based on days_supply, with some variation based on history
    df['target_days_until_refill'] = (
        df['days_supply'] * 0.8 +  # People refill ~80% through supply
        df['avg_refill_interval'] * 0.2 +  # Historical pattern
        np.random.normal(0, 3, n_samples)  # Random variation
    )
    
    df['target_days_until_refill'] = df['target_days_until_refill'].clip(lower=1)
    
    return df


def train_model():
    """Train and save the refill prediction model."""
    logger.info("Starting model training...")
    
    # Generate or load data
    logger.info("Loading training data...")
    df = generate_synthetic_data(n_samples=5000)
    
    # Split features and target
    feature_columns = [
        'days_supply',
        'quantity_prescribed',
        'refills_remaining',
        'days_since_last_fill',
        'avg_refill_interval',
        'refill_count',
        'std_refill_interval'
    ]
    
    X = df[feature_columns]
    y = df['target_days_until_refill']
    
    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    logger.info(f"Training set: {len(X_train)} samples")
    logger.info(f"Test set: {len(X_test)} samples")
    
    # Feature scaling
    logger.info("Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    logger.info("Training RandomForest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    train_pred = model.predict(X_train_scaled)
    test_pred = model.predict(X_test_scaled)
    
    train_mae = mean_absolute_error(y_train, train_pred)
    test_mae = mean_absolute_error(y_test, test_pred)
    train_r2 = r2_score(y_train, train_pred)
    test_r2 = r2_score(y_test, test_pred)
    
    logger.info("=" * 60)
    logger.info("Model Performance:")
    logger.info(f"  Train MAE: {train_mae:.2f} days")
    logger.info(f"  Test MAE:  {test_mae:.2f} days")
    logger.info(f"  Train R²:  {train_r2:.4f}")
    logger.info(f"  Test R²:   {test_r2:.4f}")
    logger.info("=" * 60)
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    logger.info("Feature Importance:")
    for _, row in feature_importance.iterrows():
        logger.info(f"  {row['feature']}: {row['importance']:.4f}")
    
    # Save model and scaler
    model_dir = Path("models/ml")
    model_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = model_dir / "refill_predictor.joblib"
    scaler_path = model_dir / "scaler.joblib"
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    logger.info(f"✓ Model saved to: {model_path}")
    logger.info(f"✓ Scaler saved to: {scaler_path}")
    logger.info("Training complete!")


if __name__ == "__main__":
    train_model()
