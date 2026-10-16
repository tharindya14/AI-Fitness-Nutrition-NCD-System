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

const postureHero = require("../../assets/images/interaction/interctionHero.png");

const postureIcons = {
  camera: require("../../assets/images/interaction/shield.png"),
  exercises: require("../../assets/images/interaction/patient.png"),
  guidance: require("../../assets/images/interaction/history.png"),
};


export default function PostureScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Pressable
          style={styles.homeBackButton}
          onPress={() => router.replace("/(tabs)/home" as any)}
        >
          <Text style={styles.homeBackIcon}>‹</Text>
          <Text style={styles.homeBackText}>Home</Text>
        </Pressable>

        <View style={styles.heroBox}>
          <View style={styles.heroTextBox}>
            <Text style={styles.titlePremium}>Food-Drug Interaction</Text>
            <Text style={styles.titlePremium}>Checker</Text>

            <Text style={styles.subtitlePremium}>
              Check food and medicine safety before planning your meals.
            </Text>
          </View>

          <Image
            source={postureHero}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.dashboardPage}>
          <View style={styles.dashboardHeaderCard}>
            <View style={styles.dashboardHeaderLeft}>
              <Text style={styles.dashboardGridIcon}>▦</Text>
              <Text style={styles.cardTitlePremium}>
                Diet Safety Dashboard
              </Text>
            </View>
          </View>

          <DashboardOption
            icon={postureIcons.camera}
            title="Interaction Checker"
            subtitle="Check possible safety issues between selected foods and medications."
            onPress={() => router.push("/(tabs)/diet" as any)}
          />

          <DashboardOption
             icon={postureIcons.exercises}
             title="Patient Story Assistant"
             subtitle="Classify patient stories, extract key info, and generate follow-up questions."
             onPress={() => router.push("/" as any)}
           />

          <DashboardOption
            icon={postureIcons.guidance}
            title="History"
            subtitle="View previous food-drug safety checks and saved results."
            onPress={() => router.push("/(tabs)/history" as any)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DashboardOption({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.dashboardOptionPremium,
        pressed && styles.dashboardOptionPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.dashboardIconPremium}>
        <Image source={icon} style={styles.dashboardIconImage} />
      </View>

      <View style={styles.dashboardDivider} />

      <View style={styles.dashboardTextBoxPremium}>
        <Text style={styles.dashboardTitlePremium}>{title}</Text>
        <Text style={styles.dashboardSubtitlePremium}>{subtitle}</Text>
      </View>

      <View style={styles.dashboardArrowCircle}>
        <Text style={styles.dashboardArrowText}>›</Text>
      </View>
    </Pressable>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <View style={styles.tipRow}>
      <Text style={styles.tipDot}>●</Text>
      <Text style={styles.tipText}>{text}</Text>
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
    marginBottom: 34,
  },
  heroTextBox: {
    flex: 1.15,
    zIndex: 2,
  },
  titlePremium: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 40,
    letterSpacing: -1.4,
  },
  subtitlePremium: {
    color: "#d8d8d8",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "700",
    marginTop: 5,
    width: "102%",
  },
  heroImage: {
    width: 190,
    height: 230,
    marginLeft: -34,
    opacity: 0.95,
  },

  dashboardPage: {
    backgroundColor: "rgba(255,122,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.55)",
    borderRadius: 30,
    padding: 18,
    shadowColor: ORANGE,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 9,
    marginBottom: 22,
  },
  dashboardHeaderCard: {
    marginBottom: 18,
    paddingTop: 4,
  },
  dashboardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  dashboardGridIcon: {
    color: ORANGE,
    fontSize: 25,
    fontWeight: "900",
    marginRight: 13,
    marginTop: -2,
  },
  cardTitlePremium: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

 dashboardOptionPremium: {
    minHeight: 116,
    backgroundColor: "rgba(5,5,5,0.96)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: ORANGE,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  dashboardOptionPressed: {
    transform: [{ scale: 0.985 }],
    borderColor: "rgba(255,122,0,0.55)",
  },
 dashboardIconPremium: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  dashboardIconImage: {
    width: 58,
    height: 58,
  },
  dashboardDivider: {
    width: 1,
    height: 66,
    backgroundColor: "rgba(255,122,0,0.75)",
    marginRight: 12,
  },
  dashboardTextBoxPremium: {
    flex: 1,
    paddingRight: 8,
  },
  dashboardTitlePremium: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 23,
    letterSpacing: -0.25,
  },
  dashboardSubtitlePremium: {
    color: "#c8c8c8",
    fontSize: 12,
    lineHeight: 20,
    marginTop: 7,
    fontWeight: "600",
  },
  dashboardArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },

  dashboardArrowText: {
    color: ORANGE,
    fontSize: 32,
    fontWeight: "900",
    marginTop: -4,
  },

  instructionsCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 28,
    padding: 18,
    marginBottom: 18,
  },
  instructionsTitle: {
    color: TEXT,
    fontSize: 24,
    fontWeight: "900",
  },
  instructionsSubtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 16,
    fontWeight: "600",
  },
  exerciseInstructionCard: {
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  exerciseNameBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  exerciseDot: {
    color: ORANGE,
    fontSize: 11,
    marginRight: 9,
  },
  exerciseName: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
  },
  exerciseInstruction: {
    color: "#cfcfcf",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },

  tipsCard: {
    backgroundColor: "rgba(255,122,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.35)",
    borderRadius: 26,
    padding: 18,
  },
  tipsTitle: {
    color: ORANGE,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 9,
  },
  tipDot: {
    color: ORANGE,
    fontSize: 12,
    marginTop: 5,
    marginRight: 10,
  },
  tipText: {
    color: "#d0d0d0",
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
});