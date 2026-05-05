import os
import math
import joblib
import pandas as pd


MODEL_PATH = "../../models/squat_model.pkl"


# Same feature columns used during training
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
    "hip_depth",
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
LEFT_HEEL = 29
RIGHT_HEEL = 30
LEFT_FOOT_INDEX = 31
RIGHT_FOOT_INDEX = 32


def calculate_angle(a, b, c):
    """
    Calculates angle ABC in degrees.
    b is the center point.
    """
    ax, ay = a.x, a.y
    bx, by = b.x, b.y
    cx, cy = c.x, c.y

    angle = math.degrees(
        math.atan2(cy - by, cx - bx)
        - math.atan2(ay - by, ax - bx)
    )

    angle = abs(angle)

    if angle > 180:
        angle = 360 - angle

    return angle


def midpoint(point_a, point_b):
    """
    Creates a simple midpoint object with x and y.
    """
    class Point:
        pass

    p = Point()
    p.x = (point_a.x + point_b.x) / 2
    p.y = (point_a.y + point_b.y) / 2
    return p


def calculate_vertical_angle(top_point, bottom_point):
    """
    Calculates torso/spine lean angle relative to vertical direction.
    Smaller value = more vertical.
    """
    dx = top_point.x - bottom_point.x
    dy = top_point.y - bottom_point.y

    angle = abs(math.degrees(math.atan2(dx, dy)))
    return angle


def safe_abs(value):
    return abs(value)


class SquatMLPredictor:
    """
    Loads trained squat_model.pkl and predicts squat posture class.
    """

    def __init__(self, model_path=MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.load_model()

    def load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Squat model not found: {self.model_path}")

        self.model = joblib.load(self.model_path)
        print("Squat ML model loaded successfully.")
        print("Model path:", self.model_path)

    def extract_features(self, landmarks, frame_index=0):
        """
        Extracts squat features from MediaPipe pose landmarks.
        These feature names match the trained dataset columns.
        """

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

        left_knee_lateral = safe_abs(left_knee.x - left_ankle.x)
        right_knee_lateral = safe_abs(right_knee.x - right_ankle.x)

        symmetry_score = safe_abs(left_knee_angle - right_knee_angle)

        # Hip depth: how low the hip is compared to knee level.
        # In MediaPipe image coordinates, larger y means lower in the image.
        hip_depth = hip_mid.y - knee_mid.y

        features = {
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
            "hip_depth": hip_depth,
        }

        return features

    def predict(self, landmarks, frame_index=0):
        """
        Returns ML prediction result.
        """

        features = self.extract_features(landmarks, frame_index)

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

        return {
            "predicted_class": int(predicted_class) if str(predicted_class).isdigit() else predicted_class,
            "confidence": round(confidence, 4) if confidence is not None else None,
            "probabilities": probabilities,
            "features": features
        }