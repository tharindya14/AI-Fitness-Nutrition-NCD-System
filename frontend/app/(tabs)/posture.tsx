import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

export default function PostureScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.badge}>FITSHIELD</Text>

        <Text style={styles.title}>Posture Detection</Text>

        <Text style={styles.text}>
          Select an exercise and start real-time camera posture analysis.
        </Text>

        <Link href={"/(tabs)/exercise-camera" as any} asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Start Exercise Camera</Text>
          </Pressable>
        </Link>

        <Text style={styles.note}>
          Supported exercises: Squat, Push-up, Bicep Curl, Lunge, Plank,
          Sit-up, and Jumping Jack.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#111111",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#272727",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#FF7A00",
    color: "#050505",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 14,
  },
  title: {
    color: "#FF7A00",
    fontSize: 28,
    fontWeight: "900",
  },
  text: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 22,
    backgroundColor: "#FF7A00",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#050505",
    fontSize: 16,
    fontWeight: "900",
  },
  note: {
    color: "#A3A3A3",
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
  },
});