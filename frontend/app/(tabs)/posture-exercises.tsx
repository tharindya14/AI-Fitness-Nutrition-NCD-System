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
import { router } from "expo-router";

const iconExercises = require("../../assets/images/posture/icon_exercises-removebg-preview.png");

const exerciseCategories = [
  {
    category: "Lower Body",
    description: "Exercises focused on legs, knees, hips, and lower-body control.",
    exercises: [
      {
        name: "Squat",
        key: "squat",
        subtitle: "Knee angle, hip depth, and body alignment.",
      },
      {
        name: "Lunge",
        key: "lunge",
        subtitle: "Front knee position and leg alignment.",
      },
    ],
  },
  {
    category: "Upper Body",
    description: "Exercises focused on arms, shoulders, chest, and upper-body posture.",
    exercises: [
      {
        name: "Push-up",
        key: "pushup",
        subtitle: "Body alignment, elbow angle, and hip position.",
      },
      {
        name: "Bicep Curl",
        key: "bicep_curl",
        subtitle: "Arm movement, elbow control, and torso stability.",
      },
    ],
  },
  {
    category: "Core & Full Body",
    description: "Exercises focused on core stability and full-body coordination.",
    exercises: [
      {
        name: "Plank",
        key: "plank",
        subtitle: "Hip position, shoulder alignment, and body straightness.",
      },
      {
        name: "Sit-up",
        key: "situp",
        subtitle: "Core movement and upper-body control.",
      },
      {
        name: "Jumping Jack",
        key: "jumping_jack",
        subtitle: "Arm-leg coordination and full-body visibility.",
      },
    ],
  },
];

export default function PostureExercisesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.homeBackButton}
          onPress={() => router.replace("/(tabs)/posture" as any)}
        >
          <Text style={styles.homeBackIcon}>‹</Text>
          <Text style={styles.homeBackText}>Posture</Text>
        </Pressable>

        <View style={styles.heroBox}>
          <View style={styles.heroTextBox}>
            <Text style={styles.titlePremium}>Supported</Text>
            <Text style={styles.titlePremium}>Exercises</Text>

            <Text style={styles.subtitlePremium}>
              Select an exercise to view camera setup, practical guidance, and
              common posture mistakes.
            </Text>
          </View>

          <Image source={iconExercises} style={styles.heroImage} />
        </View>

        {exerciseCategories.map((category) => (
          <View key={category.category} style={styles.categoryCard}>
            <Text style={styles.categoryTitle}>{category.category}</Text>
            <Text style={styles.categoryDescription}>
              {category.description}
            </Text>

            {category.exercises.map((exercise) => (
              <Pressable
                key={exercise.key}
                style={styles.exerciseCard}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/posture-instruction",
                    params: {
                      exercise: exercise.key,
                    },
                  } as any)
                }
              >
                <View style={styles.exerciseIconBox}>
                  <Text style={styles.exerciseIcon}>●</Text>
                </View>

                <View style={styles.exerciseTextBox}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseSubtitle}>
                    {exercise.subtitle}
                  </Text>
                </View>

                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 12,
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
  titlePremium: {
    color: TEXT,
    fontSize: 40,
    fontWeight: "900",
    lineHeight: 48,
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
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginLeft: -20,
  },
  categoryCard: {
    backgroundColor: "rgba(255,122,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.45)",
    borderRadius: 28,
    padding: 18,
    marginBottom: 18,
  },
  categoryTitle: {
    color: TEXT,
    fontSize: 24,
    fontWeight: "900",
  },
  categoryDescription: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 16,
    fontWeight: "600",
  },
  exerciseCard: {
    minHeight: 90,
    backgroundColor: "#050505",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,122,0,0.12)",
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  exerciseIcon: {
    color: ORANGE,
    fontSize: 18,
  },
  exerciseTextBox: {
    flex: 1,
  },
  exerciseName: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
  },
  exerciseSubtitle: {
    color: "#c8c8c8",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    fontWeight: "600",
  },
  arrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: ORANGE,
    fontSize: 32,
    fontWeight: "900",
    marginTop: -4,
  },
});