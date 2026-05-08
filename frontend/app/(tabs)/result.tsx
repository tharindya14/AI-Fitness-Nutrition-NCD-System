import React, { useCallback, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { getItem, deleteItem } from "@/utils/storage";

const GREEN = "#1B4332";
const LIGHT_BG = "#F3F7F4";
const CARD_BG = "#FFFFFF";
const SOFT_BG = "#F1F5F2";
const DANGER = "#D00000";
const MODERATE = "#F77F00";
const SAFE = "#2D6A4F";

export default function ResultPage() {
  const [result, setResult] = useState<any>(null);
  const params = useLocalSearchParams();

  const loadResult = async () => {
    const saved = await getItem("latestResult");

    if (saved) {
      setResult(JSON.parse(saved));
    } else {
      setResult(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadResult();
    }, [params.refresh])
  );

  const checkAnother = async () => {
    await deleteItem("latestResult");
    setResult(null);
    router.replace("/diet");
  };

  if (!result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.loading}>No result found.</Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/diet")}
          >
            <Text style={styles.primaryText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const finalLevel = result?.final_risk_level || result?.finalRiskLevel || "Unknown";
  const finalScore =
    result?.final_risk_score ??
    result?.finalRiskScore ??
    result?.risk_score ??
    "-";

  const riskColor =
    finalLevel === "Dangerous"
      ? DANGER
      : finalLevel === "Moderate"
      ? MODERATE
      : SAFE;

  const medicineNames: string[] = Array.isArray(result?.medicine_names)
    ? result.medicine_names
    : result?.drug_name
    ? [result.drug_name]
    : [];

  const foodDrugResults: any[] = Array.isArray(result?.food_drug_results)
    ? result.food_drug_results
    : [];

  const drugDrugInteractions: any[] = Array.isArray(result?.drug_drug_interactions)
    ? result.drug_drug_interactions
    : [];

  const summaries: string[] = Array.isArray(result?.summary)
    ? result.summary
    : [];

  const alternatives: any[] = Array.isArray(result?.recommended_alternatives)
    ? result.recommended_alternatives
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Safety Result</Text>

          <View style={styles.headerBox}>
            <View>
              <Text style={styles.smallLabel}>Risk Score</Text>
              <Text style={styles.score}>{finalScore}/100</Text>
            </View>

            <View style={[styles.badge, { backgroundColor: riskColor }]}>
              <Text style={styles.badgeText}>{finalLevel}</Text>
            </View>
          </View>

          <View style={styles.profileBox}>
            <Text style={styles.profileTitle}>Health Profile Used</Text>

            <Text style={styles.profileText}>
              BMI: {result?.bmi ?? "--"}{" "}
              {result?.bmi_category ? `(${result.bmi_category})` : ""}
            </Text>

            <Text style={styles.profileText}>
              Height: {result?.height_cm ?? "--"} cm
            </Text>

            <Text style={styles.profileText}>
              Weight: {result?.weight_kg ?? "--"} kg
            </Text>

            {result?.bmi_advice ? (
              <Text style={styles.profileAdvice}>{result.bmi_advice}</Text>
            ) : null}
          </View>

          <Info
            title="Selected Medicines"
            value={medicineNames.length > 0 ? medicineNames.join(", ") : "-"}
          />

          <Info title="Food" value={result?.food_name || "-"} />

          <Text style={styles.section}>Overall Summary</Text>
          {summaries.length === 0 ? (
            <Text style={styles.paragraph}>No summary available.</Text>
          ) : (
            summaries.map((item, index) => (
              <Text key={index} style={styles.bullet}>
                • {item}
              </Text>
            ))
          )}

          <Text style={styles.section}>Overall Advice</Text>
          <Text style={styles.paragraph}>
            {result?.overall_advice || "No advice available."}
          </Text>

          <Text style={styles.section}>Drug-Drug Interaction</Text>
          {drugDrugInteractions.length === 0 ? (
            <Text style={styles.paragraph}>
              No drug-drug interaction detected from the available dataset.
            </Text>
          ) : (
            drugDrugInteractions.map((item, index) => (
              <View key={index} style={styles.interactionBox}>
                <Text style={styles.interactionTitle}>
                  {item.medicine_1} + {item.medicine_2}
                </Text>

                <Text style={styles.interactionText}>
                  Severity: {item.severity || "-"} | Score:{" "}
                  {item.risk_score ?? "-"}
                </Text>

                <Text style={styles.interactionText}>
                  Type: {item.interaction_type || "-"}
                </Text>

                <Text style={styles.interactionText}>
                  {item.explanation || "No explanation available."}
                </Text>

                <Text style={styles.recommendationText}>
                  {item.recommendation || ""}
                </Text>
              </View>
            ))
          )}

          <Text style={styles.section}>Food-Drug Results</Text>
          {foodDrugResults.length === 0 ? (
            <Text style={styles.paragraph}>No food-drug result available.</Text>
          ) : (
            foodDrugResults.map((item, index) => (
              <View key={index} style={styles.interactionBox}>
                <View style={styles.rowBetween}>
                  <Text style={styles.interactionTitle}>{item.drug_name}</Text>

                  <View
                    style={[
                      styles.smallBadge,
                      {
                        backgroundColor:
                          item.final_risk_level === "Dangerous"
                            ? DANGER
                            : item.final_risk_level === "Moderate"
                            ? MODERATE
                            : SAFE,
                      },
                    ]}
                  >
                    <Text style={styles.smallBadgeText}>
                      {item.final_risk_level}
                    </Text>
                  </View>
                </View>

                <Text style={styles.interactionText}>
                  Contains: {item.drug_contains || "-"}
                </Text>

                <Text style={styles.interactionText}>
                  Model Risk: {item.model_risk || "-"}
                </Text>

                <Text style={styles.interactionText}>
                  Score: {item.risk_score ?? 0}/100
                </Text>

                <Text style={styles.subSection}>Explanation</Text>
                <Text style={styles.paragraph}>
                  {item.explanation?.summary || "No explanation available."}
                </Text>

                <Text style={styles.subSection}>Key Risks</Text>
                {(item.explanation?.key_risks || []).length === 0 ? (
                  <Text style={styles.paragraph}>No key risks found.</Text>
                ) : (
                  item.explanation.key_risks.map(
                    (risk: string, riskIndex: number) => (
                      <Text key={riskIndex} style={styles.bullet}>
                        • {risk}
                      </Text>
                    )
                  )
                )}

                <Text style={styles.subSection}>Advice</Text>
                <Text style={styles.paragraph}>
                  {item.explanation?.advice || "No advice available."}
                </Text>
              </View>
            ))
          )}

          <Text style={styles.section}>Recommended Alternatives</Text>
          {alternatives.length === 0 ? (
            <Text style={styles.paragraph}>No alternatives available.</Text>
          ) : (
            alternatives.map((item, index) => (
              <View key={index} style={styles.altBox}>
                <Text style={styles.altTitle}>{item.Food || item.food_name}</Text>
                <Text style={styles.altText}>
                  {item.food_type || "-"} • {item.consumption_type || "-"} •{" "}
                  {item.energy ?? "-"} kcal
                </Text>

                {item.bmi_reason ? (
                  <Text style={styles.altReason}>{item.bmi_reason}</Text>
                ) : null}
              </View>
            ))
          )}

          <Text style={styles.disclaimer}>
            {result?.disclaimer ||
              "This is a decision-support result only and should not be considered medical advice."}
          </Text>

          <Pressable style={styles.primaryButton} onPress={checkAnother}>
            <Text style={styles.primaryText}>Check Another Food</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.replace("/home")}
          >
            <Text style={styles.secondaryText}>Go Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.smallLabel}>{title}</Text>
      <Text style={styles.value}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BG,
  },

  scroll: {
    padding: 22,
    paddingBottom: 40,
  },

  centerBox: {
    flex: 1,
    padding: 22,
    justifyContent: "center",
  },

  loading: {
    fontSize: 18,
    color: GREEN,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 24,
    elevation: 4,
  },

  title: {
    fontSize: 36,
    fontWeight: "900",
    color: GREEN,
    marginBottom: 16,
  },

  headerBox: {
    backgroundColor: SOFT_BG,
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  smallLabel: {
    fontSize: 13,
    color: "#344E41",
    fontWeight: "800",
  },

  score: {
    fontSize: 30,
    fontWeight: "900",
    color: GREEN,
    marginTop: 4,
  },

  badge: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },

  badgeText: {
    color: "#fff",
    fontWeight: "900",
  },

  profileBox: {
    backgroundColor: "#EAF3EE",
    padding: 14,
    borderRadius: 16,
    marginTop: 14,
  },

  profileTitle: {
    color: GREEN,
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 6,
  },

  profileText: {
    color: "#1F2933",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },

  profileAdvice: {
    color: "#5C6B63",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    fontWeight: "600",
  },

  infoBox: {
    backgroundColor: "#F8FAF8",
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
  },

  value: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginTop: 6,
    lineHeight: 23,
  },

  section: {
    fontSize: 20,
    fontWeight: "900",
    color: GREEN,
    marginTop: 24,
    marginBottom: 8,
  },

  subSection: {
    fontSize: 15,
    fontWeight: "900",
    color: GREEN,
    marginTop: 12,
    marginBottom: 5,
  },

  paragraph: {
    fontSize: 15,
    color: "#333",
    lineHeight: 24,
  },

  bullet: {
    fontSize: 15,
    color: "#333",
    lineHeight: 24,
    marginTop: 4,
  },

  interactionBox: {
    backgroundColor: "#F8FAF8",
    padding: 14,
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E1E8E3",
  },

  interactionTitle: {
    fontWeight: "900",
    color: GREEN,
    fontSize: 16,
    flex: 1,
    paddingRight: 8,
  },

  interactionText: {
    color: "#444",
    marginTop: 5,
    lineHeight: 21,
    fontSize: 14,
    fontWeight: "600",
  },

  recommendationText: {
    color: GREEN,
    marginTop: 7,
    lineHeight: 21,
    fontSize: 14,
    fontWeight: "800",
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  smallBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  smallBadgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 11,
  },

  altBox: {
    backgroundColor: SOFT_BG,
    padding: 13,
    borderRadius: 14,
    marginTop: 9,
  },

  altTitle: {
    fontWeight: "900",
    color: GREEN,
    fontSize: 15,
  },

  altText: {
    color: "#5C6B63",
    marginTop: 3,
  },

  altReason: {
    color: "#5C6B63",
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },

  disclaimer: {
    fontSize: 12,
    color: "#777",
    marginTop: 18,
    lineHeight: 18,
    fontStyle: "italic",
  },

  primaryButton: {
    backgroundColor: SAFE,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 22,
  },

  primaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  secondaryButton: {
    backgroundColor: "#EAF3EE",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },

  secondaryText: {
    color: GREEN,
    fontWeight: "900",
    fontSize: 16,
  },
});