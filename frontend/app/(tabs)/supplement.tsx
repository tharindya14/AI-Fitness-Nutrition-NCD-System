import React, { useMemo, useState } from "react";
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

import { SUPPLEMENT_API_BASE_URL } from "@/constants/api";
import { getItem } from "@/utils/storage";
import { router } from "expo-router";

type MedicineSuggestion = {
  name: string;
  contains: string;
  therapeuticClass?: string;
  actionClass?: string;
  chemicalClass?: string;
  habitForming?: string;
  riskLabel?: string;
};

type RecommendationItem = {
  supplement_id: string;
  name: string;
  category: string;
  target_goal: string;
  ingredients: string;
  dosage: string;
  brand: string;
  size: string;
  form: string;
  price_lkr: number;
  price_range_lkr: string;
  rating: number;
  store_name: string;
  safety_status: string;
};

type ScheduleData = {
  _id: string;
  supplement_id: string;
  supplement_name: string;
  category: string;
  recommended_time: string;
  with_meal: string;
  frequency_per_day: number;
  dose_instruction: string;
  duration_weeks: number;
  avoid_with: string;
  spacing_rule: string;
  tracking_frequency: string;
  expected_result_window: string;
  adherence_tip: string;
  safety_note: string;
  status?: string;
  createdAt?: string;
};

type ReportData = {
  activeSchedules: number;
  totalSchedules: number;
  totalProgressLogs: number;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
  adherencePercentage: number;
  latestProgress: any;
  message: string;
};

type ProgressLog = {
  _id: string;
  scheduleId?: string;
  supplement_id: string;
  supplement_name: string;
  taken_status: string;
  weight_kg?: number;
  bmi?: number;
  energy_level_1_5?: number;
  workout_performance_1_5?: number;
  side_effects?: string;
  goal_progress_percentage?: number;
  note?: string;
  createdAt?: string;
  log_date?: string;
  log_day?: string;
};

const ORANGE = "#ff7a00";
const DARK = "#050505";
const CARD = "#111111";
const INPUT = "#050505";
const BORDER = "#2a2a2a";
const TEXT = "#ffffff";
const MUTED = "#a9a9a9";
const GREEN = "#31d158";
const RED = "#ff453a";

const supplementBottleImage = require("../../assets/images/supplement/supplement_bottle_hero.png");

const dashboardImages = {
  start: require("../../assets/images/supplement/icon_start.png"),
  schedule: require("../../assets/images/supplement/icon_schedule.png"),
  progress: require("../../assets/images/supplement/icon_progress.png"),
  history: require("../../assets/images/supplement/icon_history.png"),
  report: require("../../assets/images/supplement/icon_report.png"),
};

export default function SupplementScreen() {
  // 0 = Dashboard Options
  // 1 = Health Profile
  // 2 = Preferences
  // 3 = Recommendations
  // 4 = Schedule
  // 5 = Daily Progress
  // 6 = Report
  // 7 = Progress History
  const [currentStep, setCurrentStep] = useState(0);
  const totalSetupSteps = 6;

  const [openedFromDashboard, setOpenedFromDashboard] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("female");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [healthCondition, setHealthCondition] = useState("none");

  const [medicationText, setMedicationText] = useState("");
  const [selectedMedication, setSelectedMedication] = useState("none");
  const [medicineSuggestions, setMedicineSuggestions] = useState<
    MedicineSuggestion[]
  >([]);

  const [goal, setGoal] = useState("muscle gain");
  const [budgetRange, setBudgetRange] = useState("10000-25000");
  const [activityLevel, setActivityLevel] = useState("moderate");

  const [loadingMedication, setLoadingMedication] = useState(false);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingProgressHistory, setLoadingProgressHistory] = useState(false);

  const [recommendationId, setRecommendationId] = useState("");
  const [predictedCategory, setPredictedCategory] = useState("");
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(
    []
  );
  const [recommendationIndex, setRecommendationIndex] = useState(0);

  const [selectedSupplement, setSelectedSupplement] =
    useState<RecommendationItem | null>(null);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);

  const [takenStatus, setTakenStatus] = useState("taken");
  const [progressWeight, setProgressWeight] = useState("");
  const [progressBmiManual, setProgressBmiManual] = useState("");
  const [energyLevel, setEnergyLevel] = useState("4");
  const [workoutPerformance, setWorkoutPerformance] = useState("4");
  const [sideEffects, setSideEffects] = useState("None");
  const [goalProgress, setGoalProgress] = useState("10");
  const [progressNote, setProgressNote] = useState("");

  const [report, setReport] = useState<ReportData | null>(null);
  const [progressHistory, setProgressHistory] = useState<ProgressLog[]>([]);

  const [todayProgress, setTodayProgress] = useState<ProgressLog | null>(null);
  const [loadingTodayProgress, setLoadingTodayProgress] = useState(false);

  const bmi = useMemo(() => {
    const height = Number(heightCm);
    const weight = Number(weightKg);

    if (!height || !weight) return "";

    const heightM = height / 100;
    const calculated = weight / (heightM * heightM);

    return calculated.toFixed(2);
  }, [heightCm, weightKg]);

  const calculatedProgressBmi = useMemo(() => {
    const height = Number(heightCm);
    const weight = Number(progressWeight);

    if (!height || !weight) return "";

    const heightM = height / 100;
    const calculated = weight / (heightM * heightM);

    return calculated.toFixed(2);
  }, [progressWeight, heightCm]);

  const finalProgressBmi = calculatedProgressBmi || progressBmiManual;

  const currentRecommendation = recommendations[recommendationIndex];

  const getToken = async () => {
    const token =
      (await getItem("token")) ||
      (await getItem("authToken")) ||
      (await getItem("userToken"));

    return token;
  };

  const parseJsonResponse = async (response: Response) => {
    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `Expected JSON response but received: ${text.slice(0, 140)}`
      );
    }
  };

  const getMongoId = (value: any) => {
    if (!value) return "";

  if (typeof value === "string") return value;

  if (typeof value === "object") {
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
  }

  return String(value);
  };

  const resetSetupFlow = () => {
    setRecommendationId("");
  setPredictedCategory("");
  setRecommendations([]);
  setRecommendationIndex(0);
  setSelectedSupplement(null);
  setSchedule(null);
  setReport(null);
  setProgressHistory([]);
  setTodayProgress(null);
  setOpenedFromDashboard(false);
  setCurrentStep(1);
};

  const searchMedications = async (text: string) => {
    setMedicationText(text);

    if (text.trim().length < 2) {
      setMedicineSuggestions([]);
      return;
    }

    try {
      setLoadingMedication(true);

      const response = await fetch(
        `${SUPPLEMENT_API_BASE_URL}/api/supplements/drugs?q=${encodeURIComponent(
          text
        )}`
      );

      const result = await parseJsonResponse(response);

      if (result.success) {
        setMedicineSuggestions(result.data || []);
      } else {
        setMedicineSuggestions([]);
      }
    } catch (error) {
      console.log("Medication search error:", error);
      setMedicineSuggestions([]);
    } finally {
      setLoadingMedication(false);
    }
  };

  const selectMedication = (medicine: MedicineSuggestion) => {
    setSelectedMedication(medicine.name);
    setMedicationText(medicine.name);
    setMedicineSuggestions([]);
  };

  const validateProfile = () => {
    if (!name.trim()) return "Name is required.";
    if (!age.trim()) return "Age is required.";
    if (!gender.trim()) return "Gender is required.";
    if (!heightCm.trim()) return "Height is required.";
    if (!weightKg.trim()) return "Weight is required.";
    if (!bmi) return "BMI could not be calculated.";
    if (!goal.trim()) return "Goal is required.";
    if (!budgetRange.trim()) return "Budget range is required.";
    if (!activityLevel.trim()) return "Activity level is required.";

    return "";
  };

  const goNext = () => {
    if (currentStep === 1) {
      if (!name.trim() || !age.trim() || !heightCm.trim() || !weightKg.trim()) {
        Alert.alert(
          "Missing Details",
          "Please complete your health profile first."
        );
        return;
      }
    }

    if (currentStep === 2) {
      if (!goal || !budgetRange || !activityLevel) {
        Alert.alert(
          "Missing Preferences",
          "Please select goal, budget, and activity level."
        );
        return;
      }
    }

    if (currentStep === 3 && recommendations.length === 0) {
      Alert.alert(
        "No Recommendations",
        "Please generate recommendations first."
      );
      return;
    }

    if (currentStep === 4 && !schedule) {
      Alert.alert(
        "No Schedule",
        "Please select a supplement and generate a schedule first."
      );
      return;
    }

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
  if (currentStep === 0) return;

  if (openedFromDashboard || currentStep === 7) {
    setOpenedFromDashboard(false);
    setCurrentStep(0);
    return;
  }

  if (currentStep === 1) {
    setCurrentStep(0);
    return;
  }

  if (currentStep > 1) {
    setCurrentStep(currentStep - 1);
  }
};

  const goNextRecommendation = () => {
    if (recommendationIndex < recommendations.length - 1) {
      setRecommendationIndex(recommendationIndex + 1);
    }
  };

  const goPreviousRecommendation = () => {
    if (recommendationIndex > 0) {
      setRecommendationIndex(recommendationIndex - 1);
    }
  };

  const getRecommendations = async () => {
    const validationError = validateProfile();

    if (validationError) {
      Alert.alert("Missing Details", validationError);
      return;
    }

    try {
      setLoadingRecommendation(true);
      setRecommendations([]);
      setSelectedSupplement(null);
      setSchedule(null);
      setReport(null);

      const token = await getToken();

      if (!token) {
        Alert.alert("Login Required", "Please login again. Token not found.");
        return;
      }

      const payload = {
        name: name.trim(),
        age: Number(age),
        gender,
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        bmi: Number(bmi),
        health_condition: healthCondition.trim() || "none",
        medication: selectedMedication || medicationText || "none",
        goal,
        budget_range: budgetRange,
        activity_level: activityLevel,
      };

      const response = await fetch(
        `${SUPPLEMENT_API_BASE_URL}/api/supplements/recommend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await parseJsonResponse(response);

      if (!response.ok || !result.success) {
        Alert.alert(
          "Recommendation Failed",
          typeof result.error === "string"
            ? result.error
            : result.message || "Something went wrong"
        );
        return;
      }

      const savedRecommendation = result.data.recommendation;

      setRecommendationId(savedRecommendation._id);
      setPredictedCategory(savedRecommendation.predicted_category || "");
      setRecommendations(savedRecommendation.recommendations || []);
      setRecommendationIndex(0);
      setCurrentStep(3);

      Alert.alert("Success", "Supplement recommendations generated.");
    } catch (error: any) {
      Alert.alert(
        "Network Error",
        error.message || "Failed to get recommendations."
      );
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const generateSchedule = async (item: RecommendationItem) => {
    try {
      setLoadingSchedule(true);
      setSelectedSupplement(item);
      setSchedule(null);
      setReport(null);

      const token = await getToken();

      if (!token) {
        Alert.alert("Login Required", "Please login again. Token not found.");
        return;
      }

      const payload = {
        recommendationId,
        supplement_id: item.supplement_id,
        supplement_name: item.name,
        category: item.category,
        ingredients: item.ingredients,
        goal,
      };

      const response = await fetch(
        `${SUPPLEMENT_API_BASE_URL}/api/supplements/schedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await parseJsonResponse(response);

      if (!response.ok || !result.success) {
        Alert.alert(
          "Schedule Failed",
          typeof result.error === "string"
            ? result.error
            : result.message || "Something went wrong"
        );
        return;
      }

      setOpenedFromDashboard(false);
      setSchedule(result.data);
      setProgressWeight(weightKg);
      setProgressBmiManual(bmi);
      setCurrentStep(4);

      Alert.alert("Schedule Created", "Usage schedule generated successfully.");
    } catch (error: any) {
      Alert.alert("Network Error", error.message || "Schedule failed.");
    } finally {
      setLoadingSchedule(false);
    }
  };

  const loadSchedules = async (goToSchedulePage = true) => {
    try {
      setLoadingSchedules(true);

      const token = await getToken();

      if (!token) {
        Alert.alert("Login Required", "Please login again. Token not found.");
        return false;
      }

      const response = await fetch(
        `${SUPPLEMENT_API_BASE_URL}/api/supplements/schedules`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await parseJsonResponse(response);

      if (!response.ok || !result.success) {
        Alert.alert(
          "Schedules Failed",
          result.message || "Failed to load schedules."
        );
        return false;
      }

      const list: ScheduleData[] = result.data || [];
      setSchedules(list);

      const activeSchedule =
        list.find((item) => item.status === "active") || list[0] || null;

      if (!activeSchedule) {
        setSchedule(null);
        setTodayProgress(null);
        Alert.alert(
          "No Schedule Found",
          "Please start a new recommendation and generate a schedule first."
        );
        return false;
      }

      setSchedule(activeSchedule);
      await loadTodayProgress(activeSchedule);

      if (goToSchedulePage) {
        setOpenedFromDashboard(true);
        setCurrentStep(4);
      }

      return true;
    } catch (error: any) {
      Alert.alert("Network Error", error.message || "Failed to load schedules.");
      return false;
    } finally {
      setLoadingSchedules(false);
    }
  };

  const loadTodayProgress = async (selectedSchedule: ScheduleData) => {
    try {
      setLoadingTodayProgress(true);

      const token = await getToken();

      if (!token) {
        Alert.alert("Login Required", "Please login again. Token not found.");
        return false;
      }

      const response = await fetch(
        `${SUPPLEMENT_API_BASE_URL}/api/supplements/progress/today?scheduleId=${selectedSchedule._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await parseJsonResponse(response);

      if (!response.ok || !result.success) {
        setTodayProgress(null);
        return false;
      }

      if (result.exists && result.data) {
        const item = result.data;

        setTodayProgress(item);
        setTakenStatus(item.taken_status || "taken");
        setProgressWeight(item.weight_kg !== undefined ? String(item.weight_kg) : "");
        setProgressBmiManual(item.bmi !== undefined ? String(item.bmi) : "");
        setEnergyLevel(
          item.energy_level_1_5 !== undefined
            ? String(item.energy_level_1_5)
            : "4"
        );
        setWorkoutPerformance(
          item.workout_performance_1_5 !== undefined
            ? String(item.workout_performance_1_5)
            : "4"
        );
        setSideEffects(item.side_effects || "None");
        setGoalProgress(
          item.goal_progress_percentage !== undefined
            ? String(item.goal_progress_percentage)
            : "10"
        );
        setProgressNote(item.note || "");
      } else {
        setTodayProgress(null);
        setTakenStatus("taken");
        setProgressWeight("");
        setProgressBmiManual("");
        setEnergyLevel("4");
        setWorkoutPerformance("4");
        setSideEffects("None");
        setGoalProgress("10");
        setProgressNote("");
      }

      return true;
    } catch (error: any) {
      console.log("Today progress load error:", error.message || error);
      setTodayProgress(null);
      return false;
    } finally {
      setLoadingTodayProgress(false);
    }
  };

  const openDailyProgress = async () => {
    const loaded = await loadSchedules(false);

    if (!loaded) {
      setOpenedFromDashboard(false);
      setCurrentStep(0);
      return;
    }

    setOpenedFromDashboard(true);
    setCurrentStep(5);
  };

  const saveProgress = async () => {
    if (!schedule) {
      Alert.alert(
        "No Schedule",
        "Please open your active schedule or generate a schedule first."
      );
      return;
    }

    if (!progressWeight.trim()) {
      Alert.alert("Missing Details", "Current weight is required.");
      return;
    }

    try {
      setLoadingProgress(true);

      const token = await getToken();

      if (!token) {
        Alert.alert("Login Required", "Please login again. Token not found.");
        return;
      }

      const payload = {
        scheduleId: getMongoId(schedule._id),
        supplement_id: schedule.supplement_id,
        supplement_name: schedule.supplement_name,
        taken_status: takenStatus,
        weight_kg: Number(progressWeight),
        bmi: finalProgressBmi ? Number(finalProgressBmi) : undefined,
        energy_level_1_5: Number(energyLevel),
        workout_performance_1_5: Number(workoutPerformance),
        side_effects: sideEffects || "None",
        goal_progress_percentage: Number(goalProgress),
        note: progressNote,
      };

      const response = await fetch(
        `${SUPPLEMENT_API_BASE_URL}/api/supplements/progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await parseJsonResponse(response);

      if (!response.ok || !result.success) {
        Alert.alert(
          "Progress Failed",
          typeof result.error === "string"
            ? result.error
            : result.message || "Progress save failed"
        );
        return;
      }

      Alert.alert(
        "Success",
        todayProgress
          ? "Today’s progress updated successfully."
          : "Today’s progress saved successfully."
      );

      setTodayProgress(result.data);
      setProgressNote("");
      await getReport(false);
      setOpenedFromDashboard(true);
      setCurrentStep(6);
    } catch (error: any) {
      Alert.alert("Network Error", error.message || "Progress save failed.");
    } finally {
      setLoadingProgress(false);
    }
  };

  const getReport = async (showAlert = true, fromDashboard = false) => {
    try {
      setLoadingReport(true);

      const token = await getToken();

      if (!token) {
        Alert.alert("Login Required", "Please login again. Token not found.");
        return;
      }

      const response = await fetch(
        `${SUPPLEMENT_API_BASE_URL}/api/supplements/report`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await parseJsonResponse(response);

      if (!response.ok || !result.success) {
        if (showAlert) {
          Alert.alert(
            "Report Failed",
            result.message || "Failed to load report."
          );
        }
        return;
      }

      setReport(result.data);
      setOpenedFromDashboard(fromDashboard);
      setCurrentStep(6);
    } catch (error: any) {
      if (showAlert) {
        Alert.alert("Network Error", error.message || "Failed to load report.");
      }
    } finally {
      setLoadingReport(false);
    }
  };

  const loadProgressHistory = async () => {
    try {
      setLoadingProgressHistory(true);

      const token = await getToken();

      if (!token) {
        Alert.alert("Login Required", "Please login again. Token not found.");
        return;
      }

      const response = await fetch(
        `${SUPPLEMENT_API_BASE_URL}/api/supplements/progress`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await parseJsonResponse(response);

      if (!response.ok || !result.success) {
        Alert.alert(
          "History Failed",
          result.message || "Failed to load progress history."
        );
        return;
      }

      setProgressHistory(result.data || []);
      setOpenedFromDashboard(true);
      setCurrentStep(7);
    } catch (error: any) {
      Alert.alert(
        "Network Error",
        error.message || "Failed to load progress history."
      );
    } finally {
      setLoadingProgressHistory(false);
    }
  };

const editProgressLog = (item: ProgressLog) => {
  const scheduleId = getMongoId(item.scheduleId);

  if (!scheduleId) {
    Alert.alert(
      "Cannot Edit",
      "Schedule ID is missing for this progress log."
    );
    return;
  }

  setTodayProgress(item);

  setSchedule({
    _id: scheduleId,
    supplement_id: item.supplement_id,
    supplement_name: item.supplement_name,
    category: "",
    recommended_time: "",
    with_meal: "",
    frequency_per_day: 1,
    dose_instruction: "",
    duration_weeks: 0,
    avoid_with: "",
    spacing_rule: "",
    tracking_frequency: "",
    expected_result_window: "",
    adherence_tip: "",
    safety_note: "",
  });

  setTakenStatus(item.taken_status || "taken");
  setProgressWeight(item.weight_kg !== undefined ? String(item.weight_kg) : "");
  setProgressBmiManual(item.bmi !== undefined ? String(item.bmi) : "");

  setEnergyLevel(
    item.energy_level_1_5 !== undefined
      ? String(item.energy_level_1_5)
      : "4"
  );

  setWorkoutPerformance(
    item.workout_performance_1_5 !== undefined
      ? String(item.workout_performance_1_5)
      : "4"
  );

  setSideEffects(item.side_effects || "None");

  setGoalProgress(
    item.goal_progress_percentage !== undefined
      ? String(item.goal_progress_percentage)
      : "10"
  );

  setProgressNote(item.note || "");

  setOpenedFromDashboard(true);
  setCurrentStep(5);
};

  const deleteProgressLog = async (progressId: string) => {
    Alert.alert(
      "Delete Progress",
      "Are you sure you want to delete this progress log?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();

              if (!token) {
                Alert.alert("Login Required", "Please login again.");
                return;
              }

              const response = await fetch(
                `${SUPPLEMENT_API_BASE_URL}/api/supplements/progress/${progressId}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const result = await parseJsonResponse(response);

              if (!response.ok || !result.success) {
                Alert.alert(
                  "Delete Failed",
                  result.message || "Failed to delete progress log."
                );
                return;
              }

              Alert.alert("Deleted", "Progress log deleted successfully.");

                setProgressHistory((previous) =>
                  previous.filter((item) => item._id !== progressId)
                );
                
                if (todayProgress?._id === progressId) {
                  setTodayProgress(null);
                }
                
                setOpenedFromDashboard(true);
                setCurrentStep(7);
            } catch (error: any) {
              Alert.alert("Network Error", error.message || "Delete failed.");
            }
          },
        },
      ]
    );
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString();
  };

  const screenTitle =
    currentStep === 0
      ? "Smart Supplement Advisory"
      : currentStep === 7
      ? "Daily Progress History"
      : "Smart Supplement Advisory";

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={styles.pageContainer}>
         <View style={styles.headerBox}>
  {currentStep === 0 && (
    <Pressable
      style={styles.homeBackButton}
      onPress={() => router.push("/home")}
    >
      <Text style={styles.homeBackIcon}>‹</Text>
      <Text style={styles.homeBackText}>Home</Text>
    </Pressable>
  )}

  {currentStep === 0 ? (
    <View style={styles.heroBox}>
      <View style={styles.heroTextBox}>
        <Text style={styles.titlePremium}>Smart Supplement</Text>
        <Text style={styles.titlePremium}>Advisory</Text>
        <Text style={styles.subtitlePremium}>
          Choose what you want to do today
        </Text>
      </View>

      <Image
        source={supplementBottleImage}
        style={styles.heroBottle}
        resizeMode="contain"
      />
    </View>
  ) : (
    <>
      <Text style={styles.title}>{screenTitle}</Text>

      {currentStep === 7 ? (
        <Text style={styles.subtitle}>Your saved daily progress logs</Text>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Step {currentStep} of {totalSetupSteps}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(currentStep / totalSetupSteps) * 100}%`,
                },
              ]}
            />
          </View>
        </>
      )}
    </>
  )}
</View>

          <View style={styles.pageCard}>
            <ScrollView
              style={styles.stepScroll}
              contentContainerStyle={styles.stepScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {currentStep === 0 && (
  <View style={styles.dashboardPage}>
    <View style={styles.dashboardHeaderCard}>
      <View style={styles.dashboardHeaderLeft}>
        <Text style={styles.dashboardGridIcon}>▦</Text>
        <Text style={styles.cardTitlePremium}>Supplement Dashboard</Text>
      </View>
    </View>

    <DashboardOption
      icon={dashboardImages.start}
      title="Start New Recommendation"
      subtitle="Create a health profile and get supplement suggestions."
      onPress={resetSetupFlow}
    />

    <DashboardOption
      icon={dashboardImages.schedule}
      title="My Active Schedule"
      subtitle="View your selected supplement and usage schedule."
      loading={loadingSchedules}
      onPress={() => loadSchedules(true)}
    />

    <DashboardOption
      icon={dashboardImages.progress}
      title="Add Today’s Progress"
      subtitle="Update today's taken status, weight, energy, and goal progress."
      loading={loadingSchedules}
      onPress={openDailyProgress}
    />

    <DashboardOption
      icon={dashboardImages.history}
      title="View Daily Progress History"
      subtitle="See previously saved daily supplement progress logs."
      loading={loadingProgressHistory}
      onPress={loadProgressHistory}
    />

    <DashboardOption
      icon={dashboardImages.report}
      title="View Overall Report"
      subtitle="Check adherence percentage and progress summary."
      loading={loadingReport}
      onPress={() => getReport(true, true)}
    />
  </View>
)}

              {currentStep === 1 && (
                <View style={styles.pageContent}>
                  <Text style={styles.cardTitle}>1. Health Profile</Text>

                  <Input
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                  />

                  <View style={styles.row}>
                    <View style={styles.half}>
                      <Input
                        label="Age"
                        value={age}
                        onChangeText={setAge}
                        placeholder="24"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.half}>
                      <Text style={styles.label}>Gender</Text>
                      <View style={styles.optionRow}>
                        {["female", "male"].map((item) => (
                          <Pressable
                            key={item}
                            style={[
                              styles.optionButton,
                              gender === item && styles.optionButtonActive,
                            ]}
                            onPress={() => setGender(item)}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                gender === item && styles.optionTextActive,
                              ]}
                            >
                              {item}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={styles.half}>
                      <Input
                        label="Height cm"
                        value={heightCm}
                        onChangeText={setHeightCm}
                        placeholder="160"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.half}>
                      <Input
                        label="Weight kg"
                        value={weightKg}
                        onChangeText={setWeightKg}
                        placeholder="55"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.bmiBox}>
                    <Text style={styles.bmiLabel}>Calculated BMI</Text>
                    <Text style={styles.bmiValue}>{bmi || "--"}</Text>
                  </View>

                  <Input
                    label="Health Condition"
                    value={healthCondition}
                    onChangeText={setHealthCondition}
                    placeholder="none / diabetes / hypertension"
                  />

                  <Text style={styles.label}>Medication Autocomplete</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Type medication name e.g. metformin"
                    placeholderTextColor="#777"
                    value={medicationText}
                    onChangeText={searchMedications}
                  />

                  {loadingMedication && (
                    <Text style={styles.smallInfo}>Searching medications...</Text>
                  )}

                  {medicineSuggestions.length > 0 && (
                    <View style={styles.suggestionBoxCompact}>
                      {medicineSuggestions.slice(0, 5).map((item, index) => (
                        <Pressable
                          key={`${item.name}-${index}`}
                          style={styles.suggestionItem}
                          onPress={() => selectMedication(item)}
                        >
                          <Text style={styles.suggestionName}>{item.name}</Text>
                          <Text style={styles.suggestionSub}>
                            {item.contains ||
                              item.therapeuticClass ||
                              "Medication"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  <Text style={styles.selectedMedication}>
                    Selected medication: {selectedMedication || "none"}
                  </Text>
                </View>
              )}

              {currentStep === 2 && (
                <View style={styles.pageContent}>
                  <Text style={styles.cardTitle}>2. Supplement Preferences</Text>

                  <Text style={styles.label}>Goal</Text>
                  <View style={styles.wrapRow}>
                    {[
                      "muscle gain",
                      "recovery",
                      "heart health",
                      "weight loss",
                      "general wellness",
                    ].map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        active={goal === item}
                        onPress={() => setGoal(item)}
                      />
                    ))}
                  </View>

                  <Text style={styles.label}>Budget Range LKR</Text>
                  <View style={styles.wrapRow}>
                    {[
                      "0-5000",
                      "5000-10000",
                      "10000-25000",
                      "25000-50000",
                      "50000+",
                    ].map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        active={budgetRange === item}
                        onPress={() => setBudgetRange(item)}
                      />
                    ))}
                  </View>

                  <Text style={styles.label}>Activity Level</Text>
                  <View style={styles.wrapRow}>
                    {["low", "moderate", "high"].map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        active={activityLevel === item}
                        onPress={() => setActivityLevel(item)}
                      />
                    ))}
                  </View>

                  <Pressable
                    style={styles.primaryButton}
                    onPress={getRecommendations}
                    disabled={loadingRecommendation}
                  >
                    {loadingRecommendation ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        Get Recommendations
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}

              {currentStep === 3 && (
                <View style={styles.pageContent}>
                  <Text style={styles.cardTitle}>3. Recommended Supplements</Text>
                  <Text style={styles.smallInfo}>
                    Predicted category: {predictedCategory || "-"}
                  </Text>

                  {currentRecommendation ? (
                    <View style={styles.recommendCardBig}>
                      <View style={styles.recommendTop}>
                        <Text style={styles.recommendName}>
                          {currentRecommendation.name}
                        </Text>
                        <Text style={styles.price}>
                          Rs. {currentRecommendation.price_lkr}
                        </Text>
                      </View>

                      <Text style={styles.recommendText}>
                        Brand: {currentRecommendation.brand}
                      </Text>
                      <Text style={styles.recommendText}>
                        Category: {currentRecommendation.category}
                      </Text>
                      <Text style={styles.recommendText}>
                        Goal: {currentRecommendation.target_goal}
                      </Text>
                      <Text style={styles.recommendText}>
                        Ingredients: {currentRecommendation.ingredients}
                      </Text>
                      <Text style={styles.recommendText}>
                        Dosage: {currentRecommendation.dosage}
                      </Text>
                      <Text style={styles.safeText}>
                        Safety: {currentRecommendation.safety_status}
                      </Text>

                      <View style={styles.productNavRow}>
                        <Pressable
                          style={[
                            styles.smallNavButton,
                            recommendationIndex === 0 && styles.disabledButton,
                          ]}
                          onPress={goPreviousRecommendation}
                          disabled={recommendationIndex === 0}
                        >
                          <Text style={styles.smallNavText}>‹ Product</Text>
                        </Pressable>

                        <Text style={styles.productCounter}>
                          {recommendationIndex + 1}/{recommendations.length}
                        </Text>

                        <Pressable
                          style={[
                            styles.smallNavButton,
                            recommendationIndex === recommendations.length - 1 &&
                              styles.disabledButton,
                          ]}
                          onPress={goNextRecommendation}
                          disabled={
                            recommendationIndex === recommendations.length - 1
                          }
                        >
                          <Text style={styles.smallNavText}>Product ›</Text>
                        </Pressable>
                      </View>

                      <Pressable
                        style={styles.secondaryButton}
                        onPress={() => generateSchedule(currentRecommendation)}
                        disabled={loadingSchedule}
                      >
                        {loadingSchedule ? (
                          <ActivityIndicator color={ORANGE} />
                        ) : (
                          <Text style={styles.secondaryButtonText}>
                            Select & Generate Schedule
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>
                      No recommendations yet. Go back and generate
                      recommendations.
                    </Text>
                  )}
                </View>
              )}

              {currentStep === 4 && (
                <View style={styles.pageContent}>
                  <Text style={styles.cardTitle}>4. Usage Schedule</Text>

                  {schedule ? (
                    <>
                      <InfoRow
                        label="Supplement"
                        value={schedule.supplement_name}
                      />
                      <InfoRow label="Time" value={schedule.recommended_time} />
                      <InfoRow label="With Meal" value={schedule.with_meal} />
                      <InfoRow label="Dose" value={schedule.dose_instruction} />
                      <InfoRow
                        label="Duration"
                        value={`${schedule.duration_weeks} weeks`}
                      />
                      <InfoRow
                        label="Tracking"
                        value={schedule.tracking_frequency}
                      />
                      <InfoRow
                        label="Expected Result"
                        value={schedule.expected_result_window}
                      />
                      <InfoRow label="Avoid With" value={schedule.avoid_with} />
                      <InfoRow
                        label="Spacing Rule"
                        value={schedule.spacing_rule}
                      />
                      <InfoRow label="Tip" value={schedule.adherence_tip} />

                      <Text style={styles.note}>{schedule.safety_note}</Text>
                    </>
                  ) : (
                    <Text style={styles.emptyText}>
                      No active schedule found.
                    </Text>
                  )}
                </View>
              )}

              {currentStep === 5 && (
                <View style={styles.pageContent}>
                  <Text style={styles.cardTitle}>5. Daily Progress</Text>

                  {schedule ? (
                    <View style={styles.activeScheduleBox}>
                      <Text style={styles.activeScheduleTitle}>
                        Active Supplement
                      </Text>
                      <Text style={styles.activeScheduleName}>
                        {schedule.supplement_name}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>
                      No active schedule selected. Go back and open My Active
                      Schedule first.
                    </Text>
                  )}

                  {loadingTodayProgress && (
                     <Text style={styles.smallInfo}>Checking today's progress...</Text>
                   )}

                    {todayProgress && (
                      <View style={styles.todaySavedBox}>
                        <Text style={styles.todaySavedText}>
                          Today’s progress already saved. You can update it here.
                        </Text>
                      </View>
                    )}

                  <Text style={styles.label}>Taken Status</Text>
                  <View style={styles.wrapRow}>
                    {["taken", "missed", "skipped"].map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        active={takenStatus === item}
                        onPress={() => setTakenStatus(item)}
                      />
                    ))}
                  </View>

                  <Input
                    label="Current Weight kg"
                    value={progressWeight}
                    onChangeText={setProgressWeight}
                    placeholder="55.5"
                    keyboardType="numeric"
                  />

                  {calculatedProgressBmi ? (
                    <View style={styles.bmiBox}>
                      <Text style={styles.bmiLabel}>Current BMI</Text>
                      <Text style={styles.bmiValue}>{calculatedProgressBmi}</Text>
                    </View>
                  ) : (
                    <Input
                      label="Current BMI"
                      value={progressBmiManual}
                      onChangeText={setProgressBmiManual}
                      placeholder="22.03"
                      keyboardType="numeric"
                    />
                  )}

                  <Text style={styles.label}>Energy Level 1-5</Text>
                  <View style={styles.wrapRow}>
                    {["1", "2", "3", "4", "5"].map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        active={energyLevel === item}
                        onPress={() => setEnergyLevel(item)}
                      />
                    ))}
                  </View>

                  <Text style={styles.label}>Workout Performance 1-5</Text>
                  <View style={styles.wrapRow}>
                    {["1", "2", "3", "4", "5"].map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        active={workoutPerformance === item}
                        onPress={() => setWorkoutPerformance(item)}
                      />
                    ))}
                  </View>

                  <Input
                    label="Side Effects"
                    value={sideEffects}
                    onChangeText={setSideEffects}
                    placeholder="None"
                  />

                  <Input
                    label="Goal Progress %"
                    value={goalProgress}
                    onChangeText={setGoalProgress}
                    placeholder="15"
                    keyboardType="numeric"
                  />

                  <Input
                    label="Progress Note"
                    value={progressNote}
                    onChangeText={setProgressNote}
                    placeholder="Today I felt better"
                  />

                  <Pressable
                    style={styles.primaryButton}
                    onPress={saveProgress}
                    disabled={loadingProgress || !schedule}
                  >
                    {loadingProgress ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {todayProgress ? "Update Today’s Progress" : "Save Today’s Progress"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}

              {currentStep === 6 && (
                <View style={styles.pageContent}>
                  <Text style={styles.cardTitle}>6. Overall Report</Text>

                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => getReport(true)}
                    disabled={loadingReport}
                  >
                    {loadingReport ? (
                      <ActivityIndicator color={ORANGE} />
                    ) : (
                      <Text style={styles.secondaryButtonText}>
                        Refresh My Report
                      </Text>
                    )}
                  </Pressable>

                  {report ? (
                    <View style={styles.reportBox}>
                      <InfoRow
                        label="Active Schedules"
                        value={String(report.activeSchedules)}
                      />
                      <InfoRow
                        label="Total Schedules"
                        value={String(report.totalSchedules)}
                      />
                      <InfoRow
                        label="Progress Logs"
                        value={String(report.totalProgressLogs)}
                      />
                      <InfoRow label="Taken" value={String(report.takenCount)} />
                      <InfoRow label="Missed" value={String(report.missedCount)} />
                      <InfoRow
                        label="Skipped"
                        value={String(report.skippedCount)}
                      />
                      <InfoRow
                        label="Adherence"
                        value={`${report.adherencePercentage}%`}
                      />
                      <Text style={styles.note}>{report.message}</Text>
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>
                      Tap Refresh My Report to view progress summary.
                    </Text>
                  )}
                </View>
              )}

              {currentStep === 7 && (
                <View style={styles.pageContent}>
                  <Text style={styles.cardTitle}>Daily Progress History</Text>

                  {progressHistory.length === 0 ? (
                    <Text style={styles.emptyText}>
                      No daily progress logs found yet.
                    </Text>
                  ) : (
                    progressHistory.map((item) => (
                      <View key={item._id} style={styles.historyCard}>
                        <View style={styles.historyTop}>
                          <Text style={styles.historyDate}>
                            {formatDate(item.createdAt || item.log_date)}
                          </Text>
                          <Text
                            style={[
                              styles.historyStatus,
                              item.taken_status === "missed" && {
                                color: RED,
                              },
                              item.taken_status === "taken" && {
                                color: GREEN,
                              },
                            ]}
                          >
                            {item.taken_status}
                          </Text>
                        </View>

                        <Text style={styles.historyName}>
                          {item.supplement_name}
                        </Text>

                        <Text style={styles.historyText}>
                          Weight: {item.weight_kg ?? "-"} kg
                        </Text>
                        <Text style={styles.historyText}>
                          BMI: {item.bmi ?? "-"}
                        </Text>
                        <Text style={styles.historyText}>
                          Energy: {item.energy_level_1_5 ?? "-"}/5
                        </Text>
                        <Text style={styles.historyText}>
                          Workout: {item.workout_performance_1_5 ?? "-"}/5
                        </Text>
                        <Text style={styles.historyText}>
                          Goal Progress: {item.goal_progress_percentage ?? 0}%
                        </Text>
                        <Text style={styles.historyText}>
                          Side Effects: {item.side_effects || "None"}
                        </Text>

                        {item.note ? (
                            <Text style={styles.historyNote}>{item.note}</Text>
                          ) : null}
                          
                          <Pressable
                            style={styles.editButton}
                            onPress={() => editProgressLog(item)}
                          >
                            <Text style={styles.editButtonText}>Edit Log</Text>
                          </Pressable>
                          
                          <Pressable
                            style={styles.deleteButton}
                            onPress={() => deleteProgressLog(item._id)}
                          >
                            <Text style={styles.deleteButtonText}>Delete Log</Text>
                          </Pressable>
                      </View>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          </View>

          {currentStep !== 0 && (
            <View style={styles.bottomNav}>
              <Pressable style={styles.navButton} onPress={goBack}>
                <Text style={styles.navButtonText}>
  {openedFromDashboard || currentStep === 1 || currentStep === 7
    ? "Dashboard"
    : "Back"}
</Text>
              </Pressable>

              {currentStep >= 1 && currentStep <= 5 && (
                <Pressable style={styles.navButtonPrimary} onPress={goNext}>
                  <Text style={styles.navButtonPrimaryText}>Next</Text>
                </Pressable>
              )}

              

              {currentStep === 7 && (
                <Pressable
                  style={styles.navButtonPrimary}
                  onPress={loadProgressHistory}
                  disabled={loadingProgressHistory}
                >
                  {loadingProgressHistory ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.navButtonPrimaryText}>Refresh</Text>
                  )}
                </Pressable>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DashboardOption({
  icon,
  title,
  subtitle,
  onPress,
  loading = false,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.dashboardOptionPremium,
        pressed && styles.dashboardOptionPressed,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={styles.dashboardIconPremium}>
        {loading ? (
          <ActivityIndicator color={ORANGE} />
        ) : (
          <Image source={icon} style={styles.dashboardIconImage} resizeMode="contain" />
        )}
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

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#777"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK,
  },

  pageContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: DARK,
  },

  headerBox: {
    marginBottom: 12,
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
    minHeight: 250,
    position: "relative",
    justifyContent: "center",
    overflow: "visible",
  },

  heroTextBox: {
    width: "78%",
    zIndex: 2,
    paddingTop: 8,
  },

  titlePremium: {
    color: TEXT,
    fontSize: 39,
    fontWeight: "900",
    lineHeight: 48,
    letterSpacing: -1.4,
  },

  subtitlePremium: {
    color: "#d2d2d2",
    fontSize: 17,
    lineHeight: 24,
    marginTop: 16,
    fontWeight: "700",
    width: "82%",
  },

  heroBottle: {
    position: "absolute",
    right: -8,
    top: 48,
    width: 190,
    height: 190,
    zIndex: 1,
    opacity: 0.98,
  },

  title: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 4,
    lineHeight: 36,
  },

  subtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: "600",
  },

  progressTrack: {
    height: 7,
    backgroundColor: "#1a1a1a",
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },

  progressFill: {
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 99,
  },

  pageCard: {
    flex: 1,
    backgroundColor: "rgba(17,17,17,0.97)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.42)",
    overflow: "hidden",
    shadowColor: ORANGE,
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },

  stepScroll: {
    flex: 1,
  },

  stepScrollContent: {
    padding: 20,
    paddingBottom: 34,
  },

  pageContent: {
    flexGrow: 1,
  },

  cardTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 14,
    lineHeight: 28,
  },

  dashboardPage: {
    flexGrow: 1,
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

  inputGroup: {
    marginBottom: 11,
  },

  label: {
    color: "#e5e5e5",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 7,
    marginTop: 4,
  },

  input: {
    minHeight: 48,
    backgroundColor: INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    color: TEXT,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    columnGap: 12,
  },

  half: {
    flex: 1,
  },

  optionRow: {
    flexDirection: "row",
    gap: 8,
  },

  optionButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: INPUT,
    alignItems: "center",
    justifyContent: "center",
  },

  optionButtonActive: {
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.16)",
  },

  optionText: {
    color: MUTED,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  optionTextActive: {
    color: ORANGE,
  },

  bmiBox: {
    backgroundColor: "rgba(255,122,0,0.12)",
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 16,
    padding: 13,
    marginBottom: 11,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  bmiLabel: {
    color: TEXT,
    fontWeight: "800",
  },

  bmiValue: {
    color: ORANGE,
    fontSize: 18,
    fontWeight: "900",
  },

  suggestionBoxCompact: {
    backgroundColor: INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    marginTop: 8,
    overflow: "hidden",
    maxHeight: 210,
  },

  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1d1d1d",
  },

  suggestionName: {
    color: TEXT,
    fontWeight: "900",
    fontSize: 13,
  },

  suggestionSub: {
    color: MUTED,
    marginTop: 3,
    fontSize: 11,
  },

  selectedMedication: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },

  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  chip: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: INPUT,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  chipActive: {
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.16)",
  },

  chipText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  chipTextActive: {
    color: ORANGE,
  },

  primaryButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingHorizontal: 12,
  },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  secondaryButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 12,
  },

  secondaryButtonText: {
    color: ORANGE,
    fontWeight: "900",
  },

  smallInfo: {
    color: MUTED,
    fontSize: 12,
    marginBottom: 10,
    fontWeight: "700",
  },

  recommendCardBig: {
    backgroundColor: INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 14,
  },

  recommendTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 10,
  },

  recommendName: {
    flex: 1,
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },

  price: {
    color: ORANGE,
    fontSize: 15,
    fontWeight: "900",
  },

  recommendText: {
    color: MUTED,
    fontSize: 12,
    marginTop: 5,
    fontWeight: "600",
    lineHeight: 18,
  },

  safeText: {
    color: GREEN,
    fontSize: 12,
    marginTop: 6,
    fontWeight: "900",
    textTransform: "capitalize",
  },

  productNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },

  smallNavButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },

  smallNavText: {
    color: ORANGE,
    fontWeight: "900",
    fontSize: 12,
  },

  productCounter: {
    color: MUTED,
    fontWeight: "900",
    fontSize: 12,
  },

  activeScheduleBox: {
    backgroundColor: "rgba(255,122,0,0.12)",
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  activeScheduleTitle: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "800",
  },

  activeScheduleName: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },

  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
    paddingVertical: 10,
  },

  infoLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },

  infoValue: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
    lineHeight: 20,
  },

  note: {
    color: "#d5d5d5",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 14,
    fontWeight: "600",
  },

  emptyText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  reportBox: {
    marginTop: 12,
  },

  historyCard: {
    backgroundColor: INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },

  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  historyDate: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: "900",
  },

  historyStatus: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "capitalize",
  },

  historyName: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 8,
  },

  historyText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },

  historyNote: {
    color: TEXT,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 8,
  },

  editButton: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  editButtonText: {
    color: ORANGE,
    fontWeight: "900",
    fontSize: 12,
  },

  deleteButton: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RED,
    backgroundColor: "rgba(255,69,58,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  deleteButtonText: {
    color: RED,
    fontWeight: "900",
    fontSize: 12,
  },

  todaySavedBox: {
    backgroundColor: "rgba(49,209,88,0.12)",
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },

  todaySavedText: {
    color: GREEN,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },

  bottomNav: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    paddingBottom: Platform.OS === "ios" ? 6 : 0,
  },

  navButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  navButtonPrimary: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },

  navButtonText: {
    color: TEXT,
    fontWeight: "900",
  },

  navButtonPrimaryText: {
    color: "#fff",
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.45,
  },
});
