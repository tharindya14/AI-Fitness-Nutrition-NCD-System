import os
import math
import joblib
import pandas as pd


MODEL_PATH = "../../models/exercise_classifier_v2_model.pkl"

# Training dataset coordinates are in a larger numeric scale.
# Live MediaPipe landmarks usually come in normalized 0-1 values.
# This scale factor helps match live features closer to the training feature scale.
COORDINATE_SCALE = 100.0


# MediaPipe landmark indexes
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16

LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28


class Point:
    """
    Simple point object for x, y, z coordinates.
    """
    def __init__(self, x=0.0, y=0.0, z=0.0):
        self.x = x
        self.y = y
        self.z = z


def scale_landmark(point):
    """
    Convert MediaPipe normalized landmark coordinates into a larger scale
    closer to the training dataset coordinate scale.
    """
    return Point(
        x=point.x * COORDINATE_SCALE,
        y=point.y * COORDINATE_SCALE,
        z=point.z * COORDINATE_SCALE
    )


def calculate_angle(a, b, c):
    """
    Calculates angle ABC in degrees.
    b is the middle point.
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


def midpoint(a, b):
    return Point(
        x=(a.x + b.x) / 2,
        y=(a.y + b.y) / 2,
        z=(a.z + b.z) / 2
    )


def avg_point(a, b):
    return midpoint(a, b)


def xyz_difference(a, b):
    return {
        "x": a.x - b.x,
        "y": a.y - b.y,
        "z": a.z - b.z
    }


def distance_3d(a, b):
    return math.sqrt(
        (a.x - b.x) ** 2
        + (a.y - b.y) ** 2
        + (a.z - b.z) ** 2
    )


class ExerciseClassifierPredictor:
    """
    Loads exercise_classifier_v2_model.pkl and predicts exercise type
    using live MediaPipe landmarks.

    Supported trained classes:
    jumping_jack, pull_up, push_up, situp, squat
    """

    def __init__(self, model_path=MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.feature_columns = None
        self.label_encoder = None
        self.metrics = None

        self.load_model()

    def load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Exercise classifier model not found: {self.model_path}"
            )

        package = joblib.load(self.model_path)

        self.model = package["model"]
        self.feature_columns = package["feature_columns"]
        self.label_encoder = package["label_encoder"]
        self.metrics = package.get("metrics", None)

        print("Exercise classifier model loaded successfully.")
        print("Model path:", self.model_path)

        if self.metrics:
            print("Saved model metrics:", self.metrics)

        print("Classes:", list(self.label_encoder.classes_))

    def extract_features(self, landmarks):
        """
        Extract features matching train_exercise_classifier_v2.py.

        Includes:
        1. Angle features
        2. XYZ distance features
        3. 3D distance features
        """

        # Scale live MediaPipe landmarks to better match training dataset scale
        left_shoulder = scale_landmark(landmarks[LEFT_SHOULDER])
        right_shoulder = scale_landmark(landmarks[RIGHT_SHOULDER])

        left_elbow = scale_landmark(landmarks[LEFT_ELBOW])
        right_elbow = scale_landmark(landmarks[RIGHT_ELBOW])

        left_wrist = scale_landmark(landmarks[LEFT_WRIST])
        right_wrist = scale_landmark(landmarks[RIGHT_WRIST])

        left_hip = scale_landmark(landmarks[LEFT_HIP])
        right_hip = scale_landmark(landmarks[RIGHT_HIP])

        left_knee = scale_landmark(landmarks[LEFT_KNEE])
        right_knee = scale_landmark(landmarks[RIGHT_KNEE])

        left_ankle = scale_landmark(landmarks[LEFT_ANKLE])
        right_ankle = scale_landmark(landmarks[RIGHT_ANKLE])

        mid_hip = midpoint(left_hip, right_hip)

        left_hip_avg_left_wrist_left_ankle = avg_point(
            left_wrist,
            left_ankle
        )

        right_hip_avg_right_wrist_right_ankle = avg_point(
            right_wrist,
            right_ankle
        )

        features = {}

        # -------------------------------------------------
        # 1. Angle features from angles.csv
        # -------------------------------------------------
        features["right_elbow_right_shoulder_right_hip"] = calculate_angle(
            right_elbow,
            right_shoulder,
            right_hip
        )

        features["left_elbow_left_shoulder_left_hip"] = calculate_angle(
            left_elbow,
            left_shoulder,
            left_hip
        )

        features["right_knee_mid_hip_left_knee"] = calculate_angle(
            right_knee,
            mid_hip,
            left_knee
        )

        features["right_hip_right_knee_right_ankle"] = calculate_angle(
            right_hip,
            right_knee,
            right_ankle
        )

        features["left_hip_left_knee_left_ankle"] = calculate_angle(
            left_hip,
            left_knee,
            left_ankle
        )

        features["right_wrist_right_elbow_right_shoulder"] = calculate_angle(
            right_wrist,
            right_elbow,
            right_shoulder
        )

        features["left_wrist_left_elbow_left_shoulder"] = calculate_angle(
            left_wrist,
            left_elbow,
            left_shoulder
        )

        # -------------------------------------------------
        # 2. XYZ difference features from xyz_distances.csv
        # -------------------------------------------------
        xyz_pairs = {
            "left_shoulder_left_wrist": (left_shoulder, left_wrist),
            "right_shoulder_right_wrist": (right_shoulder, right_wrist),

            "left_hip_left_ankle": (left_hip, left_ankle),
            "right_hip_right_ankle": (right_hip, right_ankle),

            "left_hip_left_wrist": (left_hip, left_wrist),
            "right_hip_right_wrist": (right_hip, right_wrist),

            "left_shoulder_left_ankle": (left_shoulder, left_ankle),
            "right_shoulder_right_ankle": (right_shoulder, right_ankle),

            "left_hip_right_wrist": (left_hip, right_wrist),
            "right_hip_left_wrist": (right_hip, left_wrist),

            "left_elbow_right_elbow": (left_elbow, right_elbow),
            "left_knee_right_knee": (left_knee, right_knee),
            "left_wrist_right_wrist": (left_wrist, right_wrist),
            "left_ankle_right_ankle": (left_ankle, right_ankle),

            "left_hip_avg_left_wrist_left_ankle": (
                left_hip,
                left_hip_avg_left_wrist_left_ankle
            ),

            "right_hip_avg_right_wrist_right_ankle": (
                right_hip,
                right_hip_avg_right_wrist_right_ankle
            )
        }

        for name, pair in xyz_pairs.items():
            diff = xyz_difference(pair[0], pair[1])
            features[f"x_{name}"] = diff["x"]
            features[f"y_{name}"] = diff["y"]
            features[f"z_{name}"] = diff["z"]

        # -------------------------------------------------
        # 3. 3D distance features from calculated_3d_distances.csv
        # -------------------------------------------------
        distance_pairs = {
            "left_shoulder_left_wrist": (left_shoulder, left_wrist),
            "right_shoulder_right_wrist": (right_shoulder, right_wrist),

            "left_hip_left_ankle": (left_hip, left_ankle),
            "right_hip_right_ankle": (right_hip, right_ankle),

            "left_hip_left_wrist": (left_hip, left_wrist),
            "right_hip_right_wrist": (right_hip, right_wrist),

            "left_shoulder_left_ankle": (left_shoulder, left_ankle),
            "right_shoulder_right_ankle": (right_shoulder, right_ankle),

            "left_hip_right_wrist": (left_hip, right_wrist),
            "right_hip_left_wrist": (right_hip, left_wrist),

            "left_elbow_right_elbow": (left_elbow, right_elbow),
            "left_knee_right_knee": (left_knee, right_knee),
            "left_wrist_right_wrist": (left_wrist, right_wrist),
            "left_ankle_right_ankle": (left_ankle, right_ankle),

            "left_hip_avg_left_wrist_left_ankle": (
                left_hip,
                left_hip_avg_left_wrist_left_ankle
            ),

            "right_hip_avg_right_wrist_right_ankle": (
                right_hip,
                right_hip_avg_right_wrist_right_ankle
            )
        }

        for name, pair in distance_pairs.items():
            features[name] = distance_3d(pair[0], pair[1])

        return features

    def predict(self, landmarks):
        """
        Predict exercise type from live MediaPipe landmarks.
        """

        features = self.extract_features(landmarks)

        input_values = []

        # Use exact feature order saved during training
        for col in self.feature_columns:
            input_values.append(features.get(col, 0))

        input_df = pd.DataFrame(
            [input_values],
            columns=self.feature_columns
        )

        predicted_encoded = self.model.predict(input_df)[0]

        predicted_class = self.label_encoder.inverse_transform(
            [predicted_encoded]
        )[0]

        confidence = None
        probabilities = {}

        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba(input_df)[0]
            confidence = float(max(proba))

            for encoded_class, prob in zip(self.model.classes_, proba):
                class_name = self.label_encoder.inverse_transform(
                    [encoded_class]
                )[0]

                probabilities[class_name] = round(float(prob), 4)

        return {
            "predicted_exercise": predicted_class,
            "confidence": round(confidence, 4) if confidence is not None else None,
            "probabilities": probabilities
        }