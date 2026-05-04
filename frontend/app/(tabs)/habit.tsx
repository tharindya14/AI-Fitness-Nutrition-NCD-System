import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HabitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adaptive Habit Evaluation Engine</Text>
      <Text style={styles.text}>This module will be developed next.</Text>
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
  title: {
    color: "#FF7A00",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  text: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 15,
    textAlign: "center",
  },
});