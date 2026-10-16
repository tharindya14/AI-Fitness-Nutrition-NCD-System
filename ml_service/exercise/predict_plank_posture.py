import os
import joblib
import pandas as pd


MODEL_PATH = "../../models/plank_model.pkl"


# Plank dataset landmark columns used by trained model
LANDMARK_NAMES = [
    "nose",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
    "left_heel",
    "right_heel",
    "left_foot_index",
    "right_foot_index",
]


# MediaPipe landmark indexes
LANDMARK_INDEXES = {
    "nose": 0,
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16,
    "left_hip": 23,
    "right_hip": 24,
    "left_knee": 25,
    "right_knee": 26,
    "left_ankle": 27,
    "right_ankle": 28,
    "left_heel": 29,
    "right_heel": 30,
    "left_foot_index": 31,
    "right_foot_index": 32,
}


def get_confidence_level(confidence):
    if confidence is None:
        return "Unknown"

    if confidence >= 0.70:
        return "High"

    if confidence >= 0.50:
        return "Medium"

    return "Low"


class PlankPosturePredictor:
    """
    ML predictor for plank posture classification.
    Uses trained Random Forest model: plank_model.pkl

    Current trained labels:
    - correct
    - hips_too_high
    - hips_too_low
    """

    def __init__(self, model_path=MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.feature_columns = None
        self.metrics = None

        self.load_model()

    def load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Plank model not found: {self.model_path}")

        package = joblib.load(self.model_path)

        self.model = package["model"]
        self.feature_columns = package["feature_columns"]
        self.metrics = package.get("metrics", None)

        print("Plank posture prediction model loaded successfully.")
        print("Model path:", self.model_path)

        if self.metrics:
            print("Saved plank model metrics:", self.metrics)

    def extract_features(self, landmarks):
        """
        Extract the exact landmark coordinate features used during training.
        Columns must match train.csv / test.csv:
        nose_x, nose_y, nose_z, nose_v, ...
        """

        features = {}

        for name in LANDMARK_NAMES:
            landmark_index = LANDMARK_INDEXES[name]
            landmark = landmarks[landmark_index]

            features[f"{name}_x"] = landmark.x
            features[f"{name}_y"] = landmark.y
            features[f"{name}_z"] = landmark.z

            visibility = getattr(landmark, "visibility", 1.0)
            features[f"{name}_v"] = visibility

        return features

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