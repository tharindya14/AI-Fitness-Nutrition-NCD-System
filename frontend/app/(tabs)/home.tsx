import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.name}>FITSHIELD User 👋</Text>
          </View>

          <View style={styles.bellBox}>
            <Text style={styles.bell}>🔔</Text>
          </View>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.sectionTitle}>Today’s Overview</Text>

          <View style={styles.overviewRow}>
            <View style={styles.scoreCircle}>
              <Text style={styles.score}>82</Text>
              <Text style={styles.scoreText}>Health Score</Text>
            </View>

            <View style={styles.statsColumn}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Steps</Text>
                <Text style={styles.statValue}>7,246</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Calories</Text>
                <Text style={styles.statValue}>562 kcal</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Sleep</Text>
                <Text style={styles.statValue}>7h 23m</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.mainTitle}>Modules</Text>
        <Text style={styles.mainSubTitle}>AI Systems</Text>

        <ModuleCard
          icon="💊"
          title="Smart Supplement Advisory System"
          description="Get personalised supplement recommendations and safety alerts."
          onPress={() => router.push("/supplement")}
        />

        <ModuleCard
          icon="🧍"
          title="Posture Detection System"
          description="Analyse your posture and identify fitness-related risks."
          onPress={() => router.push("/posture")}
        />

        <ModuleCard
          icon="🥗"
          title="Food / Drug Interaction Checker"
          description="Check interactions between foods and medicines."
          onPress={() => router.push("/diet")}
        />

        <ModuleCard
          icon="🧠"
          title="Adaptive Habit Evaluation Engine"
          description="Evaluate daily habits and improve your health routine."
          onPress={() => router.push("/habit")}
        />

        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>AI Coach Tip</Text>
            <Text style={styles.tipText}>
              Keep your nutrition and medication details updated for better
              safety suggestions.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type ModuleCardProps = {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
};

function ModuleCard({ icon, title, description, onPress }: ModuleCardProps) {
  return (
    <Pressable style={styles.moduleCard} onPress={onPress}>
      <View style={styles.moduleTextBox}>
        <Text style={styles.moduleTitle}>{title}</Text>
        <Text style={styles.moduleDescription}>{description}</Text>

        <View style={styles.arrowButton}>
          <Text style={styles.arrowText}>➜</Text>
        </View>
      </View>

      <View style={styles.iconBox}>
        <Text style={styles.moduleIcon}>{icon}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#050505",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcome: {
    color: "#CFCFCF",
    fontSize: 16,
    fontWeight: "600",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  bellBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2B2B2B",
  },
  bell: {
    fontSize: 18,
  },
  overviewCard: {
    backgroundColor: "#101010",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#242424",
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
  },
  overviewRow: {
    flexDirection: "row",
    gap: 14,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: "#FF7A00",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#080808",
  },
  score: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
  },
  scoreText: {
    color: "#FFB36B",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  statsColumn: {
    flex: 1,
    gap: 10,
  },
  statBox: {
    backgroundColor: "#181818",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2B2B2B",
  },
  statLabel: {
    color: "#929292",
    fontSize: 12,
    fontWeight: "700",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  mainTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 3,
  },
  mainSubTitle: {
    color: "#FF7A00",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 14,
  },
  moduleCard: {
    backgroundColor: "#101010",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    minHeight: 130,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#252525",
    shadowColor: "#FF7A00",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  moduleTextBox: {
    flex: 1,
    paddingRight: 12,
  },
  moduleTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8,
    lineHeight: 22,
  },
  moduleDescription: {
    color: "#A8A8A8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  arrowButton: {
    width: 34,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF7A00",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "900",
  },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  moduleIcon: {
    fontSize: 46,
  },
  tipCard: {
    marginTop: 8,
    backgroundColor: "#101010",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#252525",
  },
  tipIcon: {
    fontSize: 34,
    marginRight: 14,
    color: "#FF7A00",
  },
  tipTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  tipText: {
    color: "#A8A8A8",
    fontSize: 13,
    lineHeight: 18,
  },
});