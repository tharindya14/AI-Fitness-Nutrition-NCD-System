import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
const INPUT = "#101010";
const TEXT = "#ffffff";
const MUTED = "#b8b8b8";
const DANGER = "#ff453a";

const heroDietImage = require("../../assets/images/dashboard/diet-safety-hero.png");

const shieldIcon = require("../../assets/images/diet/shield.png");
const userIcon = require("../../assets/images/diet/user.png");
const editIcon = require("../../assets/images/diet/edit.png");
const heightIcon = require("../../assets/images/diet/height.png");
const weightIcon = require("../../assets/images/diet/weight.png");
const capsuleIcon = require("../../assets/images/diet/capsule.png");
const bowlIcon = require("../../assets/images/diet/bowl.png");
const trashIcon = require("../../assets/images/diet/trash.png");
const historyIcon = require("../../assets/images/diet/history.png");

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

  const clearMedicines = () => {
    setMedicineNames([]);
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
              <Text style={styles.heroTitle}>Interaction</Text>
              <Text style={styles.heroTitleOrange}>Checker</Text>

              <Text style={styles.heroSubtitle}>
                Check food, medicine, and allergy safety before you eat.
              </Text>

              <View style={styles.trustPill}>
                <Image source={shieldIcon} style={styles.trustIconImage} resizeMode="contain" />
                <Text style={styles.trustText}>Smart • Fast • Reliable</Text>
              </View>
            </View>

            <View style={styles.heroImageBox}>
              <Image source={heroDietImage} style={styles.heroImage} resizeMode="contain" />
            </View>
          </View>

          <View style={styles.snapshotCard}>
            <View style={styles.snapshotTop}>
              

              <View style={styles.snapshotTitleBox}>
                <Text style={styles.snapshotTitle}>Health Snapshot</Text>
                <Text style={styles.snapshotSubtitle}>Using your saved profile</Text>
              </View>

              <Pressable
                style={styles.editProfileButton}
                onPress={() => router.push("/profile" as any)}
              >
                <Image source={editIcon} style={styles.editIconImage} resizeMode="contain" />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </Pressable>
            </View>

            <View style={styles.snapshotStats}>
              <View style={styles.snapshotStat}>
                <View style={styles.statMiniIcon}>
                  <Image source={heightIcon} style={styles.statIconImage} resizeMode="contain" />
                </View>
                <Text style={styles.statLabel}>Height</Text>
                <Text style={styles.statValue}>
                  {height || "--"} <Text style={styles.statUnit}>cm</Text>
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.snapshotStat}>
                <View style={styles.statMiniIcon}>
                  <Image source={weightIcon} style={styles.statIconImage} resizeMode="contain" />
                </View>
                <Text style={styles.statLabel}>Weight</Text>
                <Text style={styles.statValue}>
                  {weight || "--"} <Text style={styles.statUnit}>kg</Text>
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.snapshotStat}>
                <View style={styles.statMiniIcon}>
                  <Image source={capsuleIcon} style={styles.statIconImage} resizeMode="contain" />
                </View>
                <Text style={styles.statLabel}>Medicines</Text>
                <Text style={styles.statValue}>
                  {medicineNames.length} <Text style={styles.statUnit}>items</Text>
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formTitleRow}>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>Checker Form</Text>
              </View>
              <View style={styles.dottedLine} />
            </View>

            <View style={styles.stepBlock}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>01</Text>
                </View>

                <View style={styles.stepTextBox}>
                  <Text style={styles.stepTitle}>Add Medicines</Text>
                  <Text style={styles.stepSubtitle}>
                    Search and add the medicines you are taking.
                  </Text>
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.autoBox}>
                  <AutoCompleteInput
                    label=""
                    placeholder="Search medicine name..."
                    value={medicineInput}
                    onChangeValue={setMedicineInput}
                    data={DRUG_SUGGESTIONS}
                    subText={(item: any) =>
                      item.contains || "Tap to select medication"
                    }
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.addButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={addMedicine}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </Pressable>
              </View>

              <View style={styles.addedHeader}>
                <Text style={styles.addedLabel}>Added Medicines</Text>

                {medicineNames.length > 0 ? (
                  <Pressable style={styles.clearButton} onPress={clearMedicines}>
                    <Text style={styles.clearAllText}>Clear All</Text>
                    <Image source={trashIcon} style={styles.clearTrashIcon} resizeMode="contain" />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.medicineList}>
                {medicineNames.length === 0 ? (
                  <Text style={styles.emptyMedicineText}>
                    No medicines added yet.
                  </Text>
                ) : (
                  medicineNames.map((item) => (
                    <Pressable
                      key={item}
                      style={({ pressed }) => [
                        styles.medicineChip,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => removeMedicine(item)}
                    >
                      <Text style={styles.medicineChipText}>{item}</Text>
                      <Text style={styles.medicineRemoveText}> ×</Text>
                    </Pressable>
                  ))
                )}
              </View>
            </View>

            <View style={styles.sectionDivider} />

            <View style={styles.stepBlock}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>02</Text>
                </View>

                <View style={styles.stepTextBox}>
                  <Text style={styles.stepTitle}>Select Food</Text>
                  <Text style={styles.stepSubtitle}>
                    Search for the food or drink you want to check.
                  </Text>
                </View>
              </View>

              <View style={styles.foodInputRow}>
                <View style={styles.foodAutoBox}>
                  <AutoCompleteInput
                    label=""
                    placeholder="Search food name..."
                    value={foodName}
                    onChangeValue={setFoodName}
                    data={FOOD_SUGGESTIONS}
                    subText={() => "Tap to select food"}
                  />
                </View>

                <View style={styles.foodIconButton}>
                  <Image source={bowlIcon} style={styles.foodIconImage} resizeMode="contain" />
                </View>
              </View>
            </View>

            <View style={styles.sectionDivider} />

            <View style={styles.stepBlock}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>03</Text>
                </View>

                <View style={styles.stepTextBox}>
                  <Text style={styles.stepTitle}>Allergies</Text>
                  <Text style={styles.stepSubtitle}>
                    Add your allergies separated by commas.
                  </Text>
                </View>
              </View>

              <View style={styles.allergyInputBox}>
                <TextInput
                  style={styles.allergyInput}
                  value={allergies}
                  onChangeText={setAllergies}
                  placeholder="e.g. milk, wheat, peanuts"
                  placeholderTextColor="#777"
                  autoCorrect={false}
                  autoCapitalize="none"
                />

                <View style={styles.allergyIconBox}>
                  <Image source={shieldIcon} style={styles.allergyIconImage} resizeMode="contain" />
                </View>
              </View>
            </View>

            <View style={styles.sectionDivider} />

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={ORANGE} />
                <Text style={styles.loadingText}>Checking Interactions...</Text>
              </View>
            ) : (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={checkSafety}
                >
                  
                    <Image source={shieldIcon} style={styles.primaryIconImage} resizeMode="contain" />
                  

                  <Text style={styles.primaryText}>Check Interactions</Text>

                  <Text style={styles.primaryArrow}>›</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.historyButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => router.push("/history")}
                >
                  <Image source={historyIcon} style={styles.historyIconImage} resizeMode="contain" />
                  <Text style={styles.historyText}>View My History</Text>
                  <Text style={styles.historyArrow}>›</Text>
                </Pressable>
              </>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 34,
  },

  homeBackButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 18,
    paddingVertical: 6,
    paddingRight: 12,
  },

  backIconImage: {
    width: 28,
    height: 28,
    marginRight: 4,
  },

  homeBackText: {
    color: ORANGE,
    fontSize: 17,
    fontWeight: "900",
  },

  heroBox: {
    minHeight: 286,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  heroTextBox: {
    flex: 1,
    zIndex: 3,
  },

  heroTitle: {
    color: TEXT,
    fontSize: 35,
    fontWeight: "900",
    lineHeight: 34,
    letterSpacing: -1,
  },

  heroTitleOrange: {
    color: ORANGE,
    fontSize: 35,
    fontWeight: "900",
    lineHeight: 34,
    letterSpacing: -1,
  },

  heroSubtitle: {
    color: "#d4d4d4",
    fontSize: 16,
    lineHeight: 25,
    marginTop: 18,
    fontWeight: "700",
  },

  trustPill: {
    marginTop: 17,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(22, 239, 83, 0.23)",
    paddingVertical: 9,
    paddingHorizontal: 13,
  },

  trustIconImage: {
    width: 21,
    height: 21,
    marginRight: 8,
  },

  trustText: {
    color: "#d6d6d6",
    fontSize: 13,
    fontWeight: "800",
  },

  heroImageBox: {
    width: 210,
    height: 220,
    marginLeft: -66,
    alignItems: "center",
    justifyContent: "center",
  },

  heroImage: {
    width: 270,
    height: 300,
  },

  snapshotCard: {
    backgroundColor: "rgba(17,17,17,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    borderRadius: 26,
    padding: 16,
    marginBottom: 18,
    shadowColor: ORANGE,
    shadowOpacity: 0.23,
    shadowRadius: 16,
    elevation: 7,
  },

  snapshotTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  snapshotIcon: {
    width: 40,
    height: 40,
    borderRadius: 27,
    backgroundColor: "rgba(255,122,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    overflow: "hidden",
  },

  snapshotIconImage: {
    width: 37,
    height: 37,
  },

  snapshotTitleBox: {
    flex: 1,
  },

  snapshotTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
  },

  snapshotSubtitle: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },

  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.10)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  editIconImage: {
    width: 20,
    height: 20,
    marginRight: 7,
  },

  editProfileText: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: "900",
  },

  snapshotStats: {
    flexDirection: "row",
    alignItems: "stretch",
  },

  snapshotStat: {
    flex: 1,
    alignItems: "flex-start",
  },

  statMiniIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },

  statIconImage: {
    width: 32,
    height: 32,
  },

  statLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },

  statValue: {
    color: TEXT,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 2,
  },

  statUnit: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: "900",
  },

  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginHorizontal: 12,
  },

  formCard: {
    backgroundColor: "rgba(17,17,17,0.96)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.42)",
    padding: 16,
    shadowColor: ORANGE,
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 9,
  },

  formTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  sectionBadge: {
    backgroundColor: "rgba(255,122,0,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.55)",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },

  sectionBadgeText: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  dottedLine: {
    flex: 1,
    height: 1,
    borderStyle: "dotted",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.55)",
    marginLeft: 10,
  },

  stepBlock: {
    marginBottom: 4,
  },

  stepHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,122,0,0.10)",
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  stepNumberText: {
    color: ORANGE,
    fontSize: 17,
    fontWeight: "900",
  },

  stepTextBox: {
    flex: 1,
  },

  stepTitle: {
    color: TEXT,
    fontSize: 19,
    fontWeight: "900",
  },

  stepSubtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    fontWeight: "700",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  autoBox: {
    flex: 1,
  },

  addButton: {
    marginTop: 20,
    minHeight: 50,
    minWidth: 50,
    borderRadius: 17,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.10)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },

  addButtonText: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
  },

  addedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },

  addedLabel: {
    color: "#d7d7d7",
    fontSize: 14,
    fontWeight: "800",
  },

  clearButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  clearAllText: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: "900",
    marginRight: 6,
  },

  clearTrashIcon: {
    width: 19,
    height: 19,
  },

  medicineList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  medicineChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,122,0,0.13)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.48)",
    borderRadius: 15,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },

  medicineChipText: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: "900",
  },

  medicineRemoveText: {
    color: ORANGE,
    fontSize: 17,
    fontWeight: "900",
    marginLeft: 8,
  },

  emptyMedicineText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "700",
  },

  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 21,
  },

  foodInputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  foodAutoBox: {
    flex: 1,
  },

  foodIconButton: {
    marginTop: 20,
    width: 58,
    height: 58,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.10)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  foodIconImage: {
    width: 43,
    height: 43,
  },

  allergyInputBox: {
    minHeight: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    backgroundColor: INPUT,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 10,
  },

  allergyInput: {
    flex: 1,
    color: TEXT,
    fontSize: 15,
    fontWeight: "700",
  },

  allergyIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,122,0,0.10)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  allergyIconImage: {
    width: 32,
    height: 32,
  },

  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
  },

  loadingText: {
    color: MUTED,
    marginTop: 10,
    fontWeight: "900",
  },

  primaryButton: {
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: ORANGE,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    shadowColor: ORANGE,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },

  primaryIconBox: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  primaryIconImage: {
    width: 36,
    height: 36,
  },

  primaryText: {
    color: TEXT,
    fontWeight: "900",
    fontSize: 20,
  },

  primaryArrow: {
    color: TEXT,
    fontWeight: "900",
    fontSize: 40,
    marginTop: -4,
  },

  historyButton: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.08)",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    marginTop: 14,
    paddingHorizontal: 18,
  },

  historyIconImage: {
    width: 36,
    height: 36,
  },

  historyText: {
    color: ORANGE,
    fontSize: 18,
    fontWeight: "900",
    flex: 1,
    marginLeft: 16,
  },

  historyArrow: {
    color: ORANGE,
    fontSize: 34,
    fontWeight: "900",
    marginTop: -4,
  },

  logoutButton: {
    minHeight: 54,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: DANGER,
    backgroundColor: "rgba(255,69,58,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  logoutText: {
    color: DANGER,
    fontWeight: "900",
    fontSize: 15,
  },

  buttonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
   homeBackIcon: {
    color: ORANGE,
    fontSize: 34,
    fontWeight: "900",
    marginRight: 4,
    marginTop: -3,
  },
});