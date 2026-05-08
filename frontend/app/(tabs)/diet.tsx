import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import axios from "axios";
import { router } from "expo-router";

import { API_BASE_URL } from "@/constants/api";
import { deleteItem, getItem, saveItem } from "@/utils/storage";
import AutoCompleteInput from "@/components/AutoCompleteInput";
import { DRUG_SUGGESTIONS, FOOD_SUGGESTIONS } from "@/constants/suggestions";

const ORANGE = "#ff7a00";
const DARK = "#050505";
const INPUT = "#050505";
const BORDER = "#2a2a2a";
const TEXT = "#ffffff";
const MUTED = "#b8b8b8";
const DANGER = "#ff453a";

export default function DietPage() {
  const [loading, setLoading] = useState(false);

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const [medicineInput, setMedicineInput] = useState("");
  const [medicineNames, setMedicineNames] = useState<string[]>([]);

  const [foodName, setFoodName] = useState("");
  const [allergies, setAllergies] = useState("");

  useEffect(() => {
    loadSavedProfile();
  }, []);

  const loadSavedProfile = async () => {
    try {
      const profileText = await getItem("userProfile");

      if (!profileText) return;

      const profile = JSON.parse(profileText);

      if (profile.height) setHeight(String(profile.height));
      if (profile.weight) setWeight(String(profile.weight));

      if (Array.isArray(profile.medications)) {
        setMedicineNames(profile.medications);
      }

      if (Array.isArray(profile.allergies)) {
        setAllergies(profile.allergies.join(", "));
      }
    } catch (error) {
      console.log("Failed to load saved profile:", error);
    }
  };

  const addMedicine = () => {
    const value = medicineInput.trim();

    if (!value) {
      Alert.alert("Missing Medicine", "Please select or enter a medicine.");
      return;
    }

    if (medicineNames.includes(value)) {
      Alert.alert("Already Added", "This medicine is already added.");
      return;
    }

    setMedicineNames([...medicineNames, value]);
    setMedicineInput("");
  };

  const removeMedicine = (name: string) => {
    setMedicineNames(medicineNames.filter((item) => item !== name));
  };

  const checkSafety = async () => {
    if (!height.trim() || !weight.trim()) {
      Alert.alert("Missing Details", "Please complete your health profile first.");
      router.push("/profile" as any);
      return;
    }

    if (medicineNames.length === 0) {
      Alert.alert("Missing Medicine", "Please add at least one medicine.");
      return;
    }

    if (!foodName.trim()) {
      Alert.alert("Missing Food", "Please enter food name.");
      return;
    }

    const heightValue = Number(height);
    const weightValue = Number(weight);

    if (Number.isNaN(heightValue) || heightValue <= 0) {
      Alert.alert("Invalid Height", "Please enter a valid height in your profile.");
      return;
    }

    if (Number.isNaN(weightValue) || weightValue <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight in your profile.");
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
          height_cm: heightValue,
          weight_kg: weightValue,
          medicine_names: medicineNames,
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

      if (response.data?.user_profile) {
        await saveItem("userProfile", JSON.stringify(response.data.user_profile));
      }

      router.push({
        pathname: "/result",
        params: { refresh: Date.now().toString() },
      });
    } catch (error: any) {
      console.log("Safety error:", error.response?.data || error.message);

      Alert.alert(
        "Safety Check Failed",
        error.response?.data?.message ||
          error.message ||
          "Unable to check food-drug safety."
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={styles.homeBackButton}
            onPress={() => router.push("/interaction")}
          >
            <Text style={styles.homeBackIcon}>‹</Text>
            <Text style={styles.homeBackText}>Dashboard</Text>
          </Pressable>

          <View style={styles.heroBox}>
            <View style={styles.heroTextBox}>
              <Text style={styles.heroTitle}>Food-Drug</Text>
              <Text style={styles.heroTitle}>Interaction</Text>
              <Text style={styles.heroTitle}>Checker</Text>

              <Text style={styles.heroSubtitle}>
                Check food and medicine safety using your saved health profile.
              </Text>
            </View>

            <View style={styles.heroVisual}>
              <View style={styles.heroGlowCircle}>
                <Text style={styles.heroIcon}>✚</Text>
              </View>
              <Text style={styles.heroSmallIcon}>🥗</Text>
              <Text style={styles.heroPill}>◐</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.gridIcon}>
                <Text style={styles.gridIconText}>▦</Text>
              </View>

              <View style={styles.cardHeaderTextBox}>
                <Text style={styles.cardTitle}>Diet Safety Dashboard</Text>
                <Text style={styles.cardSubtitle}>
                  BMI, medicine, allergy and food safety analysis
                </Text>
              </View>
            </View>

            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Interaction Checker</Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.profileMiniCard}>
                <Text style={styles.profileMiniTitle}>Using Health Profile</Text>

                <Text style={styles.profileMiniText}>
                  Height: {height || "--"} cm
                </Text>

                <Text style={styles.profileMiniText}>
                  Weight: {weight || "--"} kg
                </Text>

                <Text style={styles.profileMiniText}>
                  Medicines: {medicineNames.length}
                </Text>

                <Pressable
                  style={styles.profileEditButton}
                  onPress={() => router.push("/profile" as any)}
                >
                  <Text style={styles.profileEditText}>Edit Profile</Text>
                </Pressable>
              </View>

              <AutoCompleteInput
                label="Add Medicine"
                placeholder="Search medication name..."
                value={medicineInput}
                onChangeValue={setMedicineInput}
                data={DRUG_SUGGESTIONS}
                subText={(item: any) =>
                  item.contains || "Tap to select medication"
                }
              />

              <Pressable
                style={({ pressed }) => [
                  styles.addMedicineButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={addMedicine}
              >
                <Text style={styles.addMedicineText}>+ Add Medicine</Text>
              </Pressable>

              <View style={styles.medicineList}>
                {medicineNames.length === 0 ? (
                  <Text style={styles.emptyMedicineText}>
                    No medicines added. Add from profile or search here.
                  </Text>
                ) : (
                  medicineNames.map((item) => (
                    <Pressable
                      key={item}
                      style={styles.medicineChip}
                      onPress={() => removeMedicine(item)}
                    >
                      <Text style={styles.medicineChipText}>{item}</Text>
                      <Text style={styles.medicineRemoveText}> ×</Text>
                    </Pressable>
                  ))
                )}
              </View>

              <Text style={styles.helperText}>
                Tap a medicine chip to remove it.
              </Text>

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
                placeholderTextColor="#777"
                autoCorrect={false}
                autoCapitalize="none"
              />

              <Text style={styles.helperText}>
                Separate multiple allergies with commas.
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={ORANGE} />
                <Text style={styles.loadingText}>Checking safety...</Text>
              </View>
            ) : (
              <View style={styles.actionSection}>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={checkSafety}
                >
                  <Text style={styles.primaryText}>Check Safety</Text>
                  <Text style={styles.buttonArrow}>›</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => router.push("/history")}
                >
                  <Text style={styles.secondaryText}>View My History</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={logout}
                >
                  <Text style={styles.dangerText}>Logout</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK,
  },

  container: {
    flex: 1,
    backgroundColor: DARK,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 34,
  },

  homeBackButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 16,
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
    minHeight: 260,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  heroTextBox: {
    flex: 1.2,
    zIndex: 2,
  },

  heroTitle: {
    color: TEXT,
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 51,
    letterSpacing: -1,
  },

  heroSubtitle: {
    color: "#d4d4d4",
    fontSize: 17,
    lineHeight: 25,
    marginTop: 18,
    fontWeight: "700",
  },

  heroVisual: {
    width: 190,
    height: 190,
    marginLeft: -40,
    alignItems: "center",
    justifyContent: "center",
  },

  heroGlowCircle: {
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 2,
    borderColor: "rgba(255,122,0,0.8)",
    backgroundColor: "rgba(255,122,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOpacity: 0.65,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },

  heroIcon: {
    color: "#ffd08a",
    fontSize: 62,
    fontWeight: "900",
  },

  heroSmallIcon: {
    position: "absolute",
    left: 18,
    bottom: 32,
    fontSize: 45,
  },

  heroPill: {
    position: "absolute",
    right: 26,
    bottom: 20,
    color: "#ffb25c",
    fontSize: 43,
    transform: [{ rotate: "-25deg" }],
  },

  card: {
    backgroundColor: "rgba(17,17,17,0.96)",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.42)",
    padding: 18,
    paddingTop: 22,
    shadowColor: ORANGE,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  gridIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.6)",
    backgroundColor: "rgba(255,122,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  gridIconText: {
    color: ORANGE,
    fontSize: 30,
    fontWeight: "900",
    marginTop: -2,
  },

  cardHeaderTextBox: {
    flex: 1,
  },

  cardTitle: {
    color: TEXT,
    fontSize: 27,
    fontWeight: "900",
    lineHeight: 33,
    letterSpacing: -0.4,
  },

  cardSubtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: "600",
  },

  sectionBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,122,0,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.55)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  sectionBadgeText: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  formSection: {
    backgroundColor: "rgba(5,5,5,0.94)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
  },

  profileMiniCard: {
    backgroundColor: "rgba(255,122,0,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.45)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },

  profileMiniTitle: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 6,
  },

  profileMiniText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },

  profileEditButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
    backgroundColor: "rgba(255,122,0,0.12)",
  },

  profileEditText: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "900",
  },

  label: {
    color: "#e5e5e5",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 7,
    marginTop: 8,
  },

  input: {
    minHeight: 52,
    backgroundColor: INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 15,
    color: TEXT,
    paddingHorizontal: 15,
    fontSize: 15,
    fontWeight: "700",
  },

  helperText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: "600",
  },

  addMedicineButton: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 12,
  },

  addMedicineText: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: "900",
  },

  medicineList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },

  medicineChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,122,0,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.55)",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  medicineChipText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "900",
  },

  medicineRemoveText: {
    color: ORANGE,
    fontSize: 17,
    fontWeight: "900",
  },

  emptyMedicineText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },

  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
  },

  loadingText: {
    color: MUTED,
    marginTop: 10,
    fontWeight: "800",
  },

  actionSection: {
    marginTop: 16,
  },

  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: ORANGE,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: ORANGE,
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  primaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  buttonArrow: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 32,
    marginLeft: 10,
    marginTop: -4,
  },

  secondaryButton: {
    minHeight: 54,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  secondaryText: {
    color: ORANGE,
    fontWeight: "900",
    fontSize: 15,
  },

  dangerButton: {
    minHeight: 54,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: DANGER,
    backgroundColor: "rgba(255,69,58,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  dangerText: {
    color: DANGER,
    fontWeight: "900",
    fontSize: 15,
  },

  buttonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
});