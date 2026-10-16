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

const exerciseStepImages = {
  squat: [
    require("../../assets/images/posture/squat_step_1.png"),
    require("../../assets/images/posture/squat_step_2.png"),
    require("../../assets/images/posture/squat_step_3.png"),
  ],
  pushup: [
    require("../../assets/images/posture/pushup_step_1.png"),
    require("../../assets/images/posture/pushup_step_2.png"),
    require("../../assets/images/posture/pushup_step_3.png"),
  ],
  bicep_curl: [
    require("../../assets/images/posture/bicep_curl_step_1.png"),
    require("../../assets/images/posture/bicep_curl_step_2.png"),
    require("../../assets/images/posture/bicep_curl_step_3.png"),
  ],
  lunge: [
    require("../../assets/images/posture/lunge_step_1.png"),
    require("../../assets/images/posture/lunge_step_2.png"),
    require("../../assets/images/posture/lunge_step_3.png"),
  ],
  plank: [
    require("../../assets/images/posture/plank_step_1.png"),
    require("../../assets/images/posture/plank_step_2.png"),
    require("../../assets/images/posture/plank_step_3.png"),
  ],
  situp: [
    require("../../assets/images/posture/situp_step_1.png"),
    require("../../assets/images/posture/situp_step_2.png"),
    require("../../assets/images/posture/situp_step_3.png"),
  ],
  jumping_jack: [
    require("../../assets/images/posture/jumping_jack_step_1.png"),
    require("../../assets/images/posture/jumping_jack_step_2.png"),
    require("../../assets/images/posture/jumping_jack_step_3.png"),
  ],
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

type StepGuideItem = {
  title: string;
  description: string;
  image: any;
};

type ExerciseInstructionData = {
  title: string;
  category: string;
  heroImage: any;
  cameraPosition: string;
  bodyVisibility: string;
  stepGuide: StepGuideItem[];
  commonMistakes: string[];
  videoInstruction: string;
  bestFor: string;
};

const exerciseData: Record<ExerciseKey, ExerciseInstructionData> = {
  squat: {
    title: "Squat",
    category: "Lower Body",
    heroImage: exerciseHeroImages.squat,
    cameraPosition:
      "Place the phone in front or slightly side angle. Keep the camera stable.",
    bodyVisibility:
      "Head, shoulders, hips, knees, and feet should be fully visible.",
    stepGuide: [
      {
        title: "Start Position",
        description:
          "Stand with feet shoulder-width apart. Keep your chest up and back straight.",
        image: exerciseStepImages.squat[0],
      },
      {
        title: "Lower Your Body",
        description:
          "Lower your hips like sitting on a chair. Keep knees aligned with your toes.",
        image: exerciseStepImages.squat[1],
      },
      {
        title: "Return Up",
        description:
          "Push through your heels and return to standing position slowly.",
        image: exerciseStepImages.squat[2],
      },
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
    stepGuide: [
      {
        title: "High Plank Position",
        description:
          "Place hands under shoulders. Keep your body straight from head to heels.",
        image: exerciseStepImages.pushup[0],
      },
      {
        title: "Lower Your Chest",
        description:
          "Bend elbows and lower your chest toward the floor without dropping hips.",
        image: exerciseStepImages.pushup[1],
      },
      {
        title: "Push Back Up",
        description:
          "Push your body upward while keeping your core tight and body aligned.",
        image: exerciseStepImages.pushup[2],
      },
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
    stepGuide: [
      {
        title: "Start Position",
        description:
          "Stand straight with arms down and elbows close to your body.",
        image: exerciseStepImages.bicep_curl[0],
      },
      {
        title: "Curl Up",
        description:
          "Curl the weight upward slowly while keeping your upper arm stable.",
        image: exerciseStepImages.bicep_curl[1],
      },
      {
        title: "Lower Slowly",
        description:
          "Lower the weight with control and avoid swinging your body.",
        image: exerciseStepImages.bicep_curl[2],
      },
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
    stepGuide: [
      {
        title: "Start Position",
        description:
          "Stand straight with feet hip-width apart and keep your upper body stable.",
        image: exerciseStepImages.lunge[0],
      },
      {
        title: "Step Forward",
        description:
          "Step one leg forward and lower your back knee toward the floor.",
        image: exerciseStepImages.lunge[1],
      },
      {
        title: "Return Back",
        description:
          "Push back to the starting position while keeping the front knee aligned.",
        image: exerciseStepImages.lunge[2],
      },
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
    stepGuide: [
      {
        title: "Set Your Position",
        description:
          "Place elbows or hands on the floor and keep shoulders aligned.",
        image: exerciseStepImages.plank[0],
      },
      {
        title: "Align Your Body",
        description:
          "Keep your body straight from head to ankles and engage your core.",
        image: exerciseStepImages.plank[1],
      },
      {
        title: "Hold Stable",
        description:
          "Hold the position without raising or dropping your hips.",
        image: exerciseStepImages.plank[2],
      },
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
    stepGuide: [
      {
        title: "Lie Down",
        description:
          "Lie on your back with knees bent and feet placed firmly on the floor.",
        image: exerciseStepImages.situp[0],
      },
      {
        title: "Lift Upper Body",
        description:
          "Raise your upper body toward your knees using your core muscles.",
        image: exerciseStepImages.situp[1],
      },
      {
        title: "Lower Slowly",
        description:
          "Lower your body back down slowly with control.",
        image: exerciseStepImages.situp[2],
      },
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
    stepGuide: [
      {
        title: "Start Position",
        description:
          "Stand straight with feet together and arms by your sides.",
        image: exerciseStepImages.jumping_jack[0],
      },
      {
        title: "Jump Out",
        description:
          "Jump feet outward while raising your arms above your head.",
        image: exerciseStepImages.jumping_jack[1],
      },
      {
        title: "Return In",
        description:
          "Jump back to the starting position and lower your arms smoothly.",
        image: exerciseStepImages.jumping_jack[2],
      },
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
          <Text style={styles.sectionTitle}>Step-by-Step Visual Guide</Text>

          {data.stepGuide.map((step, index) => (
            <VisualStepCard
              key={`${step.title}-${index}`}
              number={index + 1}
              title={step.title}
              description={step.description}
              image={step.image}
            />
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

function VisualStepCard({
  number,
  title,
  description,
  image,
}: {
  number: number;
  title: string;
  description: string;
  image: any;
}) {
  return (
    <View style={styles.visualStepCard}>
      <View style={styles.visualStepImageBox}>
        <Image source={image} style={styles.visualStepImage} resizeMode="contain" />
      </View>

      <View style={styles.visualStepContent}>
        <View style={styles.stepHeaderRow}>
          <View style={styles.stepNumberBox}>
            <Text style={styles.stepNumber}>{number}</Text>
          </View>

          <Text style={styles.visualStepTitle}>{title}</Text>
        </View>

        <Text style={styles.visualStepDescription}>{description}</Text>
      </View>
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

  visualStepCard: {
  backgroundColor: "#050505",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.1)",
  borderRadius: 24,
  overflow: "hidden",
  marginBottom: 20,
},
visualStepImageBox: {
  width: "100%",
  height: 430,
  backgroundColor: "#020202",
  alignItems: "center",
  justifyContent: "center",
  borderBottomWidth: 1,
  borderBottomColor: "rgba(255,122,0,0.22)",
},
 visualStepImage: {
  width: "100%",
  height: "100%",
},
  visualStepContent: {
    padding: 18,
  },
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepNumberBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,122,0,0.15)",
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  stepNumber: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: "900",
  },
  visualStepTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "900",
    flex: 1,
  },
  visualStepDescription: {
    color: "#d0d0d0",
    fontSize: 13,
    lineHeight: 20,
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