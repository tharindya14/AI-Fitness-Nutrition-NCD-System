import os
import cv2
import csv
import math
import argparse
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


MODEL_PATH = "../../models/pose_landmarker_lite.task"

DEFAULT_DATASET_DIR = "../../datasets/pushup_dataset"
DEFAULT_OUTPUT_PATH = "../../datasets/generated/pushup_features.csv"

VIDEO_EXTENSIONS = (".mp4", ".avi", ".mov", ".mkv")


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


def extract_pushup_features(landmarks):
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

    shoulder_width = abs(landmarks[LEFT_SHOULDER].x - landmarks[RIGHT_SHOULDER].x)
    wrist_width = abs(landmarks[LEFT_WRIST].x - landmarks[RIGHT_WRIST].x)
    hip_width = abs(landmarks[LEFT_HIP].x - landmarks[RIGHT_HIP].x)
    ankle_width = abs(landmarks[LEFT_ANKLE].x - landmarks[RIGHT_ANKLE].x)

    hip_drop = abs(
        ((landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2)
        - ((landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2)
    )

    return {
        "left_elbow_angle": round(left_elbow_angle, 4),
        "right_elbow_angle": round(right_elbow_angle, 4),
        "avg_elbow_angle": round(avg_elbow_angle, 4),
        "left_body_alignment": round(left_body_alignment, 4),
        "right_body_alignment": round(right_body_alignment, 4),
        "avg_body_alignment": round(avg_body_alignment, 4),
        "shoulder_width": round(shoulder_width, 4),
        "wrist_width": round(wrist_width, 4),
        "hip_width": round(hip_width, 4),
        "ankle_width": round(ankle_width, 4),
        "hip_drop": round(hip_drop, 4),
    }


def find_videos(folder_path):
    videos = []

    if not os.path.exists(folder_path):
        return videos

    for file_name in os.listdir(folder_path):
        if file_name.lower().endswith(VIDEO_EXTENSIONS):
            videos.append(os.path.join(folder_path, file_name))

    return videos


def process_video(detector, video_path, label):
    rows = []

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"Could not open video: {video_path}")
        return rows

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30

    frame_index = 0
    detected_frames = 0

    print(f"Processing: {video_path} | label={label}")

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame
        )

        timestamp_ms = int((frame_index / fps) * 1000)
        result = detector.detect_for_video(mp_image, timestamp_ms)

        if result.pose_landmarks:
            pose_landmarks = result.pose_landmarks[0]
            features = extract_pushup_features(pose_landmarks)

            row = {
                "video_file": os.path.basename(video_path),
                "frame": frame_index,
                **features,
                "label": label
            }

            rows.append(row)
            detected_frames += 1

        frame_index += 1

    cap.release()

    print(f"Detected frames: {detected_frames}")
    return rows


def generate_dataset(dataset_dir, output_path):
    correct_dir = os.path.join(dataset_dir, "correct")

    # Handle both incorrect and Incorrect folder names
    incorrect_dir_lower = os.path.join(dataset_dir, "incorrect")
    incorrect_dir_upper = os.path.join(dataset_dir, "Incorrect")

    if os.path.exists(incorrect_dir_lower):
        incorrect_dir = incorrect_dir_lower
    else:
        incorrect_dir = incorrect_dir_upper

    correct_videos = find_videos(correct_dir)
    incorrect_videos = find_videos(incorrect_dir)

    print("Correct videos found:", len(correct_videos))
    print("Incorrect videos found:", len(incorrect_videos))

    if len(correct_videos) == 0:
        print("No correct videos found. Check folder:", correct_dir)

    if len(incorrect_videos) == 0:
        print("No incorrect videos found. Check folder:", incorrect_dir)

    detector = create_pose_detector()

    all_rows = []

    for video_path in correct_videos:
        all_rows.extend(process_video(detector, video_path, "correct"))

    for video_path in incorrect_videos:
        all_rows.extend(process_video(detector, video_path, "incorrect"))

    detector.close()

    if len(all_rows) == 0:
        print("No pose data generated. Dataset CSV was not created.")
        return

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    fieldnames = list(all_rows[0].keys())

    with open(output_path, mode="w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    print("\nPush-up feature dataset generated successfully.")
    print("Output path:", output_path)
    print("Total rows:", len(all_rows))


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Generate push-up posture feature dataset from videos"
    )

    parser.add_argument(
        "--dataset",
        type=str,
        default=DEFAULT_DATASET_DIR,
        help="Path to pushup_dataset folder"
    )

    parser.add_argument(
        "--output",
        type=str,
        default=DEFAULT_OUTPUT_PATH,
        help="Output CSV file path"
    )

    return parser.parse_args()


def main():
    args = parse_arguments()

    generate_dataset(
        dataset_dir=args.dataset,
        output_path=args.output
    )


if __name__ == "__main__":
    main()