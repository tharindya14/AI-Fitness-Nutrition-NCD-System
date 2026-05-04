import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";
import axios from "axios";
import { router } from "expo-router";
import { API_BASE_URL } from "@/constants/api";
import { getItem, saveItem, deleteItem } from "@/utils/storage";
import AutoCompleteInput from "@/components/AutoCompleteInput";
import { DRUG_SUGGESTIONS, FOOD_SUGGESTIONS } from "@/constants/suggestions";

export default function DietPage() {
  const [loading, setLoading] = useState(false);

  const [drugName, setDrugName] = useState("Andol 0.5mg Tablet");
  const [foodName, setFoodName] = useState("Beer");
  const [allergies, setAllergies] = useState("milk,wheat");

  const checkSafety = async () => {
    if (!drugName.trim() || !foodName.trim()) {
      Alert.alert("Missing Details", "Please enter drug name and food name.");
      return;
    }

    try {
      setLoading(true);

      const token = await getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please login first.");
        router.replace("/");
        return;
      }

      const allergyList = allergies
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await axios.post(
        `${API_BASE_URL}/api/diet/check-safety`,
        {
          drug_name: drugName.trim(),
          food_name: foodName.trim(),
          allergies: allergyList,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await saveItem("latestResult", JSON.stringify(response.data));
      router.push({
  pathname: "/result",
  params: { refresh: Date.now().toString() },
});
    } catch (error: any) {
      console.log("Safety error:", error.response?.data || error.message);
      Alert.alert(
        "Safety Check Failed",
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await deleteItem("token");
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Diet Safety Check</Text>
          <Text style={styles.subtitle}>
            Search medication and food using dataset-based autocomplete.
          </Text>

          <AutoCompleteInput
            label="Medication"
            placeholder="Search medication name..."
            value={drugName}
            onChangeValue={setDrugName}
            data={DRUG_SUGGESTIONS}
            subText={(item: any) =>
              item.contains || "Tap to select medication"
            }
          />

          <AutoCompleteInput
            label="Food"
            placeholder="Search food name..."
            value={foodName}
            onChangeValue={setFoodName}
            data={FOOD_SUGGESTIONS}
            subText={() => "Tap to select food"}
          />

          <Text style={styles.label}>Allergies</Text>
          <TextInput
            style={styles.input}
            value={allergies}
            onChangeText={setAllergies}
            placeholder="Example: milk,wheat"
            autoCorrect={false}
            autoCapitalize="none"
          />

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#2D6A4F"
              style={{ marginTop: 20 }}
            />
          ) : (
            <>
              <Pressable style={styles.primaryButton} onPress={checkSafety}>
                <Text style={styles.primaryText}>Check Safety</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.push("/history")}
              >
                <Text style={styles.secondaryText}>View My History</Text>
              </Pressable>

              <Pressable style={styles.dangerButton} onPress={logout}>
                <Text style={styles.primaryText}>Logout</Text>
              </Pressable>
            </>
          )}
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
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1B4332",
  },
  subtitle: {
    fontSize: 15,
    color: "#5C6B63",
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#344E41",
    marginBottom: 7,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#F1F5F2",
    borderWidth: 1,
    borderColor: "#DCE8DF",
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
    color: "#111",
  },
  primaryButton: {
    backgroundColor: "#2D6A4F",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#E8F3EC",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryText: {
    color: "#2D6A4F",
    fontWeight: "900",
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: "#C0392B",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
});