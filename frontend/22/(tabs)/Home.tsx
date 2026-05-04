import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FITSHIELD</Text>
      <Text style={styles.subtitle}>Select a Module</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/diet")}
      >
        <Text style={styles.cardTitle}>Food-Drug Interaction</Text>
        <Text style={styles.cardText}>Diet and history management</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardTitle}>Supplement Management</Text>
        <Text style={styles.cardText}>Manage supplement safety</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardTitle}>Posture Detection</Text>
        <Text style={styles.cardText}>Analyze posture and fitness risks</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardTitle}>Adaptive Habit Evaluation Engine</Text>
        <Text style={styles.cardText}>Evaluate daily health habits</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#F5FAF7",
    justifyContent: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#1F5C43",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 18,
    color: "#5F6F68",
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E1EEE8",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F5C43",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: "#6B7772",
  },
});