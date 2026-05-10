import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type FormData = {
  age: string;
  gender: string;
  height: string;
  weight: string;
  health_condition: string;
  medication: string;
  goal: string;
  price_range: string;
};

type SupplementRecommendation = {
  supplement_id?: string;
  supplement_name?: string;
  name?: string;
  category?: string;
  target_goal?: string;
  ingredients?: string;
  dosage?: string;
  price_range?: string;
  rating?: number | string;
  recommendation?: string;
  interaction_risk?: string;
  severity?: string;
};

type ProgressEntry = {
  week: string;
  weight: string;
  energy_level: string;
  side_effects: string;
  notes: string;
};

const API_URL = "http://localhost:8000/recommend";

export default function IndexScreen() {
  const [currentPage, setCurrentPage] = useState<"home" | "plan">("home");

  const [formData, setFormData] = useState<FormData>({
    age: "",
    gender: "",
    height: "",
    weight: "",
    health_condition: "",
    medication: "",
    goal: "",
    price_range: "",
  });

  const [recommendations, setRecommendations] = useState<
    SupplementRecommendation[]
  >([]);

  const [selectedSupplement, setSelectedSupplement] =
    useState<SupplementRecommendation | null>(null);

  const [progressForm, setProgressForm] = useState<ProgressEntry>({
    week: "",
    weight: "",
    energy_level: "",
    side_effects: "",
    notes: "",
  });

  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setError("");
  };

  const calculateBMI = () => {
    const heightM = Number(formData.height) / 100;
    const weightKg = Number(formData.weight);

    if (!heightM || !weightKg) return "";

    const bmi = weightKg / (heightM * heightM);
    return bmi.toFixed(2);
  };

  const validateForm = () => {
    if (
      !formData.age ||
      !formData.gender ||
      !formData.height ||
      !formData.weight ||
      !formData.health_condition ||
      !formData.medication ||
      !formData.goal ||
      !formData.price_range
    ) {
      setError("Please fill all fields before getting recommendations.");
      return false;
    }

    if (Number(formData.age) <= 0) {
      setError("Age must be a valid positive number.");
      return false;
    }

    if (Number(formData.height) <= 0) {
      setError("Height must be a valid positive number.");
      return false;
    }

    if (Number(formData.weight) <= 0) {
      setError("Weight must be a valid positive number.");
      return false;
    }

    return true;
  };

  const handleRecommend = async () => {
    setSubmitted(true);
    setRecommendations([]);
    setSelectedSupplement(null);
    setProgressEntries([]);
    setCurrentPage("home");
    setError("");

    if (!validateForm()) return;

    const bmi = calculateBMI();

    const requestBody = {
      age: Number(formData.age),
      gender: formData.gender,
      height: Number(formData.height),
      weight: Number(formData.weight),
      bmi: Number(bmi),
      health_condition: formData.health_condition,
      medication: formData.medication,
      goal: formData.goal,
      price_range: formData.price_range,
    };

    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setRecommendations(data);
      } else if (Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      } else {
        setRecommendations([]);
        setError("No recommendations found for this health profile.");
      }
    } catch (err) {
      console.log(err);
      setError(
        "Cannot connect to backend. Please check whether supplement-service backend is running."
      );
      Alert.alert(
        "Backend Error",
        "Cannot connect to backend. Please check whether FastAPI server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const generateSchedule = (supplement: SupplementRecommendation) => {
    const dosage = supplement.dosage?.toLowerCase() || "";

    if (dosage.includes("after workout")) {
      return [
        "Take the supplement after workout.",
        "Mix with water or milk according to the dosage instruction.",
        "Use 4–5 days per week based on workout days.",
        "Do not exceed the recommended dosage.",
        "Track weight, energy level, digestion, and side effects weekly.",
      ];
    }

    if (dosage.includes("morning") || dosage.includes("breakfast")) {
      return [
        "Take the supplement in the morning after breakfast.",
        "Drink enough water after taking the supplement.",
        "Use consistently for 4 weeks.",
        "Track energy level and side effects weekly.",
      ];
    }

    if (dosage.includes("night") || dosage.includes("before sleep")) {
      return [
        "Take the supplement at night as recommended.",
        "Avoid taking extra doses.",
        "Track sleep quality, side effects, and progress weekly.",
        "Stop using it if severe side effects occur.",
      ];
    }

    return [
      supplement.dosage || "Follow the recommended dosage.",
      "Use consistently for 4 weeks.",
      "Track progress weekly.",
      "Stop and consult a healthcare professional if side effects occur.",
    ];
  };

  const updateProgressField = (field: keyof ProgressEntry, value: string) => {
    setProgressForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addProgressEntry = () => {
    if (
      !progressForm.week ||
      !progressForm.weight ||
      !progressForm.energy_level ||
      !progressForm.side_effects
    ) {
      Alert.alert(
        "Missing Data",
        "Please fill week, weight, energy level, and side effects."
      );
      return;
    }

    if (Number(progressForm.weight) <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight.");
      return;
    }

    setProgressEntries((prev) => [...prev, progressForm]);

    setProgressForm({
      week: "",
      weight: "",
      energy_level: "",
      side_effects: "",
      notes: "",
    });
  };

  const getProgressMessage = () => {
    if (progressEntries.length === 0) {
      return "";
    }

    const firstWeight = Number(progressEntries[0].weight);
    const lastWeight = Number(progressEntries[progressEntries.length - 1].weight);

    if (!firstWeight || !lastWeight) {
      return "Progress tracking has started. Continue adding weekly updates.";
    }

    const difference = lastWeight - firstWeight;

    if (formData.goal === "Weight Loss") {
      if (difference < 0) {
        return `Good progress. Weight reduced by ${Math.abs(
          difference
        ).toFixed(1)} kg since tracking started.`;
      }

      if (difference > 0) {
        return `Weight increased by ${difference.toFixed(
          1
        )} kg. Review diet, workout routine, and supplement usage.`;
      }

      return "Weight is stable. Continue tracking for more weeks.";
    }

    if (formData.goal === "Muscle Gain") {
      if (difference > 0) {
        return `Good progress. Weight increased by ${difference.toFixed(
          1
        )} kg since tracking started.`;
      }

      if (difference < 0) {
        return `Weight reduced by ${Math.abs(difference).toFixed(
          1
        )} kg. Review calorie intake and training consistency.`;
      }

      return "Weight is stable. Continue tracking strength and body changes.";
    }

    return "Progress tracking has started. Continue adding weekly updates to evaluate results.";
  };

  const bmiValue = calculateBMI();

  const genderOptions = ["Male", "Female"];
  const conditionOptions = [
    "None",
    "Diabetes",
    "Hypertension",
    "Heart Disease",
    "Obesity",
    "Cholesterol",
  ];
  const goalOptions = [
    "Weight Loss",
    "Muscle Gain",
    "Energy",
    "Immunity",
    "General Health",
  ];
  const priceOptions = ["Low", "Medium", "High"];

  if (currentPage === "plan" && selectedSupplement) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentPage("home")}
        >
          <Text style={styles.backButtonText}>← Back to Recommendations</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Supplement Usage Plan</Text>
          <Text style={styles.subtitle}>
            Schedule and progress tracking for your selected supplement.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selected Supplement</Text>

          <View style={styles.selectedBox}>
            <Text style={styles.selectedTitle}>
              {selectedSupplement.name ||
                selectedSupplement.supplement_name ||
                "Selected Supplement"}
            </Text>

            <Text style={styles.resultText}>
              <Text style={styles.bold}>Category: </Text>
              {selectedSupplement.category || "Not specified"}
            </Text>

            <Text style={styles.resultText}>
              <Text style={styles.bold}>Target Goal: </Text>
              {selectedSupplement.target_goal || formData.goal}
            </Text>

            <Text style={styles.resultText}>
              <Text style={styles.bold}>Ingredients: </Text>
              {selectedSupplement.ingredients || "Not specified"}
            </Text>

            <Text style={styles.resultText}>
              <Text style={styles.bold}>Dosage: </Text>
              {selectedSupplement.dosage || "Follow professional advice"}
            </Text>

            <Text style={styles.resultText}>
              <Text style={styles.bold}>Price Range: </Text>
              {selectedSupplement.price_range || formData.price_range}
            </Text>

            <Text style={styles.resultText}>
              <Text style={styles.bold}>Rating: </Text>
              {selectedSupplement.rating || "N/A"}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Suggested Usage Schedule</Text>

          {generateSchedule(selectedSupplement).map((step, index) => (
            <Text style={styles.scheduleItem} key={index}>
              {index + 1}. {step}
            </Text>
          ))}

          <Text style={styles.noteBox}>
            Important: This schedule is a system-generated suggestion for
            academic demonstration. Users should consult a healthcare
            professional before using supplements, especially if they have
            health conditions or take medications.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Progress Tracking</Text>

          <Text style={styles.label}>Week Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: Week 1"
            placeholderTextColor="#8b96a8"
            value={progressForm.week}
            onChangeText={(text) => updateProgressField("week", text)}
          />

          <Text style={styles.label}>Current Weight kg</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: 59"
            placeholderTextColor="#8b96a8"
            keyboardType="numeric"
            value={progressForm.weight}
            onChangeText={(text) => updateProgressField("weight", text)}
          />

          <Text style={styles.label}>Energy Level</Text>
          <View style={styles.optionRow}>
            {["Low", "Medium", "High"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.optionButton,
                  progressForm.energy_level === item &&
                    styles.optionButtonActive,
                ]}
                onPress={() => updateProgressField("energy_level", item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    progressForm.energy_level === item &&
                      styles.optionTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Side Effects</Text>
          <View style={styles.optionRow}>
            {["None", "Mild", "Moderate", "Severe"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.optionButton,
                  progressForm.side_effects === item &&
                    styles.optionButtonActive,
                ]}
                onPress={() => updateProgressField("side_effects", item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    progressForm.side_effects === item &&
                      styles.optionTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Example: Felt more active this week"
            placeholderTextColor="#8b96a8"
            multiline
            value={progressForm.notes}
            onChangeText={(text) => updateProgressField("notes", text)}
          />

          <TouchableOpacity style={styles.trackButton} onPress={addProgressEntry}>
            <Text style={styles.mainButtonText}>Add Weekly Progress</Text>
          </TouchableOpacity>

          {progressEntries.length > 0 ? (
            <View style={styles.progressList}>
              <Text style={styles.sectionTitle}>Progress Summary</Text>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>{getProgressMessage()}</Text>
              </View>

              {progressEntries.map((entry, index) => (
                <View style={styles.progressCard} key={index}>
                  <Text style={styles.resultTitle}>{entry.week}</Text>

                  <Text style={styles.resultText}>
                    <Text style={styles.bold}>Weight: </Text>
                    {entry.weight} kg
                  </Text>

                  <Text style={styles.resultText}>
                    <Text style={styles.bold}>Energy Level: </Text>
                    {entry.energy_level}
                  </Text>

                  <Text style={styles.resultText}>
                    <Text style={styles.bold}>Side Effects: </Text>
                    <Text
                      style={
                        entry.side_effects === "Severe"
                          ? styles.highRisk
                          : entry.side_effects === "Moderate"
                          ? styles.mediumRisk
                          : styles.lowRisk
                      }
                    >
                      {entry.side_effects}
                    </Text>
                  </Text>

                  <Text style={styles.resultText}>
                    <Text style={styles.bold}>Notes: </Text>
                    {entry.notes || "No notes added"}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Supplement Advisory</Text>
        <Text style={styles.subtitle}>
          Personalized supplement recommendations based on health profile,
          medication safety, fitness goal, and price range.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Health Profile</Text>

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter age"
          placeholderTextColor="#8b96a8"
          keyboardType="numeric"
          value={formData.age}
          onChangeText={(text) => updateField("age", text)}
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.optionRow}>
          {genderOptions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionButton,
                formData.gender === item && styles.optionButtonActive,
              ]}
              onPress={() => updateField("gender", item)}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.gender === item && styles.optionTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Height cm</Text>
        <TextInput
          style={styles.input}
          placeholder="Example: 165"
          placeholderTextColor="#8b96a8"
          keyboardType="numeric"
          value={formData.height}
          onChangeText={(text) => updateField("height", text)}
        />

        <Text style={styles.label}>Weight kg</Text>
        <TextInput
          style={styles.input}
          placeholder="Example: 60"
          placeholderTextColor="#8b96a8"
          keyboardType="numeric"
          value={formData.weight}
          onChangeText={(text) => updateField("weight", text)}
        />

        <Text style={styles.label}>Health Condition</Text>
        <View style={styles.optionWrap}>
          {conditionOptions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionButton,
                formData.health_condition === item && styles.optionButtonActive,
              ]}
              onPress={() => updateField("health_condition", item)}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.health_condition === item &&
                    styles.optionTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Medication</Text>
        <TextInput
          style={styles.input}
          placeholder="Example: Metformin / Aspirin / None"
          placeholderTextColor="#8b96a8"
          value={formData.medication}
          onChangeText={(text) => updateField("medication", text)}
        />

        <Text style={styles.label}>Fitness Goal</Text>
        <View style={styles.optionWrap}>
          {goalOptions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionButton,
                formData.goal === item && styles.optionButtonActive,
              ]}
              onPress={() => updateField("goal", item)}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.goal === item && styles.optionTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Price Range</Text>
        <View style={styles.optionRow}>
          {priceOptions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionButton,
                formData.price_range === item && styles.optionButtonActive,
              ]}
              onPress={() => updateField("price_range", item)}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.price_range === item && styles.optionTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {bmiValue ? (
          <View style={styles.bmiBox}>
            <Text style={styles.bmiText}>Calculated BMI: {bmiValue}</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.mainButton, loading && styles.disabledButton]}
          onPress={handleRecommend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.mainButtonText}>Recommend Supplements</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recommended Supplements</Text>

        {!submitted ? (
          <Text style={styles.emptyText}>
            Enter your health profile and click Recommend Supplements to view
            personalized results.
          </Text>
        ) : null}

        {submitted && loading ? (
          <Text style={styles.emptyText}>
            Please wait. Recommendations are loading...
          </Text>
        ) : null}

        {submitted && !loading && recommendations.length === 0 && !error ? (
          <Text style={styles.emptyText}>
            No suitable supplements found for the entered profile.
          </Text>
        ) : null}

        {recommendations.map((item, index) => {
          const risk = item.interaction_risk || "Low";

          return (
            <View style={styles.resultCard} key={index}>
              <Text style={styles.resultTitle}>
                {item.name || item.supplement_name || "Supplement Recommendation"}
              </Text>

              <Text style={styles.resultText}>
                <Text style={styles.bold}>Category: </Text>
                {item.category || "Not specified"}
              </Text>

              <Text style={styles.resultText}>
                <Text style={styles.bold}>Target Goal: </Text>
                {item.target_goal || formData.goal || "Not specified"}
              </Text>

              <Text style={styles.resultText}>
                <Text style={styles.bold}>Ingredients: </Text>
                {item.ingredients || "Not specified"}
              </Text>

              <Text style={styles.resultText}>
                <Text style={styles.bold}>Dosage: </Text>
                {item.dosage || "Follow professional advice"}
              </Text>

              <Text style={styles.resultText}>
                <Text style={styles.bold}>Price Range: </Text>
                {item.price_range || "Not specified"}
              </Text>

              <Text style={styles.resultText}>
                <Text style={styles.bold}>Rating: </Text>
                {item.rating || "N/A"}
              </Text>

              <Text style={styles.resultText}>
                <Text style={styles.bold}>Interaction Risk: </Text>
                <Text
                  style={
                    risk.toLowerCase() === "high"
                      ? styles.highRisk
                      : risk.toLowerCase() === "medium"
                      ? styles.mediumRisk
                      : styles.lowRisk
                  }
                >
                  {risk}
                </Text>
              </Text>

              <Text style={styles.resultText}>
                <Text style={styles.bold}>Severity: </Text>
                {item.severity || "None"}
              </Text>

              <Text style={styles.resultText}>
                <Text style={styles.bold}>Recommendation: </Text>
                {item.recommendation ||
                  "This supplement may be suitable based on your profile."}
              </Text>

              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  setSelectedSupplement(item);
                  setProgressEntries([]);
                  setProgressForm({
                    week: "",
                    weight: "",
                    energy_level: "",
                    side_effects: "",
                    notes: "",
                  });
                  setCurrentPage("plan");
                }}
              >
                <Text style={styles.selectButtonText}>Select Supplement</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#cbd5e1",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#243244",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 18,
  },
  label: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 15,
  },
  optionRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  optionButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#60a5fa",
  },
  optionText: {
    color: "#cbd5e1",
    fontWeight: "700",
  },
  optionTextActive: {
    color: "#ffffff",
  },
  bmiBox: {
    backgroundColor: "#052e2b",
    borderWidth: 1,
    borderColor: "#14b8a6",
    padding: 14,
    borderRadius: 12,
    marginTop: 18,
  },
  bmiText: {
    color: "#99f6e4",
    fontWeight: "800",
    fontSize: 15,
  },
  error: {
    color: "#fecaca",
    backgroundColor: "#7f1d1d",
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    fontWeight: "700",
  },
  mainButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 18,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  mainButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 22,
  },
  resultCard: {
    backgroundColor: "#0b1220",
    borderRadius: 14,
    padding: 15,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  resultTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  resultText: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  bold: {
    color: "#ffffff",
    fontWeight: "800",
  },
  lowRisk: {
    color: "#22c55e",
    fontWeight: "900",
  },
  mediumRisk: {
    color: "#f59e0b",
    fontWeight: "900",
  },
  highRisk: {
    color: "#ef4444",
    fontWeight: "900",
  },
  selectButton: {
    backgroundColor: "#14b8a6",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },
  selectButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
  },
  backButton: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#93c5fd",
    fontWeight: "800",
    fontSize: 14,
  },
  selectedBox: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#14b8a6",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  selectedTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 10,
  },
  scheduleItem: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 4,
  },
  noteBox: {
    color: "#fde68a",
    backgroundColor: "#422006",
    borderWidth: 1,
    borderColor: "#f59e0b",
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    fontSize: 13,
    lineHeight: 20,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  trackButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 18,
    alignItems: "center",
  },
  progressList: {
    marginTop: 18,
  },
  progressCard: {
    backgroundColor: "#0b1220",
    borderRadius: 14,
    padding: 15,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  summaryBox: {
    backgroundColor: "#052e16",
    borderWidth: 1,
    borderColor: "#22c55e",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  summaryText: {
    color: "#bbf7d0",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
});