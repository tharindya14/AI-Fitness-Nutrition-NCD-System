import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { router } from "expo-router";
import { deleteItem } from "@/utils/storage";

export default function HomePage() {
  const logout = async () => {
    await deleteItem("token");
    await deleteItem("latestResult");
    router.replace("/" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>FITSHIELD</Text>
          <Text style={styles.subtitle}>
            Health-Aware Personalized Dietary Recommendation and Safety Advisory System
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Select a Feature</Text>
            <Text style={styles.infoText}>
              Choose whether you want to check food-drug safety risk or view
              personalized food recommendations based on your profile.
            </Text>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.push({
                pathname: "/diet",
              } as any)
            }
          >
            <Text style={styles.primaryText}>Diet Safety Checker</Text>
            <Text style={styles.buttonSubText}>
              Check food-drug interaction, allergy risk, and safer alternatives
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: "/recommendations",
              } as any)
            }
          >
            <Text style={styles.secondaryText}>Personalized Recommendations</Text>
            <Text style={styles.secondarySubText}>
              Get food suggestions using BMI, allergies, and user profile
            </Text>
          </Pressable>

          <Pressable
             style={styles.secondaryButton}
             onPress={() =>
              router.push({
                pathname: "/story-classifier",
              } as any)
            }
          >
            <Text style={styles.secondaryText}>Food-Drug Story Classifier</Text>
            <Text style={styles.secondarySubText}>
              Classify a food and medicine story using NLP
            </Text>
          </Pressable>

          <Pressable
            style={styles.historyButton}
            onPress={() =>
              router.push({
                pathname: "/history",
              } as any)
            }
          >
            <Text style={styles.historyText}>View Safety History</Text>
          </Pressable>

          <Pressable style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F7F4",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#1B4332",
  },
  subtitle: {
    fontSize: 15,
    color: "#5C6B63",
    marginTop: 8,
    lineHeight: 22,
    marginBottom: 22,
  },
  infoBox: {
    backgroundColor: "#F1F5F2",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1B4332",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#344E41",
    lineHeight: 21,
  },
  primaryButton: {
    backgroundColor: "#2D6A4F",
    padding: 18,
    borderRadius: 18,
    marginTop: 10,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 18,
    textAlign: "center",
  },
  buttonSubText: {
    color: "#E8F3EC",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: "#E8F3EC",
    padding: 18,
    borderRadius: 18,
    marginTop: 14,
  },
  secondaryText: {
    color: "#2D6A4F",
    fontWeight: "900",
    fontSize: 18,
    textAlign: "center",
  },
  secondarySubText: {
    color: "#5C6B63",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  historyButton: {
    backgroundColor: "#F1F5F2",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 14,
  },
  historyText: {
    color: "#1B4332",
    fontWeight: "900",
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#C0392B",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 14,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
});