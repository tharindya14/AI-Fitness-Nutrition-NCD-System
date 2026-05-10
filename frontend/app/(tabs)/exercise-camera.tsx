import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";
import { ML_API_BASE_URL_EXERCISE } from "../../constants/api";
import { router } from "expo-router";

type ExerciseKey =
  | "squat"
  | "pushup"
  | "bicep_curl"
  | "lunge"
  | "plank"
  | "situp"
  | "jumping_jack";

type AnalysisResult = {
  exercise: string;
  pose_detected: boolean;
  exercise_match?: boolean;
  status: string;
  primary_angle_name?: string | null;
  primary_angle?: number | null;
  secondary_angle_name?: string | null;
  secondary_angle?: number | null;
  feedback?: string[];
  ml_enabled?: boolean;
  ml_prediction?: {
    ml_type: string;
    label: string;
    confidence: number;
    confidence_level: string;
    probabilities?: Record<string, number>;
  } | null;
  message?: string;
};

type RepState = {
  rep_count: number;
  stage: "up" | "down" | "hold";
  hold_seconds: number;
  last_rep_completed: boolean;
};

const EXERCISES: { label: string; value: ExerciseKey }[] = [
  { label: "Squat", value: "squat" },
  { label: "Push-up", value: "pushup" },
  { label: "Bicep Curl", value: "bicep_curl" },
  { label: "Lunge", value: "lunge" },
  { label: "Plank", value: "plank" },
  { label: "Sit-up", value: "situp" },
  { label: "Jumping Jack", value: "jumping_jack" },
];

function getStatusColor(status?: string) {
  if (!status) return "#FACC15";

  const value = status.toLowerCase();

  if (value.includes("correct")) return "#22C55E";
  if (value.includes("incorrect")) return "#EF4444";
  if (value.includes("wrong")) return "#EF4444";
  if (value.includes("mismatch")) return "#F97316";
  if (value.includes("no pose")) return "#F97316";
  if (value.includes("progress")) return "#38BDF8";
  if (value.includes("waiting")) return "#FACC15";

  return "#FACC15";
}

function formatLabel(label: string) {
  return label.replace(/_/g, " ");
}

function buildVoiceMessage(data: AnalysisResult) {
  if (!data.pose_detected) {
    return "No pose detected. Please keep your full body visible.";
  }

  const feedback = data.feedback?.[0];

  if (feedback && feedback.trim().length > 0) {
    return feedback.replace(/•/g, "").trim();
  }

  if (data.ml_prediction?.label) {
    const label = formatLabel(data.ml_prediction.label).toLowerCase();

    if (label.includes("correct")) {
      return `Good posture. ${label}`;
    }

    return `Posture issue detected. ${label}`;
  }

  if (data.status) {
    return `Status ${data.status}`;
  }

  return "Analyzing your posture.";
}

function getRepThresholds(exercise: ExerciseKey) {
  if (exercise === "squat") {
    return {
      up: 155,
      down: 95,
      mode: "lower_is_down" as const,
    };
  }

  if (exercise === "pushup") {
    return {
      up: 150,
      down: 115,
      mode: "lower_is_down" as const,
    };
  }

  if (exercise === "bicep_curl") {
    return {
      up: 145,
      down: 85,
      mode: "lower_is_down" as const,
    };
  }

  if (exercise === "lunge") {
    return {
      up: 150,
      down: 110,
      mode: "lower_is_down" as const,
    };
  }

  if (exercise === "situp") {
    return {
      up: 135,
      down: 95,
      mode: "lower_is_down" as const,
    };
  }

  if (exercise === "jumping_jack") {
    return {
      up: 1.35,
      down: 1.75,
      mode: "higher_is_down" as const,
    };
  }

  return {
    up: 160,
    down: 100,
    mode: "lower_is_down" as const,
  };
}

function getDisplayStage(
  exercise: ExerciseKey,
  angle?: number | null,
  stage?: string
) {
  if (exercise === "plank") {
    return "Hold";
  }

  if (angle === undefined || angle === null || Number.isNaN(Number(angle))) {
    return stage === "down" ? "Down Position" : "Up Position";
  }

  if (exercise === "squat") {
    if (angle > 155) return "Standing";
    if (angle < 95) return "Deep Squat";
    return "Going Down / Coming Up";
  }

  if (exercise === "pushup") {
    if (angle > 150) return "Up Position";
    if (angle < 115) return "Down Position";
    return "Going Down / Coming Up";
  }

  if (exercise === "bicep_curl") {
    if (angle > 145) return "Arm Extended";
    if (angle < 85) return "Arm Curled";
    return "Curling / Extending";
  }

  if (exercise === "lunge") {
    if (angle > 150) return "Standing";
    if (angle < 110) return "Lunge Down";
    return "Going Down / Coming Up";
  }

  if (exercise === "situp") {
    if (angle > 135) return "Lying Down";
    if (angle < 95) return "Sit-up Position";
    return "Going Up / Going Down";
  }

  if (exercise === "jumping_jack") {
    if (angle < 1.35) return "Closed Position";
    if (angle > 1.75) return "Open Position";
    return "Opening / Closing";
  }

  return stage || "Waiting";
}

export default function ExerciseCameraScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSendingRef = useRef(false);

  const lastSpokenMessageRef = useRef("");
  const lastSpokenTimeRef = useRef(0);

  const repStageRef = useRef<"up" | "down" | "hold">("up");
  const repCountRef = useRef(0);
  const plankStartTimeRef = useRef<number | null>(null);
  const plankToleranceRef = useRef(0);

  const [permission, requestPermission] = useCameraPermissions();
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseKey>("squat");

  const [isLive, setIsLive] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [lastError, setLastError] = useState("");

  const [repState, setRepState] = useState<RepState>({
    rep_count: 0,
    stage: "up",
    hold_seconds: 0,
    last_rep_completed: false,
  });

  useEffect(() => {
    return () => {
      stopLiveAnalysis();
      Speech.stop();
    };
  }, []);

  const resetRepCounter = () => {
    repStageRef.current = "up";
    repCountRef.current = 0;
    plankStartTimeRef.current = null;
    plankToleranceRef.current = 0;

    setRepState({
      rep_count: 0,
      stage: "up",
      hold_seconds: 0,
      last_rep_completed: false,
    });
  };

  const speakFeedback = async (message: string) => {
    if (!voiceEnabled || !message) return;

    const now = Date.now();
    const sameMessage = lastSpokenMessageRef.current === message;
    const tooSoon = now - lastSpokenTimeRef.current < 2000;

    if (sameMessage && tooSoon) return;

    lastSpokenMessageRef.current = message;
    lastSpokenTimeRef.current = now;

    try {
      await Speech.stop();

      Speech.speak(message, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (error) {
      console.log("Speech error:", error);
    }
  };

  const updateFrontendRepCounter = (data: AnalysisResult) => {
    if (!data.pose_detected) return;
    if (data.exercise_match === false) return;

    if (selectedExercise === "plank") {
      if (data.status === "Correct") {
        plankToleranceRef.current = 0;

        if (plankStartTimeRef.current === null) {
          plankStartTimeRef.current = Date.now();
        }

        const holdSeconds = Math.floor(
          (Date.now() - plankStartTimeRef.current) / 1000
        );

        setRepState({
          rep_count: 0,
          stage: "hold",
          hold_seconds: holdSeconds,
          last_rep_completed: false,
        });
      } else {
        plankToleranceRef.current += 1;

        if (plankToleranceRef.current > 15) {
          plankStartTimeRef.current = null;

          setRepState({
            rep_count: 0,
            stage: "hold",
            hold_seconds: 0,
            last_rep_completed: false,
          });
        }
      }

      return;
    }

    if (data.primary_angle === undefined || data.primary_angle === null) {
      return;
    }

    const value = Number(data.primary_angle);

    if (Number.isNaN(value)) return;

    const thresholds = getRepThresholds(selectedExercise);

    let currentStage = repStageRef.current;
    let currentRepCount = repCountRef.current;
    let repCompleted = false;

    if (thresholds.mode === "lower_is_down") {
      if (value < thresholds.down && currentStage === "up") {
        currentStage = "down";
      }

      if (value > thresholds.up && currentStage === "down") {
        currentStage = "up";
        currentRepCount += 1;
        repCompleted = true;
      }
    }

    if (thresholds.mode === "higher_is_down") {
      if (value > thresholds.down && currentStage === "up") {
        currentStage = "down";
      }

      if (value < thresholds.up && currentStage === "down") {
        currentStage = "up";
        currentRepCount += 1;
        repCompleted = true;
      }
    }

    repStageRef.current = currentStage;
    repCountRef.current = currentRepCount;

    setRepState({
      rep_count: currentRepCount,
      stage: currentStage,
      hold_seconds: 0,
      last_rep_completed: repCompleted,
    });

    if (repCompleted) {
      speakFeedback(`One repetition completed. Total reps ${currentRepCount}`);
    }
  };

  const sendFrameToApi = async () => {
    if (!cameraRef.current || isSendingRef.current) return;

    try {
      isSendingRef.current = true;
      setIsSending(true);
      setLastError("");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        throw new Error("Camera frame capture failed.");
      }

      const formData = new FormData();

      formData.append("exercise", selectedExercise);

      formData.append("frame", {
        uri: photo.uri,
        name: "camera_frame.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(`${ML_API_BASE_URL_EXERCISE}/analyze-frame`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Frame analysis request failed.");
      }

      const data = (await response.json()) as AnalysisResult;

      console.log("ML API RESULT:", data);

      setResult(data);
      updateFrontendRepCounter(data);

      if (!repState.last_rep_completed) {
        const message = buildVoiceMessage(data);
        speakFeedback(message);
      }
    } catch (error: any) {
      console.log("ML API ERROR:", error?.message || error);
      setLastError(error?.message || "Failed to analyze frame.");
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const startLiveAnalysis = () => {
    if (intervalRef.current) return;

    setResult(null);
    setLastError("");
    resetRepCounter();
    setIsLive(true);

    lastSpokenMessageRef.current = "";
    lastSpokenTimeRef.current = 0;

    sendFrameToApi();

    intervalRef.current = setInterval(() => {
      sendFrameToApi();
    }, 1000);
  };

  const stopLiveAnalysis = () => {
    setIsLive(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    isSendingRef.current = false;
    setIsSending(false);
    Speech.stop();
  };

  const handleToggleLive = () => {
    if (isLive) {
      stopLiveAnalysis();
    } else {
      startLiveAnalysis();
    }
  };

  const liveStatus = result?.status || "Waiting...";
  const statusColor = getStatusColor(liveStatus);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.mutedText}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera Permission Needed</Text>
        <Text style={styles.mutedText}>
          FITSHIELD needs camera access to analyze your exercise posture.
        </Text>

        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        mode="picture"
      />

      <Pressable
        style={styles.backButton}
        onPress={() => {
          stopLiveAnalysis();
          Speech.stop();
          router.replace("/(tabs)/home" as any);
        }}
      >
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>

      <View style={styles.panel}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Real-time Posture Analysis</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.exerciseRow}
          >
            {EXERCISES.map((item) => {
              const active = selectedExercise === item.value;

              return (
                <Pressable
                  key={item.value}
                  style={[
                    styles.exerciseChip,
                    active && styles.exerciseChipActive,
                  ]}
                  onPress={() => {
                    stopLiveAnalysis();
                    setSelectedExercise(item.value);
                    setResult(null);
                    setLastError("");
                    resetRepCounter();
                    Speech.stop();
                    lastSpokenMessageRef.current = "";
                    lastSpokenTimeRef.current = 0;
                  }}
                >
                  <Text
                    style={[
                      styles.exerciseChipText,
                      active && styles.exerciseChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.actionRow}>
            <Pressable
              style={[
                styles.primaryButton,
                styles.liveButton,
                isLive && styles.stopButton,
              ]}
              onPress={handleToggleLive}
            >
              <Text style={styles.primaryButtonText}>
                {isLive ? "Stop Live Analysis" : "Start Live Analysis"}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.voiceButton,
                voiceEnabled ? styles.voiceButtonOn : styles.voiceButtonOff,
              ]}
              onPress={() => {
                setVoiceEnabled((prev) => !prev);
                Speech.stop();
              }}
            >
              <Text style={styles.voiceButtonText}>
                {voiceEnabled ? "Voice On" : "Voice Off"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.cardLabel}>Selected Exercise</Text>
            <Text style={styles.cardValue}>{selectedExercise}</Text>

            <Text style={styles.cardLabel}>Live Status</Text>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {liveStatus}
            </Text>

            <View style={styles.repBox}>
              <Text style={styles.cardLabel}>
                {selectedExercise === "plank"
                  ? "Plank Hold Time"
                  : "Exercise Count"}
              </Text>

              <Text style={styles.repCountText}>
                {selectedExercise === "plank"
                  ? `${repState.hold_seconds}s`
                  : repState.rep_count}
              </Text>

              <Text style={styles.cardLabel}>Current Phase</Text>
              <Text style={styles.cardValue}>
                {getDisplayStage(
                  selectedExercise,
                  result?.primary_angle,
                  repState.stage
                )}
              </Text>

              {repState.last_rep_completed &&
              selectedExercise !== "plank" ? (
                <Text style={styles.completedText}>Rep Completed</Text>
              ) : null}
            </View>

            {isSending ? (
              <Text style={styles.mutedText}>Analyzing current frame...</Text>
            ) : null}

            {result?.pose_detected === false ? (
              <Text style={styles.errorText}>
                No pose detected. Keep your full body visible.
              </Text>
            ) : null}

            {result?.exercise_match === false ? (
              <Text style={styles.errorText}>
                Exercise mismatch detected. Please select the correct exercise.
              </Text>
            ) : null}

            {result?.primary_angle_name &&
            result?.primary_angle !== undefined &&
            result?.primary_angle !== null ? (
              <>
                <Text style={styles.cardLabel}>Primary Angle</Text>
                <Text style={styles.cardValue}>
                  {result.primary_angle_name}:{" "}
                  {Number(result.primary_angle).toFixed(2)}
                </Text>
              </>
            ) : null}

            {result?.secondary_angle_name &&
            result?.secondary_angle_name !== "N/A" &&
            result?.secondary_angle !== undefined &&
            result?.secondary_angle !== null ? (
              <>
                <Text style={styles.cardLabel}>Secondary Angle</Text>
                <Text style={styles.cardValue}>
                  {result.secondary_angle_name}:{" "}
                  {Number(result.secondary_angle).toFixed(2)}
                </Text>
              </>
            ) : null}

            {result?.feedback?.length ? (
              <>
                <Text style={styles.cardLabel}>Feedback</Text>
                {result.feedback.slice(0, 3).map((msg, index) => (
                  <Text key={`${msg}-${index}`} style={styles.feedbackText}>
                    • {msg}
                  </Text>
                ))}
              </>
            ) : null}

            {result?.ml_prediction ? (
              <>
                <Text style={styles.cardLabel}>ML Prediction</Text>
                <Text style={styles.cardValue}>
                  {formatLabel(result.ml_prediction.label)} (
                  {result.ml_prediction.confidence_level})
                </Text>
                <Text style={styles.mutedText}>
                  Confidence: {result.ml_prediction.confidence}
                </Text>
              </>
            ) : (
              <Text style={styles.mutedText}>
                ML:{" "}
                {result
                  ? result.ml_enabled
                    ? "Waiting for ML prediction..."
                    : "Rule-based mode"
                  : "Waiting for result..."}
              </Text>
            )}

            {lastError ? (
              <Text style={styles.errorText}>{lastError}</Text>
            ) : null}
          </View>

          <Text style={styles.noteText}>
            Keep your full body visible. For best results, place the phone in a
            stable position and exercise in good lighting.
          </Text>

          <Text style={styles.noteText}>
            Count updates after completing a full movement: up → down → up.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },
  camera: {
    flex: 1,
  },
  panel: {
    maxHeight: "63%",
    backgroundColor: "#0B1020",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: "#050816",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  mutedText: {
    color: "#A7B0C0",
    fontSize: 13,
    lineHeight: 18,
  },
  exerciseRow: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  exerciseChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#27314A",
    backgroundColor: "#111827",
  },
  exerciseChipActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  exerciseChipText: {
    color: "#CBD5E1",
    fontWeight: "700",
  },
  exerciseChipTextActive: {
    color: "#06130A",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#22C55E",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  liveButton: {
    flex: 1,
  },
  stopButton: {
    backgroundColor: "#EF4444",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  voiceButton: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceButtonOn: {
    backgroundColor: "#2563EB",
  },
  voiceButtonOff: {
    backgroundColor: "#475569",
  },
  voiceButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  statusCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#27314A",
    gap: 6,
  },
  repBox: {
    backgroundColor: "#0B1224",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#22C55E",
    marginVertical: 8,
  },
  cardLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
  },
  cardValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  statusText: {
    fontSize: 20,
    fontWeight: "900",
  },
  repCountText: {
    color: "#22C55E",
    fontSize: 44,
    fontWeight: "900",
    marginVertical: 2,
  },
  completedText: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
  },
  feedbackText: {
    color: "#E2E8F0",
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: "#F87171",
    fontSize: 13,
    marginTop: 4,
  },
  noteText: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
    marginBottom: 2,
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(5, 8, 22, 0.82)",
    borderWidth: 1,
    borderColor: "#FF7A00",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    shadowColor: "#FF7A00",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  backButtonText: {
    color: "#FF7A00",
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 42,
    marginTop: -4,
  },
});