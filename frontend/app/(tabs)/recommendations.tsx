import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import axios from "axios";
import { router } from "expo-router";
import { API_BASE_URL } from "@/constants/api";
import { getItem } from "@/utils/storage";

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);

      const token = await getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please login first.");
        router.replace("/" as any);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/diet/recommendations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setData(response.data);
    } catch (error: any) {
      console.log(
        "Recommendation error:",
        error.response?.data || error.message
      );

      Alert.alert(
        "Recommendation Failed",
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const goBackHome = () => {
    router.replace("/home" as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2D6A4F" />
          <Text style={styles.loadingText}>Loading recommendations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.title}>No recommendations found</Text>

          <Pressable style={styles.primaryButton} onPress={goBackHome}>
            <Text style={styles.primaryText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const profile = data.userProfile;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Personalized Recommendations</Text>

          <Text style={styles.subtitle}>
            Food suggestions based on your profile, BMI, allergies, and health
            details.
          </Text>

          <View style={styles.profileBox}>
            <Text style={styles.sectionTitle}>User Profile</Text>

            <Text style={styles.profileText}>
              Name: {profile?.fullName || "N/A"}
            </Text>

            <Text style={styles.profileText}>
              Age: {profile?.age || "N/A"}
            </Text>

            <Text style={styles.profileText}>
              Gender: {profile?.gender || "N/A"}
            </Text>

            <Text style={styles.profileText}>
              Height: {profile?.height || "N/A"} cm
            </Text>

            <Text style={styles.profileText}>
              Weight: {profile?.weight || "N/A"} kg
            </Text>

            <Text style={styles.profileText}>
              Allergies: {(profile?.allergies || []).join(", ") || "None"}
            </Text>

            <Text style={styles.profileText}>
              Medications: {(profile?.medications || []).join(", ") || "None"}
            </Text>

            <Text style={styles.profileText}>
              Health Conditions:{" "}
              {(profile?.healthConditions || []).join(", ") || "None"}
            </Text>
          </View>

          <View style={styles.bmiBox}>
            <View>
              <Text style={styles.smallLabel}>BMI</Text>
              <Text style={styles.bmiText}>{data.bmi || "N/A"}</Text>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {data.bmiCategory || "Unknown"}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Recommendation Goal</Text>
          <Text style={styles.paragraph}>
            {data.recommendationGoal || "No recommendation goal available."}
          </Text>

          <Text style={styles.sectionTitle}>Explanation</Text>
          <Text style={styles.paragraph}>
            {data.explanation?.summary || "No explanation available."}
          </Text>

          <Text style={styles.sectionTitle}>Recommended Foods</Text>

          {(data.recommendations || []).length === 0 ? (
            <Text style={styles.paragraph}>
              No suitable food recommendations found.
            </Text>
          ) : (
            data.recommendations.map((item: any, index: number) => (
              <View key={index} style={styles.foodBox}>
                <Text style={styles.foodTitle}>{item.Food}</Text>

                <Text style={styles.foodSub}>
                  {item.food_type || "food"} •{" "}
                  {item.consumption_type || "recommended"}
                </Text>

                <Text style={styles.foodDetails}>
                  Energy: {item.energy} kcal | Protein: {item.protein}g | Carbs:{" "}
                  {item.carbs}g
                </Text>

                <Text style={styles.foodDetails}>
                  Fat: {item.fat}g | Sugar: {item.sugars}g | Sodium:{" "}
                  {item.sodium}mg
                </Text>
              </View>
            ))
          )}

          <Text style={styles.note}>
            {data.explanation?.note ||
              "This is a personalized dietary support feature and should not replace professional medical or nutritional advice."}
          </Text>

          <Pressable style={styles.primaryButton} onPress={goBackHome}>
            <Text style={styles.primaryText}>Back to Home</Text>
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
    padding: 22,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    padding: 22,
  },
  loadingText: {
    marginTop: 12,
    color: "#1B4332",
    fontWeight: "700",
    textAlign: "center",
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
    fontSize: 30,
    fontWeight: "900",
    color: "#1B4332",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#5C6B63",
    lineHeight: 22,
    marginBottom: 20,
  },
  profileBox: {
    backgroundColor: "#F8FAF8",
    padding: 15,
    borderRadius: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1B4332",
    marginTop: 16,
    marginBottom: 8,
  },
  profileText: {
    fontSize: 14,
    color: "#333",
    marginTop: 5,
    lineHeight: 20,
  },
  bmiBox: {
    backgroundColor: "#F1F5F2",
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#344E41",
  },
  bmiText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1B4332",
    marginTop: 4,
  },
  badge: {
    backgroundColor: "#2D6A4F",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  badgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  paragraph: {
    fontSize: 15,
    color: "#333",
    lineHeight: 23,
  },
  foodBox: {
    backgroundColor: "#F1F5F2",
    padding: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  foodTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1B4332",
  },
  foodSub: {
    fontSize: 13,
    color: "#5C6B63",
    marginTop: 4,
  },
  foodDetails: {
    fontSize: 13,
    color: "#333",
    marginTop: 4,
  },
  note: {
    fontSize: 12,
    color: "#777",
    fontStyle: "italic",
    lineHeight: 18,
    marginTop: 18,
  },
  primaryButton: {
    backgroundColor: "#2D6A4F",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 22,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
});