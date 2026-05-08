import React from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

const exerciseHeroImages = {
  squat: require("../../assets/images/posture/squat_hero.png"),
  lunge: require("../../assets/images/posture/lunge_hero.png"),
  pushup: require("../../assets/images/posture/pushup_hero.png"),
  bicep_curl: require("../../assets/images/posture/bicep_curl_hero.png"),
  plank: require("../../assets/images/posture/plank_hero.png"),
  situp: require("../../assets/images/posture/situp_hero.png"),
  jumping_jack: require("../../assets/images/posture/jumping_jack_hero.png"),
};
const iconCamera = require("../../assets/images/posture/icon_camera.png");
const iconGuidance = require("../../assets/images/posture/icon_guidance.png");
const iconExercises = require("../../assets/images/posture/icon_exercises.png");

type ExerciseKey =
  | "squat"
  | "pushup"
  | "bicep_curl"
  | "lunge"
  | "plank"
  | "situp"
  | "jumping_jack";

const exerciseData: Record<
  ExerciseKey,
  {
  title: string;
  category: string;
  heroImage: any;
  cameraPosition: string;
  bodyVisibility: string;
  howToPerform: string[];
  commonMistakes: string[];
  videoInstruction: string;
  bestFor: string;
}
> = {
  squat: {
    title: "Squat",
    category: "Lower Body",
    heroImage: exerciseHeroImages.squat,
    cameraPosition:
      "Place the phone in front or slightly side angle. Keep the camera stable.",
    bodyVisibility:
      "Head, shoulders, hips, knees, and feet should be fully visible.",
    howToPerform: [
      "Stand with feet shoulder-width apart.",
      "Keep your chest up and back straight.",
      "Lower your hips like sitting on a chair.",
      "Keep knees aligned with toes.",
      "Return to standing position slowly.",
    ],
    commonMistakes: [
      "Knees moving inward.",
      "Heels lifting from the floor.",
      "Back bending too far forward.",
      "Not going low enough.",
    ],
    videoInstruction:
      "Recommended practical video: side/front squat demonstration showing full body movement.",
    bestFor: "Leg strength, hip control, knee stability, and posture balance.",
  },

  pushup: {
    title: "Push-up",
    category: "Upper Body",
    heroImage: exerciseHeroImages.pushup,
    cameraPosition:
      "Place the phone from side view. Camera should capture full body horizontally.",
    bodyVisibility:
      "Shoulders, elbows, wrists, hips, knees, and ankles should be visible.",
    howToPerform: [
      "Start in a plank position.",
      "Keep body straight from shoulders to ankles.",
      "Lower your chest toward the floor.",
      "Keep elbows controlled.",
      "Push back up without dropping hips.",
    ],
    commonMistakes: [
      "Hips dropping too low.",
      "Hips too high.",
      "Elbows flaring too much.",
      "Incomplete range of motion.",
    ],
    videoInstruction:
      "Recommended practical video: side-view push-up showing shoulder, elbow, and hip alignment.",
    bestFor: "Chest, shoulders, arms, core strength, and body alignment.",
  },

  bicep_curl: {
    title: "Bicep Curl",
    category: "Upper Body",
    heroImage: exerciseHeroImages.bicep_curl,
    cameraPosition:
      "Place the phone in front view. Upper body and both arms should be visible.",
    bodyVisibility:
      "Shoulders, elbows, wrists, hips, and torso should be clearly visible.",
    howToPerform: [
      "Stand straight with arms down.",
      "Keep elbows close to the body.",
      "Curl the weight upward slowly.",
      "Avoid moving the upper arm too much.",
      "Lower the arm with control.",
    ],
    commonMistakes: [
      "Swinging the body.",
      "Leaning backward.",
      "Moving elbows forward.",
      "Not completing the curl.",
    ],
    videoInstruction:
      "Recommended practical video: front-view bicep curl showing elbow stability.",
    bestFor: "Arm strength, elbow control, and upper-body stability.",
  },

  lunge: {
    title: "Lunge",
    category: "Lower Body",
    heroImage: exerciseHeroImages.lunge,
    cameraPosition:
      "Use side view. Place the phone far enough to capture both legs.",
    bodyVisibility:
      "Hips, knees, ankles, and feet should be visible during the full movement.",
    howToPerform: [
      "Stand straight with feet hip-width apart.",
      "Step one leg forward.",
      "Lower your back knee toward the floor.",
      "Keep front knee aligned with ankle.",
      "Push back to starting position.",
    ],
    commonMistakes: [
      "Front knee going too far forward.",
      "Back knee not bending.",
      "Torso leaning too much.",
      "Feet placed too close together.",
    ],
    videoInstruction:
      "Recommended practical video: side-view lunge showing front knee and back leg alignment.",
    bestFor: "Leg control, balance, hip stability, and lower-body strength.",
  },

  plank: {
    title: "Plank",
    category: "Core",
    heroImage: exerciseHeroImages.plank,
    cameraPosition:
      "Use side view. Keep phone stable at floor/body level if possible.",
    bodyVisibility:
      "Head, shoulders, hips, knees, and ankles should be visible in one frame.",
    howToPerform: [
      "Start on elbows or hands.",
      "Keep shoulders above elbows/wrists.",
      "Keep body in one straight line.",
      "Engage your core.",
      "Hold the position without dropping hips.",
    ],
    commonMistakes: [
      "Hips too high.",
      "Hips too low.",
      "Back arching.",
      "Shoulders not aligned.",
    ],
    videoInstruction:
      "Recommended practical video: side-view plank showing straight body line.",
    bestFor: "Core strength, posture control, and shoulder stability.",
  },

  situp: {
    title: "Sit-up",
    category: "Core",
    heroImage: exerciseHeroImages.situp,
    cameraPosition:
      "Place the phone from side view. Keep upper body and knees visible.",
    bodyVisibility:
      "Head, shoulders, hips, and knees should be visible throughout the movement.",
    howToPerform: [
      "Lie down with knees bent.",
      "Keep feet stable.",
      "Raise upper body toward knees.",
      "Control the movement.",
      "Lower back down slowly.",
    ],
    commonMistakes: [
      "Using neck too much.",
      "Moving too fast.",
      "Feet lifting from floor.",
      "Incomplete upper-body movement.",
    ],
    videoInstruction:
      "Recommended practical video: side-view sit-up showing upper-body movement.",
    bestFor: "Core strength and abdominal control.",
  },

  jumping_jack: {
    title: "Jumping Jack",
    category: "Full Body",
    heroImage: exerciseHeroImages.jumping_jack,
    cameraPosition:
      "Use front view. Place the phone far enough to capture arms and legs fully.",
    bodyVisibility:
      "Full body should be visible because arms and legs move outward.",
    howToPerform: [
      "Stand straight with arms by your sides.",
      "Jump feet outward while raising arms.",
      "Return feet together while lowering arms.",
      "Keep rhythm controlled.",
      "Continue movement smoothly.",
    ],
    commonMistakes: [
      "Arms not raising fully.",
      "Feet not opening enough.",
      "Body moving out of camera frame.",
      "Poor rhythm or unstable landing.",
    ],
    videoInstruction:
      "Recommended practical video: front-view jumping jack showing full-body movement.",
    bestFor: "Cardio, coordination, and full-body movement.",
  },
};

export default function PostureInstructionScreen() {
  const params = useLocalSearchParams();
  const exercise = String(params.exercise || "squat") as ExerciseKey;

  const data = exerciseData[exercise] || exerciseData.squat;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.homeBackButton}
          onPress={() => router.replace("/(tabs)/posture-exercises" as any)}
        >
          <Text style={styles.homeBackIcon}>‹</Text>
          <Text style={styles.homeBackText}>Exercises</Text>
        </Pressable>

        <View style={styles.heroBox}>
          <View style={styles.heroTextBox}>
            <Text style={styles.categoryText}>{data.category}</Text>
            <Text style={styles.titlePremium}>{data.title}</Text>
            <Text style={styles.subtitlePremium}>
              Practical camera setup, posture guidance, and common mistakes.
            </Text>
          </View>

          <Image source={data.heroImage} style={styles.heroImage} />
        </View>

        <View style={styles.mainCard}>
          <InstructionBlock
            icon={iconCamera}
            title="Camera Position"
            text={data.cameraPosition}
          />

          <InstructionBlock
            icon={iconExercises}
            title="Body Visibility"
            text={data.bodyVisibility}
          />

          <InstructionBlock
            icon={iconGuidance}
            title="Practical Video Guide"
            text={data.videoInstruction}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>How to Perform</Text>

          {data.howToPerform.map((step, index) => (
            <StepRow key={step} number={index + 1} text={step} />
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Common Mistakes</Text>

          {data.commonMistakes.map((mistake) => (
            <MistakeRow key={mistake} text={mistake} />
          ))}
        </View>

        <View style={styles.bestForCard}>
          <Text style={styles.bestForTitle}>Best For</Text>
          <Text style={styles.bestForText}>{data.bestFor}</Text>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/(tabs)/exercise-camera" as any)}
        >
          <Text style={styles.primaryButtonText}>Start Live Analysis</Text>
          <Text style={styles.primaryButtonArrow}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function InstructionBlock({
  icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.instructionBlock}>
      <Image source={icon} style={styles.blockIcon} />

      <View style={styles.blockTextBox}>
        <Text style={styles.blockTitle}>{title}</Text>
        <Text style={styles.blockText}>{text}</Text>
      </View>
    </View>
  );
}

function StepRow({ number, text }: { number: number; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumberBox}>
        <Text style={styles.stepNumber}>{number}</Text>
      </View>

      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

function MistakeRow({ text }: { text: string }) {
  return (
    <View style={styles.mistakeRow}>
      <Text style={styles.mistakeDot}>●</Text>
      <Text style={styles.mistakeText}>{text}</Text>
    </View>
  );
}

const ORANGE = "#ff7a00";
const DARK = "#050505";
const CARD = "#111111";
const BORDER = "#2a2a2a";
const TEXT = "#ffffff";
const MUTED = "#a9a9a9";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 46,
  },

  homeBackButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 10,
    paddingVertical: 6,
    paddingRight: 12,
  },
  homeBackIcon: {
    color: ORANGE,
    fontSize: 34,
    fontWeight: "900",
    marginRight: 4,
    marginTop: -3,
  },
  homeBackText: {
    color: ORANGE,
    fontSize: 15,
    fontWeight: "900",
  },

  heroBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },
  heroTextBox: {
    flex: 1.15,
    zIndex: 2,
  },
  categoryText: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  titlePremium: {
    color: TEXT,
    fontSize: 46,
    fontWeight: "900",
    lineHeight: 54,
    letterSpacing: -1.2,
  },
  subtitlePremium: {
    color: "#d8d8d8",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "700",
    marginTop: 14,
    width: "94%",
  },
  heroImage: {
    width: 160,
    height: 190,
    resizeMode: "contain",
    marginLeft: -28,
  },

  mainCard: {
    backgroundColor: "rgba(255,122,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.45)",
    borderRadius: 28,
    padding: 16,
    marginBottom: 18,
  },
  instructionBlock: {
    backgroundColor: "#050505",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  blockIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginRight: 14,
  },
  blockTextBox: {
    flex: 1,
  },
  blockTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
  },
  blockText: {
    color: "#cfcfcf",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    marginTop: 5,
  },

  sectionCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 11,
  },
  stepNumberBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,122,0,0.15)",
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  stepNumber: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: "900",
  },
  stepText: {
    flex: 1,
    color: "#d0d0d0",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  mistakeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  mistakeDot: {
    color: ORANGE,
    fontSize: 12,
    marginTop: 5,
    marginRight: 10,
  },
  mistakeText: {
    color: "#d0d0d0",
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },

  bestForCard: {
    backgroundColor: "rgba(255,122,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.35)",
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
  },
  bestForTitle: {
    color: ORANGE,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 7,
  },
  bestForText: {
    color: "#d0d0d0",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },

  primaryButton: {
    backgroundColor: ORANGE,
    borderRadius: 18,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: ORANGE,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#050505",
    fontSize: 17,
    fontWeight: "900",
  },
  primaryButtonArrow: {
    color: "#050505",
    fontSize: 30,
    fontWeight: "900",
    marginLeft: 8,
    marginTop: -3,
  },
});