import os
import tempfile
from collections import Counter

import cv2
import numpy as np
import mediapipe as mp
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from posture_engine import analyze_posture
from rep_counter import create_counter

from predict_squat_posture import SquatPosturePredictor
from predict_pushup_posture import PushupPosturePredictor
from predict_bicep_curl_posture import BicepCurlPosturePredictor
from predict_lunge_posture import LungePosturePredictor
from predict_plank_posture import PlankPosturePredictor
from exercise_classifier_predictor import ExerciseClassifierPredictor


MODEL_PATH = "../../models/pose_landmarker_lite.task"

SUPPORTED_EXERCISES = [
    "squat",
    "pushup",
    "bicep_curl",
    "lunge",
    "plank",
    "jumping_jack",
    "situp",
]


app = FastAPI(
    title="FITSHIELD Exercise Posture Analysis API",
    description="ML + rule-based exercise posture analysis service",
    version="1.0.0",
)

exercise_classifier_model = None


def get_exercise_classifier():
    global exercise_classifier_model

    if exercise_classifier_model is None:
        exercise_classifier_model = ExerciseClassifierPredictor()

    return exercise_classifier_model


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------
# Pose detector
# -------------------------------

def create_pose_detector():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Pose model not found: {MODEL_PATH}")

    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)

    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    return vision.PoseLandmarker.create_from_options(options)


def create_image_pose_detector():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Pose model not found: {MODEL_PATH}")

    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)

    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.IMAGE,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    return vision.PoseLandmarker.create_from_options(options)


# -------------------------------
# ML predictor loader
# -------------------------------

def get_ml_predictor(exercise_name):
    """
    Returns ML predictor only for exercises that currently have trained models.
    Sit-up and jumping jack use rule-based analysis only.
    """

    if exercise_name == "squat":
        return SquatPosturePredictor()

    if exercise_name == "pushup":
        return PushupPosturePredictor()

    if exercise_name == "bicep_curl":
        return BicepCurlPosturePredictor()

    if exercise_name == "lunge":
        return LungePosturePredictor()

    if exercise_name == "plank":
        return PlankPosturePredictor()

    return None


def normalize_ml_result(exercise_name, ml_result):
    """
    Converts different predictor outputs into one common API format.
    """

    if ml_result is None:
        return None

    if exercise_name == "squat":
        return {
            "ml_type": "squat_posture_class",
            "label": str(ml_result.get("ml_class")),
            "confidence": ml_result.get("ml_confidence"),
            "confidence_level": ml_result.get("confidence_level"),
            "probabilities": ml_result.get("probabilities", {}),
        }

    return {
        "ml_type": f"{exercise_name}_posture_label",
        "label": ml_result.get("ml_label"),
        "confidence": ml_result.get("ml_confidence"),
        "confidence_level": ml_result.get("confidence_level"),
        "probabilities": ml_result.get("probabilities", {}),
    }


# -------------------------------
# Exercise classifier helpers
# -------------------------------

def normalize_exercise_name(name):
    if name is None:
        return None

    name = str(name).lower().strip()

    mapping = {
        "push_up": "pushup",
        "push-up": "pushup",
        "pushup": "pushup",
        "squat": "squat",
        "situp": "situp",
        "sit_up": "situp",
        "jumping_jack": "jumping_jack",
        "jumping jack": "jumping_jack",
        "pull_up": "pull_up",
        "pullup": "pull_up",
    }

    return mapping.get(name, name)


def get_classifier_mismatch_result(selected_exercise, pose_landmarks):
    """
    Uses trained exercise classifier to detect possible selected-exercise mismatch.

    Supported classifier classes:
    jumping_jack, pull_up, push_up, situp, squat

    If confidence is low, do not block normal analysis.
    """

    classifier_supported_exercises = [
        "squat",
        "pushup",
        "situp",
        "jumping_jack",
    ]

    if selected_exercise not in classifier_supported_exercises:
        return {
            "checked": False,
            "mismatch": False,
            "reason": "selected exercise not supported by exercise classifier",
            "predicted_exercise": None,
            "confidence": None,
        }

    try:
        classifier = get_exercise_classifier()
        result = classifier.predict(pose_landmarks)

        predicted_raw = result.get("predicted_exercise")
        confidence = result.get("confidence")

        predicted_exercise = normalize_exercise_name(predicted_raw)
        selected_normalized = normalize_exercise_name(selected_exercise)

        if confidence is None:
            return {
                "checked": True,
                "mismatch": False,
                "reason": "classifier confidence unavailable",
                "predicted_exercise": predicted_exercise,
                "confidence": confidence,
            }

        if confidence >= 0.70 and predicted_exercise != selected_normalized:
            return {
                "checked": True,
                "mismatch": True,
                "severity": "high",
                "predicted_exercise": predicted_exercise,
                "confidence": confidence,
                "message": (
                    f"Possible mismatch detected. Selected exercise is "
                    f"{selected_exercise}, but the system detected "
                    f"{predicted_exercise}."
                ),
            }

        if confidence >= 0.45 and predicted_exercise != selected_normalized:
            return {
                "checked": True,
                "mismatch": True,
                "severity": "medium",
                "predicted_exercise": predicted_exercise,
                "confidence": confidence,
                "message": (
                    f"Possible exercise mismatch. Selected exercise is "
                    f"{selected_exercise}, but detected pose looks like "
                    f"{predicted_exercise}."
                ),
            }

        return {
            "checked": True,
            "mismatch": False,
            "predicted_exercise": predicted_exercise,
            "confidence": confidence,
        }

    except Exception as e:
        return {
            "checked": False,
            "mismatch": False,
            "reason": str(e),
            "predicted_exercise": None,
            "confidence": None,
        }


# -------------------------------
# Exercise-specific mismatch validation
# -------------------------------

def get_center_point(landmarks, index_a, index_b):
    a = landmarks[index_a]
    b = landmarks[index_b]

    return {
        "x": (a.x + b.x) / 2,
        "y": (a.y + b.y) / 2,
        "z": (a.z + b.z) / 2,
    }


def calculate_angle_2d(a, b, c):
    import math

    angle = math.degrees(
        math.atan2(c.y - b.y, c.x - b.x)
        - math.atan2(a.y - b.y, a.x - b.x)
    )

    angle = abs(angle)

    if angle > 180:
        angle = 360 - angle

    return angle


def detect_body_orientation(landmarks):
    """
    Detect whether the visible body is mostly vertical or horizontal.
    This is only a rough mismatch check, not final posture analysis.
    """

    left_shoulder = 11
    right_shoulder = 12
    left_hip = 23
    right_hip = 24
    left_ankle = 27
    right_ankle = 28

    shoulder_center = get_center_point(landmarks, left_shoulder, right_shoulder)
    hip_center = get_center_point(landmarks, left_hip, right_hip)
    ankle_center = get_center_point(landmarks, left_ankle, right_ankle)

    torso_dx = abs(hip_center["x"] - shoulder_center["x"])
    torso_dy = abs(hip_center["y"] - shoulder_center["y"])

    body_dx = abs(ankle_center["x"] - shoulder_center["x"])
    body_dy = abs(ankle_center["y"] - shoulder_center["y"])

    if body_dx > body_dy * 1.15 or torso_dx > torso_dy * 1.25:
        return "horizontal"

    if body_dy > body_dx * 0.75 or torso_dy > torso_dx * 1.00:
        return "vertical"

    return "uncertain"


def get_pose_measurements(landmarks):
    """
    Shared body measurements used by exercise-specific mismatch validators.
    """

    left_shoulder = 11
    right_shoulder = 12
    left_elbow = 13
    right_elbow = 14
    left_wrist = 15
    right_wrist = 16

    left_hip = 23
    right_hip = 24
    left_knee = 25
    right_knee = 26
    left_ankle = 27
    right_ankle = 28

    orientation = detect_body_orientation(landmarks)

    shoulder_width = abs(
        landmarks[left_shoulder].x - landmarks[right_shoulder].x
    )

    if shoulder_width < 0.01:
        shoulder_width = 0.01

    ankle_width = abs(
        landmarks[left_ankle].x - landmarks[right_ankle].x
    )

    knee_width = abs(
        landmarks[left_knee].x - landmarks[right_knee].x
    )

    leg_spread_ratio = ankle_width / shoulder_width
    knee_spread_ratio = knee_width / shoulder_width

    shoulder_avg_y = (
        landmarks[left_shoulder].y + landmarks[right_shoulder].y
    ) / 2

    hip_avg_y = (
        landmarks[left_hip].y + landmarks[right_hip].y
    ) / 2

    wrist_avg_y = (
        landmarks[left_wrist].y + landmarks[right_wrist].y
    ) / 2

    left_knee_angle = calculate_angle_2d(
        landmarks[left_hip],
        landmarks[left_knee],
        landmarks[left_ankle],
    )

    right_knee_angle = calculate_angle_2d(
        landmarks[right_hip],
        landmarks[right_knee],
        landmarks[right_ankle],
    )

    avg_knee_angle = (left_knee_angle + right_knee_angle) / 2

    left_elbow_angle = calculate_angle_2d(
        landmarks[left_shoulder],
        landmarks[left_elbow],
        landmarks[left_wrist],
    )

    right_elbow_angle = calculate_angle_2d(
        landmarks[right_shoulder],
        landmarks[right_elbow],
        landmarks[right_wrist],
    )

    avg_elbow_angle = (left_elbow_angle + right_elbow_angle) / 2

    hands_high = wrist_avg_y < shoulder_avg_y - 0.12

    hands_near_upper_body = (
        wrist_avg_y < hip_avg_y + 0.20
        and wrist_avg_y > shoulder_avg_y - 0.35
    )

    hands_low = wrist_avg_y > hip_avg_y - 0.05

    return {
        "orientation": orientation,
        "leg_spread_ratio": leg_spread_ratio,
        "knee_spread_ratio": knee_spread_ratio,
        "avg_knee_angle": avg_knee_angle,
        "avg_elbow_angle": avg_elbow_angle,
        "hands_high": hands_high,
        "hands_near_upper_body": hands_near_upper_body,
        "hands_low": hands_low,
    }


def mismatch_response(exercise_name, orientation, message):
    return {
        "matched": False,
        "orientation": orientation,
        "message": message,
    }


def match_response(orientation):
    return {
        "matched": True,
        "orientation": orientation,
        "message": None,
    }


def validate_squat_pose(landmarks):
    """
    Squat validation must be soft.
    Squat can be standing, half squat, or deep squat.
    Only reject obvious floor exercises.
    """

    m = get_pose_measurements(landmarks)
    orientation = m["orientation"]

    if orientation == "horizontal":
        return mismatch_response(
            "squat",
            orientation,
            "Selected exercise is squat, but your body position looks like a floor exercise such as push-up or plank.",
        )

    return match_response(orientation)


def validate_pushup_pose(landmarks):
    """
    Push-up should be a floor/horizontal exercise.
    Do not strictly distinguish push-up vs plank from a single frame.
    """

    m = get_pose_measurements(landmarks)
    orientation = m["orientation"]

    if orientation == "vertical":
        return mismatch_response(
            "pushup",
            orientation,
            "Selected exercise is push-up, but your body position looks like a standing exercise.",
        )

    return match_response(orientation)


def validate_plank_pose(landmarks):
    """
    Plank should be a floor/horizontal exercise.
    Push-up and plank may look similar from one frame, so keep this soft.
    """

    m = get_pose_measurements(landmarks)
    orientation = m["orientation"]

    if orientation == "vertical":
        return mismatch_response(
            "plank",
            orientation,
            "Selected exercise is plank, but your body position looks like a standing exercise.",
        )

    return match_response(orientation)


def validate_bicep_curl_pose(landmarks):
    """
    Bicep curl is usually standing, legs close, hands around upper body.
    Keep it conservative to avoid false mismatch.
    """

    m = get_pose_measurements(landmarks)
    orientation = m["orientation"]

    if orientation == "horizontal":
        return mismatch_response(
            "bicep_curl",
            orientation,
            "Selected exercise is bicep curl, but your body position looks like a floor exercise.",
        )

    if m["leg_spread_ratio"] >= 1.75 and m["hands_high"]:
        return mismatch_response(
            "bicep_curl",
            orientation,
            "Selected exercise is bicep curl, but your pose looks more like jumping jack.",
        )

    if m["leg_spread_ratio"] >= 1.85 and m["knee_spread_ratio"] >= 0.85:
        return mismatch_response(
            "bicep_curl",
            orientation,
            "Selected exercise is bicep curl, but your pose looks more like lunge.",
        )

    return match_response(orientation)


def validate_lunge_pose(landmarks):
    """
    Lunge is vertical with one leg forward/back.
    Do not make it too strict because camera angle can change spread ratio.
    """

    m = get_pose_measurements(landmarks)
    orientation = m["orientation"]

    if orientation == "horizontal":
        return mismatch_response(
            "lunge",
            orientation,
            "Selected exercise is lunge, but your body position looks like a floor exercise.",
        )

    if m["leg_spread_ratio"] < 0.75 and m["hands_near_upper_body"]:
        return mismatch_response(
            "lunge",
            orientation,
            "Selected exercise is lunge, but your body pose looks more like a standing upper-body exercise.",
        )

    if m["leg_spread_ratio"] >= 1.75 and m["hands_high"]:
        return mismatch_response(
            "lunge",
            orientation,
            "Selected exercise is lunge, but your pose looks more like jumping jack.",
        )

    return match_response(orientation)


def validate_jumping_jack_pose(landmarks):
    """
    Jumping jack has open and closed phases.
    Closed phase can look like standing, so do not reject normal standing immediately.
    Reject only obvious floor exercises and lunge-like wide stance without arm raise.
    """

    m = get_pose_measurements(landmarks)
    orientation = m["orientation"]

    if orientation == "horizontal":
        return mismatch_response(
            "jumping_jack",
            orientation,
            "Selected exercise is jumping jack, but your body position looks like a floor exercise.",
        )

    if m["leg_spread_ratio"] >= 1.85 and not m["hands_high"]:
        return mismatch_response(
            "jumping_jack",
            orientation,
            "Selected exercise is jumping jack, but your pose looks more like a lunge or wide standing posture.",
        )

    return match_response(orientation)


def validate_situp_pose(landmarks):
    """
    Sit-up can be lying, seated, or halfway up.
    Keep validation soft. Reject only clearly standing pose with high confidence.
    """

    m = get_pose_measurements(landmarks)
    orientation = m["orientation"]

    if (
        orientation == "vertical"
        and m["leg_spread_ratio"] < 1.4
        and m["hands_near_upper_body"]
    ):
        return mismatch_response(
            "situp",
            orientation,
            "Selected exercise is sit-up, but your body position looks like a standing exercise.",
        )

    return match_response(orientation)


def validate_exercise_pose_match(exercise_name, landmarks):
    """
    Main dispatcher.
    Each exercise has its own safe mismatch validator.
    """

    exercise_name = exercise_name.lower().strip()

    validators = {
        "squat": validate_squat_pose,
        "pushup": validate_pushup_pose,
        "bicep_curl": validate_bicep_curl_pose,
        "lunge": validate_lunge_pose,
        "plank": validate_plank_pose,
        "jumping_jack": validate_jumping_jack_pose,
        "situp": validate_situp_pose,
    }

    validator = validators.get(exercise_name)

    if validator is None:
        return match_response(detect_body_orientation(landmarks))

    return validator(landmarks)


# -------------------------------
# Helper functions
# -------------------------------

def save_upload_to_temp_file(upload_file: UploadFile):
    suffix = os.path.splitext(upload_file.filename or "")[1]

    if suffix == "":
        suffix = ".mp4"

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)

    try:
        temp_file.write(upload_file.file.read())
        temp_file.close()
        return temp_file.name
    except Exception as e:
        temp_file.close()
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded video: {e}")


def read_upload_image(upload_file: UploadFile):
    try:
        image_bytes = upload_file.file.read()
        np_array = np.frombuffer(image_bytes, np.uint8)

        frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(
                status_code=400,
                detail="Could not decode uploaded image frame",
            )

        return frame

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read uploaded image frame: {e}",
        )


def get_most_common(items):
    if not items:
        return None

    counter = Counter(items)
    return counter.most_common(1)[0][0]


# -------------------------------
# API endpoints
# -------------------------------

@app.get("/")
def root():
    return {
        "message": "FITSHIELD Exercise Posture Analysis API is running",
        "supported_exercises": SUPPORTED_EXERCISES,
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "exercise-posture-api",
    }


@app.get("/exercises")
def get_exercises():
    return {
        "supported_exercises": SUPPORTED_EXERCISES,
        "ml_supported_exercises": [
            "squat",
            "pushup",
            "bicep_curl",
            "lunge",
            "plank",
        ],
        "rule_based_only_exercises": [
            "jumping_jack",
            "situp",
        ],
    }


@app.post("/analyze-video")
async def analyze_video(
    exercise: str = Form(...),
    video: UploadFile = File(...),
    frame_skip: int = Form(3),
):
    exercise = exercise.lower().strip()

    if exercise not in SUPPORTED_EXERCISES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported exercise: {exercise}. Supported: {SUPPORTED_EXERCISES}",
        )

    if frame_skip < 1:
        frame_skip = 1

    temp_video_path = save_upload_to_temp_file(video)

    detector = None
    cap = None

    try:
        detector = create_pose_detector()
        rep_counter = create_counter(exercise)
        ml_predictor = get_ml_predictor(exercise)

        cap = cv2.VideoCapture(temp_video_path)

        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not open uploaded video")

        fps = cap.get(cv2.CAP_PROP_FPS)

        if fps == 0:
            fps = 30

        frame_index = 0
        analyzed_frames = 0
        detected_frames = 0

        status_list = []
        feedback_list = []
        ml_results = []

        final_rep_count = 0
        final_stage = None
        final_hold_seconds = 0

        last_analysis = None
        last_ml_result = None

        while True:
            ret, frame = cap.read()

            if not ret:
                break

            if frame_index % frame_skip != 0:
                frame_index += 1
                continue

            analyzed_frames += 1

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            mp_image = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=rgb_frame,
            )

            timestamp_ms = int((frame_index / fps) * 1000)
            result = detector.detect_for_video(mp_image, timestamp_ms)

            if result.pose_landmarks:
                detected_frames += 1

                pose_landmarks = result.pose_landmarks[0]

                analysis = analyze_posture(exercise, pose_landmarks)
                last_analysis = analysis

                status = analysis["status"]
                primary_angle = analysis["primary_angle"]
                feedback = analysis.get("feedback", [])

                status_list.append(status)
                feedback_list.extend(feedback)

                if exercise == "plank":
                    rep_result = rep_counter.update(status)
                    final_hold_seconds = rep_result.get("hold_seconds", 0)
                else:
                    rep_result = rep_counter.update(primary_angle)

                final_rep_count = rep_result.get("rep_count", 0)
                final_stage = rep_result.get("stage")

                if ml_predictor is not None:
                    raw_ml_result = ml_predictor.predict(pose_landmarks)
                    normalized_ml = normalize_ml_result(exercise, raw_ml_result)

                    if normalized_ml is not None:
                        ml_results.append(normalized_ml)
                        last_ml_result = normalized_ml

            frame_index += 1

        most_common_status = get_most_common(status_list)
        most_common_feedback = get_most_common(feedback_list)

        response = {
            "exercise": exercise,
            "video_file": video.filename,
            "total_frames_read": frame_index,
            "analyzed_frames": analyzed_frames,
            "detected_pose_frames": detected_frames,
            "pose_detection_rate": round(detected_frames / analyzed_frames, 4)
            if analyzed_frames > 0
            else 0,
            "summary": {
                "most_common_status": most_common_status,
                "most_common_feedback": most_common_feedback,
                "final_rep_count": final_rep_count,
                "final_stage": final_stage,
                "final_hold_seconds": final_hold_seconds if exercise == "plank" else None,
            },
            "last_rule_based_analysis": last_analysis,
            "last_ml_prediction": last_ml_result,
            "ml_enabled": ml_predictor is not None,
            "message": "Video analysis completed successfully",
        }

        return response

    finally:
        if cap is not None:
            cap.release()

        if detector is not None:
            detector.close()

        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)


@app.post("/analyze-frame")
async def analyze_frame(
    exercise: str = Form(...),
    frame: UploadFile = File(...),
):
    exercise = exercise.lower().strip()

    if exercise not in SUPPORTED_EXERCISES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported exercise: {exercise}. Supported: {SUPPORTED_EXERCISES}",
        )

    detector = None

    try:
        detector = create_image_pose_detector()
        ml_predictor = get_ml_predictor(exercise)

        image_frame = read_upload_image(frame)

        rgb_frame = cv2.cvtColor(image_frame, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame,
        )

        result = detector.detect(mp_image)

        if not result.pose_landmarks:
            return {
                "exercise": exercise,
                "pose_detected": False,
                "exercise_match": False,
                "status": "No Pose Detected",
                "feedback": [
                    "No human pose detected. Please adjust camera position."
                ],
                "ml_enabled": ml_predictor is not None,
                "ml_prediction": None,
                "message": "No pose detected in frame",
            }

        pose_landmarks = result.pose_landmarks[0]

        # 1. First use safe exercise-specific validation.
        pose_match = validate_exercise_pose_match(exercise, pose_landmarks)

        if not pose_match["matched"]:
            return {
                "exercise": exercise,
                "pose_detected": True,
                "exercise_match": False,
                "detected_orientation": pose_match["orientation"],
                "exercise_classifier": None,
                "status": "Possible Mismatch",
                "primary_angle_name": None,
                "primary_angle": None,
                "secondary_angle_name": None,
                "secondary_angle": None,
                "feedback": [
                    pose_match["message"],
                    "Please confirm the selected exercise or adjust your camera position.",
                ],
                "ml_enabled": ml_predictor is not None,
                "ml_prediction": None,
                "message": "Possible exercise mismatch detected",
            }

        # 2. Then use exercise classifier only as a secondary check.
        classifier_match = get_classifier_mismatch_result(exercise, pose_landmarks)

        if (
            classifier_match.get("mismatch")
            and classifier_match.get("severity") == "high"
        ):
            return {
                "exercise": exercise,
                "pose_detected": True,
                "exercise_match": False,
                "detected_exercise": classifier_match.get("predicted_exercise"),
                "exercise_classifier_confidence": classifier_match.get("confidence"),
                "status": "Possible Mismatch",
                "primary_angle_name": None,
                "primary_angle": None,
                "secondary_angle_name": None,
                "secondary_angle": None,
                "feedback": [
                    classifier_match.get("message"),
                    "Please confirm the selected exercise before continuing.",
                ],
                "ml_enabled": ml_predictor is not None,
                "ml_prediction": None,
                "message": "Exercise classifier mismatch detected",
            }

        analysis = analyze_posture(exercise, pose_landmarks)

        raw_ml_result = None
        normalized_ml = None

        if ml_predictor is not None:
            raw_ml_result = ml_predictor.predict(pose_landmarks)
            normalized_ml = normalize_ml_result(exercise, raw_ml_result)

        response = {
            "exercise": exercise,
            "pose_detected": True,
            "exercise_match": True,
            "detected_orientation": pose_match["orientation"],
            "exercise_classifier": classifier_match,
            "status": analysis.get("status"),
            "primary_angle_name": analysis.get("primary_angle_name"),
            "primary_angle": analysis.get("primary_angle"),
            "secondary_angle_name": analysis.get("secondary_angle_name"),
            "secondary_angle": analysis.get("secondary_angle"),
            "feedback": analysis.get("feedback", []),
            "ml_enabled": ml_predictor is not None,
            "ml_prediction": normalized_ml,
            "message": "Frame analysis completed successfully",
        }

        return response

    finally:
        if detector is not None:
            detector.close()