import os
import math
import joblib
import pandas as pd


MODEL_PATH = "../../models/squat_model.pkl"


# If you retrained after removing "frame", keep frame OUT of this list.
SQUAT_FEATURE_COLUMNS = [
    "left_knee_angle",
    "right_knee_angle",
    "left_hip_angle",
    "right_hip_angle",
    "left_ankle_angle",
    "right_ankle_angle",
    "spine_angle",
    "torso_lean",
    "left_knee_lateral",
    "right_knee_lateral",
    "symmetry_score",
    "hip_depth"
]


# MediaPipe landmark indexes
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12

LEFT_HIP = 23
RIGHT_HIP = 24

LEFT_KNEE = 25
RIGHT_KNEE = 26

LEFT_ANKLE = 27
RIGHT_ANKLE = 28

LEFT_FOOT_INDEX = 31
RIGHT_FOOT_INDEX = 32


class Point:
    def __init__(self, x=0.0, y=0.0, z=0.0):
        self.x = x
        self.y = y
        self.z = z


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


def midpoint(a, b):
    return Point(
        x=(a.x + b.x) / 2,
        y=(a.y + b.y) / 2,
        z=(a.z + b.z) / 2
    )


def calculate_vertical_angle(top_point, bottom_point):
    """
    Calculates torso lean relative to vertical direction.
    Smaller value means more upright.
    """
    dx = top_point.x - bottom_point.x
    dy = top_point.y - bottom_point.y

    angle = abs(math.degrees(math.atan2(dx, dy)))
    return angle


def get_confidence_level(confidence):
    if confidence is None:
        return "Unknown"

    if confidence >= 0.70:
        return "High"

    if confidence >= 0.50:
        return "Medium"

    return "Low"


class SquatPosturePredictor:
    """
    ML predictor for squat posture classification.
    Uses trained Random Forest model: squat_model.pkl
    """

    def __init__(self, model_path=MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.load_model()

    def load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Squat model not found: {self.model_path}")

        self.model = joblib.load(self.model_path)

        print("Squat posture prediction model loaded successfully.")
        print("Model path:", self.model_path)

    def extract_features(self, landmarks):
        left_shoulder = landmarks[LEFT_SHOULDER]
        right_shoulder = landmarks[RIGHT_SHOULDER]

        left_hip = landmarks[LEFT_HIP]
        right_hip = landmarks[RIGHT_HIP]

        left_knee = landmarks[LEFT_KNEE]
        right_knee = landmarks[RIGHT_KNEE]

        left_ankle = landmarks[LEFT_ANKLE]
        right_ankle = landmarks[RIGHT_ANKLE]

        left_foot = landmarks[LEFT_FOOT_INDEX]
        right_foot = landmarks[RIGHT_FOOT_INDEX]

        shoulder_mid = midpoint(left_shoulder, right_shoulder)
        hip_mid = midpoint(left_hip, right_hip)
        knee_mid = midpoint(left_knee, right_knee)

        left_knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
        right_knee_angle = calculate_angle(right_hip, right_knee, right_ankle)

        left_hip_angle = calculate_angle(left_shoulder, left_hip, left_knee)
        right_hip_angle = calculate_angle(right_shoulder, right_hip, right_knee)

        left_ankle_angle = calculate_angle(left_knee, left_ankle, left_foot)
        right_ankle_angle = calculate_angle(right_knee, right_ankle, right_foot)

        spine_angle = calculate_angle(shoulder_mid, hip_mid, knee_mid)
        torso_lean = calculate_vertical_angle(shoulder_mid, hip_mid)

        left_knee_lateral = abs(left_knee.x - left_ankle.x)
        right_knee_lateral = abs(right_knee.x - right_ankle.x)

        symmetry_score = abs(left_knee_angle - right_knee_angle)

        # MediaPipe y coordinate: larger y means lower in the frame
        hip_depth = hip_mid.y - knee_mid.y

        return {
            "left_knee_angle": left_knee_angle,
            "right_knee_angle": right_knee_angle,
            "left_hip_angle": left_hip_angle,
            "right_hip_angle": right_hip_angle,
            "left_ankle_angle": left_ankle_angle,
            "right_ankle_angle": right_ankle_angle,
            "spine_angle": spine_angle,
            "torso_lean": torso_lean,
            "left_knee_lateral": left_knee_lateral,
            "right_knee_lateral": right_knee_lateral,
            "symmetry_score": symmetry_score,
            "hip_depth": hip_depth
        }

    def predict(self, landmarks):
        features = self.extract_features(landmarks)

        input_df = pd.DataFrame(
            [[features[col] for col in SQUAT_FEATURE_COLUMNS]],
            columns=SQUAT_FEATURE_COLUMNS
        )

        predicted_class = self.model.predict(input_df)[0]

        confidence = None
        probabilities = {}

        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba(input_df)[0]
            confidence = float(max(proba))

            for class_label, prob in zip(self.model.classes_, proba):
                probabilities[str(class_label)] = round(float(prob), 4)

        confidence = round(confidence, 4) if confidence is not None else None

        return {
            "ml_class": int(predicted_class) if str(predicted_class).isdigit() else predicted_class,
            "ml_confidence": confidence,
            "confidence_level": get_confidence_level(confidence),
            "probabilities": probabilities,
            "features": features
        }