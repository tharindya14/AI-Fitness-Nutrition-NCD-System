import argparse
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from posture_engine import analyze_posture
from rep_counter import create_counter
from voice_feedback import VoiceFeedback
from predict_squat_posture import SquatPosturePredictor
from exercise_classifier_predictor import ExerciseClassifierPredictor
from predict_pushup_posture import PushupPosturePredictor
from predict_bicep_curl_posture import BicepCurlPosturePredictor



MODEL_PATH = "../../models/pose_landmarker_lite.task"

DEFAULT_EXERCISE = "squat"
DEFAULT_VIDEO_PATH = "../../datasets/test_videos/squat_test.mp4"

SUPPORTED_EXERCISES = [
    "squat",
    "pushup",
    "bicep_curl",
    "lunge",
    "plank",
    "jumping_jack",
    "situp"
]


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="FITSHIELD Real-Time Exercise Posture Detection"
    )

    parser.add_argument(
        "--exercise",
        type=str,
        default=DEFAULT_EXERCISE,
        choices=SUPPORTED_EXERCISES,
        help="Exercise type to analyze"
    )

    parser.add_argument(
        "--video",
        type=str,
        default=DEFAULT_VIDEO_PATH,
        help="Path to input video file"
    )

    parser.add_argument(
        "--auto",
        action="store_true",
        help="Enable automatic exercise classification"
    )

    return parser.parse_args()


def draw_landmarks(frame, pose_landmarks):
    h, w, _ = frame.shape

    connections = [
        (11, 12), (11, 13), (13, 15), (12, 14), (14, 16),
        (11, 23), (12, 24), (23, 24),
        (23, 25), (25, 27), (24, 26), (26, 28),
        (27, 29), (29, 31), (28, 30), (30, 32)
    ]

    for landmark in pose_landmarks:
        x = int(landmark.x * w)
        y = int(landmark.y * h)
        cv2.circle(frame, (x, y), 4, (0, 255, 0), -1)

    for start, end in connections:
        if start < len(pose_landmarks) and end < len(pose_landmarks):
            x1 = int(pose_landmarks[start].x * w)
            y1 = int(pose_landmarks[start].y * h)
            x2 = int(pose_landmarks[end].x * w)
            y2 = int(pose_landmarks[end].y * h)
            cv2.line(frame, (x1, y1), (x2, y2), (255, 255, 255), 2)


def put_text(frame, text, x, y, color=(0, 255, 0), scale=0.55):
    cv2.putText(
        frame,
        text,
        (x, y),
        cv2.FONT_HERSHEY_SIMPLEX,
        scale,
        color,
        2
    )


def resize_with_padding(frame, target_width=960, target_height=720):
    height, width = frame.shape[:2]
    scale = min(target_width / width, target_height / height)

    new_width = int(width * scale)
    new_height = int(height * scale)

    resized = cv2.resize(frame, (new_width, new_height))

    canvas = cv2.copyMakeBorder(
        resized,
        top=(target_height - new_height) // 2,
        bottom=target_height - new_height - ((target_height - new_height) // 2),
        left=(target_width - new_width) // 2,
        right=target_width - new_width - ((target_width - new_width) // 2),
        borderType=cv2.BORDER_CONSTANT,
        value=(0, 0, 0)
    )

    return canvas


def get_status_color(status):
    if status == "Correct":
        return (0, 255, 0)

    if status in ["Standing", "Up", "Down", "Closed", "In Progress"]:
        return (255, 255, 0)

    return (0, 0, 255)


def get_display_stage(exercise_name, primary_angle, internal_stage):
    exercise_name = exercise_name.lower()

    if exercise_name == "squat":
        if primary_angle > 155:
            return "standing"
        if primary_angle < 95:
            return "deep squat"
        return "going down / coming up"

    if exercise_name == "pushup":
        if primary_angle > 150:
            return "up position"
        if primary_angle < 115:
            return "down position"
        return "going down / coming up"

    if exercise_name == "bicep_curl":
        if primary_angle > 150:
            return "arm extended"
        if primary_angle < 60:
            return "arm curled"
        return "curling / extending"

    if exercise_name == "lunge":
        if primary_angle > 150:
            return "standing"
        if primary_angle < 110:
            return "lunge down"
        return "going down / coming up"

    if exercise_name == "jumping_jack":
        if primary_angle < 1.35:
            return "closed position"
        if primary_angle > 1.75:
            return "open position"
        return "opening / closing"

    if exercise_name == "situp":
        if primary_angle > 135:
            return "lying down"
        if primary_angle < 95:
            return "sit-up position"
        return "going up / going down"

    if exercise_name == "plank":
        return "hold"

    return internal_stage


def get_positive_voice_message(exercise_name):
    exercise_name = exercise_name.lower()

    if exercise_name == "squat":
        return "Good squat depth"

    if exercise_name == "pushup":
        return "Good push-up depth"

    if exercise_name == "bicep_curl":
        return "Good curl movement"

    if exercise_name == "lunge":
        return "Good lunge depth"

    if exercise_name == "jumping_jack":
        return "Good jumping jack"

    if exercise_name == "situp":
        return "Good sit-up"

    if exercise_name == "plank":
        return "Good plank posture"

    return "Good posture"


def create_pose_detector():
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


def main():
    args = parse_arguments()

    current_exercise = args.exercise.lower()
    video_path = args.video

    detector = create_pose_detector()
    rep_counter = create_counter(current_exercise)
    voice = VoiceFeedback(cooldown_seconds=5)

    squat_ml_predictor = None
    pushup_ml_predictor = None
    bicep_curl_ml_predictor = None
    
    if current_exercise == "squat":
        squat_ml_predictor = SquatPosturePredictor()
    
    if current_exercise == "pushup":
        pushup_ml_predictor = PushupPosturePredictor()
    
    if current_exercise == "bicep_curl":
        bicep_curl_ml_predictor = BicepCurlPosturePredictor()

    exercise_classifier = None

    if hasattr(args, "auto") and args.auto:
        exercise_classifier = ExerciseClassifierPredictor()

    previous_stage = "up"
    previous_rep_count = 0
    last_error_message = None
    incorrect_frame_count = 0

    auto_exercise_result = None
    AUTO_CLASSIFY_EVERY_N_FRAMES = 10
    AUTO_CONFIDENCE_THRESHOLD = 0.55

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("ERROR: Cannot open video file.")
        print("Check this path:", video_path)
        return

    print("Video started successfully.")
    print("Exercise:", current_exercise)
    print("Video:", video_path)
    print("Press 'q' to quit.")

    cv2.namedWindow("FITSHIELD - Pose Detection", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("FITSHIELD - Pose Detection", 960, 720)

    frame_index = 0
    fps = cap.get(cv2.CAP_PROP_FPS)

    if fps == 0:
        fps = 30

    while True:
        ret, frame = cap.read()

        if not ret:
            print("Video ended.")
            break

        frame = cv2.flip(frame, 1)
        frame = resize_with_padding(frame, target_width=960, target_height=720)

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame
        )

        timestamp_ms = int((frame_index / fps) * 1000)
        result = detector.detect_for_video(mp_image, timestamp_ms)

        if result.pose_landmarks:
            pose_landmarks = result.pose_landmarks[0]
            draw_landmarks(frame, pose_landmarks)

            analysis = analyze_posture(current_exercise, pose_landmarks)

            if (
                exercise_classifier is not None
                and frame_index % AUTO_CLASSIFY_EVERY_N_FRAMES == 0
            ):
                auto_exercise_result = exercise_classifier.predict(pose_landmarks)

            ml_result = None

            if current_exercise == "squat" and squat_ml_predictor is not None:
                ml_result = squat_ml_predictor.predict(pose_landmarks)
            
            if current_exercise == "pushup" and pushup_ml_predictor is not None:
                ml_result = pushup_ml_predictor.predict(pose_landmarks)
            
            if current_exercise == "bicep_curl" and bicep_curl_ml_predictor is not None:
                ml_result = bicep_curl_ml_predictor.predict(pose_landmarks)

            status = analysis["status"]
            primary_angle = analysis["primary_angle"]
            secondary_angle = analysis["secondary_angle"]
            primary_angle_name = analysis["primary_angle_name"]
            secondary_angle_name = analysis["secondary_angle_name"]
            feedback = analysis["feedback"]

            if current_exercise == "plank":
                rep_result = rep_counter.update(status)
            else:
                rep_result = rep_counter.update(primary_angle)

            rep_count = rep_result["rep_count"]
            stage = rep_result["stage"]

            display_stage = get_display_stage(
                current_exercise,
                primary_angle,
                stage
            )

            status_color = get_status_color(status)

            current_error_message = feedback[0] if feedback else None

            if status == "Incorrect":
                incorrect_frame_count += 1
            else:
                incorrect_frame_count = 0
                last_error_message = None

            if stage == "down" and previous_stage != "down":
                voice.speak(
                    get_positive_voice_message(current_exercise),
                    force=True
                )

            if current_exercise != "plank" and rep_count > previous_rep_count:
                voice.speak(
                    f"One repetition completed. Total reps {rep_count}",
                    force=True
                )

            if (
                status == "Incorrect"
                and incorrect_frame_count == 8
                and current_error_message
                and current_error_message != last_error_message
            ):
                voice.speak(current_error_message, force=True)
                last_error_message = current_error_message

            if (
                status == "Incorrect"
                and incorrect_frame_count > 0
                and incorrect_frame_count % 150 == 0
                and current_error_message
            ):
                voice.speak(
                    "You are still repeating the same mistake",
                    force=True
                )

            previous_stage = stage
            previous_rep_count = rep_count

            put_text(frame, "Pose Detected", 20, 40, (0, 255, 0))
            put_text(frame, f"Status: {status}", 20, 80, status_color)
            put_text(frame, f"Exercise: {current_exercise}", 20, 120, (255, 255, 255))
            put_text(frame, f"{primary_angle_name}: {primary_angle}", 20, 160, (255, 255, 255))

            y_position = 200

            if secondary_angle_name != "N/A":
                put_text(
                    frame,
                    f"{secondary_angle_name}: {secondary_angle}",
                    20,
                    y_position,
                    (255, 255, 255)
                )
                y_position += 40

            put_text(
                frame,
                f"Phase: {display_stage}",
                20,
                y_position,
                (255, 255, 0)
            )
            y_position += 40

            if current_exercise == "plank":
                hold_seconds = rep_result.get("hold_seconds", 0)
                put_text(
                    frame,
                    f"Hold Time: {hold_seconds}s",
                    20,
                    y_position,
                    (0, 255, 255)
                )
            else:
                put_text(
                    frame,
                    f"Reps: {rep_count}",
                    20,
                    y_position,
                    (0, 255, 255)
                )

            y_position += 45

            if ml_result is not None:
                if current_exercise == "squat":
                    ml_text = f"ML Class: {ml_result['ml_class']}"
                elif current_exercise in ["pushup", "bicep_curl"]:
                    ml_text = f"ML Label: {ml_result['ml_label']}"
                else:
                    ml_text = "ML Result: N/A"
            
                put_text(
                    frame,
                    ml_text,
                    20,
                    y_position,
                    (255, 255, 255),
                    0.5
                )
                y_position += 30
            
                put_text(
                    frame,
                    f"ML Confidence: {ml_result['ml_confidence']}",
                    20,
                    y_position,
                    (255, 255, 255),
                    0.5
                )
                y_position += 30
            
                put_text(
                    frame,
                    f"Confidence Level: {ml_result['confidence_level']}",
                    20,
                    y_position,
                    (255, 255, 255),
                    0.5
                )
                y_position += 35

            if auto_exercise_result is not None:
                  auto_conf = auto_exercise_result["confidence"]
              
                  if auto_conf is not None and auto_conf >= AUTO_CONFIDENCE_THRESHOLD:
                      auto_text = auto_exercise_result["predicted_exercise"]
                  else:
                      auto_text = "uncertain"
              
                  put_text(
                      frame,
                      f"Auto Exercise: {auto_text}",
                      20,
                      y_position,
                      (255, 255, 255),
                      0.5
                  )
                  y_position += 30
              
                  put_text(
                      frame,
                      f"Auto Conf: {auto_conf}",
                      20,
                      y_position,
                      (255, 255, 255),
                      0.5
                  )
                  y_position += 35
            
            for msg in feedback[:2]:
                short_msg = msg[:45] + "..." if len(msg) > 45 else msg

                put_text(
                    frame,
                    f"- {short_msg}",
                    20,
                    y_position,
                    status_color,
                    0.5
                )
                y_position += 30

        else:
            put_text(frame, "No Pose Detected", 20, 40, (0, 0, 255))

        cv2.imshow("FITSHIELD - Pose Detection", frame)

        frame_index += 1

        if cv2.waitKey(80) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    detector.close()


if __name__ == "__main__":
    main()