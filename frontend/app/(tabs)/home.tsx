import React, { useEffect, useCallback, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getItem } from "@/utils/storage";
import { API_BASE_URL } from "@/constants/api";

const logo = require("../../assets/images/splash-icon.png");

const heroImage = require("../../assets/images/dashboard/hero.png");
const defaultFemale = require("../../assets/images/dashboard/default-female.png");
const defaultMale = require("../../assets/images/dashboard/default-male.png");

const dietImage = require("../../assets/images/dashboard/diet.png");
const historyImage = require("../../assets/images/dashboard/history.png");
const resultImage = require("../../assets/images/dashboard/result.png");
const exploreImage = require("../../assets/images/dashboard/explore.png");
const supplementImage = require("../../assets/images/dashboard/supplement.png");
const postureImage = require("../../assets/images/dashboard/posture.png");
const habitImage = require("../../assets/images/dashboard/habit.png");

type DashboardCardProps = {
  title: string;
  subtitle: string;
  image: any;
  onPress: () => void;
};

export default function HomeScreen() {
  const [userName, setUserName] = useState("FITSHIELD User");
  const [profileImage, setProfileImage] = useState("");
  const [defaultAvatar, setDefaultAvatar] = useState("");

  useFocusEffect(
  useCallback(() => {
    loadUserData();
  }, [])
);

const normalizeImageUrl = (url: string) => {
  if (!url) return "";

  return url
    .replace("http://localhost:5001", API_BASE_URL)
    .replace("http://127.0.0.1:5001", API_BASE_URL);
};

const getProfileImageSource = () => {
  if (profileImage) {
    return { uri: profileImage };
  }

  if (defaultAvatar === "male") {
    return defaultMale;
  }

  if (defaultAvatar === "female") {
    return defaultFemale;
  }

  return defaultFemale;
};

const loadUserData = async () => {
  try {
    const savedName = await getItem("userName");
    const profileText = await getItem("userProfile");

    if (savedName && savedName.trim().length > 0) {
      setUserName(savedName);
    }

    if (profileText) {
      const profile = JSON.parse(profileText);

      if (profile.fullName) {
        setUserName(profile.fullName);
      }

      setDefaultAvatar(profile.defaultAvatar || "");

      if (profile.profileImage) {
        setProfileImage(normalizeImageUrl(profile.profileImage));
      } else {
        setProfileImage("");
      }
    }
  } catch (error) {
    console.log("Failed to load user data:", error);
  }
};

  const firstName = userName.split(" ")[0] || "User";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>

          <Image source={logo} style={styles.logo} resizeMode="contain" />

          <Pressable style={styles.iconButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.welcomeRow}>
          <View style={styles.welcomeTextBox}>
            <Text style={styles.welcome}>Welcome back,</Text>

            <Text style={styles.userName} numberOfLines={1}>
              {firstName}
            </Text>

            <View style={styles.orangeLine} />

            <Text style={styles.tagline}>
              You've got this. Stay consistent and{" "}
              <Text style={styles.taglineOrange}>make it count.</Text>
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.profileOuter,
              pressed && styles.profilePressed,
            ]}
            onPress={() => router.push("/profile" as any)}
          >
            <View style={styles.profileRing}>
              <Image
  source={getProfileImageSource()}
  style={styles.profileImage}
  resizeMode="cover"
  onError={(error) => {
    console.log("Home profile image load error:", error.nativeEvent);
    console.log("Home profile image URL:", profileImage);
  }}
/>
            </View>
          
            <View style={styles.profileBadge}>
              <Image source={logo} style={styles.profileBadgeLogo} />
            </View>
          </Pressable>
        </View>

        <ImageBackground
          source={heroImage}
          style={styles.heroCard}
          imageStyle={styles.heroImage}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay}>
            <View>
              <Text style={styles.heroSmall}>BE STRONG. BE DISCIPLINED.</Text>

              <Text style={styles.heroTitle}>PROTECT</Text>
              <Text style={styles.heroTitleOrange}>YOUR BEST.</Text>

              <Text style={styles.heroSubtitle}>
                FITSHIELD protects your health, posture, nutrition, and progress.
              </Text>
            </View>

            <View style={styles.heroStats}>
              <StatItem icon="🔥" label="Calories" value="1,250" unit="kcal" />
              <StatItem icon="🫀" label="Heart Rate" value="72" unit="bpm" />
              <StatItem icon="⚡" label="Streak" value="12" unit="days" />
            </View>
          </View>
        </ImageBackground>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your Dashboard</Text>
            <Text style={styles.sectionSubtitle}>
              Choose a module to continue
            </Text>
          </View>

          <Pressable>
            <Text style={styles.viewAll}>View All ›</Text>
          </Pressable>
        </View>

        <View style={styles.cardGrid}>
          <DashboardCard
            title="Interaction Checker"
            subtitle="Checks food-drug & drug-drug interactions."
            image={dietImage}
            onPress={() => router.push("/interaction")}
          />
          <DashboardCard
            title="Supplement"
            subtitle="Find the right supplements."
            image={supplementImage}
            onPress={() => router.push("/supplement")}
          />
          <DashboardCard
            title="Posture"
            subtitle="Improve posture. Prevent pain."
            image={postureImage}
            onPress={() => router.push("/posture")}
          />

          <DashboardCard
            title="Habit"
            subtitle="Build habits. Transform life."
            image={habitImage}
            onPress={() => router.push("/")}
          />
        </View>

        <Pressable style={styles.habitCard} onPress={() => router.push("/habit")}>
          <ImageBackground
            source={habitImage}
            style={styles.habitImage}
            imageStyle={styles.habitImageStyle}
            resizeMode="cover"
          >
            <View style={styles.habitOverlay}>
              <View style={styles.habitIconBox}>
                <Text style={styles.habitIcon}>✓</Text>
              </View>

              <View style={styles.habitTextBox}>
                <Text style={styles.habitTitle}>Habit</Text>
                <Text style={styles.habitSubtitle}>
                  Build habits. Transform life.
                </Text>
              </View>

              <View style={styles.habitArrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </View>
          </ImageBackground>
        </Pressable>

        <View style={styles.coachCard}>
          <Text style={styles.coachIcon}>⚡</Text>

          <View style={styles.coachTextBox}>
            <Text style={styles.coachTitle}>AI Coach Tip</Text>
            <Text style={styles.coachText}>
              Keep your health profile, medication details, and fitness progress
              updated for more accurate recommendations.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({
  icon,
  label,
  value,
  unit,
}: {
  icon: string;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>

      <Text style={styles.statLabel}>{label}</Text>

      <Text style={styles.statValue}>
        {value} <Text style={styles.statUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

function DashboardCard({ title, subtitle, image, onPress }: DashboardCardProps) {
  return (
    <Pressable style={styles.dashboardCard} onPress={onPress}>
      <Image source={image} style={styles.cardImage} resizeMode="cover" />

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>

      <View style={styles.cardArrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </Pressable>
  );
}

const ORANGE = "#FF7A00";
const DARK = "#050505";
const CARD = "#101010";
const BORDER = "#2A2A2A";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK,
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 42,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: {
    color: ORANGE,
    fontSize: 26,
    fontWeight: "900",
  },
  logo: {
    width: 175,
    height: 70,
  },
  notificationIcon: {
    fontSize: 21,
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ORANGE,
  },

  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeTextBox: {
    flex: 1,
    paddingRight: 14,
  },
  welcome: {
    color: "#CFCFCF",
    fontSize: 17,
    fontWeight: "700",
  },
  userName: {
    color: ORANGE,
    fontSize: 31,
    fontWeight: "900",
    marginTop: 3,
    lineHeight: 38,
  },
  orangeLine: {
    width: 76,
    height: 4,
    backgroundColor: ORANGE,
    borderRadius: 99,
    marginTop: 8,
    marginBottom: 12,
  },
  tagline: {
    color: "#B8B8B8",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  taglineOrange: {
    color: ORANGE,
    fontWeight: "900",
  },

  profileOuter: {
    width: 106,
    height: 106,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  profileRing: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 3,
    borderColor: ORANGE,
    backgroundColor: "#111111",
    shadowColor: ORANGE,
    shadowOpacity: 0.85,
    shadowRadius: 16,
    elevation: 9,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBadgeLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  heroCard: {
    height: 255,
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 26,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: CARD,
    shadowColor: ORANGE,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  heroImage: {
    borderRadius: 26,
  },
  heroOverlay: {
    flex: 1,
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "space-between",
  },
  heroSmall: {
    color: ORANGE,
    fontSize: 11,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 6,
  },
  heroTitleOrange: {
    color: ORANGE,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: -8,
  },
  heroSubtitle: {
    color: "#E8E8E8",
    fontSize: 11,
    lineHeight: 19,
    fontWeight: "600",
    width: "74%",
    marginTop: 4,
  },
  heroStats: {
    height: 72,
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statIcon: {
    fontSize: 12,
    marginBottom: 2,
  },
  statLabel: {
    color: "#D6D6D6",
    fontSize: 11,
    fontWeight: "800",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 1,
  },
  statUnit: {
    color: ORANGE,
    fontSize: 10,
    fontWeight: "900",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#999999",
    fontSize: 13,
    marginTop: 3,
    fontWeight: "600",
  },
  viewAll: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 2,
  },

  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  dashboardCard: {
    width: "48%",
    height: 190,
    backgroundColor: CARD,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: ORANGE,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: "100%",
    height: 100,
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingRight: 40,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  cardSubtitle: {
    color: "#A8A8A8",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    fontWeight: "600",
  },
  cardArrow: {
    position: "absolute",
    right: 10,
    bottom: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,122,0,0.14)",
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: ORANGE,
    fontSize: 26,
    fontWeight: "900",
    marginTop: -2,
  },

  habitCard: {
    height: 120,
    marginTop: 16,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
  },
  habitImage: {
    flex: 1,
  },
  habitImageStyle: {
    borderRadius: 24,
  },
  habitOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  habitIconBox: {
    width: 30,
    height: 30,
    borderRadius: 29,
    backgroundColor: "rgba(255,122,0,0.15)",
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  habitIcon: {
    color: ORANGE,
    fontSize: 20,
    fontWeight: "900",
  },
  habitTextBox: {
    flex: 1,
  },
  habitTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  habitSubtitle: {
    color: "#CFCFCF",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: "600",
  },
  habitArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,122,0,0.14)",
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },

  coachCard: {
    marginTop: 16,
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  coachIcon: {
    fontSize: 35,
    marginRight: 14,
  },
  coachTextBox: {
    flex: 1,
  },
  coachTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },
  coachText: {
    color: "#A8A8A8",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  profilePressed: {
  transform: [{ scale: 0.96 }],
  opacity: 0.85,
},
});