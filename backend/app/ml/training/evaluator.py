"""
Evaluation Interface and Metrics Module.

Calculates approved flood classification metrics (ROC-AUC, Precision, Recall, F1,
Brier Score, Confusion Matrix) on dedicated evaluation partitions.
"""

from typing import Optional
import numpy as np
from pydantic import BaseModel, Field
from sklearn.metrics import roc_auc_score, brier_score_loss, confusion_matrix


class ConfusionMatrixDetails(BaseModel):
    """Detailed confusion matrix breakdown."""
    true_negatives: int = Field(..., description="Correctly predicted non-flood events")
    false_positives: int = Field(..., description="False flood alarms")
    false_negatives: int = Field(..., description="CRITICAL: Missed flood events")
    true_positives: int = Field(..., description="Correctly predicted flood events")


class EvaluationMetrics(BaseModel):
    """Complete evaluation metrics payload for a model partition."""
    partition_name: str = Field(..., description="Partition evaluated ('train', 'validation', 'test')")
    n_samples: int = Field(..., description="Total samples in partition")
    positive_samples: int = Field(..., description="Actual flood events in partition")
    negative_samples: int = Field(..., description="Actual non-flood events in partition")
    
    roc_auc: Optional[float] = Field(None, description="Receiver Operating Characteristic Area Under Curve")
    precision: float = Field(..., description="Positive Predictive Value TP / (TP + FP)")
    recall: float = Field(..., description="Sensitivity / Hit Rate TP / (TP + FN)")
    f1_score: float = Field(..., description="Harmonic mean of Precision and Recall")
    brier_score: float = Field(..., description="Probability calibration score Mean Squared Error")
    false_negative_rate: float = Field(..., description="Miss Rate FN / (TP + FN)")
    
    decision_threshold: float = Field(..., description="Classification threshold used")
    confusion_matrix: ConfusionMatrixDetails
    flood_safety_alert: bool = Field(
        False,
        description="True if missed flood events (FN > 0) violate safety threshold"
    )


class ModelEvaluationInterface:
    """Interface for evaluating model prediction probabilities against ground truth."""

    @staticmethod
    def evaluate(
        y_true: np.ndarray,
        y_prob: np.ndarray,
        threshold: float = 0.50,
        partition_name: str = "test"
    ) -> EvaluationMetrics:
        """
        Computes comprehensive evaluation metrics on a specified dataset partition.
        y_true: Ground truth binary targets (0 or 1).
        y_prob: Predicted flood probabilities for positive class (1).
        """
        if len(y_true) != len(y_prob):
            raise ValueError(f"Length mismatch: len(y_true)={len(y_true)} vs len(y_prob)={len(y_prob)}.")

        n_samples = len(y_true)
        if n_samples == 0:
            raise ValueError("Cannot evaluate empty partition.")

        pos_count = int(np.sum(y_true == 1))
        neg_count = int(np.sum(y_true == 0))

        y_pred = (y_prob >= threshold).astype(int)

        # Confusion Matrix
        if pos_count > 0 and neg_count > 0:
            tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
        elif pos_count == 0:
            # Only negative samples
            tn = int(np.sum(y_pred == 0))
            fp = int(np.sum(y_pred == 1))
            fn = 0
            tp = 0
        else:
            # Only positive samples
            tn = 0
            fp = 0
            fn = int(np.sum(y_pred == 0))
            tp = int(np.sum(y_pred == 1))

        # Precision, Recall, F1
        precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
        fn_rate = float(fn / (tp + fn)) if (tp + fn) > 0 else 0.0

        # ROC-AUC (Requires at least one positive and one negative sample)
        roc_auc_val: Optional[float] = None
        if pos_count > 0 and neg_count > 0:
            try:
                roc_auc_val = float(roc_auc_score(y_true, y_prob))
            except Exception:
                roc_auc_val = None

        # Brier Score (Well-calibrated probability score)
        brier_val = float(brier_score_loss(y_true, y_prob))

        # Safety Check: Flag if any flood events were missed
        safety_alert = fn > 0 or (pos_count > 0 and recall < 0.85)

        return EvaluationMetrics(
            partition_name=partition_name,
            n_samples=n_samples,
            positive_samples=pos_count,
            negative_samples=neg_count,
            roc_auc=roc_auc_val,
            precision=precision,
            recall=recall,
            f1_score=f1,
            brier_score=brier_val,
            false_negative_rate=fn_rate,
            decision_threshold=threshold,
            confusion_matrix=ConfusionMatrixDetails(
                true_negatives=int(tn),
                false_positives=int(fp),
                false_negatives=int(fn),
                true_positives=int(tp)
            ),
            flood_safety_alert=safety_alert
        )
