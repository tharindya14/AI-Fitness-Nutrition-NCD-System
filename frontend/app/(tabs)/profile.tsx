import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import * as ImagePicker from "expo-image-picker";

import { API_BASE_URL } from "@/constants/api";
import { getItem, saveItem } from "@/utils/storage";
import AutoCompleteInput from "@/components/AutoCompleteInput";
import { DRUG_SUGGESTIONS } from "@/constants/suggestions";

const defaultFemale = require("../../assets/images/dashboard/default-female.png");
const defaultMale = require("../../assets/images/dashboard/default-male.png");

const ORANGE = "#ff7a00";
const DARK = "#050505";
const CARD = "#111111";
const INPUT = "#050505";
const BORDER = "#2a2a2a";
const TEXT = "#ffffff";
const MUTED = "#b8b8b8";

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicationInput, setMedicationInput] = useState("");
  const [medications, setMedications] = useState<string[]>([]);
  const [healthConditions, setHealthConditions] = useState("");

  const [profileImage, setProfileImage] = useState("");
  const [defaultAvatar, setDefaultAvatar] = useState("");
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const bmi = useMemo(() => {
    const h = Number(height);
    const w = Number(weight);

    if (!h || !w || h <= 0 || w <= 0) return "";

    const heightMeters = h / 100;
    return (w / (heightMeters * heightMeters)).toFixed(2);
  }, [height, weight]);

  const bmiCategory = useMemo(() => {
    const value = Number(bmi);

    if (!value) return "Not calculated";
    if (value < 18.5) return "Underweight";
    if (value < 25) return "Normal";
    if (value < 30) return "Overweight";
    return "Obese";
  }, [bmi]);

  useEffect(() => {
    loadProfile();
  }, []);

  const splitText = (value: string) => {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const joinArray = (value: any) => {
    return Array.isArray(value) ? value.join(", ") : "";
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

    if (gender.trim().toLowerCase() === "male") {
      return defaultMale;
    }

    return defaultFemale;
  };

  const addMedication = () => {
    const value = medicationInput.trim();

    if (!value) {
      Alert.alert("Missing Medication", "Please select or enter a medication.");
      return;
    }

    if (medications.includes(value)) {
      Alert.alert("Already Added", "This medication is already added.");
      return;
    }

    setMedications([...medications, value]);
    setMedicationInput("");
  };

  const removeMedication = (name: string) => {
    setMedications(medications.filter((item) => item !== name));
  };

  const loadProfile = async () => {
    try {
      setLoading(true);

      const token = await getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please login first.");
        router.replace("/");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = response.data?.user;

      if (user) {
        setAge(user.age ? String(user.age) : "");
        setGender(user.gender || "");
        setHeight(user.height ? String(user.height) : "");
        setWeight(user.weight ? String(user.weight) : "");
        setAllergies(joinArray(user.allergies));
        setHealthConditions(joinArray(user.healthConditions));

        setProfileImage(user.profileImage || "");
        setDefaultAvatar(user.defaultAvatar || "");

        if (Array.isArray(user.medications)) {
          setMedications(user.medications);
        } else {
          setMedications([]);
        }

        await saveItem("userProfile", JSON.stringify(user));
      }
    } catch (error: any) {
      console.log("Profile load error:", error.response?.data || error.message);

      Alert.alert(
        "Profile Load Failed",
        error.response?.data?.message || "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow gallery access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const selectedImage = result.assets[0];

      const token = await getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please login first.");
        router.replace("/");
        return;
      }

      const uriParts = selectedImage.uri.split(".");
      const fileType = uriParts[uriParts.length - 1] || "jpg";

      const formData = new FormData();

      formData.append("profileImage", {
        uri: selectedImage.uri,
        name: `profile-image.${fileType}`,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
      } as any);

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/profile/image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data?.user) {
        setProfileImage(response.data.user.profileImage || "");
        setDefaultAvatar(response.data.user.defaultAvatar || "");
        await saveItem("userProfile", JSON.stringify(response.data.user));
      }

      setImageModalVisible(false);
      Alert.alert("Uploaded", "Profile image updated successfully.");
    } catch (error: any) {
      console.log("Image upload error:", error.response?.data || error.message);

      Alert.alert(
        "Upload Failed",
        error.response?.data?.message || "Unable to upload image."
      );
    }
  };

  const chooseDefaultAvatar = async (avatar: "male" | "female") => {
    try {
      const token = await getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please login first.");
        router.replace("/");
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/auth/profile/default-avatar`,
        {
          defaultAvatar: avatar,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.user) {
        setProfileImage("");
        setDefaultAvatar(avatar);
        await saveItem("userProfile", JSON.stringify(response.data.user));
      }

      setImageModalVisible(false);
      Alert.alert("Saved", `${avatar} default avatar selected.`);
    } catch (error: any) {
      console.log("Default avatar error:", error.response?.data || error.message);

      Alert.alert(
        "Failed",
        error.response?.data?.message || "Unable to set default avatar."
      );
    }
  };

  const saveProfile = async () => {
    const heightValue = Number(height);
    const weightValue = Number(weight);

    if (!height || !weight) {
      Alert.alert("Missing Details", "Please enter height and weight.");
      return;
    }

    if (Number.isNaN(heightValue) || heightValue <= 0) {
      Alert.alert("Invalid Height", "Please enter valid height in cm.");
      return;
    }

    if (Number.isNaN(weightValue) || weightValue <= 0) {
      Alert.alert("Invalid Weight", "Please enter valid weight in kg.");
      return;
    }

    try {
      setSaving(true);

      const token = await getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please login first.");
        router.replace("/");
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/auth/profile`,
        {
          age: age ? Number(age) : null,
          gender: gender.trim(),
          height: heightValue,
          weight: weightValue,
          allergies: splitText(allergies),
          medications,
          healthConditions: splitText(healthConditions),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.user) {
        await saveItem("userProfile", JSON.stringify(response.data.user));
      }

      Alert.alert("Saved", "Profile updated successfully.");
    } catch (error: any) {
      console.log("Profile save error:", error.response?.data || error.message);

      Alert.alert(
        "Profile Save Failed",
        error.response?.data?.message || "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            onPress={() => router.push("/home")}
          >
            <Text style={styles.homeBackIcon}>‹</Text>
            <Text style={styles.homeBackText}>Home</Text>
          </Pressable>

          <View style={styles.heroBox}>
            <Text style={styles.heroTitle}>My Health Profile</Text>
            <Text style={styles.heroSubtitle}>
              Save your health details once and use them in the diet safety
              checker.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Basic Details</Text>
            </View>

            <View style={styles.profileImageSection}>
              <View style={styles.profileImageRing}>
                <Image
                  source={getProfileImageSource()}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              </View>

              <Pressable
                style={styles.changePhotoButton}
                onPress={() => setImageModalVisible(true)}
              >
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </Pressable>

              <Text style={styles.photoHint}>
                Upload your photo or use a default avatar.
              </Text>
            </View>

            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Example: 24"
              placeholderTextColor="#777"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Gender</Text>
            <TextInput
              style={styles.input}
              value={gender}
              onChangeText={setGender}
              placeholder="Example: Female"
              placeholderTextColor="#777"
            />

            <Text style={styles.label}>Height cm</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="Example: 160"
              placeholderTextColor="#777"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Weight kg</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="Example: 72"
              placeholderTextColor="#777"
              keyboardType="numeric"
            />

            <View style={styles.bmiCard}>
              <Text style={styles.bmiLabel}>Calculated BMI</Text>
              <Text style={styles.bmiValue}>{bmi || "--"}</Text>
              <Text style={styles.bmiCategory}>{bmiCategory}</Text>
            </View>

            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Medical Details</Text>
            </View>

            <Text style={styles.label}>Allergies</Text>
            <TextInput
              style={styles.input}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="Example: milk, wheat"
              placeholderTextColor="#777"
              autoCapitalize="none"
            />

            <Text style={styles.helperText}>
              Separate multiple allergies with commas.
            </Text>

            <AutoCompleteInput
              label="Medications"
              placeholder="Search medication name..."
              value={medicationInput}
              onChangeValue={setMedicationInput}
              data={DRUG_SUGGESTIONS}
              subText={(item: any) => item.contains || "Tap to select medication"}
            />

            <Pressable
              style={({ pressed }) => [
                styles.addMedicationButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={addMedication}
            >
              <Text style={styles.addMedicationText}>+ Add Medication</Text>
            </Pressable>

            <View style={styles.medicationList}>
              {medications.length === 0 ? (
                <Text style={styles.emptyMedicationText}>
                  No medications added yet.
                </Text>
              ) : (
                medications.map((item) => (
                  <Pressable
                    key={item}
                    style={styles.medicationChip}
                    onPress={() => removeMedication(item)}
                  >
                    <Text style={styles.medicationChipText}>{item}</Text>
                    <Text style={styles.medicationRemoveText}> ×</Text>
                  </Pressable>
                ))
              )}
            </View>

            <Text style={styles.helperText}>
              Tap a medication chip to remove it.
            </Text>

            <Text style={styles.label}>Health Conditions</Text>
            <TextInput
              style={styles.textArea}
              value={healthConditions}
              onChangeText={setHealthConditions}
              placeholder="Example: diabetes, hypertension"
              placeholderTextColor="#777"
              multiline
            />

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>Save Profile</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push("/diet")}
            >
              <Text style={styles.secondaryText}>Go to Safety Checker</Text>
            </Pressable>
          </View>

          <Modal
            visible={imageModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setImageModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Profile Picture</Text>
                <Text style={styles.modalSubtitle}>
                  Upload a photo or choose a default avatar.
                </Text>

                <Pressable style={styles.modalButton} onPress={pickAndUploadImage}>
                  <Text style={styles.modalButtonText}>Choose from Gallery</Text>
                </Pressable>

                <View style={styles.defaultAvatarRow}>
                  <Pressable
                    style={styles.defaultAvatarBox}
                    onPress={() => chooseDefaultAvatar("female")}
                  >
                    <Image source={defaultFemale} style={styles.defaultAvatarImage} />
                    <Text style={styles.defaultAvatarText}>Female</Text>
                  </Pressable>

                  <Pressable
                    style={styles.defaultAvatarBox}
                    onPress={() => chooseDefaultAvatar("male")}
                  >
                    <Image source={defaultMale} style={styles.defaultAvatarImage} />
                    <Text style={styles.defaultAvatarText}>Male</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setImageModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
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
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 34,
  },

  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: MUTED,
    marginTop: 12,
    fontWeight: "800",
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
    marginBottom: 20,
  },

  heroTitle: {
    color: TEXT,
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 46,
    letterSpacing: -1,
  },

  heroSubtitle: {
    color: "#d4d4d4",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10,
    fontWeight: "700",
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.42)",
    padding: 18,
    shadowColor: ORANGE,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
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
    marginTop: 6,
  },

  sectionBadgeText: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  profileImageSection: {
    alignItems: "center",
    marginBottom: 20,
  },

  profileImageRing: {
    width: 134,
    height: 134,
    borderRadius: 67,
    borderWidth: 3,
    borderColor: ORANGE,
    overflow: "hidden",
    backgroundColor: "#050505",
    shadowColor: ORANGE,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 8,
  },

  profileImage: {
    width: "100%",
    height: "100%",
  },

  changePhotoButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 22,
    backgroundColor: "rgba(255,122,0,0.12)",
  },

  changePhotoText: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: "900",
  },

  photoHint: {
    color: MUTED,
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
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

  textArea: {
    minHeight: 92,
    backgroundColor: INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 15,
    color: TEXT,
    paddingHorizontal: 15,
    paddingTop: 13,
    fontSize: 15,
    fontWeight: "700",
    textAlignVertical: "top",
  },

  helperText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    fontWeight: "600",
  },

  bmiCard: {
    backgroundColor: "rgba(255,122,0,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.45)",
    borderRadius: 22,
    padding: 16,
    marginTop: 16,
    marginBottom: 12,
  },

  bmiLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  bmiValue: {
    color: TEXT,
    fontSize: 38,
    fontWeight: "900",
    marginTop: 4,
  },

  bmiCategory: {
    color: ORANGE,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },

  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
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

  buttonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },

  addMedicationButton: {
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

  addMedicationText: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: "900",
  },

  medicationList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },

  medicationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,122,0,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.55)",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  medicationChipText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "900",
  },

  medicationRemoveText: {
    color: ORANGE,
    fontSize: 17,
    fontWeight: "900",
  },

  emptyMedicationText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#111111",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.45)",
    padding: 22,
    paddingBottom: 34,
  },

  modalTitle: {
    color: TEXT,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },

  modalSubtitle: {
    color: MUTED,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },

  modalButton: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  defaultAvatarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },

  defaultAvatarBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,122,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.45)",
    borderRadius: 20,
    padding: 12,
  },

  defaultAvatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: ORANGE,
  },

  defaultAvatarText: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 8,
  },

  cancelButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  cancelText: {
    color: ORANGE,
    fontSize: 15,
    fontWeight: "900",
  },
});