import math


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


def calculate_angle(a, b, c):
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


def avg(v1, v2):
    return (v1 + v2) / 2


def get_body_alignment_angle(shoulder, hip, ankle):
    return calculate_angle(shoulder, hip, ankle)


def horizontal_distance(a, b):
    return abs(a.x - b.x)


def normalized_distance(a, b, ref_a, ref_b):
    ref = horizontal_distance(ref_a, ref_b)
    if ref < 0.01:
        ref = 0.01
    return horizontal_distance(a, b) / ref


def analyze_squat_posture(landmarks):
    left_knee_angle = calculate_angle(
        landmarks[LEFT_HIP], landmarks[LEFT_KNEE], landmarks[LEFT_ANKLE]
    )
    right_knee_angle = calculate_angle(
        landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE], landmarks[RIGHT_ANKLE]
    )

    left_hip_angle = calculate_angle(
        landmarks[LEFT_SHOULDER], landmarks[LEFT_HIP], landmarks[LEFT_KNEE]
    )
    right_hip_angle = calculate_angle(
        landmarks[RIGHT_SHOULDER], landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE]
    )

    avg_knee_angle = avg(left_knee_angle, right_knee_angle)
    avg_hip_angle = avg(left_hip_angle, right_hip_angle)

    if avg_knee_angle > 160:
        status = "Standing"
        feedback = ["Stand position detected."]

    elif 120 < avg_knee_angle <= 160:
        status = "In Progress"
        feedback = ["Lower your body more to complete the squat."]

    elif 55 <= avg_knee_angle <= 120:
        status = "Correct"
        feedback = ["Good squat depth."]

    else:
        status = "Incorrect"
        feedback = ["You are going too low. Control your squat depth."]

    if 55 <= avg_knee_angle <= 120 and avg_hip_angle < 30:
        status = "Incorrect"
        feedback = ["Keep your upper body more upright."]

    return {
        "exercise": "squat",
        "status": status,
        "primary_angle": round(avg_knee_angle, 2),
        "secondary_angle": round(avg_hip_angle, 2),
        "primary_angle_name": "Knee Angle",
        "secondary_angle_name": "Hip Angle",
        "feedback": feedback
    }


def analyze_pushup_posture(landmarks):
    left_elbow_angle = calculate_angle(
        landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST]
    )
    right_elbow_angle = calculate_angle(
        landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST]
    )

    avg_elbow_angle = avg(left_elbow_angle, right_elbow_angle)

    left_body_angle = get_body_alignment_angle(
        landmarks[LEFT_SHOULDER], landmarks[LEFT_HIP], landmarks[LEFT_ANKLE]
    )
    right_body_angle = get_body_alignment_angle(
        landmarks[RIGHT_SHOULDER], landmarks[RIGHT_HIP], landmarks[RIGHT_ANKLE]
    )

    avg_body_angle = avg(left_body_angle, right_body_angle)

    if avg_body_angle < 140:
        status = "Incorrect"
        feedback = ["Keep your body straight. Do not drop your hips."]

    elif avg_elbow_angle > 150:
        status = "Up"
        feedback = ["Push-up up position detected."]

    elif 90 <= avg_elbow_angle <= 150:
        status = "In Progress"
        feedback = ["Lower your chest more to complete the push-up."]

    else:
        status = "Correct"
        feedback = ["Good push-up depth."]

    return {
        "exercise": "pushup",
        "status": status,
        "primary_angle": round(avg_elbow_angle, 2),
        "secondary_angle": round(avg_body_angle, 2),
        "primary_angle_name": "Elbow Angle",
        "secondary_angle_name": "Body Alignment",
        "feedback": feedback
    }


def analyze_bicep_curl_posture(landmarks):
    left_elbow_angle = calculate_angle(
        landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST]
    )
    right_elbow_angle = calculate_angle(
        landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST]
    )

    avg_elbow_angle = avg(left_elbow_angle, right_elbow_angle)

    if avg_elbow_angle > 145:
        status = "Down"
        feedback = ["Arm extended position detected."]

    elif avg_elbow_angle < 85:
        status = "Correct"
        feedback = ["Good curl contraction."]

    else:
        status = "In Progress"
        feedback = ["Control your arm movement."]

    return {
        "exercise": "bicep_curl",
        "status": status,
        "primary_angle": round(avg_elbow_angle, 2),
        "secondary_angle": 0,
        "primary_angle_name": "Elbow Angle",
        "secondary_angle_name": "N/A",
        "feedback": feedback
    }


def analyze_lunge_posture(landmarks):
    left_knee_angle = calculate_angle(
        landmarks[LEFT_HIP], landmarks[LEFT_KNEE], landmarks[LEFT_ANKLE]
    )
    right_knee_angle = calculate_angle(
        landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE], landmarks[RIGHT_ANKLE]
    )

    if left_knee_angle < right_knee_angle:
        front_knee_angle = left_knee_angle
        back_knee_angle = right_knee_angle
        front_leg = "left"
    else:
        front_knee_angle = right_knee_angle
        back_knee_angle = left_knee_angle
        front_leg = "right"

    if front_knee_angle > 150:
        status = "Standing"
        feedback = ["Standing position detected."]

    elif 110 < front_knee_angle <= 150:
        status = "In Progress"
        feedback = ["Lower your body more to complete the lunge."]

    elif 75 <= front_knee_angle <= 110:
        status = "Correct"
        feedback = ["Good lunge depth."]

    else:
        status = "Incorrect"
        feedback = ["Do not bend too low. Control your lunge depth."]

    return {
        "exercise": "lunge",
        "status": status,
        "primary_angle": round(front_knee_angle, 2),
        "secondary_angle": round(back_knee_angle, 2),
        "primary_angle_name": f"Front Knee Angle ({front_leg})",
        "secondary_angle_name": "Back Knee Angle",
        "feedback": feedback
    }


def analyze_plank_posture(landmarks):
    left_body_angle = get_body_alignment_angle(
        landmarks[LEFT_SHOULDER], landmarks[LEFT_HIP], landmarks[LEFT_ANKLE]
    )
    right_body_angle = get_body_alignment_angle(
        landmarks[RIGHT_SHOULDER], landmarks[RIGHT_HIP], landmarks[RIGHT_ANKLE]
    )

    avg_body_angle = avg(left_body_angle, right_body_angle)

    if avg_body_angle < 130:
        status = "Incorrect"
        feedback = ["Keep your body straight during plank."]
    else:
        status = "Correct"
        feedback = ["Good plank posture. Hold this position."]

    return {
        "exercise": "plank",
        "status": status,
        "primary_angle": round(avg_body_angle, 2),
        "secondary_angle": 0,
        "primary_angle_name": "Body Alignment",
        "secondary_angle_name": "N/A",
        "feedback": feedback
    }


def analyze_jumping_jack_posture(landmarks):
    ankle_spread_ratio = normalized_distance(
        landmarks[LEFT_ANKLE],
        landmarks[RIGHT_ANKLE],
        landmarks[LEFT_SHOULDER],
        landmarks[RIGHT_SHOULDER]
    )

    left_arm_up = landmarks[LEFT_WRIST].y < landmarks[LEFT_SHOULDER].y
    right_arm_up = landmarks[RIGHT_WRIST].y < landmarks[RIGHT_SHOULDER].y

    arm_score = 0
    if left_arm_up:
        arm_score += 1
    if right_arm_up:
        arm_score += 1

    if ankle_spread_ratio < 1.35:
        status = "Closed"
        feedback = ["Closed position detected."]

    elif ankle_spread_ratio >= 1.75 and arm_score == 2:
        status = "Correct"
        feedback = ["Good jumping jack open position."]

    elif ankle_spread_ratio >= 1.75 and arm_score < 2:
        status = "In Progress"
        feedback = ["Raise your arms higher to complete the jumping jack."]

    else:
        status = "In Progress"
        feedback = ["Open your legs and raise your arms."]

    return {
        "exercise": "jumping_jack",
        "status": status,
        "primary_angle": round(ankle_spread_ratio, 2),
        "secondary_angle": arm_score,
        "primary_angle_name": "Leg Spread Ratio",
        "secondary_angle_name": "Arm Raise Score",
        "feedback": feedback
    }


def analyze_situp_posture(landmarks):
    left_torso_angle = calculate_angle(
        landmarks[LEFT_SHOULDER], landmarks[LEFT_HIP], landmarks[LEFT_KNEE]
    )
    right_torso_angle = calculate_angle(
        landmarks[RIGHT_SHOULDER], landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE]
    )

    avg_torso_angle = avg(left_torso_angle, right_torso_angle)

    if avg_torso_angle > 135:
        status = "Down"
        feedback = ["Lying down position detected."]

    elif 95 < avg_torso_angle <= 135:
        status = "In Progress"
        feedback = ["Lift your upper body more to complete the sit-up."]

    else:
        status = "Correct"
        feedback = ["Good sit-up contraction."]

    return {
        "exercise": "situp",
        "status": status,
        "primary_angle": round(avg_torso_angle, 2),
        "secondary_angle": 0,
        "primary_angle_name": "Torso Angle",
        "secondary_angle_name": "N/A",
        "feedback": feedback
    }


def analyze_posture(exercise_name, landmarks):
    exercise_name = exercise_name.lower()

    if exercise_name == "squat":
        return analyze_squat_posture(landmarks)

    if exercise_name == "pushup":
        return analyze_pushup_posture(landmarks)

    if exercise_name == "bicep_curl":
        return analyze_bicep_curl_posture(landmarks)

    if exercise_name == "lunge":
        return analyze_lunge_posture(landmarks)

    if exercise_name == "plank":
        return analyze_plank_posture(landmarks)

    if exercise_name == "jumping_jack":
        return analyze_jumping_jack_posture(landmarks)

    if exercise_name == "situp":
        return analyze_situp_posture(landmarks)

    return {
        "exercise": exercise_name,
        "status": "Unknown",
        "primary_angle": 0,
        "secondary_angle": 0,
        "primary_angle_name": "N/A",
        "secondary_angle_name": "N/A",
        "feedback": ["Unsupported exercise selected."]
    }