"""
ML Service for refill prediction using scikit-learn.
Predicts when customer will need to refill their prescription.
"""

import joblib
import numpy as np
from datetime import date, timedelta
from pathlib import Path
from typing import Optional
from models.schemas import RefillPrediction, Prescription
from core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


class MLService:
    """Service for machine learning predictions."""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self._load_models()
    
    def _load_models(self):
        """Load trained ML models from disk."""
        try:
            model_path = Path(settings.ml_model_path)
            scaler_path = Path(settings.ml_scaler_path)
            
            if model_path.exists():
                self.model = joblib.load(model_path)
                logger.info(f"Loaded ML model from {model_path}")
            else:
                logger.warning(f"ML model not found at {model_path}. Predictions will use fallback.")
            
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                logger.info(f"Loaded scaler from {scaler_path}")
            
        except Exception as e:
            logger.error(f"Error loading ML models: {e}")
    
    def predict_refill_date(
        self,
        prescription: Prescription,
        order_history: Optional[list] = None
    ) -> RefillPrediction:
        """
        Predict when customer will need to refill prescription.
        
        Features used:
        - days_since_last_fill
        - days_supply
        - refills_remaining
        - quantity_prescribed
        - avg_refill_interval (from history)
        - refill_count (from history)
        
        Args:
            prescription: Prescription to predict refill for
            order_history: Historical order data for this prescription
        
        Returns:
            RefillPrediction with predicted date and confidence
        """
        try:
            # Extract features
            features = self._extract_features(prescription, order_history)
            
            # Use ML model if available, otherwise use rule-based fallback
            if self.model is not None and self.scaler is not None:
                predicted_days, confidence = self._predict_with_model(features)
            else:
                predicted_days, confidence = self._predict_fallback(prescription, features)
            
            # Calculate predicted date
            reference_date = prescription.last_filled_date or date.today()
            predicted_refill_date = reference_date + timedelta(days=int(predicted_days))
            
            # Calculate days supply remaining
            days_supply_remaining = self._calculate_days_remaining(
                prescription, reference_date
            )
            
            return RefillPrediction(
                prescription_id=prescription.id,
                predicted_refill_date=predicted_refill_date,
                confidence_score=float(confidence),
                days_supply_remaining=days_supply_remaining,
                features_used=features
            )
        
        except Exception as e:
            logger.error(f"Error in refill prediction: {e}")
            # Return conservative estimate
            return RefillPrediction(
                prescription_id=prescription.id,
                predicted_refill_date=date.today() + timedelta(days=prescription.days_supply),
                confidence_score=0.5,
                days_supply_remaining=prescription.days_supply,
                features_used={}
            )
    
    def _extract_features(
        self,
        prescription: Prescription,
        order_history: Optional[list]
    ) -> dict:
        """Extract features for ML model."""
        features = {}
        
        # Basic prescription features
        features['days_supply'] = prescription.days_supply
        features['quantity_prescribed'] = prescription.quantity_prescribed
        features['refills_remaining'] = prescription.refills_remaining
        features['refills_total'] = prescription.refills_total
        
        # Time-based features
        if prescription.last_filled_date:
            days_since_last_fill = (date.today() - prescription.last_filled_date).days
            features['days_since_last_fill'] = days_since_last_fill
        else:
            features['days_since_last_fill'] = 0
        
        # Historical features
        if order_history and len(order_history) > 1:
            # Calculate average refill interval
            intervals = []
            for i in range(1, len(order_history)):
                prev_date = order_history[i-1].get('filled_date')
                curr_date = order_history[i].get('filled_date')
                if prev_date and curr_date:
                    interval = (curr_date - prev_date).days
                    intervals.append(interval)
            
            if intervals:
                features['avg_refill_interval'] = np.mean(intervals)
                features['std_refill_interval'] = np.std(intervals) if len(intervals) > 1 else 0
            else:
                features['avg_refill_interval'] = prescription.days_supply
                features['std_refill_interval'] = 0
            
            features['refill_count'] = len(order_history)
        else:
            features['avg_refill_interval'] = prescription.days_supply
            features['std_refill_interval'] = 0
            features['refill_count'] = 0
        
        return features
    
    def _predict_with_model(self, features: dict) -> tuple[float, float]:
        """Make prediction using trained ML model."""
        # Prepare feature vector (must match training order)
        feature_vector = np.array([[
            features.get('days_supply', 30),
            features.get('quantity_prescribed', 30),
            features.get('refills_remaining', 0),
            features.get('days_since_last_fill', 0),
            features.get('avg_refill_interval', 30),
            features.get('refill_count', 0),
            features.get('std_refill_interval', 0)
        ]])
        
        # Scale features
        if self.scaler:
            feature_vector = self.scaler.transform(feature_vector)
        
        # Predict
        predicted_days = self.model.predict(feature_vector)[0]
        
        # Get confidence (if model supports predict_proba or has feature importance)
        confidence = 0.85  # Default confidence
        
        return predicted_days, confidence
    
    def _predict_fallback(
        self,
        prescription: Prescription,
        features: dict
    ) -> tuple[float, float]:
        """
        Rule-based fallback when ML model not available.
        Uses historical average or days_supply as baseline.
        """
        # If we have historical data, use average interval
        if features.get('avg_refill_interval', 0) > 0:
            predicted_days = features['avg_refill_interval']
            confidence = 0.7
        else:
            # Use prescribed days supply minus a few days (people refill early)
            predicted_days = max(prescription.days_supply - 5, prescription.days_supply * 0.8)
            confidence = 0.6
        
        return predicted_days, confidence
    
    def _calculate_days_remaining(
        self,
        prescription: Prescription,
        reference_date: date
    ) -> int:
        """Calculate days of medication supply remaining."""
        if prescription.last_filled_date:
            days_elapsed = (date.today() - prescription.last_filled_date).days
            days_remaining = prescription.days_supply - days_elapsed
            return max(0, days_remaining)
        else:
            return prescription.days_supply
