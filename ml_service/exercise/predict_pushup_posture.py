import os
import math
import joblib
import pandas as pd


MODEL_PATH = "../../models/pushup_model.pkl"


# MediaPipe landmark indexes
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16

LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_ANKLE = 27
RIGHT_ANKLE = 28


def calculate_angle(a, b, c):
    """
    Calculates angle ABC in degrees.
    b is the middle point.
    """
    angle = math.degrees(
        math.atan2(c.y - b.y, c.x - b.x)
        - math.atan2(a.y - b.y, a.x - b.x)
    )

    angle = abs(angle)

    if angle > 180:
        angle = 360 - angle

    return angle


def get_body_alignment_angle(shoulder, hip, ankle):
    """
    Shoulder-Hip-Ankle angle.
    Higher value usually means straighter body alignment.
    """
    return calculate_angle(shoulder, hip, ankle)


def get_confidence_level(confidence):
    if confidence is None:
        return "Unknown"

    if confidence >= 0.70:
        return "High"

    if confidence >= 0.50:
        return "Medium"

    return "Low"


class PushupPosturePredictor:
    """
    ML predictor for push-up posture classification.
    Uses trained Random Forest model: pushup_model.pkl
    """

    def __init__(self, model_path=MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.feature_columns = None
        self.metrics = None

        self.load_model()

    def load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Push-up model not found: {self.model_path}")

        package = joblib.load(self.model_path)

        self.model = package["model"]
        self.feature_columns = package["feature_columns"]
        self.metrics = package.get("metrics", None)

        print("Push-up posture prediction model loaded successfully.")
        print("Model path:", self.model_path)

        if self.metrics:
            print("Saved push-up model metrics:", self.metrics)

    def extract_features(self, landmarks):
        left_elbow_angle = calculate_angle(
            landmarks[LEFT_SHOULDER],
            landmarks[LEFT_ELBOW],
            landmarks[LEFT_WRIST]
        )

        right_elbow_angle = calculate_angle(
            landmarks[RIGHT_SHOULDER],
            landmarks[RIGHT_ELBOW],
            landmarks[RIGHT_WRIST]
        )

        avg_elbow_angle = (left_elbow_angle + right_elbow_angle) / 2

        left_body_alignment = get_body_alignment_angle(
            landmarks[LEFT_SHOULDER],
            landmarks[LEFT_HIP],
            landmarks[LEFT_ANKLE]
        )

        right_body_alignment = get_body_alignment_angle(
            landmarks[RIGHT_SHOULDER],
            landmarks[RIGHT_HIP],
            landmarks[RIGHT_ANKLE]
        )

        avg_body_alignment = (left_body_alignment + right_body_alignment) / 2

        shoulder_width = abs(
            landmarks[LEFT_SHOULDER].x - landmarks[RIGHT_SHOULDER].x
        )

        wrist_width = abs(
            landmarks[LEFT_WRIST].x - landmarks[RIGHT_WRIST].x
        )

        hip_width = abs(
            landmarks[LEFT_HIP].x - landmarks[RIGHT_HIP].x
        )

        ankle_width = abs(
            landmarks[LEFT_ANKLE].x - landmarks[RIGHT_ANKLE].x
        )

        hip_drop = abs(
            ((landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2)
            - ((landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2)
        )

        return {
            "left_elbow_angle": left_elbow_angle,
            "right_elbow_angle": right_elbow_angle,
            "avg_elbow_angle": avg_elbow_angle,
            "left_body_alignment": left_body_alignment,
            "right_body_alignment": right_body_alignment,
            "avg_body_alignment": avg_body_alignment,
            "shoulder_width": shoulder_width,
            "wrist_width": wrist_width,
            "hip_width": hip_width,
            "ankle_width": ankle_width,
            "hip_drop": hip_drop
        }

    def predict(self, landmarks):
        features = self.extract_features(landmarks)

        input_values = []

        for col in self.feature_columns:
            input_values.append(features.get(col, 0))

        input_df = pd.DataFrame(
            [input_values],
            columns=self.feature_columns
        )

        predicted_label = self.model.predict(input_df)[0]

        confidence = None
        probabilities = {}

        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba(input_df)[0]
            confidence = float(max(proba))

            for class_label, prob in zip(self.model.classes_, proba):
                probabilities[str(class_label)] = round(float(prob), 4)

        confidence = round(confidence, 4) if confidence is not None else None

        return {
            "ml_label": predicted_label,
            "ml_confidence": confidence,
            "confidence_level": get_confidence_level(confidence),
            "probabilities": probabilities,
            "features": features
        }